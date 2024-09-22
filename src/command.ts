import { window } from "vscode";

export interface Bindings {
  name: string;
  keys: { [key: string]: Bindings | Command };
  when?: string;
}

export interface Command {
  name: string;
  command?: string;
  commands?: (string | { command: string; args?: any })[];
  args?: any;
  when?: string;
}

export function isBindings(x: Bindings | Command): x is Bindings {
  return (x as any).keys !== undefined;
}

export function isCommand(x: Bindings | Command): x is Command {
  return (x as any).keys === undefined;
}

export function overrideExn(
  b: Bindings,
  path: string,
  commandOrBindingName: Command | string
) {
  const keys = path.split(" ").filter((s) => s !== "");
  if (keys.length === 0) throw "whichkey: path is empty";
  keys.forEach((key, i) => {
    if (i === keys.length - 1) {
      const next = b.keys[key];
      if (next !== undefined) {
        window.showWarningMessage(
          `whichkey: overriding [${keys
            .slice(0, i + 1)
            .join(" ")}] (${JSON.stringify(b.keys[key])})`
        );
      }
      if (typeof commandOrBindingName === "string") {
        if (next != undefined && isBindings(next)) {
          next.name = commandOrBindingName;
        } else {
          b.keys[key] = { name: commandOrBindingName, keys: {} };
        }
      } else {
        b.keys[key] = commandOrBindingName;
      }
    } else {
      const next = b.keys[key];
      if (next !== undefined && isBindings(next)) {
        b = next;
      } else {
        if (next !== undefined) {
          window.showWarningMessage(
            `whichkey: overriding command [${keys.slice(0, i + 1).join(" ")}]`
          );
        }
        b = b.keys[key] = { name: `${key}...`, keys: {} };
      }
    }
  });
}

type tokenType = "key" | "arrow" | "command" | "binding";

export interface RenderedToken {
  type: tokenType;
  line: number;
  char: number;
  text: string;
}

function* chunks<T>(arr: T[], n: number) {
  for (let i = 0; i < arr.length; i += n) {
    yield arr.slice(i, i + n);
  }
}

const shiftNumChars = '~!@#$%^&*()_+<>?{}:"|';
const shiftNum_Nums = "`1234567890-=,./[];'\\";

export function toVSCodeKey(key: string) {
  if (key.length === 1) {
    if (/^[A-Z]*$/.test(key)) {
      return "shift+" + key.toLowerCase();
    }
    const idxNumChar = shiftNumChars.indexOf(key);
    if (idxNumChar >= 0) {
      return "shift+" + shiftNum_Nums.substring(idxNumChar, idxNumChar + 1);
    }
  }
  return key
    .replaceAll("SPC", "space")
    .replaceAll("TAB", "tab")
    .replaceAll("RET", "enter")
    .replaceAll("C-", "ctrl+")
    .replaceAll("M-", "alt+")
    .replaceAll("S-", "shift+");
}

function sanitizeKey(key: string) {
  return key
    .replaceAll("space", "SPC")
    .replaceAll(" ", "SPC")
    .replaceAll("\t", "TAB")
    .replaceAll("tab", "TAB")
    .replaceAll("\n", "RET")
    .replaceAll("enter", "RET")
    .replaceAll("ctrl+", "C-")
    .replaceAll("alt+", "M-")
    .replaceAll("shift+", "S-");
}

export function sanitize(b: Bindings): Bindings {
  const entries = Object.entries(b.keys).map<[string, Bindings | Command]>(
    ([key, v]) => {
      const val = isBindings(v) ? sanitize(v) : v;
      return [sanitizeKey(key), val];
    }
  );
  entries.sort(([k1, _1], [k2, _2]) => {
    if (k1.length > k2.length) return -1;
    if (k1.length < k2.length) return 1;
    return k1.localeCompare(k2);
  });
  return { ...b, keys: Object.fromEntries(entries) };
}

export function go(
  root: Bindings,
  path: string
): Bindings | Command | undefined {
  const keys = path.split(" ").filter((v) => v !== "");
  for (const k of keys) {
    const n = root.keys[k];
    // TODO isCommand early quit?
    if (n === undefined || isCommand(n)) return n;
    root = n;
  }
  return root;
}

function renderToTokens(
  binding: Bindings,
  ncol: number
): { tokens: RenderedToken[]; lineLen: number } {
  const dispEntries: {
    key: string;
    name: string;
    type: "binding" | "command";
  }[] = Object.entries(binding.keys).map(([k, bOrC]) => {
    const key = sanitizeKey(k);
    if (isBindings(bOrC)) {
      return {
        key,
        name: `+${bOrC.name.replace(/^\++/, "")}`,
        type: "binding",
      };
    }
    return { key, name: bOrC.name, type: "command" };
  });
  const tokens: RenderedToken[] = [];
  const cols = [...chunks(dispEntries, Math.ceil(dispEntries.length / ncol))];
  let curChar = 0;
  cols.forEach((col) => {
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
      tokens.push({ line, char: charAfterKey + 1, text: "→", type: "arrow" });
      tokens.push({ line, char: charAfterKey + 3, text: name, type });
      curChar = charAfterKey + 4 + nameLen;
    });
  });
  return { tokens, lineLen: curChar - 1 };
}

function tokensToStrings(tokens: RenderedToken[]): {
  nLines: number;
  decos: [tokenType, string][];
} {
  const nLines = Math.max(...tokens.map((tk) => tk.line)) + 1;
  const decos: [tokenType, string][] = [];
  const tokenTypes = ["key", "arrow", "command", "binding"];
  for (const tt of tokenTypes) {
    const lines: string[] = new Array(nLines).fill("");
    for (const { line, char, text, type } of tokens) {
      if (type === tt) {
        const len = lines[line].length;
        lines[line] = lines[line] + " ".repeat(char - len) + text;
      }
    }
    decos.push([tt as tokenType, lines.join("\n")]);
  }
  return { nLines, decos };
}

export function render(binding: Bindings, targetLineLength: number) {
  for (let nCol = 5; ; nCol--) {
    const { tokens, lineLen } = renderToTokens(binding, nCol);
    if (lineLen <= targetLineLength || nCol === 1) {
      return tokensToStrings(tokens);
    }
  }
}
