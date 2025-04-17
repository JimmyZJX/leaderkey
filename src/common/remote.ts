import { ExecException, ExecOptions } from "child_process";
import { dirname } from "path-browserify";
import { commands, TextDocumentShowOptions, Uri, window, workspace } from "vscode";
import { scheme as diredScheme } from "../findFile/dired";
import { commonPrefix, log } from "./global";

export type ProcessRunResult = {
  error: ExecException | null;
  stdout: string;
  stderr: string;
};

export async function runProcess(prog: string, args: string[], execOpts?: ExecOptions) {
  log(`Running command: ${prog} ${args}`);
  const result: ProcessRunResult = await commands.executeCommand(
    "remote-commons.process.run",
    prog,
    args,
    execOpts,
  );
  return result;
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
