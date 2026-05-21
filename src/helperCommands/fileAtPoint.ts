export type FileAtPoint = {
  path: string;
  line?: number;
  column?: number;
};

function isTokenDelimiter(char: string): boolean {
  return /[\s"'`<>{}\[\](),;]/.test(char);
}

function stripBalancedWrapper(text: string): string {
  const wrapperPairs: [string, string][] = [
    ['"', '"'],
    ["'", "'"],
    ["`", "`"],
    ["(", ")"],
    ["[", "]"],
    ["{", "}"],
    ["<", ">"],
  ];

  let stripped = text.trim();
  let madeProgress = true;
  while (madeProgress && stripped.length >= 2) {
    madeProgress = false;
    for (const [start, end] of wrapperPairs) {
      if (stripped.startsWith(start) && stripped.endsWith(end)) {
        stripped = stripped.slice(1, -1).trim();
        madeProgress = true;
        break;
      }
    }
  }
  return stripped;
}

export function parseFileAtPoint(rawText: string): FileAtPoint | undefined {
  let text = rawText.trim().replace(/[,.!?]+$/g, "");
  text = stripBalancedWrapper(text)
    .replace(/[,.!?]+$/g, "")
    .trim();
  if (text === "") return undefined;

  const lineAndColumn = text.match(/^(.*?):(\d+)(?::(\d+))?$/);
  let line: number | undefined;
  let column: number | undefined;
  if (lineAndColumn !== null) {
    text = lineAndColumn[1];
    line = Number(lineAndColumn[2]);
    column = lineAndColumn[3] === undefined ? undefined : Number(lineAndColumn[3]);
  }

  text = stripBalancedWrapper(text)
    .replace(/[,.!?]+$/g, "")
    .trim();
  if (text === "") return undefined;

  return { path: text, line, column };
}

export function findFileAtPointInLine(
  lineText: string,
  cursorCharacter: number,
): FileAtPoint | undefined {
  if (lineText === "") return undefined;

  let character = Math.min(Math.max(cursorCharacter, 0), lineText.length - 1);
  if (isTokenDelimiter(lineText[character])) {
    if (character === 0 || isTokenDelimiter(lineText[character - 1])) {
      return undefined;
    }
    character -= 1;
  }

  if (isTokenDelimiter(lineText[character])) return undefined;

  let start = character;
  while (start > 0 && !isTokenDelimiter(lineText[start - 1])) start -= 1;

  let end = character + 1;
  while (end < lineText.length && !isTokenDelimiter(lineText[end])) end += 1;

  return parseFileAtPoint(lineText.slice(start, end));
}
