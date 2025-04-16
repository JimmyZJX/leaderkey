import { ExecException, ExecOptions } from "child_process";
import { commands } from "vscode";
import { log } from "./global";

export type ProcessRunResult = {
  error: ExecException | null;
  stdout: string;
  stderr: string;
};

export async function runProcess(prog: string, args: string[], execOpts?: ExecOptions) {
  log(`Running command: ${prog} ${args}`);
  const result: ProcessRunResult = await commands.executeCommand(
    "remote-commons.process.run",
    prog,
    args,
    execOpts,
  );
  return result;
}
