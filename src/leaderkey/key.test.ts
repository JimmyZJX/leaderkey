import { toEmacsKey, toVSCodeKey } from "./key";

test("toEmacsKey", () => {
  const tests = [
    "a",
    "[",
    "{",
    "ctrl+a",
    "ctrl+[",
    "ctrl+{",
    "shift+a",
    "shift+[",
    "shift+{",
    "ctrl+shift+a",
    "ctrl+shift+[",
    "ctrl+shift+{",
    "enter",
    "backspace",
    "space",
    " ",
    "\n",
  ];
  const spacemacsKeys = tests.map(toEmacsKey);
  expect(spacemacsKeys).toEqual([
    "a",
    "[",
    "{",
    "C-a",
    "C-[",
    "C-{",
    "A",
    "{",
    "[",
    "C-A",
    "C-{",
    "C-[",
    "RET",
    "<backspace>",
    "SPC",
    "SPC",
    "RET",
  ]);
});

test("toVSCodeKey", () => {
  const tests = [
    "a",
    "A",
    "[",
    "{",
    "C-a",
    "C-A",
    "C-[",
    "C-{",
    "S-a",
    "S-A",
    "S-[",
    "S-{",
    "C-S-a",
    "C-S-A",
    "C-S-[",
    "C-S-{",
    "RET",
    "<backspace>",
    "SPC",
  ];
  const vscodeKeys = tests.map(toVSCodeKey);
  expect(vscodeKeys).toEqual([
    "a",
    "shift+a",
    "[",
    "shift+[",
    "ctrl+a",
    "ctrl+shift+a",
    "ctrl+[",
    "ctrl+shift+[",
    "shift+a",
    "shift+a",
    "shift+[",
    "shift+[",
    "ctrl+shift+a",
    "ctrl+shift+a",
    "ctrl+shift+[",
    "ctrl+shift+[",
    "enter",
    "backspace",
    "space",
  ]);
});
