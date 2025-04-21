import {
  commands,
  languages,
  Range,
  Selection,
  TextDocument,
  TextEditor,
  TextEditorRevealType,
  ThemeColor,
  Uri,
  window,
  workspace,
} from "vscode";
import { openFile } from "../common/remote";
import { getNumTotal } from "../common/renderRange";
import { eagerDebouncer } from "../common/throttle";
import { scheme } from "./dummyFs";

const RIPGREP_LANGID = "leaderkey-ripgrep-panel";

interface EditorGroupSubLayout {
  groups?: EditorGroupSubLayout[];
  size: number;
}

interface EditorGroupLayout extends EditorGroupSubLayout {
  orientation: 0 | 1; // 0: LeftRight, 1: UpDown
}

function numGroups(layout: EditorGroupSubLayout): number {
  if (layout.groups === undefined) return 1;
  return layout.groups.reduce((s, l) => s + numGroups(l), 0);
}

function guessGroupHeight() {
  // https://github.com/microsoft/vscode/issues/125341#issuecomment-854812591
  const fontSize = workspace.getConfiguration("editor").get("fontSize", 12) || 12;
  const lineHeight = Math.max(8, Math.round(1.5 * fontSize));
  return lineHeight * getNumTotal() + 60;
}

// TODO store old layout to restore!
async function getRgPanelEditor() {
  const file = Uri.from({ scheme, path: `/rg` });
  const doc = await workspace.openTextDocument(file);
  languages.setTextDocumentLanguage(doc, RIPGREP_LANGID);

  const editorGroupLayout: EditorGroupLayout = await commands.executeCommand(
    "vscode.getEditorLayout",
  );

  const guessedHeight = guessGroupHeight();
  if (editorGroupLayout.orientation == 1) {
    if (editorGroupLayout.groups === undefined) {
      throw "Unexpected editor layout (groups is undefined)";
    }
    // updown, add another one in the bottom
    editorGroupLayout.groups.push({ size: guessedHeight });
  } else {
    // leftright, add into the bottom
    editorGroupLayout.orientation = 1;
    editorGroupLayout.groups = [
      { groups: editorGroupLayout.groups, size: Math.max(100, 1000 - guessedHeight) },
      { size: guessedHeight },
    ];
  }

  await commands.executeCommand("vscode.setEditorLayout", editorGroupLayout);

  const docLine0End = doc.lineAt(0).range.end;
  const rgPanelEditor = await window.showTextDocument(doc, {
    viewColumn: numGroups(editorGroupLayout),
    selection: new Range(docLine0End, docLine0End),
  });

  // try to adjust the height: three times should be enough
  const targetLinesVisible = getNumTotal() + 3;
  for (let i = 0; i < 3; i++) {
    if (rgPanelEditor.visibleRanges.length > 0) {
      const linesVisible =
        rgPanelEditor.visibleRanges[0].end.line -
        rgPanelEditor.visibleRanges[0].start.line +
        1;
      if (linesVisible === targetLinesVisible) break;
      // adjust the height
      {
        const editorGroupLayout: EditorGroupLayout = await commands.executeCommand(
          "vscode.getEditorLayout",
        );
        if (
          editorGroupLayout.orientation === 1 &&
          editorGroupLayout.groups !== undefined
        ) {
          const groups = editorGroupLayout.groups;
          const sumHeights = groups.reduce((s, l) => s + l.size, 0);
          const lastHeight = groups[groups.length - 1].size;
          const targetHeight = Math.ceil(
            (lastHeight / linesVisible) * targetLinesVisible,
          );

          const topGroupsRatio = (sumHeights - targetHeight) / (sumHeights - lastHeight);
          groups.map((g, i) => {
            if (i === groups.length - 1) {
              g.size = targetHeight;
            } else {
              g.size = Math.floor(topGroupsRatio * g.size);
            }
          });
          await commands.executeCommand("vscode.setEditorLayout", editorGroupLayout);
        } else {
          window.showWarningMessage(
            "leaderkey failed to adjust group height for ripgrep panel",
          );
        }
      }
    }
  }
  return rgPanelEditor;
}

const focusDecoration = window.createTextEditorDecorationType({
  isWholeLine: true,
  backgroundColor: new ThemeColor("list.activeSelectionBackground"),
});

