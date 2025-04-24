import {
  Disposable,
  DocumentSymbol,
  DocumentSymbolProvider,
  Event,
  EventEmitter,
  ExtensionContext,
  FileChangeEvent,
  FileStat,
  FileSystemProvider,
  FileType,
  languages,
  Range,
  SymbolKind,
  TextDocument,
  Uri,
  workspace,
} from "vscode";
import { RIPGREP_LANGID } from "./rgEditor";

export const scheme = "leaderkey.ripgrep.dummy";

class DummyFs implements FileSystemProvider {
  stat(_uri: Uri): FileStat {
    return {
      type: FileType.File,
      ctime: 0,
      mtime: 0,
      size: 0,
    };
  }
  readDirectory(_uri: Uri): [string, FileType][] {
    return [];
  }
  readFile(_uri: Uri): Uint8Array {
    return new TextEncoder().encode("\n".repeat(200));
  }
  writeFile(
    _uri: Uri,
    _content: Uint8Array,
    _options: { create: boolean; overwrite: boolean },
  ): void {}
  rename(_oldUri: Uri, _newUri: Uri, _options: { overwrite: boolean }): void {}
  delete(_uri: Uri): void {}
  createDirectory(_uri: Uri): void {}

  private _emitter = new EventEmitter<FileChangeEvent[]>();
  readonly onDidChangeFile: Event<FileChangeEvent[]> = this._emitter.event;

  watch(_resource: Uri): Disposable {
    return new Disposable(() => {});
  }
}

export function register(context: ExtensionContext) {
  context.subscriptions.push(
    workspace.registerFileSystemProvider(scheme, new DummyFs(), {
      isReadonly: true,
    }),

    languages.registerDocumentSymbolProvider(
      [{ language: RIPGREP_LANGID }],
      new (class implements DocumentSymbolProvider {
        provideDocumentSymbols(document: TextDocument): DocumentSymbol[] {
          const line0 = document.lineAt(0);
          const fullRange = new Range(
            line0.range.start,
            document.lineAt(document.lineCount - 1).range.end,
          );
          return [
            new DocumentSymbol(
              "(Leaderkey) | C-{l,h,.} → change dir | C-{j,k,d,u} → move selection | M(alt) → toggle (C)ase/(W)ord/(R)egex",
              "",
              SymbolKind.Property,
              fullRange,
              line0.range,
            ),
          ];
        }
      })(),
    ),
  );
}
