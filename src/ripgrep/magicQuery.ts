import { log } from "../common/global";

/** split a query by space with some magic done in regex mode */
export function magicSpace(queries: string[]): { rg: string; js: RegExp | null } {
  // If there's only one query, just return it
  if (queries.length <= 1) {
    return { rg: queries.join(""), js: null };
  }
  const permutations: string[][] = [];
  function generatePermutations(arr: string[], current: string[]) {
    if (arr.length === 0) {
      permutations.push([...current]);
      return;
    }

    for (let i = 0; i < arr.length; i++) {
      const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
      current.push(arr[i]);
      generatePermutations(remaining, current);
      current.pop();
    }
  }
  generatePermutations(queries, []);

  let magicRegexInd = 0;

  return {
    rg: `(${permutations.map((q) => q.join(".*")).join("|")})`,
    js: new RegExp(
      permutations
        .map((q) => q.map((q) => `(?<magic${magicRegexInd++}>${q})`).join(".*"))
        .join("|"),
      "d",
    ),
  };
}

export function matchMagic(
  line: string,
  js: RegExp | null,
): { start: number; end: number }[] | null {
  if (!js) {
    return null;
  }

  // push groups starts with "magic" to the result
  const matches: { start: number; end: number }[] = [];
  const result = js.exec(line);

  if (!result || !result.groups) {
    return null;
  }

  try {
    for (const [key, value] of Object.entries(result.indices!.groups!)) {
      if (key.startsWith("magic") && value !== undefined) {
        const [start, end] = value;
        matches.push({ start, end });
      }
    }
  } catch (e) {
    log(`Failed to extract indices from magic regex: ${JSON.stringify(e)}`);
    return null;
  }

  // If no magic matches were found, return null
  if (matches.length === 0) {
    return null;
  }

  return matches;
}

function parseMagicSpace(
  query: string,
  regex: boolean,
): { magicSpaces: number[]; queries: string[] } {
  if (!regex) {
    return { magicSpaces: [], queries: [query] };
  }

  const queries = [];
  const magicSpaces = [];
  let current = "";

  for (const [i, c] of [...query].entries()) {
    if (c === " ") {
      if (current === "") {
        current += " ";
        continue;
      }
      try {
        new RegExp(current);
        queries.push(current);
        magicSpaces.push(i);
        current = "";
      } catch {
        current += " ";
      }
    } else {
      current += c;
    }
  }
  if (current !== "") {
    queries.push(current);
  }
  // give up when there are too many
  if (queries.length > 4) {
    return { magicSpaces: [], queries: [query] };
  }
  return { magicSpaces, queries };
}

const RE_DASHDASH = /^(?<query>.*?)(?<flagArea> +-- +(?<flags>.+))?$/;
export function parseMagicQuery(
  rawQuery: string,
  regex: boolean,
): {
  magicSpaces: number[];
  queries: string[];
  flagAreaLen: number;
  args: string[];
} {
  const match = RE_DASHDASH.exec(rawQuery);
  if (!match) {
    throw new Error("RE_DASHDASH unexpectedly not matched on [" + rawQuery + "]");
  }
  const { query, flags, flagArea } = match.groups!;

  const RE_QUOTED = /(?<=\s|^)'[^']+'|[^'\s]+(?=\s|$)/g;
  const args = Array.from((flags ?? "").matchAll(RE_QUOTED), (m) =>
    m[0].startsWith("'") ? m[0].slice(1, -1) : m[0],
  );

  const parsedMagicSpace = parseMagicSpace(query, regex);
  return { ...parsedMagicSpace, args, flagAreaLen: (flagArea ?? "").length };
}
