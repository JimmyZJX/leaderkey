import { dirname, normalize } from "path-browserify";
import { TextEditor, TextEditorDecorationType, window, workspace } from "vscode";
import {
  disableLeaderKey,
  enableLeaderKeyAndDisableVim,
  enableVim,
} from "../common/context";
import { Decoration, renderDecorations } from "../common/decoration";
import { assert, commonPrefix, log } from "../common/global";
import { createFile, ENV_HOME, openFile } from "../common/remote";
import { getRenderRangeFromTop, indicesToRender } from "../common/renderRange";
import { OneLineEditor as SingleLineEditor } from "../common/singleLineEditor";
import { stripSlash } from "../common/stripSlash";
import { FzfResultItem } from "../fzf-for-js/src/lib/main";
import { showDir } from "./dired";
import {
  dummyFzfResultItem,
  FindFileData,
  FindFileDataProvider,
  getFileFromDataIdx,
} from "./findFileDataProvider";

function RETisTAB() {
  const config = workspace.getConfiguration("leaderkey.find-file");
  return config.get("RETisTAB", false);
}

function nonHighlightChars(r: FzfResultItem<string>) {
  return [...r.item].map((c, i) => (r.positions.has(i) ? " " : c)).join("");
}
function highlightChars(r: FzfResultItem<string>) {
  return [...r.item].map((c, i) => (r.positions.has(i) ? c : " ")).join("");
}

type FindFileSelection =
  | { type: "none" }
  | { type: "file"; file: string; idx: number; data: FindFileData }
  | { type: "input" };

export type FindFileOptions = {
  projectRoot?: boolean;
  init?: string;
  dirOnly?: boolean;
  title?: string;
  returnOnly?: boolean;
  query?: string;
};

type TabCompletionAction =
  | { type: "selection"; value: string }
  | { type: "input" }
  | { type: "edit"; edit: () => void }
  | { type: "none" };

export class FindFilePanel {
  disposableDecos: TextEditorDecorationType[] = [];

  dir!: string;
  dirOnly: boolean;
  editor: SingleLineEditor;

  dataProvider: FindFileDataProvider;

  lastSelection: FindFileSelection = {
    type: "none",
  };

  title: string;
  returnOnly: boolean;

  isSelectionManuallyChanged: boolean;

  isQuit: boolean;
  onQuit: (path: string | undefined) => void;

  RETisTAB: boolean;

  constructor(options: FindFileOptions, onQuit: (path: string | undefined) => void) {
    enableLeaderKeyAndDisableVim(":findFile");
    this.RETisTAB = RETisTAB();
    this.onQuit = onQuit;
    this.isQuit = false;
    this.editor = new SingleLineEditor(options.query ?? "");
    this.dirOnly = options.dirOnly ?? false;
    this.returnOnly = options.returnOnly ?? false;
    this.title = options.title ?? "Find File";
    this.isSelectionManuallyChanged = false;
    this.dataProvider = undefined!; // initialized in setDir
    this.setDir(options.init ?? ENV_HOME, "keep");
  }

  setDir(dir: string, editor: "keep" | "reset" = "reset") {
    this.dir = normalize(dir.endsWith("/") ? dir : dir + "/");
    if (editor === "reset") {
      this.editor.reset("");
    }
    this.lastSelection = { type: "none" };
    this.isSelectionManuallyChanged = false;
    this.lastKey = undefined;

    if (this.dataProvider) {
      this.dataProvider.quit();
    }
    this.dataProvider = new FindFileDataProvider(
      this.dir,
      this.dirOnly ? "ls-only" : "ls-and-fzf",
      (_) => this.render(),
    );
    if (this.editor.value() !== "") {
      this.dataProvider.setQuery(this.editor.value());
    }
    this.render();
  }

  private tabCompletion(last: string | undefined): TabCompletionAction {
    if (this.lastSelection.type === "file") {
      const { file, data } = this.lastSelection;
      const length = data.items.length;
      if (last === "TAB" || this.isSelectionManuallyChanged || data.mode === "fzf") {
        return file !== "./" ? { type: "selection", value: file } : { type: "none" };
      }
      if (length === 1 && file.endsWith("/")) {
        // the only result is a directory
        return { type: "selection", value: file };
      }
      if (length > 0) {
        // extend text to the common prefix starting from end of last match
        const subStrs = data.items.map((r) => ({
          item: r.item,
          subStr: r.item.slice(Math.max(...r.positions) + 1),
        }));
        const common = commonPrefix(subStrs.map(({ subStr }) => subStr));
        if ((common === "" || common === "/") && length === 1) {
          // only one candidate and text matches to the end
          return { type: "selection", value: file };
        } else {
          const toAppend = stripSlash(common);
          return {
            type: "edit",
            edit: () => {
              this.editor.edit((lr) => {
                lr.l = lr.l + lr.r + toAppend;
                lr.r = "";
              });
            },
          };
        }
      }
    }
    if (this.lastSelection.type === "input") {
      return { type: "input" };
    }
    return { type: "none" };
  }

