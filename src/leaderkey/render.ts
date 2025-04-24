import { TextEditor, workspace } from "vscode";
import { Bindings, DispEntry, TokenType } from "./command";
import { getRenderRangeFromTop } from "../common/renderRange";
import { Decoration, renderDecorations } from "../common/decoration";

export interface RenderedToken {
  type: TokenType;
  line: number;
  char: number;
  text: string;
  textLen?: number;
}

interface TokenAndLineLength {
  tokens: RenderedToken[];
  lineLen: number;
}

const TRY_ROWS = 6;

function* chunks<T>(arr: T[], n: number) {
  for (let i = 0; i < arr.length; i += n) {
    yield arr.slice(i, i + n);
  }
}

function renderTryRows(dispEntries: DispEntry[]): TokenAndLineLength {
  const cols = [...chunks(dispEntries, TRY_ROWS)];
  return renderByLayout(cols);
}

function renderByNumCol(dispEntries: DispEntry[], ncol: number): TokenAndLineLength {
  const cols = [...chunks(dispEntries, Math.ceil(dispEntries.length / ncol))];
  return renderByLayout(cols);
}

function renderByLayout(cols: DispEntry[][]): TokenAndLineLength {
  const arrowCharWidth = workspace.getConfiguration("leaderkey").get("arrowIsTwoCharWide")
    ? 2
    : 1;
  const tokens: RenderedToken[] = [];
  let curChar = 0;
  for (const col of cols) {
    const keyLen = Math.max(...col.map(({ key }) => key.length));
    const nameLen = Math.max(...col.map(({ name }) => name.length));
    const charAfterKey = curChar + keyLen;
    col.forEach(({ key, name, type }, line) => {
      tokens.push({
        line,
        char: charAfterKey - key.length,
        text: key,
        type: "key",
      });
      tokens.push({
        line,
        char: charAfterKey + 1,
        text: "→",
        textLen: arrowCharWidth,
        type: "arrow",
      });
      tokens.push({ line, char: charAfterKey + 2 + arrowCharWidth, text: name, type });
      curChar = charAfterKey + 3 + arrowCharWidth + nameLen;
    });
  }
  return { tokens, lineLen: curChar - 1 };
}

function tokensToStrings(tokens: RenderedToken[]): {
  nLines: number;
  maxLen: number;
  decos: [TokenType, string][];
} {
  const nLines = Math.max(...tokens.map((tk) => tk.line)) + 1;
  let maxLen = 0;
  const decos: [TokenType, string][] = [];
  const tokenTypes = ["key", "arrow", "command", "binding"];
  for (const tt of tokenTypes) {
    const lines: string[] = new Array(nLines).fill("");
    const lineLens: number[] = new Array(nLines).fill(0);
    for (const { line, char, text, type, textLen } of tokens) {
      if (type === tt) {
        const spacesToInsert = char - lineLens[line];
        lines[line] = lines[line] + " ".repeat(spacesToInsert) + text;
        lineLens[line] += spacesToInsert + (textLen ?? text.length);
      }
    }
    maxLen = Math.max(maxLen, ...lineLens);
    decos.push([tt as TokenType, lines.join("\n")]);
  }
  return { nLines, maxLen, decos };
}

function render(binding: Bindings, targetLineLength: number, when: string | undefined) {
  const dispEntries: DispEntry[] = binding.orderedKeys?.[when ?? ""] ??
    binding.orderedKeys?.[""] ?? [
      { key: "ERROR", name: "No item found", type: "command" },
    ];
  const { tokens, lineLen } = renderTryRows(dispEntries);
  if (lineLen <= targetLineLength) {
    return tokensToStrings(tokens);
  }
  for (let nCol = 5; ; nCol--) {
    const { tokens, lineLen } = renderByNumCol(dispEntries, nCol);
    if (lineLen <= targetLineLength || nCol === 1) {
      return tokensToStrings(tokens);
    }
  }
}

function appendStringRightAligned(input: string, toAppend: string, right: number) {
  return (
    input + " ".repeat(Math.max(0, right - input.length - toAppend.length)) + toAppend
  );
}

export function renderBinding(
  editor: TextEditor,
  binding: Bindings,
  path: string,
  when: string | undefined,
) {
  const rendered = render(binding, 100, when);

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

  const range = getRenderRangeFromTop(editor, rendered.nLines + 1);
  return renderDecorations(decos, editor, range);
}
