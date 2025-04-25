// init: check if remote extension is available

import { dirname, normalize } from "path-browserify";
import { TextEditor, TextEditorDecorationType, window, workspace } from "vscode";
import {
  disableLeaderKey,
  enableLeaderKeyAndDisableVim,
  enableVim,
} from "../common/context";
import { Decoration, renderDecorations } from "../common/decoration";
import { assert, commonPrefix, log } from "../common/global";
import { createFile, ENV_HOME, openFile, readDirFilesAndDirs } from "../common/remote";
import { getRenderRangeFromTop, indicesToRender } from "../common/renderRange";
import { OneLineEditor as SingleLineEditor } from "../common/singleLineEditor";
import { byLengthAsc, byStartAsc, Fzf, FzfResultItem } from "../fzf-for-js/src/lib/main";
import { showDir } from "./dired";

const RE_TRAILING_SLASH = /\/$/;
function stripSlash(basename: string) {
  return basename.replace(RE_TRAILING_SLASH, "");
}

function RETisTAB() {
  const config = workspace.getConfiguration("leaderkey.find-file");
  return config.get("RETisTAB", false);
}

async function ls(dir: string, dirOnly: boolean) {
  const filesAndDirs = await readDirFilesAndDirs(dir);
  let dirs = filesAndDirs.dirs;
  const dotAndDotDot = ["./", ...(dir.length > 1 ? ["../"] : [])];
  dirs = [...dotAndDotDot, ...dirs.map((dir) => dir + "/")];
  if (dirOnly) return dirs;
  return [...dirs, ...filesAndDirs.files];
}

function dummyFzfResultItem(item: string): FzfResultItem {
  return {
    item,
    positions: new Set(),
    start: 0,
    end: 0,
    score: 0,
  };
}
function nonHighlightChars(r: FzfResultItem<string>) {
  return [...r.item].map((c, i) => (r.positions.has(i) ? " " : c)).join("");
}
function highlightChars(r: FzfResultItem<string>) {
  return [...r.item].map((c, i) => (r.positions.has(i) ? c : " ")).join("");
}

type FindFileSelection =
  | { type: "none" }
  | { type: "file"; file: string; idx: number }
  | { type: "input" };

