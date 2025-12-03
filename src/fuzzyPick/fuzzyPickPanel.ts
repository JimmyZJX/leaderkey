import { TextEditor, TextEditorDecorationType, window } from "vscode";
import {
  disableLeaderKey,
  enableLeaderKeyAndDisableVim,
  enableVim,
} from "../common/context";
import { Decoration } from "../common/decoration";
import { log } from "../common/global";
import {
  createFuzzyMatchLayers,
  ListPanelRow,
  renderListPanel,
  TextLayer,
} from "../common/listPanelRender";
import { indicesToRender } from "../common/renderRange";
import { OneLineEditor as SingleLineEditor } from "../common/singleLineEditor";
import { extendedMatch, Fzf, FzfResultItem } from "../fzf-for-js/src/lib/main";
import { FuzzyPickItem, parseProviderResult, showParseError } from "./fuzzyPickInput";

export { FuzzyPickItem } from "./fuzzyPickInput";

export type FuzzyPickResult = {
  query: string;
  lineNumber?: number;
  item: FuzzyPickItem;
};

type DataState =
  | { status: "loading" }
  | { status: "loaded"; items: FuzzyPickItem[] }
  | { status: "error"; message: string };

type FilteredResults = {
  items: FzfResultItem<FuzzyPickItem>[];
  filtered: number;
  total: number;
};

type FuzzyPickSelection =
  | { type: "none" }
  | { type: "item"; item: FuzzyPickItem; idx: number };

export type FuzzyPickOptions = {
  title?: string;
  placeholder?: string;
  /** If true, allow `:lineNumber` suffix in query that gets parsed and returned separately */
  allowLineNumber?: boolean;
};

/** Parse query to extract optional :lineNumber suffix */
function parseQuery(query: string): { searchQuery: string; lineNumber?: number } {
  const match = query.match(/:(\d*)$/);
  if (match) {
    return {
      searchQuery: query.slice(0, -match[0].length),
      lineNumber: parseInt(match[1]) || undefined,
    };
  }
  return { searchQuery: query };
}

export class FuzzyPickPanel {
  disposableDecos: TextEditorDecorationType[] = [];

  editor: SingleLineEditor;
  dataState: DataState = { status: "loading" };
  filteredResults: FilteredResults | undefined;
  providerName: string;

  lastSelection: FuzzyPickSelection = { type: "none" };
  isSelectionManuallyChanged: boolean = false;

  title: string;
  placeholder: string;
  allowLineNumber: boolean;

  isQuit: boolean = false;
  onQuit: (result: FuzzyPickResult | undefined) => void;

  constructor(
    providerName: string,
    dataPromise: Thenable<unknown>,
    options: FuzzyPickOptions,
    onQuit: (result: FuzzyPickResult | undefined) => void,
  ) {
    enableLeaderKeyAndDisableVim(":fuzzyPick");
    this.onQuit = onQuit;
    this.providerName = providerName;
    this.editor = new SingleLineEditor("");
    this.title = options.title ?? "Pick";
    this.placeholder = options.placeholder ?? "";
    this.allowLineNumber = options.allowLineNumber ?? false;

    // Start loading data asynchronously
    this.loadData(dataPromise);
    this.render();
  }

  private async loadData(dataPromise: Thenable<unknown>) {
    try {
      const data = await dataPromise;
      if (this.isQuit) return;

      const result = parseProviderResult(data);
      if (!result.ok) {
        this.dataState = { status: "error", message: result.error };
        showParseError(this.providerName, result.error);
      } else {
        this.dataState = { status: "loaded", items: result.items };
        this.filteredResults = this.filterItems(this.editor.value());
      }
    } catch (err) {
      if (this.isQuit) return;
      const message = err instanceof Error ? err.message : String(err);
      this.dataState = { status: "error", message };
      showParseError(this.providerName, message);
    }
    this.render();
  }

