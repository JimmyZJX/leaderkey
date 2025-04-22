import { Range, TextEditor } from "vscode";

export function getCurrentSelectionFromDoc(
  reqSrcEditor: TextEditor,
  mode: "expand" | "selection-only",
  regex: "regex" | "plain",
) {
  const reqDoc = reqSrcEditor.document;
  const sel = reqSrcEditor.selection;
  let initQuery = reqDoc.getText(new Range(sel.start, sel.end));
  if (initQuery === "" && mode === "expand") {
    const range = reqDoc.getWordRangeAtPosition(sel.start);
    if (range !== undefined) {
      initQuery = reqDoc.getText(range);
    }
  }
  if (regex === "regex") {
    initQuery = initQuery.replaceAll(/[\/\\^$+?.()\|\*[\]{}]/g, "\\$&");
  }
  return initQuery;
}
