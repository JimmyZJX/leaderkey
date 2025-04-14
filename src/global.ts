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

const statusBarInfo = new ThemeColor("statusBarItem.warningBackground");
const statusBarError = new ThemeColor("statusBarItem.errorBackground");
export function setStatusBar(text: string, state?: "error" | "info") {
  clearTimeout(statusBarTimeout);
  if (statusBar) {
    statusBar.text = text;
    if (state === "error" || state === "info") {
      statusBar.backgroundColor = state === "error" ? statusBarError : statusBarInfo;
      statusBarTimeout = setTimeout(() => {
        statusBar!.backgroundColor = undefined;
        statusBar!.text = "";
      }, 2000);
    } else if (text !== "") {
      statusBar.backgroundColor = statusBarInfo;
    } else {
      statusBar.backgroundColor = undefined;
    }
  }
}

export function assert(condition: any, msg?: string): asserts condition {
  if (!condition) {
    throw new Error("Assertion error: " + msg);
  }
}
