import { readFileSync, unlinkSync, writeFileSync } from "fs";
import { keys as diredKeys, scheme as diredScheme } from "./findFile/dired";
import { normalizeKey, unshiftChars } from "./leaderkey/command";

const IN_DIRED_EDITOR_WHEN = `editorTextFocus && resourceScheme == '${diredScheme}' && !leaderkeyState && (!vim.active || vim.mode == 'Normal')`;
const diredKeyBindings = Object.entries(diredKeys).map(([key, { name, f: _ }]) => ({
  key,
  when: IN_DIRED_EDITOR_WHEN,
  command: `leaderkey.dired.${name}`,
}));

function patch(packageJson: any) {
  const ALL_KEY_CHARS = [
    ...unshiftChars,
    ..."abcdefghijklmnopqrstuvwxyz",
    "tab",
    "enter",
    "space",
    "backspace",
    "delete",
    "pageup",
    "pagedown",
    "uparrow",
    "downarrow",
    "leftarrow",
    "rightarrow",
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
    "(((activeEditorGroupEmpty || activeEditor == 'workbench.editors.errorEditor') && focusedView == '') || sideBarFocus || notebookEditorFocused || inWelcome) && !leaderkeyState && !inputFocus";

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

  packageJson.contributes.keybindings = [
    ...allKeyCharBindings,
    ...specialKeyBindings,
    ...diredKeyBindings,
  ];

  packageJson.contributes.languages = [{ id: "leaderkey.dired" }];
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
