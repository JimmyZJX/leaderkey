const shiftableChars = {
  rawKy: "abcdefghijklmnopqrstuvwxyz`1234567890-=,./[];'\\",
  shift: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ~!@#$%^&*()_+<>?{}:"|',
};

if (shiftableChars.rawKy.length !== shiftableChars.shift.length) {
  throw new Error("shiftableChars.raw.length !== shiftableChars.shift.length");
}

// [emacsKey, VSCodeKey, char]
const specialKeys: [string, string, string][] = [
  ["SPC", "space", " "],
  ["RET", "enter", "\n"],
  ["TAB", "tab", "\t"],
  ["ESC", "escape", "\x1b"],
];

// TODO F-keys

// where emacsKey = <VSCodeKey>
const rawSpecialKeys = [
  "backspace",
  "delete",
  "pageup",
  "pagedown",
  "up",
  "down",
  "left",
  "right",
  "home",
  "end",
];

type Modifiers = { C: boolean; M: boolean; S: boolean };

function parseModifier(key: string): { key: string; modifiers: Modifiers } {
  const modifiers = { C: false, M: false, S: false };
  // parse modifiers
  while (true) {
    const match = key.match(/^[CMS]-|(alt|ctrl|shift)\+/);
    if (match) {
      const m = match[0];
      key = key.slice(m.length);
      if (m.startsWith("C") || m.startsWith("ctrl")) modifiers.C = true;
      if (m.startsWith("M") || m.startsWith("alt")) modifiers.M = true;
      if (m.startsWith("S") || m.startsWith("shift")) modifiers.S = true;
      continue;
    }
    break;
  }
  return { key, modifiers };
}

function toEmacsKeyRaw(key: string, modifiers: Modifiers) {
  {
    const shiftable = shiftableChars.rawKy.indexOf(key);
    if (shiftable >= 0) {
      // e.g. "a"
      if (modifiers.S) {
        // "consume" shift
        modifiers.S = false;
        return shiftableChars.shift[shiftable];
      } else {
        return key;
      }
    }
  }
  {
    const shifted = shiftableChars.shift.indexOf(key);
    if (shifted >= 0) {
      // e.g. "A"
      if (modifiers.S) {
        // "consume" shift
        modifiers.S = false;
        return shiftableChars.rawKy[shifted];
      } else {
        return key;
      }
    }
  }
  {
    const special = specialKeys.find((k) => k[1] === key || k[2] === key);
    if (special !== undefined) {
      return special[0];
    }
  }
  if (rawSpecialKeys.includes(key)) {
    return `<${key}>`;
  }
  return key;
}

/** Identity on Emacs key. For upper case VSCode key this is different. */
export function toEmacsKey(vscodeOrEmacsKey: string) {
  const { key, modifiers } = parseModifier(vscodeOrEmacsKey);
  const emacsKey = toEmacsKeyRaw(key, modifiers);
  return (
    (modifiers.C ? "C-" : "") +
    (modifiers.M ? "M-" : "") +
    (modifiers.S ? "S-" : "") +
    emacsKey
  );
}

function toVSCodeKeyRaw(key: string, modifiers: Modifiers) {
  {
    const shiftable = shiftableChars.rawKy.indexOf(key);
    if (shiftable >= 0) {
      // e.g. "["
      return key;
    }
  }
  {
    const shifted = shiftableChars.shift.indexOf(key);
    if (shifted >= 0) {
      // e.g. "{"
      modifiers.S = true;
      return shiftableChars.rawKy[shifted];
    }
  }
  {
    const special = specialKeys.find((k) => k[0] === key || k[2] === key);
    if (special !== undefined) {
      return special[1];
    }
  }
  if (key.startsWith("<") && key.endsWith(">")) {
    const rawKey = key.slice(1, -1);
    if (rawSpecialKeys.includes(rawKey)) return rawKey;
  }
  return key;
}

export function toVSCodeKey(emacsKey: string) {
  const { key, modifiers } = parseModifier(emacsKey);
  const vscodeKey = toVSCodeKeyRaw(key, modifiers);
  return (
    (modifiers.C ? "ctrl+" : "") +
    (modifiers.M ? "alt+" : "") +
    (modifiers.S ? "shift+" : "") +
    vscodeKey
  );
}

const keyCharDesc: Record<string, string> = {
  ["`"]: "backtick",
  ["-"]: "dash",
  ["="]: "equal",
  [","]: "comma",
  ["."]: "dot",
  ["/"]: "slash",
  ["["]: "openingbracket",
  ["]"]: "closingbracket",
  [";"]: "semicolon",
  ["'"]: "singlequote",
  ["\\"]: "forwardslash",
  ["~"]: "tilde",
  ["!"]: "exclamation",
  ["@"]: "at",
  ["#"]: "hash",
  ["$"]: "dollar",
  ["%"]: "percent",
  ["^"]: "caret",
  ["&"]: "ampersand",
  ["*"]: "asterisk",
  ["("]: "openingparenthesis",
  [")"]: "closingparenthesis",
  ["_"]: "underscore",
  ["+"]: "plus",
  ["<"]: "less",
  [">"]: "greater",
  ["?"]: "question",
  ["{"]: "openingbrace",
  ["}"]: "closingbrace",
  [":"]: "colon",
  ['"']: "doublequote",
  ["|"]: "bar",
};

export function toEmacsKeyDesc(input: string) {
  const { key, modifiers } = parseModifier(input);
  let desc = key.length === 1 ? (keyCharDesc[key] ?? key) : key;
  desc = /^<[^<>]+>$/.test(desc) ? desc.slice(1, -1) : desc;
  return (
    (modifiers.C ? "C-" : "") +
    (modifiers.M ? "M-" : "") +
    (modifiers.S ? "S-" : "") +
    desc
  );
}

export function allVSCodeKeys(): string[] {
  const shiftable = [...shiftableChars.rawKy];
  return [...shiftable, ...specialKeys.map((t) => t[1]), ...rawSpecialKeys.map((t) => t)];
}
