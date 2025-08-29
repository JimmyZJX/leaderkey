import {
  commands,
  ExtensionContext,
  extensions,
  TextEditorSelectionChangeKind,
  window,
  workspace,
} from "vscode";
import { updateGlobalThemeType, updateStickyScrollConf } from "./common/decoration";
import { commonPrefix, init as initGlobal } from "./common/global";
import { getDir, inferPathFromHooks, inferPathFromUri } from "./common/inferPathFromUri";
import { ENV_HOME, init as initRemote } from "./common/remote";
import { register as registerCompare } from "./compare/compare";
import { register as registerDired, showDir } from "./findFile/dired";
import { FindFileOptions, FindFilePanel } from "./findFile/findFilePanel";
import { detectFd } from "./findFile/fzfProcess";
import { popGotoStack, pushGotoStack } from "./helperCommands/gotoStack";
import { migrateFromVSpaceCode } from "./helperCommands/migrateFromVSpaceCode";
import { registerCommands } from "./helperCommands/pathCommands";
import { LeaderkeyPanel } from "./leaderkey/leaderKeyPanel";
import {
  register as registerRipgrepFs,
  scheme as ripgrepFsScheme,
} from "./ripgrep/dummyFs";
import { createRgPanel, CreateRgPanelOptions, RgPanel } from "./ripgrep/rgPanel";
import { getQueryFromSelection } from "./ripgrep/utils";

import { register as registerInferPath } from "./common/inferPathFromUri";

type RipGrepCreateOption = CreateRgPanelOptions & { selectDir?: boolean };

class PanelManager {
  currentPanel:
    | { type: "leaderkey" }
    | { type: "findfile"; panel: FindFilePanel }
    | { type: "ripgrep"; panel: RgPanel }
    | undefined = undefined;

  // single instance only
  leaderKeyPanel = new LeaderkeyPanel(() => this.resetCurrent());

  resetCurrent() {
    this.currentPanel = undefined;
  }

  async forceReset(mode?: "normal" | "interrupt") {
    if (this.currentPanel === undefined) return;
    switch (this.currentPanel.type) {
      case "leaderkey":
        this.leaderKeyPanel.reset();
        break;
      case "findfile":
        await this.currentPanel.panel.quit();
        break;
      case "ripgrep":
        await this.currentPanel.panel.quit(mode ?? "normal");
        break;
    }
  }

  public async withInner<T>(f: () => Promise<T>) {
    const old = this.currentPanel;
    try {
      return await f();
    } finally {
      this.currentPanel = old;
    }
  }

  static getWorkspaceRoot() {
    const workspaceDirs = (workspace.workspaceFolders ?? []).flatMap((folder) => {
      const uri = folder.uri;
      if (["file", "vscode-remote"].includes(uri.scheme)) {
        return [uri.path];
      }
      return [];
    });
    if (workspaceDirs.length === 0) return ENV_HOME;
    return commonPrefix(workspaceDirs);
  }

  async findFile(options?: FindFileOptions & { doNotResetPanel?: boolean }) {
    let editor = window.activeTextEditor;
    if (!editor) {
      const doc = await workspace.openTextDocument({ language: "text" });
      editor = await window.showTextDocument(doc, { preview: true });
    }
    const init = options?.init
      ? options.init
      : await (async () => {
          if (options?.projectRoot) {
            const inferred = await inferPathFromHooks(editor.document.uri);
            if (inferred) return getDir(inferred);
            return PanelManager.getWorkspaceRoot();
          } else {
            return await inferPathFromUri(editor.document.uri, "dirname");
          }
        })();
    return new Promise<string | undefined>(async (resolve) => {
      if (!options?.doNotResetPanel) {
        await this.forceReset();
      }
      const panel = new FindFilePanel({ ...options, init }, (path) => resolve(path));
      this.currentPanel = { type: "findfile", panel };
    });
  }

