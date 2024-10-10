import { readFileSync, unlinkSync, writeFileSync } from "fs";
import { normalizeKey, unshiftChars } from "./command";

function patch(packageJson: any) {
  const ALL_KEY_CHARS = [
    ...unshiftChars,
    ..."abcdefghijklmnopqrstuvwxyz",
    "tab",
    "escape",
    "enter",
    "space",
  ];

  function toDesc(keyChar: string) {
    return (
      {
        ["`"]: "backtick",
        ["-"]: "dash",
        ["="]: "equal",
        [","]: "comma",
        ["."]: "dot",
        ["/"]: "slash",
        ["["]: "openingbracket",
        ["]"]: "closingbracket",
        [";"]: "semicolon",
        ["'"]: "singlequote",
        ["\\"]: "forwardslash",
      }[keyChar] ?? keyChar
    );
  }

  // patch all keys
  const allKeyCharBindings = ALL_KEY_CHARS.flatMap((k) => [
    {
      key: k,
      when: `leaderkeyState && !config.leaderkey.disabled.${toDesc(k)}`,
      command: "leaderkey.onkey",
      args: normalizeKey(k),
    },
    {
      key: "ctrl+" + k,
      when: `leaderkeyState && !config.leaderkey.disabled.C-${toDesc(k)}`,
      command: "leaderkey.onkey",
      args: normalizeKey("C-" + k),
    },
    {
      key: "shift+" + k,
      when: `leaderkeyState && !config.leaderkey.disabled.S-${toDesc(k)}`,
      command: "leaderkey.onkey",
      args: normalizeKey("S-" + k),
    },
  ]);

  const COMMON_OUTSIDE_EDITOR_WHEN =
    "(((activeEditorGroupEmpty || activeEditor == 'workbench.editors.errorEditor') && focusedView == '') || sideBarFocus || notebookEditorFocused) && !leaderkeyState && !inputFocus";

  const specialKeyBindings = [
    {
      // special conditional `f` for `SPC f t`
      key: "f",
      when: "leaderkeyState == 'SPC' && sideBarVisible && explorerViewletVisible",
      command: "leaderkey.onkey",
      args: { key: "f", when: "explorerVisible" },
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
      key: "backspace",
      when: "leaderkeyState",
      command: "leaderkey.onkey",
      args: "<back>",
    },
    // space keys to trigger the leaderkey panel outside the editor
    {
      key: "space",
      command: "runCommands",
      args: {
        commands: [
          {
            command: "_setContext",
            args: ["leaderkeyState", "SPC"],
          },
          {
            command: "leaderkey.render",
            args: "SPC",
          },
        ],
      },
      when: COMMON_OUTSIDE_EDITOR_WHEN,
    },
    {
      key: ",",
      command: "runCommands",
      args: {
        commands: [
          {
            command: "_setContext",
            args: ["leaderkeyState", ","],
          },
          {
            command: "leaderkey.render",
            args: ",",
          },
        ],
      },
      when: COMMON_OUTSIDE_EDITOR_WHEN,
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
