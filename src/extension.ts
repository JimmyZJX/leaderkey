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
  workspace,
} from "vscode";
import {
  Command,
  go,
  isBindings,
  isCommand,
  overrideExn,
  render,
  sanitize,
} from "./command";
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
      height: `${100 * height + 200}%`,
      width: "200ch",
      margin: `0 -1ch 0 0; position: absolute; z-index: 1; top: -50%;`,
    },
  });
}

function getHeaderDeco(text: string, tableLines: number) {
  return window.createTextEditorDecorationType({
    color: "transparent",
    before: {
      contentText: text,
      backgroundColor: "#5d4d7a",
      height: "100%",
      width: "200ch",
      margin: `0 -1ch 0 0; position: absolute; z-index: 2; top: ${tableLines}00%`,
    },
  });
}

let globalPath = "";
let globalRoot = structuredClone(root);

function onkey(key: string) {
  const newPath = (globalPath === "" ? "" : globalPath + " ") + key;
  const bOrC = go(globalRoot, newPath);
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
    const cmds = cmd.commands.map((command) =>
      typeof command === "string" ? { command } : command
    );
    commands.executeCommand("runCommands", { commands: cmds });
  } else {
    commands.executeCommand(
      cmd.command!,
      ...(cmd.args === undefined ? [] : [cmd.args])
    );
  }
  setToInit();
}

function setToInit() {
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
  commands.executeCommand("_setContext", WHICHKEY_STATE, globalPath);
  if (path === "") return;
  const binding = go(globalRoot, path);
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

  workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("whichkey")) {
      confOverrideRefresh();
    }
  });
  confOverrideRefresh();
}

function confOverrideRefresh() {
  const newRoot = structuredClone(root);
  const overrides = workspace.getConfiguration("whichkey.overrides");
  const overrideEntries = Object.entries(overrides);
  overrideEntries.sort(([k1, _1], [k2, _2]) => k1.localeCompare(k2));
  for (const [key, v] of overrideEntries) {
    if (typeof v === "function") continue;
    if (typeof v === "object" && !Array.isArray(v)) {
      const entries = Object.entries(v);
      entries.sort(([k1, _1], [k2, _2]) => k1.localeCompare(k2));
      for (const [path, cmd] of entries) {
        try {
          overrideExn(
            newRoot,
            path,
            typeof cmd === "string"
              ? cmd
              : (Object.fromEntries(
                  Object.entries(cmd as any)
                ) as any as Command)
          );
        } catch (e) {
          window.showErrorMessage(
            `Error parsing config whichkey.overrides.${key}`
          );
        }
      }
    } else {
      window.showWarningMessage(
        `Config whichkey.overrides.${key} is not a dict`
      );
    }
  }
  globalRoot = sanitize(newRoot);
}

export function deactivate() {}
