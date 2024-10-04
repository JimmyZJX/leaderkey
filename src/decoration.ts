import {
  ColorThemeKind,
  Range,
  ThemableDecorationAttachmentRenderOptions,
  window,
} from "vscode";
import { Bindings, render, TokenType } from "./command";

type ThemeType = "dark" | "light";
let globalThemeType: ThemeType = "dark";

export function updateGlobalThemeType() {
  switch (window.activeColorTheme.kind) {
    case ColorThemeKind.Dark:
    case ColorThemeKind.HighContrast:
      globalThemeType = "dark";
      break;
    case ColorThemeKind.Light:
    case ColorThemeKind.HighContrastLight:
      globalThemeType = "light";
      break;
    default:
      globalThemeType = "dark";
      break;
  }
}
updateGlobalThemeType();

type DecoType = "background" | "headerBackground";

const decoRenderOpts: { [themeType in ThemeType]: { [decoType in DecoType]: string } } = {
  dark: {
    background: "#292b2e",
    headerBackground: "#5d4d7a",
  },
  light: {
    background: "#FAF7EC",
    headerBackground: "#E6E6EA",
  },
};

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
      backgroundColor: decoRenderOpts[globalThemeType]["background"],
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
      backgroundColor: decoRenderOpts[globalThemeType]["headerBackground"],
      height: "100%",
      width: "200ch",
      margin: `0 -1ch 0 0; position: absolute; z-index: 2;
               content: '${escapeTextForBeforeContentText(text)}'`,
    },
  });
}

function appendStringRightAligned(input: string, toAppend: string, right: number) {
  return (
    input + " ".repeat(Math.max(0, right - input.length - toAppend.length)) + toAppend
  );
}

const themeRenderOpts: {
  [themeType in ThemeType]: {
    [tokenType in TokenType]: ThemableDecorationAttachmentRenderOptions;
  };
} = {
  dark: {
    key: { color: "#bc6ec5", fontWeight: "bold" },
    arrow: { color: "#2d9574" },
    binding: { color: "#4190d8" },
    command: { color: "#ccc" },
  },
  light: {
    key: { color: "#692F60", fontWeight: "bold" },
    arrow: { color: "#2A976D" },
    binding: { color: "#3781C2" },
    command: { color: "#67537A" },
  },
};

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
  let lnHeader =
    visibleRange.start.line +
    Math.min(stickyScrollMaxRows, (visibleRange.end.line - visibleRange.start.line) >> 1);

  const headerWhen = when === undefined ? "" : `(${when})`;
  let header = `${path}-    `;
  const transientMode = binding.transient ? `${binding.name}    ` : "";
  header = appendStringRightAligned(header, transientMode, rendered.maxLen >> 1);
  header = appendStringRightAligned(header, headerWhen, rendered.maxLen);
  const decoHeader = getHeaderDeco(header);
  const decoBg = getBackgroundDeco(rendered.nLines);

  const decoTypes = rendered.decos.map(([tt, str]) => {
    const tro = themeRenderOpts[globalThemeType][tt];
    return window.createTextEditorDecorationType({
      color: "transparent",
      before: {
        ...tro,
        ...renderTextDeco(str),
      },
    });
  });

  const docLines = editor.document.lineCount;
  // fix header to be at least on the 2nd last line
  lnHeader = Math.max(0, Math.min(docLines - 2, lnHeader));
  const headerRange = editor.document.lineAt(lnHeader).range;
  const lnTableStart = Math.max(0, Math.min(docLines - 1, lnHeader + 1));
  const posTableStart = editor.document.lineAt(lnTableStart).range.start;
  const posTableEnd = editor.document.lineAt(
    Math.min(docLines - 1, lnTableStart + rendered.nLines - 1),
  ).range.end;

  const tableRange = new Range(posTableStart, posTableEnd);
  editor.setDecorations(decoHeader, [headerRange]);
  editor.setDecorations(decoBg, [new Range(headerRange.start, tableRange.end)]);
  decoTypes.forEach((dt) => {
    editor.setDecorations(dt, [tableRange]);
  });
  return [...decoTypes, decoHeader, decoBg];
}
