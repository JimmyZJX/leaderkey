import path from "path-browserify";
import {
  commands,
  ExtensionContext,
  Position,
  Range,
  TextDocument,
  window,
  workspace,
} from "vscode";
import { ENV_HOME, openFile } from "../common/remote";
import { FileAtPoint, findFileAtPointInLine, parseFileAtPoint } from "./fileAtPoint";

function documentDirname(document: TextDocument): string | undefined {
  if (document.uri.scheme === "untitled") return undefined;
  return path.posix.dirname(document.uri.path);
}

function expandHome(rawPath: string): string {
  return rawPath.startsWith("~/") ? path.posix.join(ENV_HOME, rawPath.slice(2)) : rawPath;
}

function candidatePaths(document: TextDocument, rawPath: string): string[] {
  const pathAtPoint = expandHome(rawPath);
  const candidates: string[] = [];
  if (pathAtPoint.startsWith("/")) {
    candidates.push(pathAtPoint);
  } else {
    const documentDir = documentDirname(document);
    if (documentDir !== undefined) {
      candidates.push(path.posix.normalize(path.posix.join(documentDir, pathAtPoint)));
    }
    for (const folder of workspace.workspaceFolders ?? []) {
      candidates.push(path.posix.normalize(path.posix.join(folder.uri.path, pathAtPoint)));
    }
  }

  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate)) return false;
    seen.add(candidate);
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

async function openPathAtTarget(path: string, target: FileAtPoint) {
  if (target.line === undefined) {
    await openFile(path, { preview: false });
  } else {
    const line = Math.max(0, target.line - 1);
    const character = Math.max(0, (target.column ?? 1) - 1);
    const position = new Position(line, character);
    await openFile(path, {
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
    window.showWarningMessage("gf: no file found under cursor");
    return;
  }

  let lastError: unknown = undefined;
  for (const path of candidatePaths(editor.document, target.path)) {
    try {
      await openPathAtTarget(path, target);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  window.showErrorMessage(
    `gf: failed to open ${target.path}: ${errorMessage(lastError)}`,
  );
}

export function register(context: ExtensionContext) {
  context.subscriptions.push(commands.registerCommand("leaderkey.gf", openFileAtPoint));
}
