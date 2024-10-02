import { Range, ThemableDecorationAttachmentRenderOptions, window } from "vscode";
import { Bindings, render } from "./command";

function escapeTextForBeforeContentText(text: string) {
  return text.replaceAll("'", "\\'").replaceAll(" ", "\\00a0 ").replaceAll("\n", " \\A ");
}

function renderTextDeco(text: string): ThemableDecorationAttachmentRenderOptions {
  return {
    backgroundColor: "transparent",
    margin: `0 -1ch 0 0; position: absolute; white-space: pre;
             z-index: 3; content: '${escapeTextForBeforeContentText(text)}';`,
  };
}

function getBackgroundDeco(height: number) {
  return window.createTextEditorDecorationType({
    color: "transparent",
    before: {
      contentText: " ",
      backgroundColor: "#292b2e",
      height: `${100 * height + 200}%`,
      width: "200ch",
      margin: `0 -1ch 0 0; position: absolute; z-index: 1; top: -50%;`,
    },
  });
}

function getHeaderDeco(text: string) {
  return window.createTextEditorDecorationType({
    color: "transparent",
    before: {
      color: "#ccc",
      backgroundColor: "#5d4d7a",
      height: "100%",
      width: "200ch",
      margin: `0 -1ch 0 0; position: absolute; z-index: 2;
               content: '${escapeTextForBeforeContentText(text)}'`,
    },
  });
}

export function renderBinding(
  binding: Bindings,
  path: string,
  when: string | undefined,
  stickyScrollMaxRows: number,
) {
  const editor = window.activeTextEditor;
  if (editor === undefined) return [];

  const rendered = render(binding, 100, when);
  const visibleRange = editor.visibleRanges[0];
  const lnHeader =
    visibleRange.start.line +
    Math.min(stickyScrollMaxRows, (visibleRange.end.line - visibleRange.start.line) / 2);

  const headerWhen = when === undefined ? "" : `(${when})`;
  let header = `${path}-   `;
  header +=
    " ".repeat(Math.max(0, rendered.maxLen - header.length - headerWhen.length)) +
    headerWhen;
  const decoHeader = getHeaderDeco(header);
  const decoBg = getBackgroundDeco(rendered.nLines);

  const decoTypes = rendered.decos.map(([tt, str]) => {
    let tro: ThemableDecorationAttachmentRenderOptions = {};
    switch (tt) {
      case "key":
        tro = { color: "#bc6ec5", fontWeight: "bold" };
        break;
      case "arrow":
        tro = { color: "#2d9574" };
        break;
      case "binding":
        tro = { color: "#4190d8" };
        break;
      case "command":
        tro = { color: "#ccc" };
        break;
    }
    return window.createTextEditorDecorationType({
      color: "transparent",
      before: {
        ...tro,
        ...renderTextDeco(str),
      },
    });
  });

  const lnTableStart = lnHeader + 1;
  const docLines = editor.document.lineCount;
  const posTableStart = editor.document.lineAt(Math.min(docLines - 1, lnTableStart)).range
    .start;
  const posTableEnd = editor.document.lineAt(
    Math.min(docLines - 1, lnTableStart + rendered.nLines - 1),
  ).range.end;

  const tableRange = new Range(posTableStart, posTableEnd);
  const headerRange = editor.document.lineAt(lnHeader).range;
  editor.setDecorations(decoHeader, [headerRange]);
  editor.setDecorations(decoBg, [new Range(headerRange.start, tableRange.end)]);
  decoTypes.forEach((dt) => {
    editor.setDecorations(dt, [tableRange]);
  });
  return [...decoTypes, decoHeader, decoBg];
}
