// init: check if remote extension is available

import { dirname, normalize } from "path-browserify";
import { commands, Range, TextEditorDecorationType, Uri, window } from "vscode";
import { byLengthAsc, byStartAsc, Fzf, FzfResultItem } from "../fzf-for-js/src/lib/main";
import { assert, log, WHICHKEY_STATE } from "../global";
import {
  Decoration,
  renderDecorations,
  stickyScrollMaxRows,
} from "../leaderkey/decoration";
import { ProcessRunResult, runProcess } from "../remote";
import { showDir } from "./dired";

const RE_TRAILING_SLASH = /\/$/;
function stripSlash(basename: string) {
  return basename.replace(RE_TRAILING_SLASH, "");
}

async function ls(dir: string) {
  const result = await runProcess("/bin/ls", ["-a", "-p", dir]);
  if (result.error) {
    window.showErrorMessage(`Failed to ls: ${JSON.stringify(result)}`);
    // TODO consider quit?
    return [];
  } else {
    const filesAndDirs = result.stdout
      .trim()
      .split("\n")
      .sort((a, b) => stripSlash(a).localeCompare(stripSlash(b)));
    return [
      ...filesAndDirs.filter((f) => f.endsWith("/")),
      ...filesAndDirs.filter((f) => !f.endsWith("/")),
    ];
  }
}

let ENV_HOME = "/";
(async () => {
  const result: ProcessRunResult = await commands.executeCommand(
    "remote-commons.process.run",
    "/bin/bash",
    ["-c", "echo ~"],
  );
  if (result.error) {
    window.showErrorMessage(`Failed to run bash? ${JSON.stringify(result)}`);
  } else {
    ENV_HOME = result.stdout.trim();
    log(`Got ENV_HOME=${ENV_HOME}`);
  }
})();

const NUM_ABOVE_OR_BELOW = 10;
const NUM_TOTAL = NUM_ABOVE_OR_BELOW * 2 + 1;

export class FindFilePanel {
  disposableDecos: TextEditorDecorationType[] = [];

  dir!: string;
  basename: string;
  filesPromise!: Promise<any>;
  files!: string[] | undefined;
  lastSelections: string[] = [];
  lastFzfResults: FzfResultItem<string>[] = [];
  // TODO remove [lastSelection]?
  lastSelection: string | undefined;

  isShowing: boolean;

  onReset: () => void;

  constructor(dir: string, onReset: () => void) {
    this.onReset = onReset;
    this.isShowing = false;
    this.setDir(dir);
    this.basename = "";
  }