export type FindFileOptions = {
  init?: string;
  dirOnly?: boolean;
  title?: string;
  returnOnly?: boolean;
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
  filesPromise!: Promise<any>;
  files!: string[] | undefined;
  lastFzfResults: FzfResultItem<string>[] = [];
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
    this.editor = new SingleLineEditor("");
    this.dirOnly = options.dirOnly ?? false;
    this.returnOnly = options.returnOnly ?? false;
    this.title = options.title ?? "Find File";
    this.isSelectionManuallyChanged = false;
    this.setDir(options.init ?? ENV_HOME);
  }

  setDir(dir: string) {
    this.dir = normalize(dir.endsWith("/") ? dir : dir + "/");
    this.editor.reset("");
    this.lastSelection = { type: "none" };
    this.isSelectionManuallyChanged = false;
    this.lastKey = undefined;
    const promise = ls(dir, this.dirOnly);
    this.files = undefined;
    this.filesPromise = promise;
    promise.then((files) => {
      if (this.filesPromise === promise) {
        this.files = files;
        this.render();
      }
    });
  }

  lastKey: string | undefined;

  private tabCompletion(last: string | undefined): TabCompletionAction {
    if (this.lastSelection.type === "file") {
      const file = this.lastSelection.file;
      if (last === "TAB" || this.isSelectionManuallyChanged) {
        return file !== "./" ? { type: "selection", value: file } : { type: "none" };
      }
      if (this.lastFzfResults.length === 1 && file.endsWith("/")) {
        // the only result is a directory
        return { type: "selection", value: file };
      }
      if (this.lastFzfResults.length > 0) {
        // extend text to the common prefix starting from end of last match
        assert(this.lastFzfResults.length > 0);
        const subStrs = this.lastFzfResults.map((r) => ({
          item: r.item,
          subStr: r.item.slice(Math.max(...r.positions) + 1),
        }));
        const common = commonPrefix(subStrs.map(({ subStr }) => subStr));
        if ((common === "" || common === "/") && this.lastFzfResults.length === 1) {
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
        await this.open(this.lastSelection.file, "ret");
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
    RET: async (last) => {
      if (this.RETisTAB) {
        await this.keyActionTAB(last);
      } else {
        await this.keyActionRET();
      }
    },
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
    "C-h": () => this.setDir(dirname(this.dir)),
    "C-<backspace>": () => {
      if (this.editor.value().length > 0) {
        this.editor.reset("");
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

  public async onKey(key: string) {
    const last = this.lastKey;
    this.lastKey = key;

    const keyAction = this.keyActions[key];
    if (keyAction) {
      await keyAction(last);
    } else if ((await this.editor.tryKey(key)) === "handled") {
      // handled by editor
    } else {
      log(`find-file: unknown key ${key} (last=${last})`);
    }
    this.render();
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
      // move downward from input; same when no selections was selected before somehow
      if (this.lastFzfResults.length > 0) {
        this.lastSelection = { type: "file", file: this.lastFzfResults[0].item, idx: 0 };
      } else {
        this.lastSelection = { type: "none" };
      }
    } else if (type === "file") {
      const { idx, file: _ } = this.lastSelection;
      const newIdx =
        delta > 0
          ? Math.min(this.lastFzfResults.length - 1, idx + delta)
          : Math.max(0, idx + delta);
      this.lastSelection = {
        type: "file",
        file: this.lastFzfResults[newIdx].item,
        idx: newIdx,
      };
    }
    if (this.lastSelection) {
      this.render();
    }
  }

  private doRender(editor: TextEditor) {
    const {
      renderedLines,
      newSelection,
      fzfResults,
    }: {
      renderedLines: { start: number; len: number };
      newSelection: FindFileSelection;
      fzfResults: FzfResultItem<string>[];
    } =
      this.files !== undefined
        ? FindFilePanel.recompute({
            ...this,
            input: this.editor.value(),
            files: this.files,
          })
        : {
            renderedLines: { start: 0, len: 1 },
            newSelection: { type: "none" },
            fzfResults: [dummyFzfResultItem("<loading...>")],
          };
    this.lastFzfResults = fzfResults;
    this.lastSelection = newSelection;

    const toRender = fzfResults.slice(
      renderedLines.start,
      renderedLines.start + renderedLines.len,
    );

    const fileListFiles = toRender
      .map((r) => (r.item.endsWith("/") ? "" : nonHighlightChars(r)))
      .join("\n");
    const fileListDirs = toRender
      .map((r) => (r.item.endsWith("/") ? nonHighlightChars(r) : ""))
      .join("\n");
    const fileListHighlight = toRender.map(highlightChars).join("\n");

    const counterInfo =
      this.files === undefined
        ? "0/0"
        : `${this.lastFzfResults.length}/${this.files.length}`;

    const inputPostfix =
      newSelection.type === "input" ||
      (this.files !== undefined &&
        (this.files.length === 0 || this.lastFzfResults.length === 0))
        ? "   (RET to create " +
          (this.editor.value().slice(1, -1).includes("/") ? "dir and " : "") +
          "file)"
        : "";

    const tabCompletion = this.tabCompletion(this.lastKey);
    const tabCompletionIndicator =
      tabCompletion.type === "selection" ? `→ ${tabCompletion.value}` : "";
    const inputLen = this.editor.value().length;
    const inputDecos: Decoration[] = [
      ...this.editor.render({
        char: this.dir.length,
        line: 1,
        postfix: inputPostfix,
      }),
      {
        type: "text",
        text: tabCompletionIndicator,
        lineOffset: 1,
        foreground: "dim",
        charOffset: this.dir.length + inputLen + 2,
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
      { type: "background", lines: renderedLines.len + 2 },
      // header
      {
        type: "text",
        text: `${counterInfo.padEnd(7)} ${this.title}`,
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
        lineOffset: renderedLines.len + 2,
      },
      // dir
      { type: "text", foreground: "binding", text: this.dir, lineOffset: 1 },
      // input
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
          lineOffset: newSelection.idx - renderedLines.start + 2,
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

    const range = getRenderRangeFromTop(editor, renderedLines.len + 2);
    return renderDecorations(decos, editor, range);
  }

  private static recompute(args: {
    files: string[];
    input: string;
    isSelectionManuallyChanged: boolean;
    lastSelection: FindFileSelection;
  }): {
    fzfResults: FzfResultItem<string>[];
    newSelection: FindFileSelection;
    renderedLines: { start: number; len: number };
  } {
    const { files, input, isSelectionManuallyChanged, lastSelection } = args;

    let fzfResults: FzfResultItem<string>[] = [];
    if (input === "") {
      fzfResults = files.map(dummyFzfResultItem);
    } else {
      const dirs = new Set(files.filter((f) => f.endsWith("/")).map(stripSlash));
      fzfResults = new Fzf(files.map(stripSlash), {
        tiebreakers: [byStartAsc, byLengthAsc],
      })
        .find(input)
        .map((r) => (dirs.has(r.item) ? { ...r, item: r.item + "/" } : r));
    }

    if (fzfResults.length === 0) {
      return {
        fzfResults,
        renderedLines: { start: 0, len: 0 },
        newSelection: lastSelection.type === "input" ? lastSelection : { type: "none" },
      };
    } else {
      let focusIdx: number;
      let newSelection: FindFileSelection;
      if (lastSelection.type === "none") {
        newSelection = {
          type: "file",
          file: fzfResults[0].item,
          idx: 0,
        };
        focusIdx = 0;
      } else if (lastSelection.type === "file") {
        if (isSelectionManuallyChanged) {
          // follow user selection
          const file = lastSelection.file;
          focusIdx = Math.max(
            0,
            fzfResults.findIndex((r) => r.item === file),
          );
        } else {
          // use the best fzf match if selection is never manually changed
          focusIdx = 0;
        }
        newSelection = {
          type: "file",
          file: fzfResults[focusIdx].item,
          idx: focusIdx,
        };
      } else {
        assert(lastSelection.type === "input");
        newSelection = lastSelection;
        focusIdx = 0;
      }

      const renderedLines = indicesToRender({
        length: fzfResults.length,
        focus: focusIdx,
      });
      return { fzfResults, newSelection, renderedLines };
    }
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
    for (const dsp of this.disposableDecos) dsp.dispose();
    this.disposableDecos = [];
    await disableLeaderKey();
    await enableVim();
    this.onQuit(path);
  }
}