async function closeCurrentEditor() {
  await commands.executeCommand("workbench.action.revertAndCloseActiveEditor");
  if (
    workspace
      .getConfiguration("workbench.editor")
      .get<boolean>("closeEmptyGroups", true) === false
  ) {
    await commands.executeCommand("workbench.action.closeGroup");
  }
}

async function vimEsc(goToLine?: number) {
  let vimCmds = ["<Esc>"];
  if (goToLine !== undefined) {
    vimCmds = [...`${goToLine}ggzz`, "<Esc>"];
  }
  try {
    await commands.executeCommand("vim.remap", { after: vimCmds });
  } catch {}
}

export class RgEditor {
  // undefined when being initialized
  private rgPanelEditor: TextEditor | undefined;
  private rgPanelPromise: Promise<TextEditor>;
  private reqViewColumn: number | undefined;
  private reqDoc: TextDocument;

  // `undefined` indicates that the RgEditor is no longer active
  private toPreview: { path: string; line: number } | undefined;
  private previewDebouncer: () => void;

  constructor(reqSrcEditor: TextEditor, onInit: () => void) {
    this.rgPanelEditor = reqSrcEditor;
    this.reqViewColumn = reqSrcEditor.viewColumn;
    this.reqDoc = reqSrcEditor.document;

    this.rgPanelEditor = undefined;
    this.rgPanelPromise = getRgPanelEditor();
    this.rgPanelPromise.then((editor) => {
      this.rgPanelEditor = editor;
      onInit();
    });

    this.previewDebouncer = eagerDebouncer(async () => await this.doPreview(), 100);
  }

  public getEditor() {
    return this.rgPanelEditor;
  }

  public preview(path: string, line: number) {
    this.toPreview = { path, line };
    this.previewDebouncer();
  }

  private async doPreview() {
    if (this.toPreview === undefined) return;
    const { path, line } = this.toPreview;
    const viewColumn = this.reqViewColumn ?? 1;
    await openFile(path, {
      viewColumn,
      preserveFocus: true,
      preview: true,
    });
    const editor = window.visibleTextEditors.find((te) => te.viewColumn === viewColumn);
    if (editor) {
      const lineL = editor.document.lineAt(line - 1).range;
      editor.setDecorations(focusDecoration, [lineL]);
      editor.revealRange(lineL, TextEditorRevealType.InCenter);
    }
  }

  public async enter(path: string, line: number) {
    await this.quit(false);

    const viewColumn = this.reqViewColumn ?? 1;
    await openFile(path, { viewColumn, preview: false });
    const editor = window.activeTextEditor;
    if (editor && editor.viewColumn === viewColumn) {
      const doc = editor.document;
      const lineL = doc.lineAt(line - 1).range;
      editor.selections = [new Selection(lineL.start, lineL.start)];
      editor.setDecorations(focusDecoration, []);
      await vimEsc(line);
    }
  }

  public async quit(backToStart: boolean) {
    if (this.toPreview === undefined) return;
    this.toPreview = undefined;
    {
      const rgPanelEditor = await this.rgPanelPromise;
      // close rgPanel editor
      const doc = rgPanelEditor.document;
      const activeEditor = window.activeTextEditor;
      if (
        activeEditor !== undefined &&
        activeEditor.document.uri.toString() === doc.uri.toString()
      ) {
        await closeCurrentEditor();
      } else {
        // try to switch to the panel editor doc on the same view column
        await window.showTextDocument(doc, {
          preserveFocus: false,
          viewColumn: rgPanelEditor.viewColumn,
        });
        const activeEditor = window.activeTextEditor;
        if (
          activeEditor !== undefined &&
          activeEditor.document.uri.toString() === doc.uri.toString()
        ) {
          await closeCurrentEditor();
        }
      }
    }

    // try to remove decorations on the preview editor
    for (const editor of window.visibleTextEditors) {
      editor.setDecorations(focusDecoration, []);
    }

    // go back to the original editor
    if (backToStart) {
      if (this.reqDoc !== undefined) {
        const editor = await window.showTextDocument(this.reqDoc, {
          viewColumn: this.reqViewColumn,
          preserveFocus: false,
          preview: false,
        });
        await vimEsc();
        editor.revealRange(editor.selection, TextEditorRevealType.InCenter);
      }
    }
  }
}
