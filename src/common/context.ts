import { commands } from "vscode";

const LEADERKEY_STATE = "leaderkeyState";

export async function disableVim() {
  //   log("[leaderkey] DISABLE VIM");
  await commands.executeCommand("_setContext", "vim.active", false);
}

export async function enableVim() {
  //   log("[leaderkey] ENABLE VIM");
  await commands.executeCommand("_setContext", "vim.active", true);
}

export async function enableLeaderKeyAndDisableVim(path: string) {
  //   log("[leaderkey] ENABLE [" + path + "]");
  const vim = path ? disableVim : enableVim;
  await Promise.allSettled([
    commands.executeCommand("_setContext", LEADERKEY_STATE, path),
    vim(),
  ]);
}

export async function disableLeaderKey() {
  //   log("[leaderkey] DISABLE");
  await commands.executeCommand("_setContext", LEADERKEY_STATE, "");
}