  private async open(basename: string, mode?: "forceCreate" | "ret") {
    if (mode === undefined && basename.endsWith("/")) {
      this.setDir(this.dir + basename);
    } else {
      const path = normalize(this.dir + basename);
      if (path.endsWith("/")) {
        await this.quit(path);
        if (!this.returnOnly) await showDir(path);
      } else {
        if (mode === "forceCreate") {
          await Promise.allSettled([createFile(path), this.quit(path)]);
        } else {
          await this.quit(path);
        }
        if (!this.returnOnly) await openFile(path, { preview: false });
      }
    }
  }

  private async keyActionTAB(last: string | undefined) {
    const r = this.tabCompletion(last);
    switch (r.type) {
      case "edit":
        r.edit();
        break;
      case "selection":
        await this.open(r.value);
        break;
      case "input":
        await this.open(this.editor.value());
        break;
      case "none":
        break;
      default: {
        const _: never = r;
      }
    }
  }

  private async keyActionRET() {
    switch (this.lastSelection.type) {
      case "file":
        if (this.RETisTAB) {
          await this.keyActionTAB("TAB");
        } else {
          await this.open(this.lastSelection.file, "ret");
        }
        break;
      case "input":
      case "none":
        await this.open(this.editor.value(), "forceCreate");
    }
  }

  private keyActions: {
    [key: string]: (last: string | undefined) => void | Promise<void>;
  } = {
    ESC: async () => await this.quit(),
    "C-/": () => {
      this.editor.insert("/");
    },
    "/": async () => {
      const isCursorAtEnd = this.editor.edit((lr) => lr.r === "");
      if (!isCursorAtEnd) {
        this.editor.insert("/");
        return;
      }
      if (
        this.lastSelection.type === "file" &&
        this.lastSelection.file !== "./" &&
        this.lastSelection.file.endsWith("/")
      ) {
        await this.open(this.lastSelection.file);
      } else {
        const input = this.editor.value();
        if (input.startsWith("/") && this.lastSelection.type !== "input") {
          this.setDir(input);
        } else {
          this.editor.insert("/");
        }
      }
    },
    "~": () => {
      if (this.editor.value() === "") this.setDir(ENV_HOME + "/");
      else this.editor.insert("~");
    },
    SPC: () => {
      this.editor.insert(" ");
    },
    "S-RET": async () => await this.open(this.editor.value(), "forceCreate"),
    "C-RET": async () => await this.open(this.editor.value(), "forceCreate"),
    RET: async () => await this.keyActionRET(),
    "C-l": async () => await this.keyActionRET(),
    TAB: async (last) => await this.keyActionTAB(last),
    "C-j": () => this.moveSelection(1),
    "<down>": () => this.moveSelection(1),
    "C-k": () => this.moveSelection(-1),
    "<up>": () => this.moveSelection(-1),
    "C-d": () => this.moveSelection(8),
    "C-u": () => this.moveSelection(-8),
    "<pagedown>": () => this.moveSelection(15),
    "<pageup>": () => this.moveSelection(-15),
    "C-h": () => this.setDir(dirname(this.dir), "keep"),
    "C-<backspace>": () => {
      if (this.editor.value().length > 0) {
        this.editor.tryKey("C-<backspace>");
      } else {
        this.setDir(dirname(this.dir));
      }
    },
    "<backspace>": () => {
      if (this.editor.value().length > 0) {
        this.editor.edit((lr) => (lr.l = lr.l.slice(0, -1)));
      } else {
        this.setDir(dirname(this.dir));
      }
    },
  };

  lastKey: string | undefined;

