import { QuickPickItem } from "vscode";
import { log } from "../common/global";
import { toEmacsKey } from "./key";

export interface DispEntry {
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
  /* For display only; `when === ""` on the default null condition */
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
function normalizeKey(key: string) {
  return key.replace(
    RE_KEY_WHEN,
    (_all, k: string, _2, when: string) => toEmacsKey(k) + when,
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

export function showAsQuickPickItems(bindings: Bindings): QuickPickItem[] {
  const items: QuickPickItem[] = [];
  function loop(bindings: Bindings, keyChord: string[], whens: string[]) {
    if (bindings.orderedKeys === undefined) return;
    for (const [keyWhen, entry] of Object.entries(bindings.keys)) {
      const [key, when] =
        keyWhen.includes(":") && keyWhen.length >= 3
          ? keyWhen.split(":", 2)
          : [keyWhen, undefined];
      const curWhens = [...whens, ...(when ? [when] : [])];
      const curKeyChord = [...keyChord, key];
      if (isBindings(entry)) {
        loop(entry, curKeyChord, curWhens);
      } else {
        const detail =
          curWhens.length === 0 ? undefined : "when: " + curWhens.join(" && ");
        items.push({
          label: entry.name,
          description: curKeyChord.join(" "),
          detail,
        });
      }
    }
  }
  loop(bindings, [], []);
  items.sort((x, y) => x.description!.localeCompare(y.description!));
  return items;
}
