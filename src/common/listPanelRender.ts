import { TextEditor } from "vscode";
import { Decoration, renderDecorations, TextType } from "./decoration";
import { getRenderRangeFromTop } from "./renderRange";

/**
 * A text layer to render at a specific position.
 */
export type TextLayer = {
  text: string;
  foreground: TextType;
  /** Character offset from left (default: 0) */
  charOffset?: number;
};

/**
 * Represents a single display row in the list panel.
 * Each row can have multiple text layers that render on top of each other.
 */
export type ListPanelRow = {
  /** Text layers to render on this row (rendered in order, later layers on top) */
  textLayers: TextLayer[];
};

/**
 * Configuration for rendering a list panel.
 */
export type ListPanelConfig = {
  /** Header text (usually "count  Title") */
  header: string;
  /** Decorations for the input line (line 1) */
  inputDecos: Decoration[];
  /** Rows to render starting at line 2 (can be items, descriptions, etc.) */
  rows: ListPanelRow[];
  /** Index of the selected row (0-based, relative to rows array). Use -1 for input line selection. */
  selectedRow?: number;
};

/**
 * Renders a list panel with the standard layout:
 *
 *   -------- top border --------
 *   header (line 0)
 *   input line (line 1)
 *   row 0 (line 2)
 *   row 1 (line 3)
 *   ...
 *   -------- bottom border --------
 *
 * Returns disposable decoration types that must be disposed by the caller.
 */
export function renderListPanel(
  editor: TextEditor,
  config: ListPanelConfig,
): ReturnType<typeof renderDecorations> {
  const { header, inputDecos, rows, selectedRow } = config;
  const rowCount = rows.length;

  const decos: Decoration[] = [
    // overall background
    { type: "background", lines: rowCount + 2 },
    // header
    {
      type: "text",
      text: header,
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
      lineOffset: rowCount + 2,
    },
    // input line decorations
    ...inputDecos,
  ];

  // Selection highlight (selectedRow === -1 means input line is selected)
  if (selectedRow !== undefined) {
    const lineOffset = selectedRow === -1 ? 1 : selectedRow + 2;
    decos.push({
      type: "background",
      background: "header",
      lines: 1,
      lineOffset,
      zOffset: 1,
    });
  }

  // Render rows
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineOffset = i + 2;

    // Text layers
    for (const layer of row.textLayers) {
      decos.push({
        type: "text",
        text: layer.text,
        foreground: layer.foreground,
        lineOffset,
        charOffset: layer.charOffset,
      });
    }
  }

  const range = getRenderRangeFromTop(editor, rowCount + 2);
  return renderDecorations(decos, editor, range);
}

/**
 * Helper to create text layers for a fuzzy-matched item.
 * Splits text into non-highlighted and highlighted parts.
 */
export function createFuzzyMatchLayers(
  text: string,
  positions: Set<number>,
  baseForeground: TextType = "command",
): TextLayer[] {
  const nonHighlight = [...text]
    .map((c, i) => (positions.has(i) ? " " : c))
    .join("");
  const highlight = [...text]
    .map((c, i) => (positions.has(i) ? c : " "))
    .join("");

  return [
    { text: nonHighlight, foreground: baseForeground },
    { text: highlight, foreground: "highlight" },
  ];
}