  setDir(dir: string) {
    this.dir = normalize(dir.endsWith("/") ? dir : dir + "/");
    this.basename = "";
    this.lastSelection = undefined;
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

  private async open(basename: string, ret?: "ret" | "ret-selection") {
    if (ret === undefined && basename.endsWith("/")) {
      this.setDir(this.dir + basename);
    } else {
      // TODO return value to promise
      const path = normalize(this.dir + basename);
      if (path.endsWith("/")) {
        showDir(path);
        await this.reset();
      } else {
        const file = Uri.file(path);
        await this.reset();
        await window.showTextDocument(file, { preview: false });
      }
    }
  }

  private static commonPrefix(strs: string[]) {
    if (!strs[0] || strs.length == 1) return strs[0] || "";
    let i = 0;
    while (strs[0][i] && strs.every((w) => w[i] === strs[0][i])) i++;
    return strs[0].slice(0, i);
  }

  // TODO left/right arrow
  // TODO C-v C-y

  private async keyActionRET() {
    if (this.lastSelection) {
      await this.open(this.lastSelection, "ret-selection");
    } else {
      await this.open(this.basename, "ret");
    }
  }

  private keyActions: {
    [key: string]: (last: string | undefined) => void | Promise<void>;
  } = {
    ESC: async () => await this.reset(),
    "/": async () => {
      if (
        this.lastSelection &&
        this.lastSelection !== "./" &&
        this.lastSelection.endsWith("/")
      ) {
        await this.open(this.lastSelection);
      } else {
        if (this.basename.startsWith("/")) {
          this.setDir(this.basename);
        } else {
          this.basename += "/";
        }
      }
    },
    "~": () => {
      if (this.basename === "") this.setDir(ENV_HOME + "/");
      else this.basename += "~";
    },
    SPC: () => {
      this.basename += " ";
    },
    RET: async () => this.keyActionRET(),
    "C-l": async () => this.keyActionRET(),
    TAB: async (last) => {
      if (this.lastSelection) {
        if (
          (this.lastSelections.length === 1 && this.lastSelection.endsWith("/")) ||
          last === "TAB"
        ) {
          await this.open(this.lastSelection);
        } else if (this.lastSelections.length > 1) {
          // extend text to the common prefix starting from end of last match
          assert(this.lastFzfResults.length > 1);
          const subStrs = this.lastFzfResults.map((r) => ({
            item: r.item,
            subStr: r.item.slice(Math.max(...r.positions) + 1),
          }));
          const common = FindFilePanel.commonPrefix(subStrs.map(({ subStr }) => subStr));
          this.basename += stripSlash(common);
        }
      }
    },
    "C-j": () => this.moveSelection(1),
    "C-k": () => this.moveSelection(-1),
    "C-d": () => this.moveSelection(8),
    "C-u": () => this.moveSelection(-8),
    "<pagedown>": () => this.moveSelection(15),
    "<pageup>": () => this.moveSelection(-15),
    "C-h": () => this.setDir(dirname(this.dir)),
    "C-<backspace>": () => {
      if (this.basename.length > 0) {
        this.basename = "";
      } else {
        this.setDir(dirname(this.dir));
      }
    },
    "<backspace>": () => {
      if (this.basename.length > 0) {
        this.basename = this.basename.slice(0, this.basename.length - 1);
      } else {
        this.setDir(dirname(this.dir));
      }
    },
  };

  public async onkey(key: string) {
    const last = this.lastKey;
    this.lastKey = key;

    const keyAction = this.keyActions[key];
    if (keyAction) {
      await keyAction(last);
    } else if (key.length === 1) {
      this.basename += key;
    } else {
      log(`find-file: unknown key ${key} (last=${last})`);
    }
    if (this.isShowing) this.render();
  }

  private moveSelection(delta: number) {
    if (this.lastSelection === undefined) {
      this.lastSelection = this.lastSelections.at(0);
    } else {
      const idx = this.lastSelections.indexOf(this.lastSelection);
      if (idx < 0) {
        this.lastSelection = this.lastSelections[0];
      } else {
        const newIdx =
          delta > 0
            ? Math.min(this.lastSelections.length - 1, idx + delta)
            : Math.max(0, idx + delta);
        this.lastSelection = this.lastSelections[newIdx];
      }
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

    let fileListFiles: string;
    let fileListDirs: string;
    let fileListHighlight: string;
    let numRenderedSelections: number;
    let selectedLineOffset: number | undefined;
    if (this.files === undefined) {
      numRenderedSelections = 1;
      fileListFiles = "<loading...>";
      fileListDirs = "";
      fileListHighlight = "";
      this.lastSelection = undefined;
      this.lastFzfResults = [];
      this.lastFzfResults = [];
    } else {
      let fzfResults: FzfResultItem<string>[];
      if (this.basename === "") {
        fileListFiles =
          "\n" + this.files.map((f) => (f.endsWith("/") ? "" : f)).join("\n");
        fileListDirs =
          "\n" + this.files.map((f) => (f.endsWith("/") ? f : "")).join("\n");
        fileListHighlight = "";
        this.lastSelections = [...this.files];
        this.lastFzfResults = this.files.map<FzfResultItem<string>>((f) => ({
          item: f,
          positions: new Set(),
          start: 0,
          end: 0,
          score: 0,
        }));
      } else {
        const dirs = new Set(this.files.filter((f) => f.endsWith("/")).map(stripSlash));
        this.lastFzfResults = new Fzf(this.files.map(stripSlash), {
          tiebreakers: [byStartAsc, byLengthAsc],
        })
          .find(this.basename)
          .map((r) => (dirs.has(r.item) ? { ...r, item: r.item + "/" } : r));
        this.lastSelections = this.lastFzfResults.map((r) => r.item);

        // change selection if user input is an exact match
        const exactMatch = this.files.filter(
          (f) => f === this.basename || f === this.basename + "/",
        );
        if (exactMatch.length > 0) this.lastSelection = exactMatch[0];
      }

      if (this.lastSelections.length > 0) {
        let selectedIdx: number;
        if (this.lastSelection) {
          selectedIdx = this.lastSelections.indexOf(this.lastSelection);
          if (selectedIdx < 0) selectedIdx = 0;
        } else {
          selectedIdx = 0;
        }
        this.lastSelection = this.lastSelections[selectedIdx];

        let renderFrom = Math.max(0, selectedIdx - NUM_ABOVE_OR_BELOW),
          renderTo = Math.min(
            this.lastSelections.length,
            selectedIdx + NUM_ABOVE_OR_BELOW + 1,
          );

        // try extend upward
        if (renderTo - renderFrom < NUM_TOTAL && renderFrom > 0) {
          renderFrom = Math.max(0, renderTo - NUM_TOTAL);
        }
        // try extend downward
        if (renderTo - renderFrom < NUM_TOTAL && renderTo < this.lastSelections.length) {
          renderTo = Math.min(this.lastSelections.length, renderFrom + NUM_TOTAL);
        }

        const toRender = this.lastFzfResults.slice(renderFrom, renderTo);
        numRenderedSelections = toRender.length;
        selectedLineOffset = selectedIdx - renderFrom;

        const mapEntries = (f: (r: FzfResultItem<string>) => string) =>
          toRender.map(f).join("\n");

        fileListFiles = mapEntries((r) =>
          r.item.endsWith("/")
            ? ""
            : [...r.item].map((c, i) => (r.positions.has(i) ? " " : c)).join(""),
        );
        fileListDirs = mapEntries((r) =>
          r.item.endsWith("/")
            ? [...r.item].map((c, i) => (r.positions.has(i) ? " " : c)).join("")
            : "",
        );
        fileListHighlight = mapEntries((r) =>
          [...r.item].map((c, i) => (r.positions.has(i) ? c : " ")).join(""),
        );
      } else {
        fileListFiles = fileListDirs = fileListHighlight = "";
        numRenderedSelections = 0;
      }
    }

    const decos: Decoration[] = [
      { type: "background", background: "border", lines: 0.5, lineOffset: -1 },
      { type: "background", lines: numRenderedSelections + 2, lineOffset: -0.5 },
      {
        type: "background",
        background: "border",
        lines: 0.5,
        lineOffset: numRenderedSelections + 1.5,
      },
      { type: "text", foreground: "binding", text: this.dir },
      {
        type: "text",
        foreground: "command",
        text: " ".repeat(this.dir.length) + this.basename + "█",
      },
      { type: "text", foreground: "dir", text: fileListDirs, lineOffset: 1 },
      { type: "text", foreground: "command", text: fileListFiles, lineOffset: 1 },
      { type: "text", foreground: "highlight", text: fileListHighlight, lineOffset: 1 },
      { type: "text", foreground: "binding", text: this.dir },
    ];
    if (selectedLineOffset !== undefined) {
      decos.push({
        type: "background",
        background: "header",
        lines: 1,
        lineOffset: selectedLineOffset + 1,
      });
    }

    const doc = editor.document;
    const docLines = doc.lineCount;
    // fix header to be at least on the 2nd last line
    lnHeader = Math.max(0, Math.min(docLines - 2, lnHeader));
    const lnEnd = Math.min(docLines - 1, lnHeader + numRenderedSelections);
    const overallRange = new Range(
      doc.lineAt(lnHeader).range.start,
      doc.lineAt(lnEnd).range.end,
    );
    return renderDecorations(decos, editor, overallRange);
  }

  public render() {
    this.isShowing = true;
    const oldDisposables = this.disposableDecos;
    try {
      commands.executeCommand("_setContext", WHICHKEY_STATE, ":findFile");
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
  }
}
