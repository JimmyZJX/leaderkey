import {
  commands,
  ExtensionContext,
  TextEditorSelectionChangeKind,
  window,
} from "vscode";
import { init } from "./global";
import { popGotoStack, pushGotoStack } from "./helperCommands/gotoStack";
import { migrateFromVSpaceCode } from "./helperCommands/migrateFromVSpaceCode";
import { registerCommands } from "./helperCommands/pathCommands";
import { updateGlobalThemeType } from "./leaderkey/decoration";
import { LeaderkeyPanel } from "./leaderkey/leaderKeyPanel";

export async function activate(context: ExtensionContext) {
  init();
  const leaderKeyPanel = new LeaderkeyPanel();
  context.subscriptions.push(
    commands.registerCommand(
      "leaderkey.render",
      (pathOrWithWhen: string | { path: string; when: string }) =>
        leaderKeyPanel.render(pathOrWithWhen),
    ),
    commands.registerCommand(
      "leaderkey.onkey",
      (keyOrObj: string | { key: string; when: string }) =>
        leaderKeyPanel.onkey(keyOrObj),
    ),
    commands.registerCommand("leaderkey.migrateFromVSpaceCode", migrateFromVSpaceCode),
    commands.registerCommand("leaderkey.pushGotoStack", pushGotoStack),
    commands.registerCommand("leaderkey.popGotoStack", popGotoStack),
    commands.registerCommand(
      "leaderkey.searchBindings",
      async () => await leaderKeyPanel.searchBindings(),
    ),

    window.onDidChangeActiveColorTheme((_ct) => updateGlobalThemeType()),
    window.onDidChangeActiveTextEditor((_e) => leaderKeyPanel.reset()),
    window.onDidChangeTextEditorSelection((event) => {
      if (event.kind === TextEditorSelectionChangeKind.Mouse) {
        leaderKeyPanel.reset();
      }
    }),
  );

  registerCommands(context);
}

export function deactivate() {}
