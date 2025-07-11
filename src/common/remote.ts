import { ExecException, ProcessEnvOptions, SpawnOptions } from "child_process";
import { dirname } from "path-browserify";
import { commands, TextDocumentShowOptions, Uri, window, workspace } from "vscode";
import { scheme as diredScheme } from "../findFile/dired";
import { commonPrefix, log } from "./global";
import { throttler } from "./throttle";

const RE_WINDOWS_URL_PATH = /^\/(?<drive>[a-zA-Z]):\/(?<rest>.+)$/;
function ppWinPath(arg: string) {
  if (isWin()) {
    const m = RE_WINDOWS_URL_PATH.exec(arg);
    if (m) {
      return (
        m.groups!.drive!.toUpperCase() + ":\\" + m.groups!.rest!.replaceAll("/", "\\")
      );
    }
  }
  return arg;
}
function ppWinPaths(args: string[]) {
  return args.map(ppWinPath);
}

const RE_WINDOWS_NATIVE_PATH = /^(?<drive>[a-zA-Z]):\\(?<rest>.+)$/;
export function normalizePath(path: string) {
  if (isWin()) {
    const m = RE_WINDOWS_NATIVE_PATH.exec(path);
    if (m) {
      return (
        "/" +
        m.groups!.drive!.toLowerCase() +
        ":/" +
        m.groups!.rest!.replaceAll("\\", "/")
      );
    }
  }
  return path.replaceAll("\\", "/");
}

export async function readDirFilesAndDirs(
  path: string,
): Promise<{ files: string[]; dirs: string[] }> {
  return await commands.executeCommand(
    "remote-commons.fs.readDirFilesAndDirs",
    ppWinPath(path),
  );
}

export async function createFile(path: string, contents?: string): Promise<void> {
  return await commands.executeCommand(
    "remote-commons.fs.createFile",
    ppWinPath(path),
    contents,
  );
}

export async function createTempFile(path: string, contents?: string): Promise<string> {
  const file = (await commands.executeCommand(
    "remote-commons.fs.createTempFile",
    ppWinPath(path),
    contents,
  )) as string;
  return normalizePath(file);
}

export async function fileExists(
  path: string,
): Promise<{ files: string[]; dirs: string[] }> {
  return await commands.executeCommand("remote-commons.fs.fileExists", ppWinPath(path));
}

export type ProcessRunResult = {
  error: ExecException | null;
  stdout: string | undefined;
  stderr: string | undefined;
};

type RunProcessOptions = SpawnOptions & { pty?: boolean };

export async function runProcess(
  prog: string,
  args: string[],
  execOpts?: RunProcessOptions,
) {
  args = ppWinPaths(args);
  execOpts ??= {};
  if (typeof execOpts.cwd === "string") {
    execOpts.cwd = ppWinPath(execOpts.cwd);
  }
  log(`Running command: [${prog}] [${args}] [${JSON.stringify(execOpts)}]`);
  const result: ProcessRunResult = await commands.executeCommand(
    "remote-commons.process.run",
    prog,
    args,
    execOpts,
  );
  return result;
}

type ProcessLineStreamerSpawnResult =
  | { succeed: false; error: ExecException }
  | { succeed: true; id: string };

type ProcessLineStreamerStatus = {
  stdout: string[];
  stderr: string[];
  exit: number | string | undefined;
};

type ProcessLineStreamerYieldStatus =
  | { type: "stdout"; lines: string[] }
  | { type: "stderr"; lines: string[] }
  | { type: "error"; error: ExecException }
  | { type: "exit"; exit: number | string }
  | { type: "notFound" };

type SpawnConfig = {
  minDelayMs?: number;
};

export class ProcessLineStreamer {
  prog: string;
  args: string[];
  execOpts?: ProcessEnvOptions;

  // init (undefined) -> spawned (undetermined) -> running (async string) -> killed (async
  // undefined)
  id: Thenable<string | undefined> | undefined;
  isKilled = false;

