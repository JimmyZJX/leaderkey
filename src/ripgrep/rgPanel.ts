import { dirname, join } from "path-browserify";
import {
  CancellationTokenSource,
  TextEditor,
  TextEditorDecorationType,
  window,
  workspace,
} from "vscode";
import {
  disableLeaderKey,
  enableLeaderKeyAndDisableVim,
  enableVim,
} from "../common/context";
import { Decoration, renderDecorations } from "../common/decoration";
import { commonPrefix, log } from "../common/global";
import { ENV_HOME, pickPathFromUri } from "../common/remote";
import {
  getNumTotal,
  getRenderRangeFromTop,
  indicesToRender,
} from "../common/renderRange";
import { OneLineEditor } from "../common/singleLineEditor";
import { eagerDebouncer } from "../common/throttle";
import { panelManager } from "../extension";
import {
  doQuery,
  GrepLine,
  RipGrepQuery,
  RipGrepSearchMode,
  RipgrepStatusUpdate,
} from "./rg";
import { RgEditor } from "./rgEditor";
import { getQueryFromSelection, GetQueryFromSelectionOptions } from "./utils";

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

const MAX_NUM_MATCHES = 99999;
const MAX_RENDER_LEN = 400;

function spcs(len: number) {
  return " ".repeat(len);
}

type Query = RipGrepQuery & {
  dirHistory: { cwd: string; dir: string[] }[];
};

let lastRgQuery: Query | undefined;

function getSearchMode(): RipGrepSearchMode {
  if (lastRgQuery) {
    return { case: lastRgQuery.case, regex: lastRgQuery.regex, word: lastRgQuery.word };
  }
  return { case: "smart", regex: "on", word: "off" };
}

export class RgPanel {
  private editor: OneLineEditor;
  private query: Query;
  private cancellationToken: CancellationTokenSource;

  private matchState: RgMatchState = emptyRgMatchState();
  private disposableDecos: TextEditorDecorationType[] = [];

  private spawnDebouncer: (f: () => void) => "immediately" | "delayed";
  // undefined means quit
  private rgEditor: RgEditor | undefined;

  private onReset: () => void;

  constructor(query: RipGrepQuery, activeTextEditor: TextEditor, onReset: () => void) {
    RgPanel.enterContext();
    this.editor = new OneLineEditor(query.query);
    this.query = { ...query, dirHistory: [] };
    lastRgQuery = this.query;
    this.onReset = onReset;
    this.cancellationToken = new CancellationTokenSource();
    this.rgEditor = new RgEditor(activeTextEditor, () => this.render());
    this.spawnDebouncer = eagerDebouncer(() => this.doSpawn(), INPUT_DEBOUNCE_TIMEOUT);
    this.spawn();
  }

  private static enterContext() {
    enableLeaderKeyAndDisableVim(":ripgrep");
  }

  private clearDecos() {
    for (const d of this.disposableDecos) d.dispose();
    this.disposableDecos = [];
  }

  public async quit(mode: "interrupt" | "normal" | { file: string; lineNo: number }) {
    this.cancellationToken.cancel();
    enableVim();
    if (mode === "interrupt") {
      await this.rgEditor?.quit(false);
    } else if (mode === "normal") {
      await this.rgEditor?.quit(true);
    } else {
      await this.rgEditor?.enter(mode.file, mode.lineNo);
    }
    this.rgEditor = undefined;
    this.clearDecos();
    this.onReset();
    await disableLeaderKey();
  }

  async changeDirViaFindFile() {
    this.clearDecos();
    const dir = await panelManager.findFile({
      init: this.query.cwd,
      dirOnly: true,
      returnOnly: true,
    });
    RgPanel.enterContext();
    panelManager.setRgPanel(this);
    if (dir === undefined) {
      this.render();
    } else {
      this.query.dir = [dir];
      this.query.cwd = dir;
      this.query.dirHistory = [];
      this.spawn();
    }
  }

  public async onKey(key: string) {
    const queryAction = this.queryActions[key];
    if (queryAction) {
      await queryAction();
      return;
    }
    const uiAction = this.uiActions[key];
    if (uiAction) {
      await uiAction();
      this.render();
      return;
    }
    const oldValue = this.editor.value();
    if ((await this.editor.tryKey(key)) === "handled") {
      if (oldValue === this.editor.value()) {
        this.render();
        return;
      } else {
        this.query.query = this.editor.value();
        this.spawn();
        return;
      }
    }
    log(`[rgPanel] Key not handled: ${key}`);
  }

  private queryActions: {
    [key: string]: () => void | Promise<void>;
  } = {
    RET: async () => {
      if (this.matchState.selection === undefined) return;
      const match = this.matchState.matches[this.matchState.selection];
      if (match === undefined) return;
      await this.quit({ file: join(this.query.cwd, match.file), lineNo: match.lineNo });
    },
    "C-h": () => this.dirUp(),
    "M-h": () => this.dirUp(),
    "C-l": () => this.dirDown(),
    "M-l": () => this.dirDown(),
    "C-.": async () => await this.changeDirViaFindFile(),
    "M-r": async () => {
      this.query.regex = this.query.regex === "on" ? "off" : "on";
      this.spawn();
    },
    "M-w": async () => {
      this.query.word = this.query.word === "on" ? "off" : "on";
      this.spawn();
    },
    "M-c": async () => {
      this.query.case =
        this.query.case === "smart"
          ? "strict"
          : this.query.case === "strict"
            ? "ignore"
            : "smart";
      this.spawn();
    },
  };

