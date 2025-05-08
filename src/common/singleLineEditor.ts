import { env } from "vscode";
import { Decoration, TextType } from "./decoration";

const CURSOR_WIDTH = 0.2;

function findWordBoundary(text: string, direction: "left" | "right"): number {
  if (text.length === 0) return 0;

  if (direction === "left") {
    const match = text.match(/(^|\s)\S+\s*$/);
    if (!match) return 0;
    return (match.index ?? 0) + match[1].length;
  } else {
    const match = text.match(/^(\s*)($|\S+)(\s|$)/);
    if (!match) return 0;
    return match[1].length + match[2].length;
  }
}

export class OneLineEditor {
  private input: string;
  private cursor: number; // cursor at i => insert to i (0 <= cursor <= input.length)

  constructor(initInput: string) {
    this.input = initInput;
    this.cursor = this.input.length;
  }

  public reset(value: string) {
    this.input = value;
    this.cursor = this.input.length;
  }

  public value() {
    return this.input;
  }

  private moveCursor(delta: number) {
    if (delta > 0) {
      this.cursor = Math.min(this.input.length, this.cursor + delta);
    } else {
      this.cursor = Math.max(0, this.cursor + delta);
    }
  }

  public edit<T>(f: (lr: { l: string; r: string }) => T) {
    const lr = { l: this.input.slice(0, this.cursor), r: this.input.slice(this.cursor) };
    const r = f(lr);
    this.input = lr.l + lr.r;
    this.cursor = lr.l.length;
    return r;
  }

  public insert(content: string) {
    content = content.replace(/\r|\n/g, "");
    this.edit((lr) => (lr.l += content));
  }

  private async pasteClipboard() {
    this.insert((await env.clipboard.readText()).replaceAll("\n", ""));
  }

  private keyActions: { [key: string]: () => void | Promise<void> } = {
    // cursor movement
    "<left>": () => this.moveCursor(-1),
    "<right>": () => this.moveCursor(1),
    "C-<left>": () => {
      this.cursor = this.edit((lr) => findWordBoundary(lr.l, "left"));
    },
    "C-<right>": () => {
      this.cursor += this.edit((lr) => findWordBoundary(lr.r, "right"));
    },
    "<home>": () => {
      this.cursor = 0;
    },
    "<end>": () => {
      this.cursor = this.input.length;
    },

    // editing
    SPC: () => this.insert(" "),
    "<backspace>": () => {
      this.edit((lr) => (lr.l = lr.l.slice(0, -1)));
    },
    "<delete>": () => {
      this.edit((lr) => (lr.r = lr.r.slice(1)));
    },
    "C-<backspace>": () => {
      this.edit((lr) => (lr.l = lr.l.slice(0, findWordBoundary(lr.l, "left"))));
    },
    "C-<delete>": () => {
      this.edit((lr) => (lr.r = lr.r.slice(findWordBoundary(lr.r, "right"))));
    },

    "C-v": async () => this.pasteClipboard(),
    "C-y": async () => this.pasteClipboard(),
  };

  public async tryKey(key: string): Promise<"handled" | undefined> {
    if (key.length === 1) {
      // single character: insert
      this.insert(key);
      return "handled";
    } else {
      const action = this.keyActions[key];
      if (action === undefined) return undefined;
      await action();
      return "handled";
    }
    return undefined;
  }

  public render(config?: {
    char?: number;
    line?: number;
    foreground?: TextType;
    postfix?: string;
  }): Decoration[] {
    const lineOffset = config?.line ?? 0;
    const charOffset = config?.char ?? 0;
    const foreground = config?.foreground ?? "command";
    const postfix = config?.postfix ?? "";
    return [
      { type: "text", text: this.input + postfix, foreground, lineOffset, charOffset },
      {
        type: "background",
        background: "cursor",
        lines: 1,
        width: CURSOR_WIDTH,
        charOffset: charOffset + this.cursor - CURSOR_WIDTH / 2,
        lineOffset,
      },
    ];
  }
}
