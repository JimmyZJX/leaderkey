import { log } from "./global";

interface DispEntry {
  key: string;
  name: string;
  type: "binding" | "command";
  when?: string;
}

export interface Bindings {
  name: string;
  transient?: boolean;
  // [key] might be "key" or "key:when"
  keys: { [key: string]: Bindings | Command };
  /* `when === ""` on the default null condition */
  orderedKeys?: {
    [when: string]: DispEntry[];
  };
}

export interface Command {
  name: string;
  goto?: string;
  command?: string;
  commands?: (string | { command: string; args?: any })[];
  args?: any;
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
  commandOrBindingName: Command | string,
) {
  const keys = path.split(" ").filter((s) => s !== "");
  if (keys.length === 0) throw "leaderkey: path is empty";
  keys.forEach((key, i) => {
    if (i === keys.length - 1) {
      const next = b.keys[key];
      if (next !== undefined) {
        log(
          `Overriding [${keys.slice(0, i + 1).join(" ")}] (${JSON.stringify(
            b.keys[key],
          )})`,
        );
      }
      if (typeof commandOrBindingName === "string") {
        if (next !== undefined && isBindings(next)) {
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
          log(`Overriding command [${keys.slice(0, i + 1).join(" ")}]`);
        }
        b = b.keys[key] = { name: `${key}...`, keys: {} };
      }
    }
  });
}

export type TokenType = "key" | "arrow" | "command" | "binding";

export interface RenderedToken {
  type: TokenType;
  line: number;
  char: number;
  text: string;
}

function* chunks<T>(arr: T[], n: number) {
  for (let i = 0; i < arr.length; i += n) {
    yield arr.slice(i, i + n);
  }
}

const shiftChars = '~!@#$%^&*()_+<>?{}:"|';
export const unshiftChars = "`1234567890-=,./[];'\\";

export function toVSCodeKey(key: string) {
  const lastChar = key.at(-1)!;
  if (/^[A-Z]*$/.test(lastChar)) {
    key = key.slice(0, key.length - 1) + "shift+" + lastChar.toLowerCase();
  }
  const idxNumChar = shiftChars.indexOf(lastChar);
  if (idxNumChar >= 0) {
    key =
      key.slice(0, key.length - 1) +
      "shift+" +
      unshiftChars.substring(idxNumChar, idxNumChar + 1);
  }

  return key
    .replaceAll("SPC", "space")
    .replaceAll("TAB", "tab")
    .replaceAll("RET", "enter")
    .replaceAll("ESC", "escape")
    .replaceAll("Backspace", "backspace")
    .replaceAll("C-", "ctrl+")
    .replaceAll("M-", "alt+")
    .replaceAll("S-", "shift+")
    .replaceAll("shift+shift+", "shift+");
}

const RE_KEY_WHEN = /^((^:|\+:|[^:])+)(|:.+)$/;

function _containsWhen(key: string) {
  const match = key.match(RE_KEY_WHEN);
  return match && match[3] !== "";
}

function getRaw(key: string) {
  const match = key.match(RE_KEY_WHEN);
  if (match !== null) return match[1];
  return key;
}

function getWhen(key: string) {
  const match = key.match(RE_KEY_WHEN);
  if (match !== null && match[3] !== "") return match[3].substring(1);
  return undefined;
}

function normalizeBindingName(name: string) {
  return `+${name.replace(/^\++/, "")}`;
}

