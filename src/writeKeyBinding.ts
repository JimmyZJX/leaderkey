import { writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path/posix";
import { window } from "vscode";
import { Bindings, isCommand, toVSCodeKey } from "./command";
import { root } from "./vspacecode";

export const WHICHKEY_STATE = "leaderkeyState";

export function writeKeyBinding() {
  const setKeys = new Set<string>();
  const keys: any[] = [];
  function loop(r: Bindings, path: string) {
    const when = `${WHICHKEY_STATE} == '${path}'`;
    Object.entries(r.keys).forEach(([k, v]) => {
      setKeys.add(k);
      const key = toVSCodeKey(k);
      if (isCommand(v)) {
        let commands = v.commands;
        if (commands === undefined) {
          if (v.args === undefined) {
            commands = [v.command!];
          } else {
            commands = [{ command: v.command!, args: v.args }];
          }
        }
        commands.unshift(
          { command: "_setContext", args: [WHICHKEY_STATE, ""] },
          { command: "leaderkey.render", args: "" }
        );
        keys.push({
          key,
          when,
          command: "runCommands",
          args: { commands },
        });
      } else {
        const newPath = (path === "" ? path : path + " ") + k;
        keys.push({
          key,
          when,
          command: "runCommands",
          args: {
            commands: [
              { command: "_setContext", args: [WHICHKEY_STATE, newPath] },
              { command: "leaderkey.render", args: newPath },
            ],
          },
        });
        loop(v, newPath);
      }
    });
  }
  loop(structuredClone(root), "");

  const vsc = join(tmpdir(), "vsc_keys.json");
  writeFileSync(vsc, JSON.stringify(keys, undefined, 2));

  const flatKeys: any[] = [];
  const whenInWhichkey = `${WHICHKEY_STATE} != ''`;
  for (const k of setKeys) {
    const key = toVSCodeKey(k);
    flatKeys.push({
      key,
      when: whenInWhichkey,
      command: "leaderkey.onkey",
      args: k,
    });
  }
  writeFileSync(
    join(tmpdir(), "vsc_flat_keys.json"),
    JSON.stringify(flatKeys, undefined, 2)
  );

  window.showInformationMessage("leaderkey: finish writing file");
}
