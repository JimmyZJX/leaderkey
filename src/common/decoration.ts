import {
  ColorThemeKind,
  Range,
  TextEditor,
  ThemableDecorationAttachmentRenderOptions,
  ThemeColor,
  window,
  workspace,
} from "vscode";
import { TokenType } from "../leaderkey/command";

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

type BackgroundType = "default" | "header" | "border" | "cursor" | "gray";

const decoRenderOpts: {
  [themeType in ThemeType]: { [decoType in BackgroundType]: string };
} = {
  dark: {
    default: "#292b2e",
    header: "#5d4d7a",
    border: "#68217A",
    cursor: "#BBB",
    gray: "#88888833",
  },
  light: {
    default: "#FAF7EC",
    header: "#E6E6EA",
    border: "#E7E5EB",
    cursor: "#444",
    gray: "#88888833",
  },
};

export type TextType =
  | TokenType
  | "dir"
  | "highlight"
  | "arrow-bold"
  | "error-bold"
  | "dim"
  | "dimdim";

const themeRenderOpts: {
  [themeType in ThemeType]: {
    [tokenType in TextType]: ThemableDecorationAttachmentRenderOptions;
  };
} = {
  dark: {
    dir: { color: "#bc6ec5" },
    key: { color: "#bc6ec5", fontWeight: "bold" },
    arrow: { color: "#2d9574" },
    "arrow-bold": { color: "#2d9574", fontWeight: "bold" },
    binding: { color: "#4190d8" },
    highlight: { color: "#4190d8", fontWeight: "bold" },
    command: { color: "#ccc" },
    dim: { color: "#ccc8" },
    dimdim: { color: "#ccc3" },
    "error-bold": { color: new ThemeColor("errorForeground"), fontWeight: "bold" },
  },
  light: {
    key: { color: "#692F60", fontWeight: "bold" },
    dir: { color: "#692F60" },
    arrow: { color: "#2A976D" },
    "arrow-bold": { color: "#2A976D", fontWeight: "bold" },
    binding: { color: "#3781C2" },
    highlight: { color: "#3781C2", fontWeight: "bold" },
    command: { color: "#67537A" },
    dim: { color: "#67537A80" },
    dimdim: { color: "#67537A30" },
    "error-bold": { color: new ThemeColor("errorForeground"), fontWeight: "bold" },
  },
};

export type Decoration =
  | {
      type: "background";
      background?: BackgroundType;
      lines: number;
      width?: number;
      lineOffset?: number;
      charOffset?: number;
      zOffset?: number;
    }
  | {
      type: "text";
      background?: BackgroundType;
      foreground: TextType;
      lineOffset?: number;
      charOffset?: number;
      text: string;
      zOffset?: number;
    };

function escapeTextForBeforeContentText(text: string) {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll(" ", "\\00a0 ")
    .replace(/(\r\n|\r|\n)/g, " \\A ");
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
            width: `${deco.width ?? 200}ch`,
            margin: `0 -1ch 0 ${deco.charOffset !== undefined ? 0.5 + deco.charOffset : 0}ch;
                position: absolute; z-index: ${100 + (deco.zOffset ?? 0)};
                ${deco.lineOffset === undefined ? "" : `top: ${deco.lineOffset * 100}%;`}`,
          },
        });
      case "text":
        return window.createTextEditorDecorationType({
          color: "transparent",
          before: {
            fontWeight: "normal",
            ...themeRenderOpts[globalThemeType][deco.foreground],
            ...(deco.background === undefined
              ? {}
              : { backgroundColor: decoRenderOpts[globalThemeType][deco.background] }),
            height: "100%",
            width: "200ch",
            margin: `0 -1ch 0 ${deco.charOffset ?? 0}ch; position: absolute; z-index: ${110 + (deco.zOffset ?? 0)}; padding-left: 0.5ch; white-space: pre;
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
