import {
  commands,
  Disposable,
  ExtensionContext,
  Range,
  ThemableDecorationAttachmentRenderOptions,
  window,
} from "vscode";
import { render } from "./command";
import { root } from "./vspacecode";

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
               content: '${escaped}';`,
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
      width: "100ch",
      margin: `0 -1ch 0 0; position: absolute;`,
    },
  });
}

export function activate(context: ExtensionContext) {
  console.log('Congratulations, your extension "whichkey" is now active!');

  const disposable = commands.registerCommand(
    "whichkey.helloWorld",
    async () => {
      disposableDecos.forEach((d) => d.dispose());
      const editorLayout = await commands.executeCommand(
        "vscode.getEditorLayout"
      );

      const editor = window.activeTextEditor;
      editor?.viewColumn;

      if (editor === undefined) return;

      const rendered = render(root, 100);

      const decoBg = getBgDeco(rendered.nLines);
      disposableDecos.push(decoBg);

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

      editor.setDecorations(decoBg, [
        new Range(1, 0, 1 - 1 + rendered.nLines, 0),
      ]);
      decoTypes.forEach((dt) => {
        disposableDecos.push(dt);
        editor.setDecorations(dt, [new Range(1, 0, 1, 0)]);
      });
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