  constructor(prog: string, args: string[], execOpts?: ProcessEnvOptions) {
    this.prog = prog;
    this.args = ppWinPaths(args);
    if (execOpts && typeof execOpts.cwd === "string") {
      execOpts.cwd = ppWinPath(execOpts.cwd);
    }
    this.execOpts = execOpts;
  }

  public async *spawn(
    config?: SpawnConfig,
  ): AsyncGenerator<ProcessLineStreamerYieldStatus, void, void> {
    if (this.id !== undefined) {
      throw (
        "process spawned twice " + JSON.stringify({ prog: this.prog, args: this.args })
      );
    }
    log(
      `Running command (ProcessLineStreamer): [${this.prog}] [${this.args}] [${JSON.stringify(this.execOpts)}]`,
    );
    const resultPromise: Thenable<ProcessLineStreamerSpawnResult> =
      commands.executeCommand(
        "remote-commons.process.lineStreamer.spawn",
        this.prog,
        this.args,
        this.execOpts,
      );
    this.id = resultPromise.then((result) => (result.succeed ? result.id : undefined));

    const result = await resultPromise;
    if (result.succeed === false) {
      yield { type: "error", error: result.error };
      return;
    }

    for await (const _ of throttler(config?.minDelayMs ?? 100)) {
      const status: ProcessLineStreamerStatus | undefined = await commands.executeCommand(
        "remote-commons.process.lineStreamer.read",
        result.id,
      );
      if (status === undefined) {
        if (this.isKilled) return;
        throw (
          "Remote process unexpectedly quits " +
          JSON.stringify({ prog: this.prog, args: this.args })
        );
      }
      if (status.stdout.length > 0) {
        yield { type: "stdout", lines: status.stdout };
        if (this.isKilled) return;
      }
      if (status.stderr.length > 0) {
        yield { type: "stderr", lines: status.stderr };
        if (this.isKilled) return;
      }
      if (status.exit !== undefined) {
        yield { type: "exit", exit: status.exit };
        return;
      }
    }
  }

  public async kill(signal?: NodeJS.Signals | number) {
    if (this.id !== undefined) {
      const id = await this.id;
      if (id !== undefined) {
        this.isKilled = true;
        await commands.executeCommand(
          "remote-commons.process.lineStreamer.kill",
          id,
          signal,
        );
      }
    }
  }
}

export async function openFile(file: string | Uri, options?: TextDocumentShowOptions) {
  if (file instanceof Uri) {
    file = file.toString();
  }
  await commands.executeCommand("remote-commons.openFile", file, options);
}

type FetchInit = {
  body?: BodyInit;
  headers?: HeadersInit;
  method?: string;
  timeout?: number;
};

type FetchResult = {
  ok: boolean;
  status: number;
  statusText: string;
  headers: [string, string][];
  bodyText: string;
};

export async function fetchText(url: string, init?: FetchInit): Promise<FetchResult> {
  return await commands.executeCommand("remote-commons.fetch.fetchText", url, init);
}

async function goToExtensionSearchView(id: string) {
  await commands.executeCommand("workbench.extensions.search", id);
}

