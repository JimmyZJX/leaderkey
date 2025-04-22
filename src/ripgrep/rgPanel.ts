import { join } from "path-browserify";
import { CancellationTokenSource, TextEditor, TextEditorDecorationType } from "vscode";
import {
  disableLeaderKey,
  enableLeaderKeyAndDisableVim,
  enableVim,
} from "../common/context";
import { Decoration, renderDecorations } from "../common/decoration";
import { log } from "../common/global";
import {
  getNumTotal,
  getRenderRangeFromTop,
  indicesToRender,
} from "../common/renderRange";
import { OneLineEditor } from "../common/singleLineEditor";
import { eagerDebouncer } from "../common/throttle";
import { doQuery, GrepLine, RipGrepQuery, RipgrepStatusUpdate } from "./rg";
import { RgEditor } from "./rgEditor";

type RgMatchState = {
  matches: GrepLine[];
  message: string;
  selection: number | undefined;
  isDone: boolean;
};

function emptyRgMatchState(): RgMatchState {
  return {
    matches: [],
    message: "",
    selection: undefined,
    isDone: false,
  };
}

const PAD_INDICATOR_COUNT = 5;
const INPUT_DEBOUNCE_TIMEOUT = 200;

function spcs(len: number) {
  return " ".repeat(len);
}

export class RgPanel {
  private editor: OneLineEditor;
  private query: RipGrepQuery;
  private cancellationToken: CancellationTokenSource;

  private matchState: RgMatchState = emptyRgMatchState();
  private disposableDecos: TextEditorDecorationType[] = [];

  private spawnDebouncer: (f: () => void) => "immediately" | "delayed";
  // undefined means quit
  private rgEditor: RgEditor | undefined;

  private onReset: () => void;

  constructor(query: RipGrepQuery, activeTextEditor: TextEditor, onReset: () => void) {
    enableLeaderKeyAndDisableVim(":ripgrep");
    this.editor = new OneLineEditor(query.query);
    this.query = query;
    this.onReset = onReset;
    this.cancellationToken = new CancellationTokenSource();
    this.rgEditor = new RgEditor(activeTextEditor, () => this.render());
    this.spawnDebouncer = eagerDebouncer(() => this.doSpawn(), INPUT_DEBOUNCE_TIMEOUT);
    this.spawn();
  }

  public async quit(mode: "interrupt" | "normal" | { file: string; lineNo: number }) {
    this.cancellationToken.cancel();
    enableVim();
    if (mode === "interrupt") {
      await this.rgEditor?.quit(true);
    } else if (mode === "normal") {
      await this.rgEditor?.quit(false);
    } else {
      await this.rgEditor?.enter(mode.file, mode.lineNo);
    }
    this.rgEditor = undefined;
    for (const d of this.disposableDecos) d.dispose();
    this.disposableDecos = [];
    this.onReset();
    await disableLeaderKey();
  }

  public async onKey(key: string) {
    if (key === "RET") {
      if (this.matchState.selection === undefined) return;
      const match = this.matchState.matches[this.matchState.selection];
      if (match === undefined) return;
      await this.quit({ file: join(this.query.cwd, match.file), lineNo: match.lineNo });
    } else {
      const uiAction = this.uiActions[key];
      if (uiAction) {
        await uiAction();
        this.render();
      } else if ((await this.editor.tryKey(key)) === "handled") {
        this.query.query = this.editor.value();
        this.spawn();
      } else {
        log(`[rgPanel] Key not handled: ${key}`);
      }
    }
  }

