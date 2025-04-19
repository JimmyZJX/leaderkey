import { ExecException, ProcessEnvOptions } from "child_process";
import { dirname } from "path-browserify";
import { commands, TextDocumentShowOptions, Uri, window, workspace } from "vscode";
import { scheme as diredScheme } from "../findFile/dired";
import { commonPrefix, log } from "./global";

export type ProcessRunResult = {
  error: ExecException | null;
  stdout: string;
  stderr: string;
};

export async function runProcess(
  prog: string,
  args: string[],
  execOpts?: ProcessEnvOptions,
) {
  log(`Running command: ${prog} ${args}`);
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
    this.args = args;
    this.execOpts = execOpts;
  }

  public async *spawn(): AsyncGenerator<ProcessLineStreamerYieldStatus, void, void> {
    if (this.id !== undefined) {
      throw (
        "process spawned twice " + JSON.stringify({ prog: this.prog, args: this.args })
      );
    }
    log(`Running command (ProcessLineStreamer): ${this.prog} ${this.args}`);
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

    while (true) {
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

export async function openFile(file: string, options?: TextDocumentShowOptions) {
  await commands.executeCommand("remote-commons.openFile", file, options);
}

export let ENV_HOME = "/";

export async function init() {
  const result: ProcessRunResult = await runProcess("/bin/bash", ["-c", "echo ~"]);
  if (result.error) {
    window.showErrorMessage(`Failed to run bash? ${JSON.stringify(result)}`);
  } else {
    ENV_HOME = result.stdout.trim();
    log(`Got ENV_HOME=${ENV_HOME}`);
  }
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
    uri.scheme in ["file", "vscode-remote", diredScheme] ||
    COMMON_PATH_PREFIX.some((p) => uri.path.startsWith(p))
  ) {
    // looks like a path, accept immediately
    return modeOf(uri.path);
  } else if (uri.path === "/" || !uri.path.startsWith("/")) {
    return defaultPath();
  } else {
    const r = await runProcess("/bin/realpath", ["--no-symlinks", uri.path]);
    if (!r.error) {
      return modeOf(r.stdout.trimEnd());
    } else {
      log(`realpath failed: ${JSON.stringify(r)}`);
    }
    return defaultPath();
  }
}
