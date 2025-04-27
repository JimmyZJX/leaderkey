import { commands } from "vscode";

const LEADERKEY_STATE = "leaderkeyState";

export async function disableVim() {
  // log("[leaderkey] DISABLE VIM");
  // use inDebugRepl to bypass vim keybindings
  // we don't want to use `vim.active` here, since it might be used by other extensions to
  // determine the state of vim. debug repl is less likely to cause problems.
  // await commands.executeCommand("_setContext", "vim.active", false);
  await commands.executeCommand("_setContext", "inDebugRepl", true);
}

export async function enableVim() {
  // log("[leaderkey] ENABLE VIM");
  // await commands.executeCommand("_setContext", "vim.active", true);
  await commands.executeCommand("_setContext", "inDebugRepl", false);
}

export async function enableLeaderKeyAndDisableVim(path: string) {
  // log("[leaderkey] ENABLE [" + path + "]");
  const vim = path ? disableVim : enableVim;
  await Promise.allSettled([
    commands.executeCommand("_setContext", LEADERKEY_STATE, path),
    vim(),
  ]);
}

export async function disableLeaderKey() {
  // log("[leaderkey] DISABLE");
  await commands.executeCommand("_setContext", LEADERKEY_STATE, "");
}
