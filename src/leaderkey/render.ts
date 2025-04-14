import { workspace } from "vscode";
import { Bindings, DispEntry, TokenType } from "./command";

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

export function render(
  binding: Bindings,
  targetLineLength: number,
  when: string | undefined,
) {
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
