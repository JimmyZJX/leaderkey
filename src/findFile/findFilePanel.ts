// init: check if remote extension is available

import { dirname, normalize } from "path-browserify";
import { commands, TextEditor, TextEditorDecorationType, window } from "vscode";
import { Decoration, renderDecorations } from "../common/decoration";
import { assert, commonPrefix, log, WHICHKEY_STATE } from "../common/global";
import { ENV_HOME, openFile, runProcess } from "../common/remote";
import { getRenderRangeFromTop, indicesToRender } from "../common/renderRange";
import { OneLineEditor as SingleLineEditor } from "../common/singleLineEditor";
import { byLengthAsc, byStartAsc, Fzf, FzfResultItem } from "../fzf-for-js/src/lib/main";
import { showDir } from "./dired";

const RE_TRAILING_SLASH = /\/$/;
function stripSlash(basename: string) {
  return basename.replace(RE_TRAILING_SLASH, "");
}

async function ls(dir: string) {
  // a: all, p: append slash, H: follow link for input
  const result = await runProcess("/bin/ls", ["-apH", "--file-type", dir]);
  if (result.error) {
    window.showErrorMessage(`Failed to ls: ${JSON.stringify(result)}`);
    // TODO consider quit?
    return [];
  } else {
    const all = result.stdout.trim().split("\n");
    const dirs: string[] = [],
      files: string[] = [];
    for (const e of all) {
      switch (e.at(-1)) {
        case "@":
          dirs.push(e.slice(0, -1) + "/");
          break;
        case "/":
          dirs.push(e);
          break;
        default:
          files.push(e.replace(/[=>|*]$/, ""));
      }
    }
    return [...dirs, ...files];
  }
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

export class FindFilePanel {
  disposableDecos: TextEditorDecorationType[] = [];

  dir!: string;
  editor: SingleLineEditor;
  filesPromise!: Promise<any>;
  files!: string[] | undefined;
  lastFzfResults: FzfResultItem<string>[] = [];
  lastSelection: FindFileSelection = {
    type: "none",
  };

  isSelectionManuallyChanged: boolean;
  isShowing: boolean;

  onReset: () => void;

  constructor(dir: string, onReset: () => void) {
    this.onReset = onReset;
    this.isShowing = false;
    this.editor = new SingleLineEditor("");
    this.setDir(dir);
    this.isSelectionManuallyChanged = false;
  }

  setDir(dir: string) {
    this.dir = normalize(dir.endsWith("/") ? dir : dir + "/");
    this.editor.reset("");
    this.lastSelection = { type: "none" };
    this.isSelectionManuallyChanged = false;
    const promise = ls(dir);
    this.files = undefined;
    this.filesPromise = promise;
    promise.then((files) => {
      if (this.filesPromise === promise) {
        this.files = files;
        if (this.isShowing) this.render();
      }
    });
  }

  lastKey: string | undefined;

  private async open(basename: string, mode?: "forceCreate" | "ret") {
    if (mode === undefined && basename.endsWith("/")) {
      this.setDir(this.dir + basename);
    } else {
      // TODO return value to promise
      const path = normalize(this.dir + basename);
      if (path.endsWith("/")) {
        await this.reset();
        await showDir(path);
      } else {
        if (mode === "forceCreate") {
          await Promise.allSettled([
            (async () => {
              await runProcess("/bin/mkdir", ["-p", dirname(path)]);
              await runProcess("/bin/touch", ["-a", path]);
            })(),
            this.reset(),
          ]);
        }
        await openFile(path, { preview: false });
        await this.reset();
      }
    }
  }

  // TODO left/right arrow

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
    ESC: async () => await this.reset(),
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
    RET: async () => this.keyActionRET(),
    "C-l": async () => this.keyActionRET(),
    TAB: async (last) => {
      // TODO immediately select if selection has changed?
      if (this.lastSelection.type === "file") {
        const file = this.lastSelection.file;
        if (last === "TAB") {
          if (file !== "./") {
            await this.open(file);
          }
        } else if (this.lastFzfResults.length === 1 && file.endsWith("/")) {
          // the only result is a directory
          await this.open(file);
        } else if (this.lastFzfResults.length > 0) {
          // extend text to the common prefix starting from end of last match
          assert(this.lastFzfResults.length > 0);
          const subStrs = this.lastFzfResults.map((r) => ({
            item: r.item,
            subStr: r.item.slice(Math.max(...r.positions) + 1),
          }));
          const common = commonPrefix(subStrs.map(({ subStr }) => subStr));
          if ((common === "" || common === "/") && this.lastFzfResults.length === 1) {
            // only one candidate and text matches to the end
            await this.open(file);
          } else {
            this.editor.insert(stripSlash(common));
          }
        }
      } else if (this.lastSelection.type === "input") {
        await this.open(this.editor.value());
      }
    },
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
  // TODO implement <left> <right> and C-<left> C-<right>

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
    if (this.isShowing) this.render();
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
    const inputDeco = this.editor.render({
      char: this.dir.length,
      line: 1,
      postfix: inputPostfix,
    });

    /* layout:
       -------- top border --------
       header
       dir + input█
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
        text: `${counterInfo.padEnd(7)} Find file`,
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
      ...inputDeco,
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
    this.isShowing = true;
    const oldDisposables = this.disposableDecos;
    try {
      commands.executeCommand("_setContext", WHICHKEY_STATE, ":findFile");
      commands.executeCommand("_setContext", "inDebugRepl", true);
      const editor = window.activeTextEditor;
      this.disposableDecos = editor === undefined ? [] : this.doRender(editor);
    } finally {
      for (const dsp of oldDisposables) dsp.dispose();
    }
  }

  public async reset() {
    log("findFile: reset");
    for (const dsp of this.disposableDecos) dsp.dispose();
    this.disposableDecos = [];
    this.isShowing = false;
    this.onReset();
    await commands.executeCommand("_setContext", WHICHKEY_STATE, "");
    await commands.executeCommand("_setContext", "inDebugRepl", false);
  }
}
