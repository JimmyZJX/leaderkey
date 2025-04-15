import { dirname, join, normalize } from "path-browserify";
import {
  commands,
  EventEmitter,
  ExtensionContext,
  TextDocumentContentProvider,
  TextEditor,
  Uri,
  window,
  workspace,
} from "vscode";
import { log } from "../global";
import { runProcess } from "../remote";

export const scheme = "leaderkey.dired";

async function loadContent(uri: Uri) {
  const result = await runProcess("/bin/ls", ["-lA", uri.path]);
  if (result.error) {
    return (
      `ERROR [${uri.toString()}]\n${JSON.stringify(result.error)}\n\n` +
      `STDOUT\n======\n${result.stdout}\n\n` +
      `STDERR\n======\n${result.stderr}`
    );
  } else {
    return result.stdout.replace(/^[^\n]+(\n|$)/, `${uri.path}:\n`);
  }
}

export async function showDir(path: string) {
  const uri = Uri.from({ scheme, path });
  const loadedContent = loadContent(uri);
  await window.showTextDocument(uri, { preview: false });
  contentCache[uri.toString()] = await loadedContent;
  onDidChangeEmitter.fire(uri);
}

// TODO init here and mock for jest
let onDidChangeEmitter: EventEmitter<Uri>;
const contentCache: { [uri: string]: string } = {};

function registerProvider() {
  onDidChangeEmitter = new EventEmitter<Uri>();
  return workspace.registerTextDocumentContentProvider(
    scheme,
    new (class implements TextDocumentContentProvider {
      onDidChange = onDidChangeEmitter.event;

      provideTextDocumentContent(uri: Uri): string {
        return contentCache[uri.toString()] ?? "<loading...>";
      }
    })(),
  );
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
  context.subscriptions.push(registerProvider());

  for (const { name, f } of Object.values(keys)) {
    commands.registerCommand(`leaderkey.dired.${name}`, f);
  }
}
