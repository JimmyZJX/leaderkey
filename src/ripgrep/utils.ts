import { Range, TextEditor } from "vscode";

export type GetQueryFromSelectionOptions =
  | { type: "selection-only" }
  | { type: "expand" }
  | { type: "raw"; query: string };

export function getQueryFromSelection(
  reqSrcEditor: TextEditor,
  mode: GetQueryFromSelectionOptions,
  regex: "regex" | "plain",
) {
  let query: string;
  if (mode.type === "raw") {
    query = mode.query;
  } else {
    const reqDoc = reqSrcEditor.document;
    const sel = reqSrcEditor.selection;
    query = reqDoc.getText(new Range(sel.start, sel.end));
    if (query === "" && mode.type === "expand") {
      const range = reqDoc.getWordRangeAtPosition(sel.start);
      if (range !== undefined) {
        query = reqDoc.getText(range);
      }
    }
  }
  if (regex === "regex") {
    query = query.replaceAll(/[/\\^$+?.()|*[\]{}]/g, "\\$&");
  }
  return query;
}
