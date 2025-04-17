import {
  ColorThemeKind,
  Range,
  TextEditor,
  ThemableDecorationAttachmentRenderOptions,
  window,
  workspace,
} from "vscode";
import { Bindings, TokenType } from "./command";
import { render } from "./render";

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

export let stickyScrollMaxRows: number = 0;
export function updateStickyScrollConf() {
  const ss = workspace.getConfiguration("editor.stickyScroll");
  if (ss.get("enabled") === true) {
    stickyScrollMaxRows = ss.get("maxLineCount", 5);
  } else {
    stickyScrollMaxRows = 0;
  }
}
updateStickyScrollConf();

type BackgroundType = "default" | "header" | "border";

const decoRenderOpts: {
  [themeType in ThemeType]: { [decoType in BackgroundType]: string };
} = {
  dark: {
    default: "#292b2e",
    header: "#5d4d7a",
    border: "#68217A",
  },
  light: {
    default: "#FAF7EC",
    header: "#E6E6EA",
    border: "#E7E5EB",
  },
};

type TextType = TokenType | "dir" | "highlight";

const themeRenderOpts: {
  [themeType in ThemeType]: {
    [tokenType in TextType]: ThemableDecorationAttachmentRenderOptions;
  };
} = {
  dark: {
    dir: { color: "#bc6ec5" },
    key: { color: "#bc6ec5", fontWeight: "bold" },
    arrow: { color: "#2d9574" },
    binding: { color: "#4190d8" },
    highlight: { color: "#4190d8", fontWeight: "bold" },
    command: { color: "#ccc" },
  },
  light: {
    key: { color: "#692F60", fontWeight: "bold" },
    dir: { color: "#692F60" },
    arrow: { color: "#2A976D" },
    binding: { color: "#3781C2" },
    highlight: { color: "#3781C2", fontWeight: "bold" },
    command: { color: "#67537A" },
  },
};

export type Decoration =
  | {
      type: "background";
      background?: BackgroundType;
      lines: number;
      lineOffset?: number;
      zOffset?: number;
    }
  | {
      type: "text";
      background?: BackgroundType;
      foreground: TextType;
      lineOffset?: number;
      text: string;
    };

function escapeTextForBeforeContentText(text: string) {
  return text.replaceAll("'", "\\'").replaceAll(" ", "\\00a0 ").replaceAll("\n", " \\A ");
}

export function renderDecorations(
  decorations: Decoration[],
  editor: TextEditor,
  range: Range,
) {
  const dts = decorations.map((deco) => {
    switch (deco.type) {
      case "background":
        return window.createTextEditorDecorationType({
          color: "transparent",
          before: {
            contentText: "",
            backgroundColor:
              decoRenderOpts[globalThemeType][deco.background ?? "default"],
            height: `${100 * deco.lines}%`,
            width: "200ch",
            margin: `0 -1ch 0 0; position: absolute; z-index: ${100 + (deco.zOffset ?? 0)};
               ${deco.lineOffset === undefined ? "" : `top: ${deco.lineOffset * 100}%;`}`,
          },
        });
      case "text":
        return window.createTextEditorDecorationType({
          color: "transparent",
          before: {
            ...themeRenderOpts[globalThemeType][deco.foreground],
            ...(deco.background === undefined
              ? {}
              : { backgroundColor: decoRenderOpts[globalThemeType][deco.background] }),
            height: "100%",
            width: "200ch",
            margin: `0 -1ch 0 0; position: absolute; z-index: 110; padding-left: 0.5ch; white-space: pre;
               ${deco.lineOffset === undefined ? "" : `top: ${deco.lineOffset * 100}%;`}
               content: '${escapeTextForBeforeContentText(deco.text)}'`,
          },
        });
    }
  });
  dts.forEach((dt) => editor.setDecorations(dt, [range]));
  return dts;
}

export function getThemeRenderOpts(tokenType: TextType) {
  return themeRenderOpts[globalThemeType][tokenType];
}

function appendStringRightAligned(input: string, toAppend: string, right: number) {
  return (
    input + " ".repeat(Math.max(0, right - input.length - toAppend.length)) + toAppend
  );
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
  let lnHeader =
    visibleRange.start.line +
    Math.min(stickyScrollMaxRows, (visibleRange.end.line - visibleRange.start.line) >> 1);

  const headerWhen = when === undefined ? "" : `(${when})`;
  let strHeader = `${path}-    `;
  const transientMode = binding.transient ? `${binding.name}    ` : "";
  strHeader = appendStringRightAligned(strHeader, transientMode, rendered.maxLen >> 1);
  strHeader = appendStringRightAligned(strHeader, headerWhen, rendered.maxLen);
  const header: Decoration = {
    type: "text",
    text: strHeader,
    foreground: "command",
    background: "header",
  };
  const background: Decoration = {
    type: "background",
    background: "default",
    lines: rendered.nLines + 2,
    lineOffset: -0.5,
  };

  const decos = [
    header,
    background,
    ...rendered.decos.map<Decoration>(([tt, str]) => ({
      type: "text",
      text: str,
      lineOffset: 1,
      foreground: tt,
    })),
  ];

  const doc = editor.document;
  // fix header to be at least on the 2nd last line
  lnHeader = Math.max(0, Math.min(doc.lineCount - 2, lnHeader));
  const lnEnd = Math.min(doc.lineCount - 1, lnHeader + 1 + rendered.nLines - 1);
  const overallRange = new Range(
    doc.lineAt(lnHeader).range.start,
    doc.lineAt(lnEnd).range.end,
  );
  return renderDecorations(decos, editor, overallRange);
}
