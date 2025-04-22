import {
  commands,
  ExtensionContext,
  TextEditorDecorationType,
  window,
  workspace,
} from "vscode";
import { enableLeaderKeyAndDisableVim } from "../common/context";
import { log, setStatusBar } from "../common/global";
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
import { defaultBindings } from "./defaultBindings";
import { renderBinding } from "./render";

export class LeaderkeyPanel {
  root: Bindings;
  path: string;
  when: string | undefined;
  disposableDecos: TextEditorDecorationType[] = [];

  onReset: () => void;

  constructor(onReset: () => void) {
    this.onReset = onReset;
    this.root = structuredClone(defaultBindings);
    this.path = "";
    this.when = undefined;
  }

  public async activate(context: ExtensionContext) {
    this.confOverrideRefresh();

    context.subscriptions.push(
      commands.registerCommand("leaderkey.refreshConfigs", () =>
        this.confOverrideRefresh(),
      ),
      workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("leaderkey")) {
          this.confOverrideRefresh();
        }
      }),
    );
    await enableLeaderKeyAndDisableVim(this.path);
  }

  private confOverrideRefresh() {
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
    this.root = normalize(newRoot);
    log("Normalized root:\n" + JSON.stringify(this.root, undefined, 2));
    if (global.gc) global.gc();
  }

  private async setAndRenderPath(path: string, binding: Bindings | undefined) {
    this.path = path;
    try {
      await enableLeaderKeyAndDisableVim(this.path);
      setStatusBar(path === "" ? "" : path + "-");
    } finally {
      const oldDisposables = this.disposableDecos;
      try {
        this.disposableDecos = [];
        const editor = window.activeTextEditor;
        if (editor !== undefined) {
          if (path === "") {
            // reset
            this.when = undefined;
          } else {
            const bOrC = binding ?? go(this.root, path, this.when);
            if (bOrC === undefined || isCommand(bOrC)) {
              // skip rendering
            } else {
              this.disposableDecos = renderBinding(editor, bOrC, path, this.when);
            }
          }
        }
      } finally {
        for (const dsp of oldDisposables) dsp.dispose();
      }
    }
  }

  private pop(path: string): string {
    const lastSpaceIndex = path.lastIndexOf(" ");
    return lastSpaceIndex === -1 ? "" : path.slice(0, lastSpaceIndex);
  }

  public async onKey(keyOrObj: string | { key: string; when: string }) {
    const [key, when] =
      typeof keyOrObj === "string"
        ? [keyOrObj, undefined]
        : [keyOrObj.key, keyOrObj.when];
    this.when = when ?? this.when;

    const newPath =
      key === "<backspace>"
        ? this.pop(this.path)
        : (this.path === "" ? "" : this.path + " ") + key;
    const bOrC = go(this.root, newPath, this.when);
    if (bOrC === undefined) {
      await this.setAndRenderPath("", undefined);
      setStatusBar(`Unknown leaderkey: ${newPath}`, "error");
      return;
    }
    if (isBindings(bOrC)) {
      await this.setAndRenderPath(newPath, bOrC);
      return;
    }
    // command
    const cmd = bOrC;
    await this.setAndRenderPath(cmd.goto ?? "", undefined);
    if (cmd.commands) {
      const cmds = cmd.commands.map((command) =>
        typeof command === "string" ? { command } : command,
      );
      commands.executeCommand("runCommands", { commands: cmds });
    } else {
      commands.executeCommand(
        cmd.command!,
        ...(cmd.args === undefined ? [] : [cmd.args]),
      );
    }
  }

  public render(pathOrWithWhen: string | { path: string; when: string }) {
    if (typeof pathOrWithWhen === "string") {
      return this.setAndRenderPath(pathOrWithWhen, undefined);
    } else {
      this.when = pathOrWithWhen.when;
      return this.setAndRenderPath(pathOrWithWhen.path, undefined);
    }
  }

  public reset() {
    if (this.path) {
      this.setAndRenderPath("", undefined);
    }
    this.onReset();
  }

  public async searchBindings() {
    const items = showAsQuickPickItems(this.root);
    window.showQuickPick(items, {
      title: "All bindings of leaderkey",
      matchOnDescription: true,
    });
  }
}
