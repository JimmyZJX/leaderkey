import {
  CancellationTokenSource,
  ExtensionContext,
  Uri,
  window,
  workspace,
} from "vscode";
import { log } from "../common/global";
import { isWin, ProcessLineStreamer, runProcess } from "../common/remote";
import { stripSlash } from "../common/stripSlash";
import { FzfResultItem } from "../fzf-for-js/src/lib/main";
import { FindFileItems } from "./findFileDataProvider";
import type { FzfWorkerInput, FzfWorkerOutput } from "./fzfWorker";

export type JsFzfResult = FindFileItems<FzfResultItem<string>> & { reading: boolean };

export class JsFzf {
  private cwd: string;
  private query: string;
  private onResults: (r: JsFzfResult) => void;

  private cancelSource: CancellationTokenSource;

  public static instance: JsFzf | undefined;

  constructor(
    cwd: string,
    query: string,
    readonly fdExe: string,
    onResults: (r: JsFzfResult) => void,
  ) {
    cwd = stripSlash(cwd);
    this.cwd = cwd;
    this.query = query;
    queryWorker({ type: "init", query });
    this.onResults = onResults;
    this.cancelSource = new CancellationTokenSource();
    this.spawnFd();
    JsFzf.instance = this;
  }

  private totalFiles: number | undefined;

  private async spawnFd() {
    const proc = new ProcessLineStreamer(this.fdExe, getFdArgs(), { cwd: this.cwd });
    const files = [];

    const cancellationToken = this.cancelSource.token;
    cancellationToken.onCancellationRequested(() => proc.kill());
    for await (const status of proc.spawn()) {
      if (cancellationToken.isCancellationRequested) continue;

      switch (status.type) {
        case "stdout": {
          queryWorker({ type: "items", items: status.lines });
          break;
        }
        case "error":
          window.showErrorMessage("fd error: " + JSON.stringify(status.error));
          break;
        case "exit":
          this.totalFiles = files.length;
          break;
        case "notFound":
          window.showErrorMessage("fd error: not found");
          break;
        case "stderr":
          for (const line of status.lines) {
            window.showWarningMessage("fd stderr: " + line);
          }
          break;
        default: {
          const _exhaustive: never = status;
        }
      }
    }
  }

  public onWorkerResult({ result, total }: FzfWorkerOutput) {
    this.onResults({
      items: result,
      render: (item: FzfResultItem<string>) => item,
      filtered: result.length,
      total: total,
      reading: this.totalFiles === undefined || total !== this.totalFiles,
    });
  }

  public setQuery(query: string) {
    this.query = query;
    queryWorker({ type: "query", query });
  }

  public getQuery() {
    return this.query;
  }

  public async quit() {
    this.cancelSource.cancel();
  }
}

function quoteArg(s: string) {
  if (s === "") return `''`;
  if (!/[^%+,-.\/:=@_0-9A-Za-z]/.test(s)) return s;
  return `'` + s.replace(/'/g, `'"'`) + `'`;
}

function getFdArgs(): string[] {
  const excluded_files = workspace.getConfiguration("files").get("exclude") || {};
  if (typeof excluded_files !== "object") return ["--type", "f"];
  const exclude_opts = Object.entries(excluded_files).flatMap(([key, enabled]) => {
    if (!enabled) return [];
    return ["--exclude", quoteArg(key)];
  });
  return ["--type", "f", ...exclude_opts];
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
  window.showErrorMessage(`fd(2): ${fdExe}`);
}

let worker: Worker | undefined;

export async function register(context: ExtensionContext) {
  detectFd();

  const workerJsUri = Uri.joinPath(context.extensionUri, "dist", "fzfWorker.js");
  const content = await workspace.fs.readFile(workerJsUri);
  const blob = new Blob([content], { type: "application/javascript" });
  const workerUrl = URL.createObjectURL(blob);
  try {
    worker = new Worker(workerUrl);
    worker.onmessage = (e) => {
      if (JsFzf.instance) {
        JsFzf.instance.onWorkerResult(e.data);
      }
    };
  } catch (e) {
    log(`Error creating worker: ${JSON.stringify(e)}`);
    worker = undefined;
    fdExe = undefined;
  }
}

async function queryWorker(input: FzfWorkerInput) {
  worker?.postMessage(input);
}
