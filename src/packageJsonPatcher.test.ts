import { readFileSync, unlinkSync, writeFileSync } from "fs";
import { normalizeKey, unshiftChars } from "./command";

function patch(packageJson: any) {
  const ALL_KEY_CHARS = [
    ...unshiftChars,
    ..."abcdefghijklmnopqrstuvwxyz",
    "tab",
    "escape",
    "enter",
  ];

  // patch all keys
  const allKeyCharBindings = ALL_KEY_CHARS.flatMap((k) => [
    {
      key: k,
      when: "leaderkeyState",
      command: "leaderkey.onkey",
      args: normalizeKey(k),
    },
    {
      key: "ctrl+" + k,
      when: "leaderkeyState",
      command: "leaderkey.onkey",
      args: normalizeKey("C-" + k),
    },
    {
      key: "shift+" + k,
      when: "leaderkeyState",
      command: "leaderkey.onkey",
      args: normalizeKey("S-" + k),
    },
  ]);

  const specialKeyBindings = [
    {
      // special conditional `t` for `SPC f t`
      key: "t",
      when: "sideBarVisible&&explorerViewletVisible",
      command: "leaderkey.onkey",
      args: "t:sideBarVisible&&explorerViewletVisible",
    },
    {
      // `ESC`
      key: "escape",
      when: "leaderkeyState",
      command: "runCommands",
      args: {
        commands: [
          {
            command: "_setContext",
            args: ["leaderkeyState", ""],
          },
          {
            command: "leaderkey.render",
            args: "",
          },
        ],
      },
    },
    {
      // `backspace`
      key: "backspace", // TODO actually implement backspace!
      when: "leaderkeyState",
      command: "runCommands",
      args: {
        commands: [
          {
            command: "_setContext",
            args: ["leaderkeyState", ""],
          },
          {
            command: "leaderkey.render",
            args: "",
          },
        ],
      },
    },
  ];

  packageJson.contributes.keybindings = [...allKeyCharBindings, ...specialKeyBindings];
}

test("package.json", () => {
  const packageJsonRaw = readFileSync("package.json", { encoding: "utf-8" });
  const packageJson = JSON.parse(packageJsonRaw);
  patch(packageJson);
  const patched = JSON.stringify(packageJson, null, 2) + "\n";
  try {
    expect(patched).toEqual(packageJsonRaw);
    try {
      // remove or clear contents on success
      unlinkSync("package.json.corrected");
    } catch {
      writeFileSync("package.json.corrected", "");
    }
  } catch (e) {
    writeFileSync("package.json.corrected", patched);
    throw e;
  }
});