/** turn keys into how they are displayed on which-key */
export function normalizeKey(key: string) {
  return key.replace(
    RE_KEY_WHEN,
    (_all, k: string, _2, when: string) =>
      k
        .replaceAll("space", "SPC")
        .replaceAll(" ", "SPC")
        .replaceAll("\t", "TAB")
        .replaceAll("tab", "TAB")
        .replaceAll("\n", "RET")
        .replaceAll("enter", "RET")
        .replaceAll("escape", "ESC")
        .replaceAll("backspace", "Backspace")
        .replaceAll("ctrl+", "C-")
        .replaceAll("alt+", "M-")
        .replaceAll("shift+", "S-")
        .replaceAll(/S-([`1234567890=,./[\];'\\-])$/g, (match, ch) => {
          const idx = unshiftChars.indexOf(ch);
          if (idx >= 0) return shiftChars.substring(idx, idx + 1);
          return match;
        })
        .replaceAll(/S-([a-z])$/g, (_m, ch) => (ch as string).toUpperCase()) + // suffix
      when,
  );
}

export function normalize(b: Bindings): Bindings {
  const dispEntries: DispEntry[] = [];
  const whens: Set<string | undefined> = new Set();
  const entries = Object.entries(b.keys).map<[string, Bindings | Command]>(([key, v]) => {
    const nKey = normalizeKey(key);
    const when = getWhen(nKey);
    whens.add(when);
    if (isBindings(v)) {
      const binding = normalize(v);
      dispEntries.push({
        key: getRaw(nKey),
        name: normalizeBindingName(binding.name),
        type: "binding",
        when,
      });
      return [nKey, binding];
    } else {
      dispEntries.push({
        key: getRaw(nKey),
        name: v.name,
        type: "command",
        when,
      });
      return [nKey, v];
    }
  });
  dispEntries.sort(({ key: k1 }, { key: k2 }) => {
    if (k1.length > k2.length) return -1;
    if (k1.length < k2.length) return 1;
    return k1.localeCompare(k2);
  });

  const orderedKeys: Bindings["orderedKeys"] = {};
  for (const when of whens) {
    const keysWithWhen: Set<string> = new Set();
    if (when !== undefined) {
      for (const de of dispEntries) {
        if (de.when === when) keysWithWhen.add(de.key);
      }
    }
    orderedKeys[when ?? ""] = dispEntries.filter(
      (de) => (de.when === undefined && !keysWithWhen.has(de.key)) || de.when === when,
    );
  }

  return { ...b, keys: Object.fromEntries(entries), orderedKeys };
}

export function go(
  root: Bindings,
  path: string,
  when: string | undefined,
): Bindings | Command | undefined {
  const keys = path.split(" ").filter((v) => v !== "");
  const chords = [];
  let transient: string | undefined;
  for (const k of keys) {
    chords.push(k);
    const n =
      (when === undefined ? undefined : root.keys[`${k}:${when}`]) ?? root.keys[k];
    // TODO isCommand early quit?
    if (n === undefined) return undefined;
    if (isCommand(n)) return { ...n, goto: n.goto ?? transient };
    if (n.transient) transient = chords.join(" ");
    root = n;
  }
  return root;
}

function renderToTokens(
  binding: Bindings,
  ncol: number,
  when: string | undefined,
): { tokens: RenderedToken[]; lineLen: number } {
  const dispEntries: DispEntry[] = binding.orderedKeys?.[when ?? ""] ??
    binding.orderedKeys?.[""] ?? [
      { key: "ERROR", name: "No item found", type: "command" },
    ];
  const tokens: RenderedToken[] = [];
  const cols = [...chunks(dispEntries, Math.ceil(dispEntries.length / ncol))];
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
      tokens.push({ line, char: charAfterKey + 1, text: "→", type: "arrow" });
      tokens.push({ line, char: charAfterKey + 3, text: name, type });
      curChar = charAfterKey + 4 + nameLen;
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
    for (const { line, char, text, type } of tokens) {
      if (type === tt) {
        const len = lines[line].length;
        lines[line] = lines[line] + " ".repeat(char - len) + text;
      }
    }
    maxLen = Math.max(maxLen, ...lines.map((l) => l.length));
    decos.push([tt as TokenType, lines.join("\n")]);
  }
  return { nLines, maxLen, decos };
}

export function render(
  binding: Bindings,
  targetLineLength: number,
  when: string | undefined,
) {
  for (let nCol = 5; ; nCol--) {
    const { tokens, lineLen } = renderToTokens(binding, nCol, when);
    if (lineLen <= targetLineLength || nCol === 1) {
      return tokensToStrings(tokens);
    }
  }
}
