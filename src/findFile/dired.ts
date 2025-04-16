import { dirname, join, normalize } from "path-browserify";
import {
  commands,
  DocumentSymbol,
  DocumentSymbolProvider,
  EventEmitter,
  ExtensionContext,
  languages,
  Range,
  SymbolKind,
  TextDocument,
  TextDocumentChangeEvent,
  TextDocumentContentProvider,
  TextEditor,
  TextEditorDecorationType,
  Uri,
  window,
  workspace,
} from "vscode";
import { runAndParseAnsi } from "../common/ansi";
import { log } from "../common/global";

export const scheme = "leaderkey.dired";
export const language = "leaderkey.dired";

async function loadContent(uri: Uri) {
  return await runAndParseAnsi("/bin/ls", ["-lA", "--color", uri.path], {
    textHook: (stdout: string) =>
      stdout.replace(/^[^\n]+(\n|$)/, `\x1b[1;38;5;39m${uri.path}\x1b[0m:\n`),
  });
}

export async function showDir(path: string) {
  const uri = Uri.from({ scheme, path });
  const pagePromise = loadContent(uri);
  const doc = await workspace.openTextDocument(uri);
  await languages.setTextDocumentLanguage(doc, language);
  await window.showTextDocument(doc, { preview: false });
  const page = await pagePromise;
  const strUri = uri.toString();
  contentCache[strUri] = page.text;
  decorationCache[strUri] = page.decorations;
  onDidChangeEmitter.fire(uri);
}

// TODO init here and mock for jest
let onDidChangeEmitter: EventEmitter<Uri>;
const contentCache: { [uri: string]: string } = {};
const decorationCache: { [uri: string]: [TextEditorDecorationType, Range[]][] } = {};
const oldDecorations: { [uri: string]: TextEditorDecorationType[] } = {};

function updateDecoration(editor: TextEditor) {
  const uri = editor.document.uri;
  if (uri.scheme !== scheme) return;
  const strUri = uri.toString();
  for (const dt of oldDecorations[strUri] ?? []) {
    editor.setDecorations(dt, []);
  }
  const decorations = decorationCache[strUri] ?? [];
  oldDecorations[strUri] = decorations.map(([dt, _ranges]) => dt);
  for (const [dt, ranges] of decorations) {
    editor.setDecorations(dt, ranges);
  }
}

function registerProviders() {
  onDidChangeEmitter = new EventEmitter<Uri>();
  return [
    workspace.registerTextDocumentContentProvider(
      scheme,
      new (class implements TextDocumentContentProvider {
        onDidChange = onDidChangeEmitter.event;

        provideTextDocumentContent(uri: Uri): string {
          return contentCache[uri.toString()] ?? "<loading...>";
        }
      })(),
    ),
    workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {
      for (const editor of window.visibleTextEditors) {
        if (editor.document.uri.toString() === e.document.uri.toString()) {
          updateDecoration(editor);
        }
      }
    }),
    window.onDidChangeVisibleTextEditors((editors: readonly TextEditor[]) => {
      for (const editor of editors) {
        updateDecoration(editor);
      }
    }),
    languages.registerDocumentSymbolProvider(
      [{ language: language }],
      new (class implements DocumentSymbolProvider {
        provideDocumentSymbols(document: TextDocument): DocumentSymbol[] {
          const line0 = document.lineAt(0);
          const dir = line0.text.replace(/:$/, "");
          const fullRange = new Range(
            line0.range.start,
            document.lineAt(document.lineCount - 1).range.end,
          );
          return [
            new DocumentSymbol(dir, "dir", SymbolKind.File, fullRange, line0.range),
          ];
        }
      })(),
    ),
  ];
}

type Command = {
  name: string;
  f: () => Promise<void>;
};

function withEditor(f: (editor: TextEditor) => Promise<void>) {
  return async () => {
    const editor = window.activeTextEditor;
    if (!editor) return;
    return await f(editor);
  };
}

const RE_FILE_OR_DIR = /^(?<type>d|-|l).+ (?<basename>\S+)(\*| -> \S+)?$/;

export const keys: { [key: string]: Command } = {
  q: {
    name: "quit",
    f: async () => await commands.executeCommand("workbench.action.closeActiveEditor"),
  },
  "shift+6": {
    name: "up",
    f: withEditor(async (editor) => await showDir(dirname(editor.document.uri.path))),
  },
  enter: {
    name: "enter",
    f: withEditor(async (editor) => {
      const doc = editor.document;
      const activeLineNo = editor.selection.active.line;
      const activeLineText = doc.lineAt(activeLineNo).text;
      log(`activeLineText ${activeLineText}`);
      const match = RE_FILE_OR_DIR.exec(activeLineText);
      if (match === null) {
        window.showErrorMessage("No file/dir on this line");
      } else {
        const type_ = match.groups!.type;
        switch (type_) {
          case "-":
            {
              // file
              const file = Uri.file(join(doc.uri.path, match.groups!.basename!));
              await window.showTextDocument(file, { preview: false });
            }
            break;
          case "l":
          case "d": // dir
            {
              const dir = normalize(join(doc.uri.path, match.groups!.basename!));
              await showDir(dir);
            }
            break;
          default:
            window.showErrorMessage(`Unexpected header [${type_}]`);
        }
      }
    }),
  },
};

export function register(context: ExtensionContext) {
  context.subscriptions.push(...registerProviders());

  for (const { name, f } of Object.values(keys)) {
    commands.registerCommand(`leaderkey.dired.${name}`, f);
  }
}
