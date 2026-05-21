import {
  commands,
  ExtensionContext,
  Position,
  Range,
  TextDocument,
  Uri,
  window,
  workspace,
} from "vscode";
import { ENV_HOME } from "../common/remote";
import { FileAtPoint, findFileAtPointInLine, parseFileAtPoint } from "./fileAtPoint";

function uriDirname(uri: Uri): Uri {
  const lastSlash = uri.path.lastIndexOf("/");
  const path = lastSlash <= 0 ? "/" : uri.path.slice(0, lastSlash);
  return uri.with({ path, query: "", fragment: "" });
}

function uriForAbsolutePath(document: TextDocument, path: string): Uri[] {
  const uris: Uri[] = [];
  if (document.uri.scheme !== "untitled") {
    uris.push(document.uri.with({ path, query: "", fragment: "" }));
  }
  for (const folder of workspace.workspaceFolders ?? []) {
    uris.push(folder.uri.with({ path, query: "", fragment: "" }));
  }
  uris.push(Uri.file(path));
  return uris;
}

function candidateUris(document: TextDocument, rawPath: string): Uri[] {
  const path = rawPath.startsWith("~/") ? `${ENV_HOME}/${rawPath.slice(2)}` : rawPath;
  const candidates: Uri[] = [];
  if (path.startsWith("/")) {
    candidates.push(...uriForAbsolutePath(document, path));
  } else {
    if (document.uri.scheme !== "untitled") {
      candidates.push(Uri.joinPath(uriDirname(document.uri), path));
    }
    for (const folder of workspace.workspaceFolders ?? []) {
      candidates.push(Uri.joinPath(folder.uri, path));
    }
  }

  const seen = new Set<string>();
  return candidates.filter((uri) => {
    const key = uri.toString();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fileAtPoint(): FileAtPoint | undefined {
  const editor = window.activeTextEditor;
  if (editor === undefined || editor.selections.length !== 1) return undefined;

  const selection = editor.selection;
  if (!selection.isEmpty) {
    return parseFileAtPoint(editor.document.getText(selection));
  }

  const active = selection.active;
  return findFileAtPointInLine(
    editor.document.lineAt(active.line).text,
    active.character,
  );
}

async function showTextDocumentAtTarget(uri: Uri, target: FileAtPoint) {
  const document = await workspace.openTextDocument(uri);
  if (target.line === undefined) {
    await window.showTextDocument(document, { preview: false });
  } else {
    const line = Math.min(document.lineCount - 1, Math.max(0, target.line - 1));
    const character = Math.min(
      document.lineAt(line).text.length,
      Math.max(0, (target.column ?? 1) - 1),
    );
    const position = new Position(line, character);
    await window.showTextDocument(document, {
      preview: false,
      selection: new Range(position, position),
    });
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function openFileAtPoint() {
  const editor = window.activeTextEditor;
  if (editor === undefined) return;

  const target = fileAtPoint();
  if (target === undefined) {
    await window.showWarningMessage("gf: no file found under cursor");
    return;
  }

  let lastError: unknown = undefined;
  for (const uri of candidateUris(editor.document, target.path)) {
    try {
      await showTextDocumentAtTarget(uri, target);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  await window.showErrorMessage(
    `gf: failed to open ${target.path}: ${errorMessage(lastError)}`,
  );
}

export function register(context: ExtensionContext) {
  context.subscriptions.push(commands.registerCommand("leaderkey.gf", openFileAtPoint));
}
