import { commands, Disposable, ExtensionContext, window, workspace } from "vscode";
import {
  Bindings,
  Command,
  go,
  isBindings,
  isCommand,
  normalize,
  overrideExn,
  showAsQuickPickItems,
} from "./command";
import { renderBinding, updateGlobalThemeType } from "./decoration";
import { defaultBindings } from "./defaultBindings";
import { init, log, setStatusBar, WHICHKEY_STATE } from "./global";
import { popGotoStack, pushGotoStack } from "./gotoStack";
import { migrateFromVSpaceCode } from "./migrateFromVSpaceCode";
import { registerCommands } from "./pathCommands";

let globalPath = "";
let globalRoot = structuredClone(defaultBindings);
let globalWhen: string | undefined = undefined;

let stickyScrollMaxRows = 0;

function pop(path: string): string {
  const lastSpaceIndex = path.lastIndexOf(" ");
  return lastSpaceIndex === -1 ? "" : path.slice(0, lastSpaceIndex);
}

async function onkey(keyOrObj: string | { key: string; when: string }) {
  const [key, when] =
    typeof keyOrObj === "string" ? [keyOrObj, undefined] : [keyOrObj.key, keyOrObj.when];
  globalWhen = when ?? globalWhen;

  const newPath =
    key === "<back>"
      ? pop(globalPath)
      : (globalPath === "" ? "" : globalPath + " ") + key;
  const bOrC = go(globalRoot, newPath, globalWhen);
  if (bOrC === undefined) {
    setAndRenderPath("", undefined);
    setStatusBar(`Unknown leaderkey: ${newPath}`, "error");
    return;
  }
  if (isBindings(bOrC)) {
    setAndRenderPath(newPath, bOrC);
    return;
  }
  // command
  const cmd = bOrC;
  await setAndRenderPath(cmd.goto ?? "", undefined);
  if (cmd.commands) {
    const cmds = cmd.commands.map((command) =>
      typeof command === "string" ? { command } : command,
    );
    commands.executeCommand("runCommands", { commands: cmds });
  } else {
    commands.executeCommand(cmd.command!, ...(cmd.args === undefined ? [] : [cmd.args]));
  }
}

let disposableDecos: Disposable[] = [];

async function setAndRenderPath(path: string, binding: Bindings | undefined) {
  globalPath = path;
  try {
    setStatusBar(path === "" ? "" : path + "-");
    await commands.executeCommand("_setContext", WHICHKEY_STATE, globalPath);
  } finally {
    const oldDisposables = disposableDecos;
    try {
      if (path === "") {
        globalWhen = undefined;
      } else {
        const bOrC = binding ?? go(globalRoot, path, globalWhen);
        if (bOrC === undefined || isCommand(bOrC)) {
          // skip rendering
        } else {
          disposableDecos = renderBinding(bOrC, path, globalWhen, stickyScrollMaxRows);
        }
      }
    } finally {
      for (const dsp of oldDisposables) dsp.dispose();
    }
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
      },
    ),
    commands.registerCommand("leaderkey.onkey", onkey),
    commands.registerCommand("leaderkey.refreshConfigs", confOverrideRefresh),
    commands.registerCommand("leaderkey.migrateFromVSpaceCode", migrateFromVSpaceCode),
    commands.registerCommand("leaderkey.pushGotoStack", pushGotoStack),
    commands.registerCommand("leaderkey.popGotoStack", popGotoStack),
    commands.registerCommand("leaderkey.searchBindings", searchBindings),

    workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("leaderkey")) {
        confOverrideRefresh();
      }
      if (event.affectsConfiguration("editor.stickyScroll")) {
        updateStickyScrollConf();
      }
    }),
    window.onDidChangeActiveTextEditor((_e) => {
      if (globalPath === "") return;
      // try to render the UI on the new editor
      setAndRenderPath(globalPath, undefined);
    }),
    window.onDidChangeActiveColorTheme((_ct) => updateGlobalThemeType()),
  );

  confOverrideRefresh();
  updateStickyScrollConf();
  registerCommands(context);
}

function updateStickyScrollConf() {
  const ss = workspace.getConfiguration("editor.stickyScroll");
  if (ss.get("enabled") === true) {
    stickyScrollMaxRows = ss.get("maxLineCount", 5);
  } else {
    stickyScrollMaxRows = 0;
  }
}

function confOverrideRefresh() {
  const newRoot = structuredClone(defaultBindings);
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
              : (Object.fromEntries(Object.entries(cmd as any)) as any as Command),
          );
        } catch (e) {
          window.showErrorMessage(
            `Error parsing config leaderkey.overrides.${key}: ${e}`,
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

async function searchBindings() {
  const items = showAsQuickPickItems(globalRoot);
  window.showQuickPick(items, {
    title: "All bindings of leaderkey",
    matchOnDescription: true,
  });
}

export function deactivate() {}
