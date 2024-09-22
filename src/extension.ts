import {
  commands,
  Disposable,
  ExtensionContext,
  Position,
  Range,
  StatusBarItem,
  ThemableDecorationAttachmentRenderOptions,
  ThemeColor,
  window,
} from "vscode";
import { go, isBindings, isCommand, render } from "./command";
import { root } from "./vspacecode";
import { WHICHKEY_STATE, writeKeyBinding } from "./writeKeyBinding";

let statusBar: StatusBarItem | undefined = undefined;
const statusBarWarning = new ThemeColor("statusBarItem.warningBackground");
let statusBarTimeout: NodeJS.Timeout | undefined = undefined;

function renderTextDeco(
  text: string
): ThemableDecorationAttachmentRenderOptions {
  const escaped = text
    .replaceAll("'", "\\'")
    .replaceAll(" ", "\\00a0 ")
    .replaceAll("\n", " \\A ");

  return {
    backgroundColor: "transparent",
    margin: `0 -1ch 0 0; position: absolute; white-space: pre;
             z-index: 3; content: '${escaped}';`,
  };
}

let disposableDecos: Disposable[] = [];

function getBgDeco(height: number) {
  return window.createTextEditorDecorationType({
    color: "transparent",
    before: {
      contentText: " ",
      backgroundColor: "#292b2e",
      height: `${100 * height}%`,
      width: "200ch",
      margin: `0 -1ch 0 0; position: absolute; z-index: 1;`,
    },
  });
}

function getHeaderDeco(text: string, tableLines: number) {
  return window.createTextEditorDecorationType({
    color: "transparent",
    before: {
      contentText: text,
      backgroundColor: "#5d4d7a",
      height: "200%",
      width: "200ch",
      margin: `0 -1ch 0 0; position: absolute; z-index: 2; top: ${tableLines}00%`,
    },
  });
}

let globalPath = "";

function onkey(key: string) {
  const newPath = globalPath === "" ? "" : globalPath + " " + key;
  const bOrC = go(root, newPath);
  if (bOrC === undefined) {
    // TODO error
    setToInit();
    if (statusBar !== undefined) {
      const msg = `Unknown whichkey: ${newPath}`;
      statusBar.backgroundColor = statusBarWarning;
      statusBar.text = msg;
      clearTimeout(statusBarTimeout);
      statusBarTimeout = setTimeout(function () {
        if (statusBar !== undefined) {
          if (statusBar.text == msg) {
            statusBar.text = globalPath;
            statusBar.backgroundColor = undefined;
          }
        }
      }, 2000);
    }
    return;
  }
  if (isBindings(bOrC)) {
    setAndRenderPath(newPath);
    return;
  }
  // command
  const cmd = bOrC;
  if (cmd.commands) {
    commands.executeCommand("runCommands", { commands: cmd.commands });
  } else {
    commands.executeCommand(cmd.command!, cmd.args);
  }
  setToInit();
}

function setToInit() {
  commands.executeCommand("_setContext", WHICHKEY_STATE, "");
  setAndRenderPath("");
}

function setAndRenderPath(path: string) {
  globalPath = path;
  disposableDecos.forEach((d) => d.dispose());
  disposableDecos = [];
  //   const editorLayout = await commands.executeCommand(
  //     "vscode.getEditorLayout"
  //   );

  if (statusBar !== undefined) {
    statusBar.backgroundColor = undefined;
    statusBar.text = path === "" ? "" : path + "-";
  }
  if (path === "") return;
  const binding = go(root, path);
  if (binding === undefined || isCommand(binding)) return;

  const editor = window.activeTextEditor;
  editor?.viewColumn;

  if (editor === undefined) return;

  const rendered = render(binding, 100);

  const totalLines = rendered.nLines + 1;
  const visibleRange = editor.visibleRanges[0];
  const lineToStart = Math.max(
    visibleRange.start.line,
    // (visibleRange.end.line + visibleRange.start.line - totalLines) >> 1
    visibleRange.end.line - totalLines + 1
  );

  const decoHeader = getHeaderDeco(`${path}-`, rendered.nLines);
  const decoBg = getBgDeco(rendered.nLines);

  const decoTypes = rendered.decos.map(([tt, str]) => {
    let tro: ThemableDecorationAttachmentRenderOptions = {};
    switch (tt) {
      case "key":
        tro = { color: "#bc6ec5", fontWeight: "bold" };
        break;
      case "arrow":
        tro = { color: "#2d9574" };
        break;
      case "binding":
        tro = { color: "#4190d8" };
        break;
      case "command":
        tro = { color: "#ccc" };
        break;
    }
    return window.createTextEditorDecorationType({
      color: "transparent",
      before: {
        ...tro,
        ...renderTextDeco(str),
      },
    });
  });

  const docLines = editor.document.lineCount;
  const tableEndLine = editor.document.lineAt(
    Math.min(docLines - 1, lineToStart + rendered.nLines - 1)
  );

  const tableRange = new Range(
    new Position(lineToStart, 0),
    tableEndLine.range.end
  );
  editor.setDecorations(decoHeader, [tableRange]);
  editor.setDecorations(decoBg, [tableRange]);
  decoTypes.forEach((dt) => {
    disposableDecos.push(dt);
    editor.setDecorations(dt, [tableRange]);
  });
  disposableDecos.push(decoHeader);
  disposableDecos.push(decoBg);
}

export async function activate(context: ExtensionContext) {
  writeKeyBinding();

  statusBar = window.createStatusBarItem("whichkeyState");
  statusBar.show();

  await commands.executeCommand("_setContext", WHICHKEY_STATE, globalPath);
  context.subscriptions.push(
    commands.registerCommand("whichkey.render", setAndRenderPath),
    commands.registerCommand("whichkey.onkey", onkey)
  );
}

export function deactivate() {}
