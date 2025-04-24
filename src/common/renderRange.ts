import { Range, TextEditor } from "vscode";
import { scheme as rgScheme } from "../ripgrep/dummyFs";
import { stickyScrollMaxRows } from "./decoration";

export function getRenderRangeFromTop(
  editor: TextEditor,
  totalLines: number,
  mode?: "ignore-sticky-scroll",
) {
  const doc = editor.document;
  const docLines = doc.lineCount;
  let lnHeader: number;

  if (doc.uri.scheme === rgScheme) {
    lnHeader = 0;
  } else {
    const visibleRange = editor.visibleRanges[0];
    const toSkip = mode === "ignore-sticky-scroll" ? 0 : stickyScrollMaxRows;
    lnHeader =
      visibleRange.start.line +
      Math.min(toSkip, (visibleRange.end.line - visibleRange.start.line) >> 1);
  }
  // header should be at least on the 2nd last line
  lnHeader = Math.max(0, Math.min(docLines - 2, lnHeader));

  const lnEnd = Math.min(docLines - 1, lnHeader + totalLines);
  return new Range(doc.lineAt(lnHeader).range.start, doc.lineAt(lnEnd).range.end);
}

const NUM_ABOVE_OR_BELOW = 10;
const NUM_TOTAL = NUM_ABOVE_OR_BELOW * 2 + 1;

export function getNumTotal() {
  return NUM_TOTAL;
}

export function indicesToRender(_: { length: number; focus: number }) {
  const { length, focus } = _;
  let from = Math.max(0, focus - NUM_ABOVE_OR_BELOW),
    to = Math.min(length, focus + NUM_ABOVE_OR_BELOW + 1);

  // try extend upward
  if (to - from < NUM_TOTAL && from > 0) {
    from = Math.max(0, to - NUM_TOTAL);
  }
  // try extend downward
  if (to - from < NUM_TOTAL && to < length) {
    to = Math.min(length, from + NUM_TOTAL);
  }

  return { start: from, len: to - from };
}
