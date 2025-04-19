import {
  CancellationTokenSource,
  commands,
  TextEditor,
  TextEditorDecorationType,
  window,
} from "vscode";
import { Decoration, renderDecorations } from "../common/decoration";
import { WHICHKEY_STATE } from "../common/global";
import { getRenderRangeFromTop, indicesToRender } from "../common/renderRange";
import { doQuery, GrepLine, RipGrepQuery, RipgrepStatusUpdate } from "./rg";

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
  private disposableDecos: TextEditorDecorationType[] = [];

  constructor(query: RipGrepQuery) {
    this.query = query;
    this.cancellationToken = new CancellationTokenSource();
    this.spawn();
  }

  public async quit() {
    for (const d of this.disposableDecos) d.dispose();
    this.disposableDecos = [];
    this.cancellationToken.cancel();
    await commands.executeCommand("_setContext", WHICHKEY_STATE, "");
    await commands.executeCommand("_setContext", "inDebugRepl", false);
  }

  public onKey(key: string) {
    const uiAction = this.uiActions[key];
    if (uiAction) {
      uiAction();
      this.render();
    } else {
      let f = (input: string) => {
        if (key === "<backspace>") return input.slice(0, -1);
        if (key.length === 1) return input + key;
        return input;
      };
      this.query.query = f(this.query.query);
      this.spawn();
    }
  }

  private uiActions: {
    [key: string]: () => void;
  } = {
    "<up>": () => this.moveSelection(-1),
    "C-k": () => this.moveSelection(-1),
    "<down>": () => this.moveSelection(1),
    "C-j": () => this.moveSelection(1),
    "C-u": () => this.moveSelection(-5),
    "C-d": () => this.moveSelection(5),
  };

  moveSelection(delta: number) {
    const ms = this.matchState;
    if (ms.selection === undefined) return;
    if (delta > 0) {
      ms.selection = Math.min(ms.matches.length - 1, ms.selection + delta);
    } else {
      ms.selection = Math.max(0, ms.selection + delta);
    }
  }

  render() {
    const lastDecorations = this.disposableDecos;
    try {
      commands.executeCommand("_setContext", WHICHKEY_STATE, ":ripgrep");
      commands.executeCommand("_setContext", "inDebugRepl", true);
      const editor = window.activeTextEditor;
      this.disposableDecos = editor === undefined ? [] : this.doRender(editor);
    } finally {
      for (const dsp of lastDecorations) dsp.dispose();
    }
  }

  doRender(editor: TextEditor) {
    if (this.matchState.selection === undefined && this.matchState.matches.length > 0) {
      this.matchState.selection = 0;
    }
    const { selection, message, matches } = this.matchState;
    const HEADER_NUM_LINES = 2;

    const renderedLines =
      selection === undefined
        ? { start: 0, len: 0 }
        : indicesToRender({
            length: matches.length,
            focus: selection,
          });

    const highlight: Decoration[] = [];
    if (selection !== undefined) {
      highlight.push({
        type: "background",
        lines: 1,
        background: "header",
        zOffset: 1,
        lineOffset: selection - renderedLines.start + HEADER_NUM_LINES,
      });
    }
    const decos: Decoration[] = [
      { type: "background", lines: HEADER_NUM_LINES + renderedLines.len },
      { type: "text", text: this.query.query + "█", foreground: "command" },
      { type: "text", text: message, foreground: "arrow", lineOffset: 1 },
      ...highlight,
      ...matches
        .slice(renderedLines.start, renderedLines.start + renderedLines.len)
        .map<Decoration>((grepLine, i) => {
          const text = `${grepLine.file}:${grepLine.lineNo}:${grepLine.line}`;
          return {
            type: "text",
            text,
            foreground: "command",
            lineOffset: HEADER_NUM_LINES + i,
          };
        }),
    ];
    const range = getRenderRangeFromTop(editor, HEADER_NUM_LINES + renderedLines.len);
    return renderDecorations(decos, editor, range);
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
              this.matchState.message = `finding [${summary.query}]`;
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
