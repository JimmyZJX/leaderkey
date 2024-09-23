import { commands, Disposable, ExtensionContext, window, workspace } from "vscode";
import { Command, go, isBindings, isCommand, overrideExn, sanitize } from "./command";
import { renderBinding } from "./decoration";
import { init, setStatusBar, WHICHKEY_STATE } from "./global";
import { root } from "./vspacecode";

let globalPath = "";
let globalRoot = structuredClone(root);

function onkey(key: string) {
  const newPath = (globalPath === "" ? "" : globalPath + " ") + key;
  const bOrC = go(globalRoot, newPath);
  if (bOrC === undefined) {
    setStatusBar(`Unknown leaderkey: ${newPath}`, "warning");
    setAndRenderPath("");
    return;
  }
  if (isBindings(bOrC)) {
    setAndRenderPath(newPath);
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
  setAndRenderPath("");
}

let disposableDecos: Disposable[] = [];

function setAndRenderPath(path: string) {
  globalPath = path;
  const oldDisposables = disposableDecos;
  try {
    setStatusBar(path === "" ? "" : path + "-");
    commands.executeCommand("_setContext", WHICHKEY_STATE, globalPath);
    if (path === "") return;
    const binding = go(globalRoot, path);
    if (binding === undefined || isCommand(binding)) return;

    disposableDecos = renderBinding(binding, path);
  } finally {
    for (const dsp of oldDisposables) dsp.dispose();
  }
}

export async function activate(context: ExtensionContext) {
  init();

  await commands.executeCommand("_setContext", WHICHKEY_STATE, globalPath);
  context.subscriptions.push(
    commands.registerCommand("leaderkey.render", setAndRenderPath),
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
  globalRoot = sanitize(newRoot);
}

export function deactivate() {}
