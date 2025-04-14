import {
  commands,
  Position,
  Range,
  TextEditor,
  TextEditorRevealType,
  Uri,
  window,
  workspace,
} from "vscode";
import { setStatusBar } from "../global";

interface gotoStackElement {
  uri: Uri;
  cursor: Position;
}

const gotoStack: gotoStackElement[] = [];

function createStackElement(editor: TextEditor): gotoStackElement {
  return {
    uri: editor.document.uri,
    cursor: editor.selection.active,
  };
}

function isGotoStackElementEqual(e1: gotoStackElement, e2: gotoStackElement) {
  return e1.uri.toString() === e2.uri.toString() && e1.cursor.compareTo(e2.cursor) === 0;
}

export async function pushGotoStack(
  cmdOrOpts: string | { command: string; args?: any } | undefined,
) {
  const editor = window.activeTextEditor;
  if (editor === undefined) {
    setStatusBar("Goto stack: no active text editor", "error");
    return;
  }
  const e = createStackElement(editor);
  if (cmdOrOpts === undefined) {
    // push
    gotoStack.push(e);
  } else {
    const { command, args } =
      typeof cmdOrOpts === "string" ? { command: cmdOrOpts, args: undefined } : cmdOrOpts;
    try {
      if (Array.isArray(args)) {
        await commands.executeCommand(command, ...args);
      } else {
        await commands.executeCommand(command, args);
      }
    } catch (e) {
      window.showErrorMessage(`Goto stack: fail to execute command [${command}]: ${e}`);
    }
    const editor2 = window.activeTextEditor;
    if (editor2 === undefined) {
      setStatusBar("Goto stack: no active text editor", "error");
      return;
    }
    const e2 = createStackElement(editor2);
    if (isGotoStackElementEqual(e, e2)) {
      // nothing to push
    } else {
      setStatusBar("Goto stack: pushed", "info");
      gotoStack.push(e);
    }
  }
}

export async function popGotoStack() {
  const e = gotoStack.pop();
  if (e === undefined) {
    setStatusBar("Goto stack: empty", "error");
    return;
  }
  const selection = new Range(e.cursor, e.cursor);
  const doc = await workspace.openTextDocument(e.uri);
  const editor = await window.showTextDocument(doc, {
    preserveFocus: false,
    preview: false,
    selection,
  });
  editor.revealRange(selection, TextEditorRevealType.InCenter);
}