  private uiActions: {
    [key: string]: () => void | Promise<void>;
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
      const editor = this.rgEditor?.getEditor();
      this.disposableDecos = editor === undefined ? [] : this.doRender(editor);
    } finally {
      for (const dsp of lastDecorations) dsp.dispose();
    }
  }

  doRender(editor: TextEditor) {
    const ms = this.matchState;
    if (ms.selection === undefined && ms.matches.length > 0) {
      ms.selection = 0;
    }
    const { selection, message, matches } = ms;
    const HEADER_NUM_LINES = 2;

    const selected = ms.matches[ms.selection ?? 0];
    if (selected) {
      this.rgEditor?.preview(join(this.query.cwd, selected.file), selected.lineNo);
    }

    // status line
    const status = `[${this.query.dir[0]}] ${message}`;

    const renderedLines =
      selection === undefined
        ? { start: 0, len: 0 }
        : indicesToRender({
            length: matches.length,
            focus: selection,
          });

    const selectedBg: Decoration[] = [];
    if (selection !== undefined) {
      selectedBg.push({
        type: "background",
        lines: 1,
        background: "header",
        zOffset: 1,
        lineOffset: selection - renderedLines.start + HEADER_NUM_LINES,
      });
    }

    const matchText = matches
      .slice(renderedLines.start, renderedLines.start + renderedLines.len)
      .map((grepLine) => {
        const normalChars = [...grepLine.line];
        let highlightChars = Array(grepLine.line.length).fill(" ");
        for (const { start, end } of grepLine.match) {
          for (let i = start; i < end; i++) {
            highlightChars[i] = normalChars[i];
            normalChars[i] = " ";
          }
        }
        const lineNormal = normalChars.join("");
        const lineHighlight = highlightChars.join("");

        // line format:
        // <file>:<line>:  line with optional highlighted text

        const file = grepLine.file;
        const strLineNo = grepLine.lineNo.toString();
        const lineNo = spcs(file.length + 1) + strLineNo;
        const linePrefix = spcs(file.length) + ":" + spcs(strLineNo.length) + ":";
        const normal = linePrefix + lineNormal;
        const highlight = spcs(linePrefix.length) + lineHighlight;
        return { file, lineNo, normal, highlight };
      });
    const fileText = matchText.map(({ file }) => file).join("\n");
    const lineNoText = matchText.map(({ lineNo }) => lineNo).join("\n");
    const normalText = matchText.map(({ normal }) => normal).join("\n");
    const highlightText = matchText.map(({ highlight }) => highlight).join("\n");

    const bgSize = HEADER_NUM_LINES + Math.max(getNumTotal(), renderedLines.len);

    const rgIndicator =
      (ms.isDone || ms.matches.length > 0 ? ms.matches.length.toString() : "").padEnd(
        PAD_INDICATOR_COUNT,
      ) + " rg: ";
    const editorDecos = this.editor.render({ char: rgIndicator.length });

    const decos: Decoration[] = [
      { type: "background", lines: bgSize },
      { type: "background", lines: 0.5, lineOffset: -0.5, background: "border" },
      {
        type: "background",
        lines: 0.5,
        lineOffset: bgSize,
        background: "border",
      },
      {
        type: "text",
        text: rgIndicator,
        foreground: ms.isDone ? "arrow-bold" : "binding",
      },
      ...editorDecos,
      { type: "text", text: status, foreground: "command", lineOffset: 1 },
      ...selectedBg,
      {
        type: "text",
        text: fileText,
        foreground: "binding",
        lineOffset: HEADER_NUM_LINES,
      },
      {
        type: "text",
        text: lineNoText,
        foreground: "arrow",
        lineOffset: HEADER_NUM_LINES,
      },
      {
        type: "text",
        text: normalText,
        foreground: "command",
        lineOffset: HEADER_NUM_LINES,
      },
      {
        type: "text",
        text: highlightText,
        foreground: "error-bold",
        lineOffset: HEADER_NUM_LINES,
      },
    ];
    const range = getRenderRangeFromTop(
      editor,
      HEADER_NUM_LINES + renderedLines.len,
      "ignore-sticky-scroll",
    );
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
              this.matchState.isDone = true;
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

  private doSpawn() {
    // to prevent rendering after the panel is closed
    if (!this.rgEditor) return;

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

  private spawn() {
    switch (this.spawnDebouncer(() => this.doSpawn())) {
      case "immediately":
        break;
      case "delayed":
        this.render();
        break;
    }
  }
}
