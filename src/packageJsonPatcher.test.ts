import { readFileSync, unlinkSync, writeFileSync } from "fs";
import { sanitizeKey, unshiftChars } from "./command";

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
      args: sanitizeKey(k),
    },
    {
      key: "ctrl+" + k,
      when: "leaderkeyState",
      command: "leaderkey.onkey",
      args: sanitizeKey("C-" + k),
    },
    {
      key: "shift+" + k,
      when: "leaderkeyState",
      command: "leaderkey.onkey",
      args: sanitizeKey("S-" + k),
    },
  ]);

  packageJson.contributes.keybindings = [
    ...allKeyCharBindings,
    {
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
