import { OutputChannel, StatusBarItem, ThemeColor, window } from "vscode";

export const WHICHKEY_STATE = "leaderkeyState";

let statusBar: StatusBarItem | undefined = undefined;
let statusBarTimeout: NodeJS.Timeout | undefined = undefined;
let outputChannel: OutputChannel | undefined = undefined;

export function init() {
  outputChannel = window.createOutputChannel("leaderkey");
  statusBar = window.createStatusBarItem("leaderkeyState");
  statusBar.show();
}

export function log(msg: string) {
  outputChannel?.appendLine(msg);
}

const statusBarWarning = new ThemeColor("statusBarItem.warningBackground");
const statusBarError = new ThemeColor("statusBarItem.errorBackground");
export function setStatusBar(text: string, state?: "warning" | "error") {
  clearTimeout(statusBarTimeout);
  if (statusBar) {
    statusBar.text = text;
    if (state === "warning") {
      statusBar.backgroundColor = statusBarWarning;
      statusBarTimeout = setTimeout(() => (statusBar!.backgroundColor = undefined), 2000);
    } else if (state === "error") {
      statusBar.backgroundColor = statusBarError;
      statusBarTimeout = setTimeout(() => (statusBar!.backgroundColor = undefined), 2000);
    } else {
      statusBar.backgroundColor = undefined;
    }
  }
}
