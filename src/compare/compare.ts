import {
  commands,
  env,
  EventEmitter,
  ExtensionContext,
  TextDocumentContentProvider,
  Uri,
  window,
  workspace,
} from "vscode";

let from: string | undefined;
let to_: string | undefined;

function getActiveText(): string | undefined {
  const editor = window.activeTextEditor;
  if (!editor) {
    window.showWarningMessage("Compare: No active editor");
    return;
  }

  const text = editor.selections
    .map((sel) => editor.document.getText(sel))
    .filter((t) => t !== "")
    .join("\n");
  if (text === "") {
    window.showWarningMessage("Compare: No text selected");
    return;
  }

  return text;
}

let onDidChangeEmitter: EventEmitter<Uri>;

const scheme = "leaderkey.compare";

export function register(context: ExtensionContext) {
  onDidChangeEmitter = new EventEmitter<Uri>();

  const compareFromUri = Uri.from({ scheme, path: "from" });
  const compareToUri = Uri.from({ scheme, path: "to" });

  async function show() {
    // in case the diff editor is open, in which case VSCode will not reload automatically
    onDidChangeEmitter.fire(compareFromUri);
    onDidChangeEmitter.fire(compareToUri);
    await commands.executeCommand(
      "vscode.diff",
      compareFromUri,
      compareToUri,
      "Compare (Leaderkey)",
    );
  }

  context.subscriptions.push(
    workspace.registerTextDocumentContentProvider(
      scheme,
      new (class implements TextDocumentContentProvider {
        onDidChange = onDidChangeEmitter.event;

        provideTextDocumentContent(uri: Uri): string {
          if (uri.path === compareFromUri.path) {
            return from ?? "";
          } else if (uri.path === compareToUri.path) {
            return to_ ?? "";
          } else {
            return "ERROR: bad query (" + uri.path + ")";
          }
        }
      })(),
    ),
    commands.registerCommand("leaderkey.compare-from", () => {
      from = getActiveText();
    }),
    commands.registerCommand("leaderkey.compare-to", async () => {
      to_ = getActiveText();
      await show();
    }),
    commands.registerCommand("leaderkey.compare-from-clipboard", async () => {
      to_ = getActiveText();
      from = await env.clipboard.readText();
      await show();
    }),
  );
}
