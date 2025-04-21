import {
  commands,
  ExtensionContext,
  TextEditorSelectionChangeKind,
  window,
  workspace,
} from "vscode";
import { updateGlobalThemeType, updateStickyScrollConf } from "./common/decoration";
import { init as initGlobal } from "./common/global";
import { init as initRemote, pickPathFromUri } from "./common/remote";
import { register as registerDired } from "./findFile/dired";
import { FindFilePanel } from "./findFile/findFilePanel";
import { popGotoStack, pushGotoStack } from "./helperCommands/gotoStack";
import { migrateFromVSpaceCode } from "./helperCommands/migrateFromVSpaceCode";
import { registerCommands } from "./helperCommands/pathCommands";
import { LeaderkeyPanel } from "./leaderkey/leaderKeyPanel";
import {
  register as registerRipgrepFs,
  scheme as ripgrepFsScheme,
} from "./ripgrep/dummyFs";
import { defaultQueryMode } from "./ripgrep/rg";
import { RgPanel } from "./ripgrep/rgPanel";

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
  registerRipgrepFs(context);

  const leaderKeyPanel = new LeaderkeyPanel(() => resetCurrentPanel());
  await leaderKeyPanel.activate(context);

  const findFilePanel = new FindFilePanel(
    workspace.workspaceFolders?.at(0)?.uri?.path ?? "/",
    () => resetCurrentPanel(),
  );

  async function resetPanel() {
    if (currentPanel === undefined) return;
    switch (currentPanel.type) {
      case "leaderkey":
        leaderKeyPanel.reset();
        break;
      case "findfile":
        await findFilePanel.reset();
        break;
      case "ripgrep":
        await currentPanel.panel.quit("normal");
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
      const rgPanel = new RgPanel(
        {
          dir: [dir],
          query: "",
          cwd: dir,
          ...defaultQueryMode(),
        },
        editor,
        () => resetCurrentPanel(),
      );
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
      async (keyOrObj: string | { key: string; when: string }) => {
        if (currentPanel === undefined) {
          currentPanel = { type: "leaderkey" };
          window.showWarningMessage(
            `onkey got [${JSON.stringify(keyOrObj)}] when no panel is active`,
          );
        }
        switch (currentPanel.type) {
          case "leaderkey":
            await leaderKeyPanel.onKey(keyOrObj);
            break;
          case "findfile":
            await findFilePanel.onKey(
              typeof keyOrObj === "string" ? keyOrObj : keyOrObj.key,
            );
            break;
          case "ripgrep":
            await currentPanel.panel.onKey(
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
    window.onDidChangeActiveTextEditor((editor) => {
      if (
        currentPanel?.type === "ripgrep" &&
        editor?.document.uri.scheme === ripgrepFsScheme
      ) {
        // this is likely spawned by ripgrep, pass
      } else {
        resetPanel();
      }
    }),
    window.onDidChangeTextEditorSelection((event) => {
      if (event.kind === TextEditorSelectionChangeKind.Mouse) {
        resetPanel();
      }
    }),
  );

  registerCommands(context);
}

export function deactivate() {}
