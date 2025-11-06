import { commands, TextEditor, window } from "vscode";

let isMultiCursor = false;

function setIsMultiCursor(v: boolean) {
  if (v === isMultiCursor) return;
  isMultiCursor = v;
  commands.executeCommand("_setContext", "isMultiCursor", v);
}

function updateIsMultiCursor(editor?: TextEditor) {
  editor ??= window.activeTextEditor;
  if (editor) setIsMultiCursor(editor.selections.length > 1);
}

export function register() {
  return [
    window.onDidChangeTextEditorSelection((e) => updateIsMultiCursor(e.textEditor)),
    window.onDidChangeActiveTextEditor((editor) => updateIsMultiCursor(editor)),
  ];
}
