import { commands, Disposable, ExtensionContext, window, workspace } from "vscode";
import {
  Bindings,
  Command,
  go,
  isBindings,
  isCommand,
  normalize,
  overrideExn,
} from "./command";
import { renderBinding } from "./decoration";
import { init, log, setStatusBar, WHICHKEY_STATE } from "./global";
import { root } from "./vspacecode";

let globalPath = "";
let globalRoot = structuredClone(root);
let globalWhen: string | undefined = undefined;

function onkey(keyOrObj: string | { key: string; when: string }) {
  const [key, when] =
    typeof keyOrObj === "string" ? [keyOrObj, undefined] : [keyOrObj.key, keyOrObj.when];
  globalWhen = when ?? globalWhen;

  const newPath = (globalPath === "" ? "" : globalPath + " ") + key;
  const bOrC = go(globalRoot, newPath, globalWhen);
  if (bOrC === undefined) {
    setStatusBar(`Unknown leaderkey: ${newPath}`, "warning");
    setAndRenderPath("", undefined);
    return;
  }
  if (isBindings(bOrC)) {
    setAndRenderPath(newPath, bOrC);
    return;
  }
  // command
  const cmd = bOrC;
  if (cmd.commands) {
    const cmds = cmd.commands.map((command) =>
      typeof command === "string" ? { command } : command
    );
    commands.executeCommand("runCommands", { commands: cmds });
  } else {
    commands.executeCommand(cmd.command!, ...(cmd.args === undefined ? [] : [cmd.args]));
  }
  setAndRenderPath("", undefined);
}

let disposableDecos: Disposable[] = [];

function setAndRenderPath(path: string, binding: Bindings | undefined) {
  globalPath = path;
  const oldDisposables = disposableDecos;
  try {
    setStatusBar(path === "" ? "" : path + "-");
    commands.executeCommand("_setContext", WHICHKEY_STATE, globalPath);
    if (path === "") {
      globalWhen = undefined;
      return;
    }
    const bOrC = binding ?? go(globalRoot, path, globalWhen);
    if (bOrC === undefined || isCommand(bOrC)) return;
    disposableDecos = renderBinding(bOrC, path, globalWhen);
  } finally {
    for (const dsp of oldDisposables) dsp.dispose();
  }
}

export async function activate(context: ExtensionContext) {
  init();

  await commands.executeCommand("_setContext", WHICHKEY_STATE, globalPath);
  context.subscriptions.push(
    commands.registerCommand(
      "leaderkey.render",
      (pathOrWithWhen: string | { path: string; when: string }) => {
        if (typeof pathOrWithWhen === "string") {
          return setAndRenderPath(pathOrWithWhen, undefined);
        } else {
          globalWhen = pathOrWithWhen.when;
          return setAndRenderPath(pathOrWithWhen.path, undefined);
        }
      }
    ),
    commands.registerCommand("leaderkey.onkey", onkey)
  );

  workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("leaderkey")) {
      confOverrideRefresh();
    }
  });
  confOverrideRefresh();
}

function confOverrideRefresh() {
  const newRoot = structuredClone(root);
  const overrides = workspace.getConfiguration("leaderkey.overrides");
  const overrideEntries = Object.entries(overrides);
  overrideEntries.sort(([k1, _1], [k2, _2]) => k1.localeCompare(k2));
  for (const [key, v] of overrideEntries) {
    if (typeof v === "function") continue;
    if (typeof v === "object" && !Array.isArray(v)) {
      const entries = Object.entries(v);
      entries.sort(([k1, _1], [k2, _2]) => k1.localeCompare(k2));
      for (const [path, cmd] of entries) {
        try {
          overrideExn(
            newRoot,
            path,
            typeof cmd === "string"
              ? cmd
              : (Object.fromEntries(Object.entries(cmd as any)) as any as Command)
          );
        } catch (e) {
          window.showErrorMessage(
            `Error parsing config leaderkey.overrides.${key}: ${e}`
          );
        }
      }
    } else {
      window.showWarningMessage(`Config leaderkey.overrides.${key} is not a dict`);
    }
  }
  globalRoot = normalize(newRoot);
  log("Normalized root:\n" + JSON.stringify(globalRoot, undefined, 2));
  if (global.gc) global.gc();
}

export function deactivate() {}
