// init: check if remote extension is available

import { dirname, normalize } from "path-browserify";
import { commands, env, Range, TextEditorDecorationType, window } from "vscode";
import { assert, commonPrefix, log, WHICHKEY_STATE } from "../common/global";
import { ENV_HOME, openFile, runProcess } from "../common/remote";
import { byLengthAsc, byStartAsc, Fzf, FzfResultItem } from "../fzf-for-js/src/lib/main";
import {
  Decoration,
  renderDecorations,
  stickyScrollMaxRows,
} from "../leaderkey/decoration";
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

const NUM_ABOVE_OR_BELOW = 10;
const NUM_TOTAL = NUM_ABOVE_OR_BELOW * 2 + 1;

type FindFileSelection =
  | { type: "none" }
  | { type: "file"; file: string; idx: number }
  | { type: "input" };

export class FindFilePanel {
  disposableDecos: TextEditorDecorationType[] = [];

  dir!: string;
  input: string;
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
    this.setDir(dir);
    this.input = "";
    this.isSelectionManuallyChanged = false;
  }

  setDir(dir: string) {
    this.dir = normalize(dir.endsWith("/") ? dir : dir + "/");
    this.input = "";
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
        await this.open(this.input, "forceCreate");
    }
  }
  private async pasteAction() {
    this.input += (await env.clipboard.readText()).replaceAll("\n", "");
  }

  private keyActions: {
    [key: string]: (last: string | undefined) => void | Promise<void>;
  } = {
    ESC: async () => await this.reset(),
    "C-/": () => {
      this.input += "/";
    },
    "/": async () => {
      if (
        this.lastSelection.type === "file" &&
        this.lastSelection.file !== "./" &&
        this.lastSelection.file.endsWith("/")
      ) {
        await this.open(this.lastSelection.file);
      } else {
        if (this.input.startsWith("/") && this.lastSelection.type !== "input") {
          this.setDir(this.input);
        } else {
          this.input += "/";
        }
      }
    },
    "~": () => {
      if (this.input === "") this.setDir(ENV_HOME + "/");
      else this.input += "~";
    },
    SPC: () => {
      this.input += " ";
    },
    "S-RET": async () => await this.open(this.input, "forceCreate"),
    "C-RET": async () => await this.open(this.input, "forceCreate"),
    RET: async () => this.keyActionRET(),
    "C-l": async () => this.keyActionRET(),
    TAB: async (last) => {
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
            this.input += stripSlash(common);
          }
        }
      } else if (this.lastSelection.type === "input") {
        await this.open(this.input);
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
      if (this.input.length > 0) {
        this.input = "";
      } else {
        this.setDir(dirname(this.dir));
      }
    },
    "<backspace>": () => {
      if (this.input.length > 0) {
        this.input = this.input.slice(0, this.input.length - 1);
      } else {
        this.setDir(dirname(this.dir));
      }
    },
    "C-y": () => this.pasteAction(),
    "C-v": () => this.pasteAction(),
  };

  public async onkey(key: string) {
    const last = this.lastKey;
    this.lastKey = key;

    const keyAction = this.keyActions[key];
    if (keyAction) {
      await keyAction(last);
    } else if (key.length === 1) {
      this.input += key;
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
      const { idx, file } = this.lastSelection;
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

  private doRender() {
    const editor = window.activeTextEditor;
    if (editor === undefined) return [];

    const visibleRange = editor.visibleRanges[0];
    let lnHeader =
      visibleRange.start.line +
      Math.min(
        stickyScrollMaxRows,
        (visibleRange.end.line - visibleRange.start.line) >> 1,
      );

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

    const inputText =
      " ".repeat(this.dir.length) +
      this.input +
      "█" +
      (newSelection.type === "input" ||
      (this.files !== undefined &&
        (this.files.length === 0 || this.lastFzfResults.length === 0))
        ? "   (RET to create " +
          (this.input.slice(1, -1).includes("/") ? "dir and " : "") +
          "file)"
        : "");

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
      {
        type: "text",
        foreground: "command",
        text: inputText,
        lineOffset: 1,
      },
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

    const doc = editor.document;
    const docLines = doc.lineCount;
    // fix header to be at least on the 2nd last line
    lnHeader = Math.max(0, Math.min(docLines - 2, lnHeader));
    const lnEnd = Math.min(docLines - 1, lnHeader + renderedLines.len);
    const overallRange = new Range(
      doc.lineAt(lnHeader).range.start,
      doc.lineAt(lnEnd).range.end,
    );
    return renderDecorations(decos, editor, overallRange);
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

      const numResults = fzfResults.length;
      let renderFrom = Math.max(0, focusIdx - NUM_ABOVE_OR_BELOW),
        renderTo = Math.min(numResults, focusIdx + NUM_ABOVE_OR_BELOW + 1);

      // try extend upward
      if (renderTo - renderFrom < NUM_TOTAL && renderFrom > 0) {
        renderFrom = Math.max(0, renderTo - NUM_TOTAL);
      }
      // try extend downward
      if (renderTo - renderFrom < NUM_TOTAL && renderTo < numResults) {
        renderTo = Math.min(numResults, renderFrom + NUM_TOTAL);
      }

      return {
        fzfResults,
        newSelection,
        renderedLines: { start: renderFrom, len: renderTo - renderFrom },
      };
    }
  }

  public render() {
    this.isShowing = true;
    const oldDisposables = this.disposableDecos;
    try {
      commands.executeCommand("_setContext", WHICHKEY_STATE, ":findFile");
      commands.executeCommand("_setContext", "inDebugRepl", true);
      this.disposableDecos = this.doRender();
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
