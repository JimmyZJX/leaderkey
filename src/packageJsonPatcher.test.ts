import { readFileSync, unlinkSync, writeFileSync } from "fs";
import { keys as diredKeys, scheme as diredScheme } from "./findFile/dired";
import { allVSCodeKeys, toEmacsKey, toEmacsKeyDesc } from "./leaderkey/key";

const IN_DIRED_EDITOR_WHEN = `editorTextFocus && resourceScheme == '${diredScheme}' && !leaderkeyState && (!vim.active || vim.mode == 'Normal')`;
const diredKeyBindings = Object.entries(diredKeys).map(([key, { name, f: _ }]) => ({
  key,
  when: IN_DIRED_EDITOR_WHEN,
  command: `leaderkey.dired.${name}`,
}));

const vscodeModifiers = ["", "alt+", "ctrl+", "shift+"];

function patch(packageJson: any) {
  // patch all keys
  const allKeyCharBindings = allVSCodeKeys().flatMap((vscode) => [
    ...vscodeModifiers.map((vscodeModifier) => {
      const vscodeKey = vscodeModifier + vscode;
      const emacsKey = toEmacsKey(vscodeKey);
      const desc = toEmacsKeyDesc(emacsKey);
      return {
        key: vscodeKey,
        when: `leaderkeyState && !config.leaderkey.disabled.${desc}`,
        command: "leaderkey.onkey",
        args: emacsKey,
      };
    }),
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