async function checkExtensionVersion(
  workspaceExtensions: { id: string; version: string }[],
  target: { id: string; name: string; major: number; minor: number },
) {
  const strExpectedVer = `${target.major}.${target.minor}.*`;
  const goToSearchView = async () => await goToExtensionSearchView(target.id);

  const extension = workspaceExtensions.find(
    ({ id }) => id.toLowerCase() === target.id.toLowerCase(),
  );
  if (!extension) {
    if (
      (await window.showErrorMessage(
        `"${target.name}" extension not installed`,
        "Install",
      )) === "Install"
    )
      await goToSearchView();
  } else {
    log(`[${target.id}] version = [${extension.version}]`);
    const parsedVersion = extension.version.split(".");
    if (parsedVersion.length < 2) {
      window.showErrorMessage(
        `Unexpected: version of "${target.name}" extension is not in expected format: ` +
          extension.version,
      );
    } else {
      const major = Number.parseInt(parsedVersion[0]);
      const minor = Number.parseInt(parsedVersion[1]);
      if (major < target.major || (major === target.major && minor < target.minor)) {
        if (
          (await window.showErrorMessage(
            `"${target.name}" extension too old: expected ${strExpectedVer}, got ${extension.version}`,
            "Update",
          )) === "Update"
        )
          await goToSearchView();
      } else if (major > target.major) {
        if (
          (await window.showWarningMessage(
            `"${target.name}" extension is newer than expected ${strExpectedVer} (got ${extension.version}). There might be some breaking changes.`,
            "Go to gallery",
          )) === "Go to gallery"
        )
          await goToSearchView();
      }
    }
  }
}

const REMOTE_COMMONS_EXTENSION_ID = "JimmyZJX.remote-commons";
const REMOTE_COMMONS_EXPECTED_VERSION = { major: 0, minor: 5 };

let workspaceExtensions: { id: string; version: string }[] | undefined = undefined;
let platform: string | undefined = undefined;
export let ENV_HOME = "/";

export async function init() {
  try {
    workspaceExtensions = await commands.executeCommand(
      "remote-commons.extensions.getAll",
    );
  } catch (e) {
    log(`Failed to get extensions: ${e}`);
    if (
      (await window.showErrorMessage(
        "Remote Commons extension not installed. It is needed for rg, find-file and fzf to work",
        "Install",
      )) === "Install"
    ) {
      await goToExtensionSearchView(REMOTE_COMMONS_EXTENSION_ID);
    }
  }

  if (workspaceExtensions) {
    checkExtensionVersion(workspaceExtensions, {
      id: REMOTE_COMMONS_EXTENSION_ID,
      name: "Remote Commons",
      ...REMOTE_COMMONS_EXPECTED_VERSION,
    });
  }

  platform = await commands.executeCommand("remote-commons.platform");
  log(`Remote platform = [${platform}]`);

  let result: ProcessRunResult;
  if (isWin()) {
    result = await runProcess("cmd", ["/c", "echo %USERPROFILE%"]);
  } else {
    result = await runProcess("/bin/bash", ["-c", "echo ~"]);
  }
  if (result.error) {
    window.showErrorMessage(`Failed to run bash/cmd? ${JSON.stringify(result)}`);
  } else {
    ENV_HOME = normalizePath(result.stdout!.trim());
    log(`Got home directory = [${ENV_HOME}]`);
  }
}

export function isWin() {
  return platform?.startsWith("win");
}

const COMMON_PATH_PREFIX = ["/tmp/", "/home/", "/usr/local/home/"];
export async function pickPathFromUri(uri: Uri, mode?: "dirname") {
  function modeOf(path: string) {
    switch (mode) {
      case "dirname":
        if (path.endsWith("/")) return path.slice(0, -1);
        return dirname(path);
      case undefined:
        return path;
    }
  }

  function defaultPath() {
    if (workspace.workspaceFolders) {
      return commonPrefix(workspace.workspaceFolders.map((f) => f.uri.path));
    }
    return ENV_HOME;
  }

  if (
    ["file", "vscode-remote", diredScheme].includes(uri.scheme) ||
    COMMON_PATH_PREFIX.some((p) => uri.path.startsWith(p)) ||
    RE_WINDOWS_URL_PATH.test(uri.path)
  ) {
    // looks like a path, accept immediately
    return modeOf(uri.path);
  } else if (uri.path === "/" || !uri.path.startsWith("/")) {
    return defaultPath();
  } else {
    if (await fileExists(uri.path)) {
      return modeOf(uri.path);
    }
    return defaultPath();
  }
}