  private filterItems(query: string): FilteredResults {
    if (this.dataState.status !== "loaded") {
      return { items: [], filtered: 0, total: 0 };
    }

    // Strip line number suffix for filtering if enabled
    const searchQuery = this.allowLineNumber ? parseQuery(query).searchQuery : query;

    const { items } = this.dataState;
    let filtered: FzfResultItem<FuzzyPickItem>[];

    if (searchQuery === "") {
      filtered = items.map((item) => ({
        item,
        positions: new Set<number>(),
        start: 0,
        end: 0,
        score: 0,
      }));
    } else {
      const fzf = new Fzf(items, {
        selector: (item) => item.label,
        sort: false,
        match: extendedMatch,
      });
      filtered = fzf.find(searchQuery);
      filtered.sort(
        (a, b) => -((a.item.score ?? 1) * a.score - (b.item.score ?? 1) * b.score),
      );
    }

    return {
      items: filtered,
      filtered: filtered.length,
      total: items.length,
    };
  }

  private keyActions: {
    [key: string]: () => void | Promise<void>;
  } = {
    ESC: async () => await this.quit(),
    RET: async () => await this.confirmSelection(),
    TAB: async () => await this.confirmSelection(),
    "C-l": async () => await this.confirmSelection(),
    "C-j": () => this.moveSelection(1),
    "<down>": () => this.moveSelection(1),
    "C-k": () => this.moveSelection(-1),
    "<up>": () => this.moveSelection(-1),
    "C-d": () => this.moveSelection(8),
    "C-u": () => this.moveSelection(-8),
    "<pagedown>": () => this.moveSelection(15),
    "<pageup>": () => this.moveSelection(-15),
  };

  private async confirmSelection() {
    let item: FuzzyPickItem | undefined;
    if (this.lastSelection.type === "item") {
      item = this.lastSelection.item;
    } else if (this.filteredResults && this.filteredResults.items.length > 0) {
      item = this.filteredResults.items[0].item;
    }

    if (item) {
      const query = this.editor.value();
      const { lineNumber } = this.allowLineNumber ? parseQuery(query) : {};
      await this.quitWithResult({ query, lineNumber, item });
    } else {
      await this.quitWithResult();
    }
  }

  public async onKey(key: string) {
    const lastInput = this.editor.value();

    const keyAction = this.keyActions[key];
    if (keyAction) {
      await keyAction();
    } else if ((await this.editor.tryKey(key)) === "handled") {
      // handled by editor
    } else {
      log(`fuzzy-pick: unknown key ${key}`);
    }

    if (this.editor.value() !== lastInput) {
      this.filteredResults = this.filterItems(this.editor.value());
    }
    this.render();
  }

  private moveSelection(delta: number) {
    this.isSelectionManuallyChanged = true;

    if (!this.filteredResults || this.filteredResults.items.length === 0) {
      this.lastSelection = { type: "none" };
      return;
    }

    const { items } = this.filteredResults;
    let newIdx: number;
    if (this.lastSelection.type === "none") {
      newIdx = delta > 0 ? 0 : items.length - 1;
    } else {
      const { idx } = this.lastSelection;
      newIdx =
        delta > 0 ? Math.min(items.length - 1, idx + delta) : Math.max(0, idx + delta);
    }

    this.lastSelection = {
      type: "item",
      item: items[newIdx].item,
      idx: newIdx,
    };
    this.render();
  }

