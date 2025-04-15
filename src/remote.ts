import { ExecException } from "child_process";
import { commands } from "vscode";

export type ProcessRunResult = {
  error: ExecException | null;
  stdout: string;
  stderr: string;
};

export async function runProcess(prog: string, args: string[]) {
  const result: ProcessRunResult = await commands.executeCommand(
    "remote-commons.process.run",
    prog,
    args,
  );
  return result;
}
