import { window, workspace } from "vscode";

interface LeaderkeyOverrideItem {
  name: string;
  command: string;
  args?: string;
}

function splitByDotPreservingConsecutive(input: string): string[] {
  return input.split(/\.(?=.)/g);
}

function convertSpcMToComma(list: string[]): string[] {
  if (
    list.length >= 3 &&
    list[0] === "SPC" &&
    list[1] === "m" &&
    list[2].startsWith("languageId:")
  ) {
    return [",", ...list.slice(3)];
  }
  return list;
}

function parseWhichKey(conf: unknown) {
  const overrides: { [path: string]: LeaderkeyOverrideItem } = {};
  parse(["SPC"], conf);
  return overrides;

  function parse(chords: string[], conf: any) {
    if (Array.isArray(conf)) {
      for (const subConf of conf) {
        parse(chords, subConf);
      }
    } else if (typeof conf === "object" && conf) {
      let key =
        (typeof conf.key === "string" ? conf.key : undefined) ??
        (typeof conf.keys === "string" ? conf.keys : undefined);
      let keys = key !== undefined ? splitByDotPreservingConsecutive(key ?? "???") : [];
      if (Array.isArray(conf.keys)) {
        keys = conf.keys;
      }
      const keyList = keys.map((k) => k.replace("\t", "TAB").replace(" ", "SPC"));
      const curChords = convertSpcMToComma([...chords, ...keyList]);

      if (Array.isArray(conf.bindings)) {
        for (const subConf of conf.bindings) {
          parse(curChords, subConf);
        }
      } else if (conf.command !== undefined) {
        const path = curChords.join(" ");
        const name = conf.name ?? "<name not set>";
        if (conf.args !== undefined) {
          overrides[path] = { name, command: conf.command, args: conf.args };
        } else {
          overrides[path] = { name, command: conf.command };
        }
      }
    }
  }
}

export function migrateFromVSpaceCode() {
  const vspacecodeOverrides = workspace
    .getConfiguration("vspacecode")
    .get("bindingOverrides", undefined);
  const jsonVSpaceCode = JSON.stringify(vspacecodeOverrides);

  let leaderkeyOverrides = parseWhichKey(vspacecodeOverrides);
  leaderkeyOverrides = Object.fromEntries(
    Object.entries(leaderkeyOverrides).sort(([k1, _v1], [k2, _v2]) =>
      k1.localeCompare(k2),
    ),
  );
  let json = JSON.stringify(leaderkeyOverrides, undefined, 4);

  workspace
    .openTextDocument({
      content:
        "Leaderkey translated `vspacecode.bindingOverrides`. Please review carefully before using!\n\n" +
        json,
    })
    .then((doc) => window.showTextDocument(doc));
}
