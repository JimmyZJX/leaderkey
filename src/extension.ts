import {
  commands,
  ExtensionContext,
  TextEditorSelectionChangeKind,
  window,
  workspace,
} from "vscode";
import { init as initGlobal } from "./common/global";
import { init as initRemote, pickPathFromUri } from "./common/remote";
import { register as registerDired } from "./findFile/dired";
import { FindFilePanel } from "./findFile/findFilePanel";
import { popGotoStack, pushGotoStack } from "./helperCommands/gotoStack";
import { migrateFromVSpaceCode } from "./helperCommands/migrateFromVSpaceCode";
import { registerCommands } from "./helperCommands/pathCommands";
import { updateGlobalThemeType, updateStickyScrollConf } from "./leaderkey/decoration";
import { LeaderkeyPanel } from "./leaderkey/leaderKeyPanel";
import { RgPanel } from "./ripgrep/rgPanel";
import { defaultQueryMode } from "./ripgrep/rg";

// TODO panel dispatcher
let currentPanel:
  | { type: "leaderkey" }
  | { type: "findfile" }
  | { type: "ripgrep"; panel: RgPanel }
  | undefined = undefined;
function resetCurrentPanel() {
  currentPanel = undefined;
}

export async function activate(context: ExtensionContext) {
  initGlobal();
  initRemote();
  registerDired(context);

  const leaderKeyPanel = new LeaderkeyPanel(() => resetCurrentPanel());
  await leaderKeyPanel.activate(context);

  const findFilePanel = new FindFilePanel(
    workspace.workspaceFolders?.at(0)?.uri?.path ?? "/",
    () => resetCurrentPanel(),
  );

  function resetPanel() {
    if (currentPanel === undefined) return;
    switch (currentPanel.type) {
      case "leaderkey":
        leaderKeyPanel.reset();
        break;
      case "findfile":
        findFilePanel.reset();
        break;
      case "ripgrep":
        currentPanel.panel.quit();
        break;
    }
  }

  // check if remote-commons is registered
  try {
    await commands.executeCommand("remote-commons.ping");
  } catch {
    window.showErrorMessage("Remote Commons extension not registered :(");
  }

  context.subscriptions.push(
    commands.registerCommand("leaderkey.findFile", async () => {
      let editor = window.activeTextEditor;
      if (!editor) {
        const doc = await workspace.openTextDocument({ language: "text" });
        editor = await window.showTextDocument(doc, { preview: true });
      }
      findFilePanel.setDir(await pickPathFromUri(editor.document.uri, "dirname"));
      findFilePanel.render();
      currentPanel = { type: "findfile" };
    }),
    commands.registerCommand("leaderkey.ripgrep", async () => {
      let editor = window.activeTextEditor;
      if (!editor) {
        const doc = await workspace.openTextDocument({ language: "text" });
        editor = await window.showTextDocument(doc, { preview: true });
      }

      //  synchronously show and then set dir
      const dir = await pickPathFromUri(editor.document.uri, "dirname");
      const rgPanel = new RgPanel({
        dir: [dir],
        query: "",
        cwd: dir,
        ...defaultQueryMode(),
      });
      currentPanel = { type: "ripgrep", panel: rgPanel };
    }),
    commands.registerCommand(
      "leaderkey.render",
      (pathOrWithWhen: string | { path: string; when: string }) => {
        resetPanel();
        currentPanel = { type: "leaderkey" };
        leaderKeyPanel.render(pathOrWithWhen);
      },
    ),
    commands.registerCommand(
      "leaderkey.onkey",
      (keyOrObj: string | { key: string; when: string }) => {
        currentPanel ??= { type: "leaderkey" };
        switch (currentPanel.type) {
          case "leaderkey":
            leaderKeyPanel.onKey(keyOrObj);
            break;
          case "findfile":
            findFilePanel.onKey(typeof keyOrObj === "string" ? keyOrObj : keyOrObj.key);
            break;
          case "ripgrep":
            currentPanel.panel.onKey(
              typeof keyOrObj === "string" ? keyOrObj : keyOrObj.key,
            );
            break;
          default: {
            const _exhaustive: never = currentPanel;
          }
        }
      },
    ),
    commands.registerCommand("leaderkey.migrateFromVSpaceCode", migrateFromVSpaceCode),
    commands.registerCommand("leaderkey.pushGotoStack", pushGotoStack),
    commands.registerCommand("leaderkey.popGotoStack", popGotoStack),
    commands.registerCommand(
      "leaderkey.searchBindings",
      async () => await leaderKeyPanel.searchBindings(),
    ),

    workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("editor.stickyScroll")) {
        updateStickyScrollConf();
      }
    }),

    window.onDidChangeActiveColorTheme((_ct) => updateGlobalThemeType()),
    window.onDidChangeActiveTextEditor((_e) => resetPanel()),
    window.onDidChangeTextEditorSelection((event) => {
      if (event.kind === TextEditorSelectionChangeKind.Mouse) {
        resetPanel();
      }
    }),
  );

  registerCommands(context);
}

export function deactivate() {}
