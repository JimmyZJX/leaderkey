import { window } from "vscode";

export type FuzzyPickItem = {
  label: string;
  description?: string;
  score?: number;
};

export type ParseResult =
  | { ok: true; items: FuzzyPickItem[] }
  | { ok: false; error: string };

/**
 * Parse and validate input data from a provider command.
 * Supports multiple input formats:
 * - Array of strings: ["item1", "item2"]
 * - Array of objects with label: [{ label: "item1" }, { label: "item2", description: "desc" }]
 */
export function parseProviderResult(data: unknown): ParseResult {
  if (data === undefined || data === null) {
    return { ok: false, error: "Provider returned null or undefined" };
  }

  if (!Array.isArray(data)) {
    return { ok: false, error: `Provider must return an array, got ${typeof data}` };
  }

  if (data.length === 0) {
    return { ok: true, items: [] };
  }

  const items: FuzzyPickItem[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const parsed = parseItem(item, i);
    if (!parsed.ok) {
      return parsed;
    }
    items.push(parsed.item);
  }

  return { ok: true, items };
}

type ItemParseResult = { ok: true; item: FuzzyPickItem } | { ok: false; error: string };

function parseItem(item: unknown, index: number): ItemParseResult {
  // String format: "label"
  if (typeof item === "string") {
    return { ok: true, item: { label: item } };
  }

  // Object format: { label: string, description?: string }
  if (typeof item === "object" && item !== null) {
    const obj = item as Record<string, unknown>;

    if (typeof obj.label !== "string") {
      return {
        ok: false,
        error: `Item at index ${index} must have a string 'label' property ${JSON.stringify(obj)}`,
      };
    }

    const result: FuzzyPickItem = { label: obj.label };

    if (obj.description !== undefined) {
      if (typeof obj.description !== "string") {
        return {
          ok: false,
          error: `Item at index ${index} has invalid 'description' (must be string)`,
        };
      }
      result.description = obj.description;
    }

    if (obj.score !== undefined) {
      if (typeof obj.score !== "number") {
        return {
          ok: false,
          error: `Item at index ${index} has invalid 'score' (must be number)`,
        };
      }
      result.score = obj.score;
    }

    return { ok: true, item: result };
  }

  return {
    ok: false,
    error: `Item at index ${index} must be a string or object with 'label', got ${typeof item}`,
  };
}

/**
 * Show an error message for parse failures.
 */
export function showParseError(providerName: string, error: string): void {
  window.showErrorMessage(`FuzzyPick provider '${providerName}': ${error}`);
}
