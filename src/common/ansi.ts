import { ExecException, ExecOptions } from "child_process";
import {
  DecorationRenderOptions,
  Position,
  Range,
  TextEditorDecorationType,
  ThemeColor,
  window,
} from "vscode";
import {
  Color,
  DecorationType,
  createAnsiSequenceParser,
  createColorPalette,
  namedColors,
} from "../ansi-sequence-parser/src";
import { assert, log } from "./global";
import { runProcess } from "./remote";

/** This module manages the terminal ANSI color rendering in VSCode via DecorationType. */

export type DecoratedPage<T> = {
  text: string;
  decorations: [TextEditorDecorationType, Range[]][];
  metadata: T;
};

function updateLineChar(pos: Position, text: string) {
  let line = pos.line,
    char = pos.character;
  let lastNewLine = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n") {
      line++;
      lastNewLine = i;
    }
  }
  if (lastNewLine < 0) {
    char += text.length;
  } else {
    char = text.length - lastNewLine - 1;
  }
  return new Position(line, char);
}

const decorationCache: {
  [color_str: string]: TextEditorDecorationType;
} = {};

function capitalize(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

class Lazy<T> {
  #value?: T;
  constructor(public valueFactory: () => T) {}
  public get value(): T {
    return (this.#value ??= this.valueFactory());
  }
}

const lazyThemeColors = new Lazy(() => {
  const themeColorList = namedColors.map(
    (colorName) => new ThemeColor(`terminal.ansi${capitalize(colorName)}`),
  );
  const themeColors: { [colorName: string]: ThemeColor } = Object.fromEntries(
    namedColors.map((colorName, i) => [colorName, themeColorList[i]]),
  );
  const colorPalette = createColorPalette();
  return { themeColorList, themeColors, colorPalette };
});

function getDecorationKey(
  fg: Color | null,
  bg: Color | null,
  decos: Set<DecorationType>,
): string | null {
  if (fg === null && bg === null && decos.size === 0) return null;

  const colorJson = JSON.stringify({ fg, bg, decos: Array.from(decos).sort() });
  if (decorationCache[colorJson]) return colorJson;

  const { themeColorList, themeColors, colorPalette } = lazyThemeColors.value;

  function getVscodeColor(color: Color): ThemeColor | string {
    switch (color.type) {
      case "named":
        return themeColors[color.name];
      case "table":
        if (color.index < 16) return themeColorList[color.index];
        return colorPalette.value(color);
      default:
        return colorPalette.value(color);
    }
  }
  const vscodeDecoration: DecorationRenderOptions = {};
  if (fg) vscodeDecoration.color = getVscodeColor(fg);
  if (bg) vscodeDecoration.backgroundColor = getVscodeColor(bg);
  for (const deco of decos) {
    switch (deco) {
      case "bold":
        vscodeDecoration.fontWeight = "bold";
        break;
      case "italic":
        vscodeDecoration.fontStyle = "italic";
        break;
      case "underline":
        vscodeDecoration.textDecoration = "underline";
        break;
      case "dim":
        vscodeDecoration.opacity = "50%";
        break;
    }
  }

  decorationCache[colorJson] = window.createTextEditorDecorationType(vscodeDecoration);
  return colorJson;
}

export function ansiToRaw(ansi: string): string {
  return createAnsiSequenceParser()
    .parse(ansi)
    .map(({ value }) => value)
    .join("");
}

export function parseAnsi(text: string): DecoratedPage<undefined> {
  const tokens = createAnsiSequenceParser().parse(text);
  const keyedDecorations: { [key: string]: Range[] } = {};
  // [Range, TextEditorDecorationType][] = [];
  let pos = new Position(0, 0);
  // "Javascript Does Not Need a StringBuilder"
  let rawText = "";
  for (const { value, foreground, background, decorations: decos } of tokens) {
    const startPos = pos;
    pos = updateLineChar(pos, value);
    rawText += value;
    const decorationKey = getDecorationKey(foreground, background, decos);
    if (decorationKey) {
      (keyedDecorations[decorationKey] ||= []).push(new Range(startPos, pos));
    }
  }
  const decorations = Object.entries(keyedDecorations).map<
    [TextEditorDecorationType, Range[]]
  >(([key, value]) => [decorationCache[key], value]);
  return { text: rawText, decorations, metadata: undefined };
}

export function execErrorToPage(error: ExecException, stdout: string, stderr: string) {
  if (stdout === "" && stderr.length > 2) {
    // workaround to show the "empty review" page in a friendly way
    return parseAnsi(stderr);
  } else {
    const outputText = [stdout, stderr].join("\n");
    const { cmd, ...errorWithoutCmd } = error;
    const text = "[1;31mERROR[0m " + JSON.stringify(errorWithoutCmd) + "\n" + outputText;
    log("Ansi command failed: " + cmd);
    return parseAnsi(text);
  }
}

type MaybePromise<T> = T | Promise<T>;

export async function runAndParseAnsi<T>(
  prog: string,
  args: string[],
  opts?: ExecOptions & {
    textHook?: (text: string) => MaybePromise<{ text: string; metadata: T }>;
  },
): Promise<DecoratedPage<T>>;
export async function runAndParseAnsi(
  prog: string,
  args: string[],
  opts?: ExecOptions & {
    textHook?: (text: string) => MaybePromise<string>;
  },
): Promise<DecoratedPage<undefined>>;
export async function runAndParseAnsi(
  prog: string,
  args: string[],
  opts?: ExecOptions & { textHook?: (text: string) => MaybePromise<any> },
): Promise<DecoratedPage<any>> {
  // TODO think about exception
  const { textHook, ...execOpts } = opts ?? {};
  const r = await runProcess(prog, args, execOpts);
  if (r.error) {
    return execErrorToPage(r.error, r.stdout ?? "", r.stderr ?? "");
  } else {
    const afterHook = textHook ? await textHook(r.stdout ?? "") : r.stdout;
    let text: string;
    let metadata: any = undefined;
    if (typeof afterHook === "string") {
      text = afterHook;
    } else if (typeof afterHook === "object" && afterHook.text && afterHook.metadata) {
      text = afterHook.text;
      metadata = afterHook.metadata;
    } else {
      assert(false, `Failed to consume result of textHook: ${JSON.stringify(afterHook)}`);
    }
    return { ...parseAnsi(text), metadata };
  }
}

export function unescapeAnsi(ansiText: string) {
  return ansiText.replace(
    // eslint-disable-next-line no-control-regex
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    "",
  );
}
