import {
  CancellationTokenSource,
  commands,
  ExtensionContext,
  TextEditorSelectionChangeKind,
  window,
  workspace,
} from "vscode";
import { init as initGlobal, log } from "./common/global";
import { init as initRemote, pickPathFromUri } from "./common/remote";
import { register as registerDired } from "./findFile/dired";
import { FindFilePanel } from "./findFile/findFilePanel";
import { popGotoStack, pushGotoStack } from "./helperCommands/gotoStack";
import { migrateFromVSpaceCode } from "./helperCommands/migrateFromVSpaceCode";
import { registerCommands } from "./helperCommands/pathCommands";
import { updateGlobalThemeType, updateStickyScrollConf } from "./leaderkey/decoration";
import { LeaderkeyPanel } from "./leaderkey/leaderKeyPanel";
import { doQuery, RipGrepQuery } from "./ripgrep/rg";

let currentPanel: "leaderkey" | "findfile" | undefined = undefined;
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
    if (currentPanel === "findfile") {
      findFilePanel.reset();
    } else {
      leaderKeyPanel.reset();
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
      currentPanel = "findfile";
    }),
    commands.registerCommand(
      "leaderkey.render",
      (pathOrWithWhen: string | { path: string; when: string }) => {
        if (currentPanel === "findfile") {
          findFilePanel.reset();
        }
        leaderKeyPanel.render(pathOrWithWhen);
      },
    ),
    commands.registerCommand(
      "leaderkey.onkey",
      (keyOrObj: string | { key: string; when: string }) => {
        if (currentPanel === "findfile") {
          findFilePanel.onkey(typeof keyOrObj === "string" ? keyOrObj : keyOrObj.key);
        } else {
          leaderKeyPanel.onkey(keyOrObj);
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
