import { TextEditor, Range } from "vscode";
import { stickyScrollMaxRows } from "./decoration";

export function getRenderRangeFromTop(editor: TextEditor, totalLines: number) {
  const visibleRange = editor.visibleRanges[0];
  let lnHeader =
    visibleRange.start.line +
    Math.min(stickyScrollMaxRows, (visibleRange.end.line - visibleRange.start.line) >> 1);
  const doc = editor.document;
  const docLines = doc.lineCount;

  // header should be at least on the 2nd last line
  lnHeader = Math.max(0, Math.min(docLines - 2, lnHeader));

  const lnEnd = Math.min(docLines - 1, lnHeader + totalLines);
  return new Range(doc.lineAt(lnHeader).range.start, doc.lineAt(lnEnd).range.end);
}