  public async onKey(key: string) {
    const last = this.lastKey;
    this.lastKey = key;

    const lastInput = this.editor.value();

    const keyAction = this.keyActions[key];
    if (keyAction) {
      await keyAction(last);
    } else if ((await this.editor.tryKey(key)) === "handled") {
      // handled by editor
    } else {
      log(`find-file: unknown key ${key} (last=${last})`);
    }
    if (this.editor.value() !== lastInput) {
      this.dataProvider.setQuery(this.editor.value());
    }
    this.render();
  }

  private getCurResults() {
    return this.dataProvider.getCurResults();
  }

  private moveSelection(delta: number) {
    this.isSelectionManuallyChanged = true;
    const { type } = this.lastSelection;
    if (
      delta === -1 &&
      (type === "none" || (type === "file" && this.lastSelection.idx === 0))
    ) {
      // move upward to select input
      this.lastSelection = { type: "input" };
    } else if ((delta === 1 && type === "input") || type === "none") {
      // move downward from input; same when no selections was selected before
      // somehow
      const curResults = this.getCurResults();
      if (curResults === undefined || curResults.items.length === 0) {
        this.lastSelection = { type: "none" };
      } else {
        const file = getFileFromDataIdx(curResults, 0);
        this.lastSelection = { type: "file", file, idx: 0, data: curResults };
      }
    } else if (type === "file") {
      const { idx, file: _ } = this.lastSelection;
      const curResults = this.getCurResults();
      if (curResults === undefined || curResults.items.length === 0) {
        this.lastSelection = { type: "none" };
      } else {
        const newIdx =
          delta > 0
            ? Math.min(curResults.items.length - 1, idx + delta)
            : Math.max(0, idx + delta);
        const file = getFileFromDataIdx(curResults, newIdx);
        this.lastSelection = { type: "file", file, idx: newIdx, data: curResults };
      }
    }
    this.render();
  }

  static RENDER_DIR_LEN = 70;

  private static renderDir(dir: string) {
    if (dir.length < this.RENDER_DIR_LEN || !dir.includes("/")) return dir;
    const parts = dir.split("/");
    // get minimum part suffix whose sum of lengths is shorter than this.RENDER_DIR_LEN
    let sum = 0;
    for (let i = parts.length - 1; i >= 0; i--) {
      sum += parts[i].length + 1;
      if (i < parts.length - 1 && sum > this.RENDER_DIR_LEN) {
        return ".../" + parts.slice(i + 1).join("/");
      }
    }
    window.showWarningMessage(
      `Unexpected: failed to shorten dir: ${dir} with length limit ${this.RENDER_DIR_LEN}`,
    );
    return dir;
  }

  private static renderLogic({
    curResults,
    isSelectionManuallyChanged,
    lastSelection,
  }: {
    curResults: FindFileData | undefined;
    isSelectionManuallyChanged: boolean;
    lastSelection: FindFileSelection;
  }): {
    newSelection: FindFileSelection;
    renderStart: number;
    toRender: FzfResultItem<string>[];
  } {
    if (curResults === undefined || curResults.items.length === 0) {
      let toRender: FzfResultItem<string>[] = [];
      if (curResults === undefined) {
        toRender = [dummyFzfResultItem("<loading...>")];
      } else if (curResults.mode === "fzf" && curResults.reading === true) {
        toRender = [dummyFzfResultItem("<fzf loading...>")];
      }

      return {
        newSelection: lastSelection.type === "input" ? lastSelection : { type: "none" },
        renderStart: 0,
        toRender,
      };
    }

    let focusIdx: number;
    let newSelection: FindFileSelection;
    if (lastSelection.type === "none") {
      newSelection = {
        type: "file",
        file: getFileFromDataIdx(curResults, 0),
        idx: 0,
        data: curResults,
      };
      focusIdx = 0;
    } else if (lastSelection.type === "file") {
      if (curResults.mode === "ls" && isSelectionManuallyChanged) {
        // follow user selection
        const file = lastSelection.file;
        focusIdx = Math.max(
          0,
          curResults.items.findIndex(
            (_r, i) => getFileFromDataIdx(curResults, i) === file,
          ),
        );
      } else {
        // don't move selection if never manually changed, or is fzf mode
        focusIdx = lastSelection.idx;
      }
      newSelection = {
        type: "file",
        file: getFileFromDataIdx(curResults, focusIdx),
        idx: focusIdx,
        data: curResults,
      };
    } else {
      assert(lastSelection.type === "input");
      newSelection = lastSelection;
      focusIdx = 0;
    }

    const { start, len } = indicesToRender({
      length: curResults.items.length,
      focus: focusIdx,
    });
    const toRender = // identical for fzf and ls, just to make type checker happy
      curResults.mode === "fzf"
        ? curResults.items.slice(start, start + len).map(curResults.render)
        : curResults.items.slice(start, start + len).map(curResults.render);
    return { newSelection, renderStart: start, toRender };
  }