  dirDown() {
    const history = this.query.dirHistory;
    const top = history.pop();
    if (top) {
      const { cwd, dir } = top;
      this.query.cwd = cwd;
      this.query.dir = dir;
      this.spawn();
    }
  }

  dirUp() {
    const query = this.query;
    if (query.dir.length === 1 && query.dir[0] === "/") {
      return;
    }
    query.dirHistory.push({ cwd: query.cwd, dir: query.dir });
    if (query.dir.length > 1) {
      query.dir = [query.cwd];
    } else {
      const newDir = dirname(query.cwd);
      query.dir = [newDir];
      query.cwd = newDir;
    }
    this.spawn();
  }

  private uiActions: {
    [key: string]: () => void | Promise<void>;
  } = {
    "<up>": () => this.moveSelection(-1),
    "C-k": () => this.moveSelection(-1),
    "<down>": () => this.moveSelection(1),
    "C-j": () => this.moveSelection(1),
    "C-u": () => this.moveSelection(-8),
    "C-d": () => this.moveSelection(8),
    "<pagedown>": () => this.moveSelection(15),
    "<pageup>": () => this.moveSelection(-15),
    "C-<home>": () => this.moveSelection(-MAX_NUM_MATCHES),
    "C-<end>": () => this.moveSelection(MAX_NUM_MATCHES),
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

  private getModeHint() {
    const hints: string[] = [];
    const q = this.query;
    switch (q.case) {
      case "smart": {
        const isLower = q.query.toLowerCase() === q.query;
        if (isLower) {
          hints.push("case: smart (ignore)");
        } else {
          hints.push("case: smart (strict)");
        }
        break;
      }
      case "strict":
        hints.push("case: strict");
        break;
      case "ignore":
        hints.push("case: ignore");
        break;
      default: {
        const _: never = q.case;
      }
    }
    switch (q.word) {
      case "off":
        break;
      case "on":
        hints.push("word: on");
        break;
      default: {
        const _: never = q.word;
      }
    }
    switch (q.regex) {
      case "on":
        break;
      case "off":
        hints.push("regex: off");
        break;
      default: {
        const _: never = q.regex;
      }
    }
    return hints.join(" | ");
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
    const statusSubFolder =
      this.query.dir.length === 1 ? "" : ` (x${this.query.dir.length} sub-dirs)`;
    const status = `[${this.query.cwd}]${statusSubFolder}`;
    const statusDim = spcs(status.length) + " " + message;

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
        const line = grepLine.line.slice(0, MAX_RENDER_LEN);
        const normalChars = [...line];
        const highlightChars = Array(line.length).fill(" ");
        for (const { start, end } of grepLine.match) {
          for (let i = start; i < end; i++) {
            if (i < line.length) {
              highlightChars[i] = normalChars[i];
              normalChars[i] = " ";
            }
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

    const modeHint = this.getModeHint();
    const modeHintMinPos = rgIndicator.length + this.editor.value().length + 4;
    const modeHintPos = Math.max(modeHintMinPos, 80 - modeHint.length);
    const editorDecos: Decoration[] = [
      ...this.editor.render({ char: rgIndicator.length }),
      {
        type: "text",
        text: modeHint,
        foreground: "dim",
        charOffset: modeHintPos,
      },
    ];

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
      { type: "text", text: statusDim, foreground: "dim", lineOffset: 1 },
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
        this.matchState.matches.push(
          ...update.lines.slice(0, MAX_NUM_MATCHES - this.matchState.matches.length),
        );
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

export type CreateRgPanelOptions = {
  query?: GetQueryFromSelectionOptions;
  dir?: { type: "current" } | { type: "workspace" } | { type: "path"; path: string };
  resume?: true;
};

export async function createRgPanel(
  mode: CreateRgPanelOptions | undefined,
  onReset: () => void,
) {
  let editor = window.activeTextEditor;
  if (!editor) {
    const doc = await workspace.openTextDocument({ language: "text" });
    editor = await window.showTextDocument(doc, { preview: true });
  }

  let rgQuery: RipGrepQuery;
  if (mode?.resume && lastRgQuery) {
    rgQuery = structuredClone(lastRgQuery);
  } else {
    const queryMode = mode?.query ?? { type: "selection-only" };
    const dirMode = mode?.dir ?? { type: "current" };

    let dir: string[];
    // TODO synchronously show and then set dir
    if (dirMode.type === "current") {
      dir = [await pickPathFromUri(editor.document.uri, "dirname")];
    } else if (dirMode.type === "workspace") {
      dir = (workspace.workspaceFolders ?? []).flatMap((folder) => {
        const uri = folder.uri;
        if (["file", "vscode-remote"].includes(uri.scheme)) {
          return [uri.path];
        }
        return [];
      });
      if (dir.length === 0) dir = [ENV_HOME];
    } else if (dirMode.type === "path" && dirMode.path.startsWith("/")) {
      dir = [dirMode.path];
    } else {
      dir = [ENV_HOME];
    }

    const query = getQueryFromSelection(editor, queryMode, "regex");

    rgQuery = {
      dir,
      query,
      cwd: commonPrefix(dir),
      ...getSearchMode(),
    };
  }

  return new RgPanel(rgQuery, editor, onReset);
}