  async ripgrep(mode?: RipGrepCreateOption) {
    mode = JSON.parse(JSON.stringify(mode ?? {}));
    if (mode?.selectDir) {
      let query: string | undefined = undefined;
      if (window.activeTextEditor) {
        query = getQueryFromSelection(
          window.activeTextEditor,
          mode.query ?? { type: "selection-only" },
          "regex",
        );
        mode.query = { type: "raw", query };
      }
      const dir = await this.findFile({
        title: "Select dir to rg" + (query ? ` [${query}]` : ""),
        dirOnly: true,
        returnOnly: true,
      });
      if (dir === undefined) return;
      mode ??= {};
      mode.dir = { type: "path", path: dir };
    }
    const rgPanel = await createRgPanel(mode, () => this.resetCurrent());
    await this.forceReset();
    this.currentPanel = { type: "ripgrep", panel: rgPanel };
  }

  setRgPanel(panel: RgPanel) {
    this.currentPanel = { type: "ripgrep", panel };
  }

  async activate(context: ExtensionContext) {
    await this.leaderKeyPanel.activate(context);
    registerCompare(context);
    context.subscriptions.push(
      commands.registerCommand(
        "leaderkey.render",
        async (pathOrWithWhen?: string | { path: string; when: string }) => {
          await this.forceReset();
          this.currentPanel = { type: "leaderkey" };
          this.leaderKeyPanel.render(pathOrWithWhen ?? "SPC");
        },
      ),
      commands.registerCommand(
        "leaderkey.findFile",
        async (options: FindFileOptions) => await this.findFile(options),
      ),
      commands.registerCommand("leaderkey.dired", async () => {
        const editor = window.activeTextEditor;
        let dir: string;
        if (editor) {
          dir = await inferPathFromUri(editor.document.uri, "dirname");
        } else {
          dir = workspace.workspaceFolders?.[0]?.uri.fsPath ?? ENV_HOME;
        }
        await showDir(dir);
      }),
      commands.registerCommand("leaderkey.ripgrep", (mode?: RipGrepCreateOption) =>
        this.ripgrep(mode),
      ),
      commands.registerCommand(
        "leaderkey.onkey",
        async (keyOrObj: string | { key: string; when: string }) => {
          if (keyOrObj === "ESC") {
            this.forceReset();
            return;
          }
          if (this.currentPanel === undefined) {
            this.currentPanel = { type: "leaderkey" };
          }
          switch (this.currentPanel.type) {
            case "leaderkey":
              await this.leaderKeyPanel.onKey(keyOrObj);
              break;
            case "findfile":
              await this.currentPanel.panel.onKey(
                typeof keyOrObj === "string" ? keyOrObj : keyOrObj.key,
              );
              break;
            case "ripgrep":
              await this.currentPanel.panel.onKey(
                typeof keyOrObj === "string" ? keyOrObj : keyOrObj.key,
              );
              break;
            default: {
              const _exhaustive: never = this.currentPanel;
            }
          }
        },
      ),
      commands.registerCommand(
        "leaderkey.searchBindings",
        async () => await this.leaderKeyPanel.searchBindings(),
      ),
      window.onDidChangeActiveTextEditor((editor) => {
        if (
          this.currentPanel?.type === "ripgrep" &&
          editor?.document.uri.scheme === ripgrepFsScheme
        ) {
          // this is likely spawned by ripgrep, pass
        } else {
          this.forceReset("interrupt");
        }
      }),
      window.onDidChangeTextEditorSelection((event) => {
        if (event.kind === TextEditorSelectionChangeKind.Mouse) {
          this.forceReset("interrupt");
        }
      }),
    );
  }
}
export const panelManager = new PanelManager();

export async function activate(context: ExtensionContext) {
  initGlobal();
  initRemote();
  registerDired(context);
  registerRipgrepFs(context);
  registerInferPath(context);
  detectFd();

  await panelManager.activate(context);

  context.subscriptions.push(
    commands.registerCommand("leaderkey.migrateFromVSpaceCode", migrateFromVSpaceCode),
    commands.registerCommand("leaderkey.pushGotoStack", pushGotoStack),
    commands.registerCommand("leaderkey.popGotoStack", popGotoStack),
    commands.registerCommand("leaderkey.extensions.getAll", () =>
      extensions.all.map((extension) => ({
        id: extension.id,
        version: extension.packageJSON.version,
      })),
    ),

    workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("editor.stickyScroll")) {
        updateStickyScrollConf();
      }
    }),

    window.onDidChangeActiveColorTheme((_ct) => updateGlobalThemeType()),
  );
  updateGlobalThemeType();

  registerCommands(context);
}

export function deactivate() {}