  private doRender(editor: TextEditor) {
    const curResults = this.getCurResults();
    const { newSelection, renderStart, toRender } = FindFilePanel.renderLogic({
      curResults,
      lastSelection: this.lastSelection,
      isSelectionManuallyChanged: this.isSelectionManuallyChanged,
    });
    this.lastSelection = newSelection;

    const fileListFiles = toRender
      .map((r) => (r.item.endsWith("/") ? "" : nonHighlightChars(r)))
      .join("\n");
    const fileListDirs = toRender
      .map((r) => (r.item.endsWith("/") ? nonHighlightChars(r) : ""))
      .join("\n");
    const fileListHighlight = toRender.map(highlightChars).join("\n");

    const counterInfo = `${curResults?.filtered ?? 0}/${curResults?.total ?? 0}`;

    const inputPostfix =
      newSelection.type === "input" || curResults?.filtered === 0
        ? "   (" +
          "RET" +
          " to create " +
          (this.editor.value().slice(1, -1).includes("/") ? "dir and " : "") +
          "file)"
        : "";

    const dirEllipsis = FindFilePanel.renderDir(this.dir);

    const tabCompletion = this.tabCompletion(this.lastKey);
    const tabCompletionIndicator =
      tabCompletion.type === "selection"
        ? curResults?.mode === "fzf"
          ? "[fzf mode]"
          : `→ ${tabCompletion.value}`
        : "";
    const inputLen = this.editor.value().length;
    const inputDecos: Decoration[] = [
      { type: "text", foreground: "binding", text: dirEllipsis, lineOffset: 1 },
      ...this.editor.render({
        char: dirEllipsis.length,
        line: 1,
        postfix: inputPostfix,
      }),
      {
        type: "text",
        text: tabCompletionIndicator,
        lineOffset: 1,
        foreground: "dim",
        charOffset: dirEllipsis.length + inputLen + 2,
      },
    ];

    /* layout:
       -------- top border --------
       header
       dir + input + tabCompletion preview
       selections
       ... (highlighted selection)
       bottom border
       -------- top border -------- */

    const decos: Decoration[] = [
      // overall background
      { type: "background", lines: toRender.length + 2 },
      // header
      {
        type: "text",
        text: `${counterInfo.padEnd(10)} ${this.title}`,
        foreground: "binding",
      },
      // top border
      {
        type: "background",
        background: "border",
        lines: 0.5,
        lineOffset: -0.5,
      },
      // bottom border
      {
        type: "background",
        background: "border",
        lines: 0.5,
        lineOffset: toRender.length + 2,
      },
      // dir and input
      ...inputDecos,
      // selections
      { type: "text", foreground: "dir", text: fileListDirs, lineOffset: 2 },
      { type: "text", foreground: "command", text: fileListFiles, lineOffset: 2 },
      { type: "text", foreground: "highlight", text: fileListHighlight, lineOffset: 2 },
    ];
    switch (newSelection.type) {
      case "none":
        break;
      case "file":
        decos.push({
          type: "background",
          background: "header",
          lines: 1,
          lineOffset: newSelection.idx - renderStart + 2,
          zOffset: 1,
        });
        break;
      case "input":
        decos.push({
          type: "background",
          background: "header",
          lines: 1,
          lineOffset: 1,
          zOffset: 1,
        });
    }

    const range = getRenderRangeFromTop(editor, toRender.length + 2);
    return renderDecorations(decos, editor, range);
  }

  public render() {
    if (this.isQuit) return;
    const oldDisposables = this.disposableDecos;
    try {
      const editor = window.activeTextEditor;
      this.disposableDecos = editor === undefined ? [] : this.doRender(editor);
    } finally {
      for (const dsp of oldDisposables) dsp.dispose();
    }
  }

  public async quit(path?: string) {
    if (this.isQuit) return;
    this.isQuit = true;
    this.dataProvider.quit();
    for (const dsp of this.disposableDecos) dsp.dispose();
    this.disposableDecos = [];
    await disableLeaderKey();
    await enableVim();
    this.onQuit(path);
  }
}
