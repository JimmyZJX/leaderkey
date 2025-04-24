import { dirname, join, normalize } from "path-browserify";
import {
  commands,
  EventEmitter,
  ExtensionContext,
  languages,
  Range,
  TextDocumentChangeEvent,
  TextDocumentContentProvider,
  TextEditor,
  TextEditorDecorationType,
  Uri,
  window,
  workspace,
} from "vscode";
import { DecoratedPage, parseAnsi, runAndParseAnsi } from "../common/ansi";
import { assert } from "../common/global";
import { isWin, openFile, readDirFilesAndDirs } from "../common/remote";

export const scheme = "leaderkey.dired";
export const language = "leaderkey-dired";

const RE_DIRED_FOOTER = /\/\/DIRED\/\/(?<dired>[0-9 ]+)\n\/\/DIRED-OPTIONS\/\/.+\n$/;

const DIRECTORY_HIGHLIGHT_ANSI = "\x1b[38;5;45m";

type DiredMetadata =
  | { type: "linux"; data: number[] }
  | { type: "win"; data: ("dir" | "file")[] };

async function loadContent(uri: Uri): Promise<DecoratedPage<DiredMetadata>> {
  if (isWin()) {
    const { dirs, files } = await readDirFilesAndDirs(uri.path);
    const ansiText = [
      ...dirs.map((d) => `${DIRECTORY_HIGHLIGHT_ANSI}${d}\x1b[0m`),
      ...files,
    ].join("\n");
    return {
      ...parseAnsi(ansiText),
      metadata: {
        type: "win",
        data: [...dirs.map<"dir">((_) => "dir"), ...files.map<"file">((_) => "file")],
      },
    };
  }
  return await runAndParseAnsi(
    "/bin/ls",
    // l: long details, A: all but . and .., h: human readable, H: follow link for input
    [
      "-lAhH",
      "--dired",
      "--color=always",
      "--quoting-style=literal",
      "--show-control-chars",
      uri.path,
    ],
    {
      textHook: (stdout: string) => {
        // ignore this specific ANSI code
        // eslint-disable-next-line no-control-regex
        stdout = stdout.replace(/\x1B\[K/g, "");
        const diredFooter = RE_DIRED_FOOTER.exec(stdout);
        const diredIndices = diredFooter?.groups?.dired;
        assert(diredFooter && diredIndices, "Dired footer not matched!");
        const indices = diredIndices
          .trim()
          .split(" ")
          .map((n) => parseInt(n));
        stdout = stdout.slice(0, stdout.length - diredFooter[0].length);
        const firstNewLine = stdout.indexOf("\n");
        assert(firstNewLine >= 0, "ls did not print any line?");
        let text = `  \x1b[1;38;5;39m${uri.path}\x1b[0m:` + stdout.slice(firstNewLine);
        const newHeaderLength = 2 + uri.path.length + 1; /* ':' */
        const indexOffset = newHeaderLength - firstNewLine;

        // tweak color: remove background on public dir (and change foreground to normal dir)
        text = text.replaceAll(
          "\x1b[48;5;10;38;5;21m",
          "\x1b[0m" + DIRECTORY_HIGHLIGHT_ANSI,
        );
        return {
          text,
          metadata: { type: "linux", data: indices.map((i) => i + indexOffset) },
        };
      },
    },
  );
}

export async function showDir(path: string) {
  if (!path.endsWith("/")) path += "/";
  const uri = Uri.from({ scheme, path });
  const pagePromise = loadContent(uri);
  const doc = await workspace.openTextDocument(uri);
  await languages.setTextDocumentLanguage(doc, language);
  await window.showTextDocument(doc, { preview: false });
  const page = await pagePromise;
  const strUri = uri.toString();
  contentCache[strUri] = page.text;
  metadataCache[strUri] = page.metadata;
  decorationCache[strUri] = page.decorations;
  onDidChangeEmitter.fire(uri);
}

// TODO init here and mock for jest
let onDidChangeEmitter: EventEmitter<Uri>;
const contentCache: { [uri: string]: string } = {};
const metadataCache: { [uri: string]: DiredMetadata } = {};
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
      const metadata = metadataCache[doc.uri.toString()];
      const activeLineNo = editor.selection.active.line;
      const activeLine = doc.lineAt(activeLineNo);

      if (activeLine.range.isEmpty || !metadata) {
        window.showErrorMessage("No file/dir on this line");
        return;
      }

      if (metadata.type === "win") {
        const i = activeLineNo;
        const basename = activeLine.text;
        const fullPath = join(doc.uri.path, basename);
        const type_ = metadata.data[i];
        switch (type_) {
          case "file":
            await openFile(fullPath, { preview: false });
            break;
          case "dir":
            await showDir(normalize(fullPath));
            break;
          default:
            window.showErrorMessage(`Unknown header [${type_}]`);
        }
      } else {
        const i = activeLineNo - 1;
        if (i < 0) {
          window.showErrorMessage("No file/dir on this line");
          return;
        }
        const indices = metadata.data;
        assert(
          i * 2 + 1 < indices.length,
          `index out of bound (i=${i}, len=${indices.length})`,
        );
        const from = doc.positionAt(indices[i * 2]),
          to = doc.positionAt(indices[i * 2 + 1]);
        const basename = doc.getText(new Range(from, to));
        const fullPath = join(doc.uri.path, basename);
        const type_ = activeLine.text[2];
        switch (type_) {
          case "-":
            // file
            await openFile(fullPath, { preview: false });
            break;
          case "l":
          case "d": // dir
            await showDir(normalize(fullPath));
            break;
          default:
            window.showErrorMessage(`Unknown header [${type_}]`);
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
