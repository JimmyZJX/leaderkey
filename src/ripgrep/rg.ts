import { relative } from "path-browserify";
import { CancellationToken, workspace } from "vscode";
import { ProcessLineStreamer } from "../common/remote";

//#region ripgrep message format (incomplete)
interface GrepBegin {
  type: "begin";
  data: { path?: { text?: string } };
}
interface GrepEnd {
  type: "end";
  data: { path?: { text?: string } };
}
interface GrepMatch {
  type: "match";
  data: {
    path?: { text?: string };
    lines: { text?: string };
    line_number: number;
    submatches: { match: { text?: string }; start: number; end: number }[];
  };
}
interface GrepSummary {
  type: "summary";
  data: {
    elapsed_total: { human: string; secs: number; nanos: number };
    stats: { matched_lines: number };
  };
}

type GrepMessage = GrepBegin | GrepEnd | GrepMatch | GrepSummary;
//#endregion

export type RipGrepQuery = {
  query: string;
  cwd: string; // only affects how the results are rendered
  dir: string[]; // a list of dirs to search for `query`
  case: "smart" | "strict" | "ignore"; // `--smart-case`, default or `--ignore-case`
  // IDEA: indicate strictness with some decoration
  regex: "on" | "off"; // default or `--fixed-strings`
  word: "on" | "off"; // `--word-regexp` or default
  // IDEA: maybe render \b...\b around user query
};

function toArgs(q: RipGrepQuery) {
  const rgOpts = ["--json"];
  if (q.case === "smart") {
    rgOpts.push("--smart-case");
  } else if (q.case === "ignore") {
    rgOpts.push("--ignore-case");
  }
  if (q.regex === "off") rgOpts.push("--fixed-strings");
  if (q.word === "on") rgOpts.push("--word-regexp");

  // resolve to relative dir
  let dirs = q.dir.map((dir) => {
    const rel = relative(q.cwd, dir);
    return rel || ".";
  });
  if (dirs.length === 1 && dirs[0] === ".") {
    dirs = [];
  }
  const prog = workspace.getConfiguration("leaderkey").get("ripgrep.exe", "rg");
  return { prog, args: [q.query, ...dirs, ...rgOpts], cwd: q.cwd };
}

export interface GrepLine {
  file: string;
  lineNo: number;
  line: string;
  match: { start: number; end: number }[];
}

export type Summary =
  | { type: "done"; elapsed: string; matches: number }
  | { type: "error"; msg: string }
  // TOOD ??
  | { type: "start"; query: string };

type RipgrepStatusUpdate =
  | { type: "summary"; summary: Summary }
  | { type: "match"; lines: GrepLine[] };

export async function doQuery(
  query: RipGrepQuery,
  onUpdate: (update: RipgrepStatusUpdate) => void,
  cancellationToken: CancellationToken,
) {
  const { prog, args, cwd } = toArgs(query);
  const proc = new ProcessLineStreamer(prog, args, { cwd });

  cancellationToken.onCancellationRequested(() => proc.kill());
  for await (const status of proc.spawn()) {
    if (cancellationToken.isCancellationRequested) continue;

    switch (status.type) {
      case "stdout": {
        let summary: Summary | undefined = undefined;
        const grepLines: GrepLine[] = [];
        for (const line of status.lines) {
          const msg: GrepMessage = JSON.parse(line);
          if (msg.type === "match") {
            const data = msg.data;
            const text = data.lines.text;
            if (text !== undefined && text.endsWith("\n")) {
              grepLines.push({
                file: data.path?.text ?? "<bad filename>",
                lineNo: data.line_number,
                line: text.trimEnd(),
                match: data.submatches.map(({ start, end }) => ({ start, end })),
              });
            }
          } else if (msg.type === "summary") {
            const data = msg.data;
            const elapsed =
              (data.elapsed_total.secs + data.elapsed_total.nanos * 1e-9).toFixed(2) +
              "s";
            summary = { type: "done", matches: data.stats.matched_lines, elapsed };
          }
        }
        if (grepLines.length > 0) onUpdate({ type: "match", lines: grepLines });
        if (summary !== undefined) onUpdate({ type: "summary", summary });
        break;
      }
      case "error":
        onUpdate({
          type: "summary",
          summary: { type: "error", msg: JSON.stringify(status.error) },
        });
        break;
      case "exit":
        onUpdate({
          type: "summary",
          summary: { type: "error", msg: "rg quits unexpectedly" },
        });
        break;
      case "notFound":
        onUpdate({
          type: "summary",
          summary: { type: "error", msg: "rg process lost by `remote-commons`" },
        });
        break;
      case "stderr":
        onUpdate({
          type: "summary",
          summary: { type: "error", msg: `unexpected stderr ${status.lines}` },
        });
        break;
      default: {
        const _exhaustive: never = status;
      }
    }
  }
}
