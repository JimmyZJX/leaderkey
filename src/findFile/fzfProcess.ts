import { window, workspace } from "vscode";
import { log } from "../common/global";
import { fetchText, isWin, runProcess } from "../common/remote";
import { stripSlash } from "../common/stripSlash";

type FzfState =
  | { type: "ok"; port: number }
  | { type: "error"; code: number; detail: string };

function getRandomDynamicPort(): number {
  const min = 49152;
  const max = 65535;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export type FzfGetResponse = {
  progress: number;
  reading: boolean;
  query: string;
  totalCount: number;
  matchCount: number;
  matches: { text: string }[];
};

// GET the fzf server and ignore error when failed
async function fzfGet(port: number, limit: number) {
  try {
    const r = await fetchText(`http://127.0.0.1:${port}?limit=${limit}`, {
      method: "GET",
    });
    if (r.ok && r.status === 200 && r.bodyText.length > 0) {
      try {
        return JSON.parse(r.bodyText) as FzfGetResponse;
      } catch (e) {
        log(`fzfGet: Bad JSON ${JSON.stringify(e)}: ${r.bodyText}`);
        return undefined;
      }
    } else {
      return undefined;
    }
  } catch {
    return undefined;
  }
}

async function fzfSetQuery(port: number, query: string) {
  const r = await fetchText(`http://127.0.0.1:${port}`, {
    method: "POST",
    body: `change-query(${query})`,
  });
  return r.ok && r.status === 200;
}

async function fzfAbort(port: number) {
  await fetchText(`http://127.0.0.1:${port}`, {
    method: "POST",
    body: "abort",
  });
}

export class FzfProcess {
  private cwd: string;
  private query: string;
  private onResults: (r: FzfGetResponse) => void;

  private querySending: boolean = false;
  private sentQuery: string | undefined;

  private stateResolved: FzfState | null = null;
  private state: Promise<FzfState>;

  constructor(cwd: string, query: string, onResults: (r: FzfGetResponse) => void) {
    cwd = stripSlash(cwd);
    this.cwd = cwd;
    this.query = query;
    this.onResults = onResults;

    const fzfExe = workspace.getConfiguration("leaderkey").get<string>("fzf.exe", "fzf");
    this.state = new Promise(async (resolveState) => {
      const resolve = (s: FzfState) => {
        log(`fzf state -> ${JSON.stringify(s)}`);
        this.stateResolved = s;
        resolveState(s);
        if (s.type === "ok") {
          this.doSetQuery();
        } else {
          window.showErrorMessage(`fzf failed to execute: ${s.detail} (code=${s.code})`);
        }
      };
      let lastResp: FzfState = {
        type: "error",
        code: 0,
        detail: "fzf not initialized",
      };
      for (let j = 0; j < 5; j++) {
        // try to spawn fzf up to 5 times
        const port = getRandomDynamicPort();
        const additionalArgs = isWin() ? [] : fzfLinuxAdditionalArg;
        const proc = runProcess(
          fzfExe,
          ["--listen", port.toString(), ...additionalArgs],
          {
            cwd,
            pty: true,
            stdio: ["pipe", "ignore", "pipe"],
            env: getFdEnv(),
          },
        ).then<FzfState>((r) => {
          if (r.error) {
            return {
              type: "error",
              code: r.error.code || 0,
              detail:
                r.error.message +
                " [" +
                (r.error.stdout || "") +
                "] [" +
                (r.error.stderr || "") +
                "]: " +
                JSON.stringify(r),
            };
          }
          // never settle (on Windows the pty mode quits immediately)
          return new Promise<FzfState>(() => {});
        });
        const init = (async (): Promise<FzfState> => {
          for (let i = 0; i < 6; i++) {
            await new Promise((r) => setTimeout(r, 10 << i));
            if ((await fzfGet(port, 0)) !== undefined) {
              return { type: "ok", port };
            }
          }
          return { type: "error", code: 0, detail: "HTTP connection failed" };
        })();
        try {
          lastResp = await Promise.race([init, proc]);
        } catch (e) {
          resolve({
            type: "error",
            code: 0,
            detail: "fzf init failed " + JSON.stringify(e),
          });
          return;
        }
        if (lastResp.type === "ok") {
          resolve(lastResp);
          return;
        }
      }
      resolve(lastResp);
      return;
    });
  }

  public setQuery(query: string) {
    this.query = query;
    if (this.stateResolved?.type === "ok" && this.querySending === false) {
      this.doSetQuery();
    }
  }

  public getQuery() {
    return this.query;
  }

  private async doSetQuery() {
    if (this.stateResolved?.type !== "ok") return;
    let polled = false; // poll at least once
    this.querySending = true;
    while (this.sentQuery !== this.query) {
      log(`fzf set query: ${this.query}`);
      await fzfSetQuery(this.stateResolved.port, this.query);
      this.sentQuery = this.query;
      this.poll();
      polled = true;
    }
    if (!polled) this.poll();
    this.querySending = false;
  }

  readonly POLL_INTERVAL = 200;
  readonly FZF_MAX_RESULTS = 999;

  private pollTimeout: NodeJS.Timeout | null = null;
  private async poll() {
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    if (this.stateResolved?.type === "ok") {
      const r = await fzfGet(this.stateResolved.port, this.FZF_MAX_RESULTS);
      if (r) {
        log(
          `fzf poll ${r.matchCount} / ${r.totalCount}, reading=${r.reading}, ${r.progress}%`,
        );
        this.onResults(r);
        if (r.reading === false && r.progress === 100) return; // fzf is done
      }
      this.pollTimeout = setTimeout(() => this.poll(), this.POLL_INTERVAL);
    }
  }

  public async quit() {
    if (this.stateResolved?.type === "ok") {
      await fzfAbort(this.stateResolved.port);
      this.stateResolved = null;
    }
  }
}

function quoteArg(s: string) {
  if (s === "") return `''`;
  if (!/[^%+,-.\/:=@_0-9A-Za-z]/.test(s)) return s;
  return `'` + s.replace(/'/g, `'"'`) + `'`;
}

const fzfLinuxAdditionalArg = ["--with-shell", "/bin/bash -c"];

function getFdEnv(): NodeJS.ProcessEnv {
  if (!fdExe) return {};
  const excluded_files = workspace.getConfiguration("files").get("exclude") || {};
  if (typeof excluded_files !== "object") {
    return { FZF_DEFAULT_COMMAND: `${fdExe} --type f` };
  }
  const exclude_opts = Object.entries(excluded_files).flatMap(([key, enabled]) => {
    if (!enabled || !key) return [];
    return ["--exclude", quoteArg(key)];
  });
  return {
    FZF_DEFAULT_COMMAND: `${fdExe} --type f ${exclude_opts.join(" ")}`,
  };
}

export let fdExe: string | undefined;

export async function detectFd() {
  if (isWin()) {
    return;
  }
  const config = workspace.getConfiguration("leaderkey").get("fd.exe", "fd");
  const r = await runProcess(config, ["--version"]);
  if (r.error === null && r.stdout !== undefined && r.stdout.startsWith("fd")) {
    fdExe = config;
  }
}
