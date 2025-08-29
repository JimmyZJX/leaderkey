import { dirname } from "path-browserify";
import { commands, ExtensionContext, Uri, window, workspace } from "vscode";
import { scheme as diredScheme } from "../findFile/dired";
import { commonPrefix, log } from "./global";
import { ENV_HOME, fileExists, RE_WINDOWS_URL_PATH } from "./remote";

const inferPathCommands: [RegExp, string][] = [];

export function register(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(
      "leaderkey.registerInferPathCommand",
      (regex: string, command: string) => {
        if (typeof regex !== "string" || typeof command !== "string") return;
        try {
          inferPathCommands.push([new RegExp(regex), command]);
        } catch (e) {
          log(`Error registering inferPathCommand: ${e}`);
        }
      },
    ),
  );
}

export async function inferPathFromHooks(uri: Uri) {
  for (const [regex, command] of inferPathCommands) {
    if (regex.test(uri.toString())) {
      try {
        const r = await commands.executeCommand(command);
        if (typeof r === "string") {
          return r;
        }
      } catch (e) {
        window.showErrorMessage(`Error executing command ${command}: ${e}`);
      }
    }
  }
  return undefined;
}

export function getDir(path: string) {
  if (path.endsWith("/")) return path.slice(0, -1);
  return dirname(path);
}

const COMMON_PATH_PREFIX = ["/tmp/", "/home/", "/usr/local/home/"];
export async function inferPathFromUri(uri: Uri, mode?: "dirname") {
  function modeOf(path: string) {
    if (mode === "dirname") return getDir(path);
    return path;
  }

  function defaultPath() {
    if (workspace.workspaceFolders) {
      return commonPrefix(workspace.workspaceFolders.map((f) => f.uri.path));
    }
    return ENV_HOME;
  }

  const fromHooks = await inferPathFromHooks(uri);
  if (fromHooks) return modeOf(fromHooks);

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
