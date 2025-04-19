import {
  window,
  CancellationTokenSource,
  TextEditorDecorationType,
  Range,
  commands,
} from "vscode";
import { doQuery, GrepLine, RipGrepQuery, RipgrepStatusUpdate } from "./rg";
import {
  Decoration,
  renderDecorations,
  stickyScrollMaxRows,
} from "../leaderkey/decoration";
import { WHICHKEY_STATE } from "../common/global";

type RgMatchState = {
  matches: GrepLine[];
  message: string;
  selection: number | undefined;
};

function emptyRgMatchState() {
  return {
    matches: [],
    message: "<init>",
    selection: undefined,
  };
}

export class RgPanel {
  private query: RipGrepQuery;
  private cancellationToken: CancellationTokenSource;

  private matchState: RgMatchState = emptyRgMatchState();
  private lastDecorations: TextEditorDecorationType[] = [];

  constructor(query: RipGrepQuery) {
    this.query = query;
    this.cancellationToken = new CancellationTokenSource();
    this.spawn();
  }

  public async quit() {
    for (const d of this.lastDecorations) d.dispose();
    this.lastDecorations = [];
    this.cancellationToken.cancel();
    await commands.executeCommand("_setContext", WHICHKEY_STATE, "");
    await commands.executeCommand("_setContext", "inDebugRepl", false);
  }

  public onKey(key: string) {
    let f = (input: string) => {
      if (key === "<backspace>") return input.slice(0, -1);
      if (key.length === 1) return input + key;
      return input;
    };
    this.query.query = f(this.query.query);
    this.spawn();
  }

  render() {
    const lastDecorations = this.lastDecorations;
    try {
      commands.executeCommand("_setContext", WHICHKEY_STATE, ":ripgrep");
      commands.executeCommand("_setContext", "inDebugRepl", true);
      this.lastDecorations = this.doRender();
    } finally {
      for (const dsp of lastDecorations) dsp.dispose();
    }
  }

  doRender() {
    const decos: Decoration[] = [
      { type: "background", lines: 2 + this.matchState.matches.length },
      { type: "text", text: this.query.query, foreground: "command" },
      { type: "text", text: this.matchState.message, foreground: "arrow", lineOffset: 1 },
      ...this.matchState.matches.map<Decoration>((grepLine, i) => {
        const text = `${grepLine.file}:${grepLine.lineNo}:${grepLine.line}`;
        return { type: "text", text, foreground: "command", lineOffset: 2 + i };
      }),
    ];
    const totalLines = 2 + this.matchState.matches.length;

    // TODO duplicated code
    const editor = window.activeTextEditor;
    if (editor === undefined) return [];
    const visibleRange = editor.visibleRanges[0];
    let lnHeader =
      visibleRange.start.line +
      Math.min(
        stickyScrollMaxRows,
        (visibleRange.end.line - visibleRange.start.line) >> 1,
      );
    const doc = editor.document;
    const docLines = doc.lineCount;
    lnHeader = Math.max(0, Math.min(docLines - 2, lnHeader));
    const lnEnd = Math.min(docLines - 1, lnHeader + totalLines);
    const overallRange = new Range(
      doc.lineAt(lnHeader).range.start,
      doc.lineAt(lnEnd).range.end,
    );

    return renderDecorations(decos, editor, overallRange);
  }

  private onUpdate(update: RipgrepStatusUpdate) {
    switch (update.type) {
      case "match":
        this.matchState.matches.push(...update.lines);
        break;
      case "summary":
        {
          const summary = update.summary;
          switch (summary.type) {
            case "done":
              this.matchState.message = `${summary.matches} matches in ${summary.elapsed}`;
              break;
            case "error":
              this.matchState.message = `ERROR: ${summary.msg}`;
              break;
            case "start":
              this.matchState.message = `⏳ [${summary.query}]`;
              break;
            default: {
              const _exhaustive: never = summary;
            }
          }
        }
        break;
      default: {
        const _exhaustive: never = update;
      }
    }
    this.render();
  }

  spawn() {
    this.matchState = emptyRgMatchState();
    this.cancellationToken.cancel();
    this.cancellationToken = new CancellationTokenSource();
    if (this.query.query !== "") {
      doQuery(
        this.query,
        (update) => this.onUpdate(update),
        this.cancellationToken.token,
      );
    }
    this.render();
  }
}