  private computeRenderState(): {
    newSelection: FuzzyPickSelection;
    renderStart: number;
    toRender: FzfResultItem<FuzzyPickItem>[];
  } {
    if (!this.filteredResults || this.filteredResults.items.length === 0) {
      return {
        newSelection: { type: "none" },
        renderStart: 0,
        toRender: [],
      };
    }

    const { items } = this.filteredResults;
    let focusIdx: number;
    let newSelection: FuzzyPickSelection;

    if (this.lastSelection.type === "none") {
      newSelection = {
        type: "item",
        item: items[0].item,
        idx: 0,
      };
      focusIdx = 0;
    } else {
      if (this.isSelectionManuallyChanged) {
        // Follow user selection by finding same item
        const item = this.lastSelection.item;
        focusIdx = Math.max(
          0,
          items.findIndex((r) => r.item === item),
        );
      } else {
        focusIdx = Math.min(this.lastSelection.idx, items.length - 1);
      }
      newSelection = {
        type: "item",
        item: items[focusIdx].item,
        idx: focusIdx,
      };
    }

    const { start, len } = indicesToRender({
      length: items.length,
      focus: focusIdx,
    });
    const toRender = items.slice(start, start + len);

    return { newSelection, renderStart: start, toRender };
  }

  private doRender(editor: TextEditor) {
    const { newSelection, renderStart, toRender } = this.computeRenderState();
    this.lastSelection = newSelection;

    // Determine counter info based on data state
    let counterInfo: string;
    if (this.dataState.status === "loading") {
      counterInfo = "...";
    } else if (this.dataState.status === "error") {
      counterInfo = "Error";
    } else {
      const { filtered, total } = this.filteredResults!;
      counterInfo = `${filtered}/${total}`;
    }

    const inputDecos: Decoration[] = [];

    if (this.editor.value()) {
      inputDecos.push(
        ...this.editor.render({
          char: 0,
          line: 1,
          foreground: "command",
        }),
      );
    } else if (this.placeholder) {
      inputDecos.push({
        type: "text",
        text: this.placeholder,
        foreground: "dim",
        lineOffset: 1,
        charOffset: 0,
      });
    }

    // Build rows based on data state
    const rows: ListPanelRow[] = [];
    let selectedRow: number | undefined;

    if (this.dataState.status === "loading") {
      rows.push({
        textLayers: [{ text: "<loading...>", foreground: "dim" }],
      });
    } else if (this.dataState.status === "error") {
      rows.push({
        textLayers: [{ text: `<error: ${this.dataState.message}>`, foreground: "dim" }],
      });
    } else {
      for (let i = 0; i < toRender.length; i++) {
        const r = toRender[i];
        const isSelected =
          newSelection.type === "item" && newSelection.idx === renderStart + i;

        if (isSelected) {
          selectedRow = rows.length;
        }

        // Label row: [header] label [description]
        // Header is dim, label has fuzzy match highlighting, description is dim
        const headerPrefix = r.item.header ? r.item.header + " " : "";
        const labelSuffix = r.item.description ? " " + r.item.description : "";

        const textLayers: TextLayer[] = [];

        // Header (dim, before label)
        if (headerPrefix) {
          textLayers.push({ text: headerPrefix, foreground: "dim" as const });
        }

        // Label with fuzzy match highlighting (offset by header length)
        const fuzzyLayers = createFuzzyMatchLayers(r.item.label, r.positions);
        for (const layer of fuzzyLayers) {
          textLayers.push({
            ...layer,
            charOffset: headerPrefix.length,
          });
        }

        // Description (dim, after label)
        if (labelSuffix) {
          textLayers.push({
            text: labelSuffix,
            foreground: "dim" as const,
            charOffset: headerPrefix.length + r.item.label.length,
          });
        }

        rows.push({ textLayers });
      }
    }

    return renderListPanel(editor, {
      header: `${counterInfo.padEnd(10)} ${this.title}`,
      inputDecos,
      rows,
      selectedRow,
    });
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

  /** Quit without selection (e.g., ESC) */
  public async quit() {
    await this.quitWithResult();
  }

  private async quitWithResult(result?: FuzzyPickResult) {
    if (this.isQuit) return;
    for (const dsp of this.disposableDecos) dsp.dispose();
    this.disposableDecos = [];
    await disableLeaderKey();
    await enableVim();
    this.onQuit(result);
    this.isQuit = true;
  }
}
