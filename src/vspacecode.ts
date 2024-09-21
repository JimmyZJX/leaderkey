import { Bindings, sanitize } from "./command";

//   function loop(r: any): any {
//     if (r.bindings !== undefined) {
//       const keys: { [key: string]: any } = {};
//       r.bindings.forEach((binding: any) => {
//         const key = binding.key;
//         if (key === undefined)
//           throw `Unexpected 'key' not found: ${JSON.stringify(binding.name)}`;
//         delete binding.key;
//         keys[key] = loop(binding);
//       });
//       r.keys = keys;
//       delete r.bindings;
//     }
//     delete r.type;
//     return r;
//   }

//   const vsc = join(tmpdir(), "vsc.json");
//   writeFileSync(vsc, JSON.stringify(loop(vspacecodeBindings), undefined, 2));
//   window.showInformationMessage("whichkey: finish writing file");

const rawRoot: Bindings = {
  name: "<root>",
  keys: {
    "0": {
      name: "Focus on files explorer",
      command: "workbench.files.action.focusFilesExplorer",
    },
    "1": {
      name: "Focus 1st window",
      command: "workbench.action.focusFirstEditorGroup",
    },
    "2": {
      name: "Focus 2nd window",
      command: "workbench.action.focusSecondEditorGroup",
    },
    "3": {
      name: "Focus 3rd window",
      command: "workbench.action.focusThirdEditorGroup",
    },
    "4": {
      name: "Focus 4th window",
      command: "workbench.action.focusFourthEditorGroup",
    },
    "5": {
      name: "Focus 5th window",
      command: "workbench.action.focusFifthEditorGroup",
    },
    "6": {
      name: "Focus 6th window",
      command: "workbench.action.focusSixthEditorGroup",
    },
    "7": {
      name: "Focus 7th window",
      command: "workbench.action.focusSeventhEditorGroup",
    },
    "8": {
      name: "Focus 8th window",
      command: "workbench.action.focusEighthEditorGroup",
    },
    " ": {
      name: "Commands",
      command: "workbench.action.showCommands",
    },
    "\t": {
      name: "Last buffer",
      commands: [
        "workbench.action.quickOpenPreviousRecentlyUsedEditorInGroup",
        "list.select",
      ],
    },
    "!": {
      name: "Show terminal",
      command: "workbench.action.terminal.focus",
    },
    '"': {
      name: "Open new external terminal",
      command: "workbench.action.terminal.openNativeConsole",
    },
    $: {
      name: "Run Recent Command in Terminal",
      command: "workbench.action.terminal.runRecentCommand",
    },
    "'": {
      name: "Show terminal",
      command: "workbench.action.terminal.focus",
    },
    "*": {
      name: "Search in project with selection",
      commands: [
        "editor.action.addSelectionToNextFindMatch",
        "workbench.action.findInFiles",
        "search.action.focusSearchList",
      ],
    },
    ".": {
      name: "Repeat most recent action",
      command: "whichkey.repeatMostRecent",
      args: "vspacecode.bindings",
    },
    "/": {
      name: "Search in project",
      command: "workbench.action.findInFiles",
    },
    ";": {
      name: "Toggle comment",
      command: "editor.action.commentLine",
    },
    "?": {
      name: "Search keybindings",
      command: "whichkey.searchBindings",
    },
    v: {
      name: "Smart select/expand region",
      command: "editor.action.smartSelect.grow",
      keys: {
        v: {
          name: "Grow selection",
          command: "editor.action.smartSelect.grow",
        },
        V: {
          name: "Shrink selection",
          command: "editor.action.smartSelect.shrink",
        },
      },
    },
    ":": {
      name: "+Tasks",
      keys: {
        ".": {
          name: "Rerun last task",
          command: "workbench.action.tasks.reRunTask",
        },
        ":": {
          name: "Run task",
          command: "workbench.action.tasks.runTask",
        },
        b: {
          name: "Run build tasks",
          command: "workbench.action.tasks.build",
        },
        c: {
          name: "Configure task runner",
          command: "workbench.action.tasks.configureTaskRunner",
        },
        g: {
          name: "Show running tasks",
          command: "workbench.action.tasks.showTasks",
        },
        l: {
          name: "Show task log",
          command: "workbench.action.tasks.showLog",
        },
        t: {
          name: "Run test task",
          command: "workbench.action.tasks.test",
        },
        x: {
          name: "Terminate task",
          command: "workbench.action.tasks.terminate",
        },
        R: {
          name: "Restart running task",
          command: "workbench.action.tasks.restartTask",
        },
      },
    },
    b: {
      name: "+Buffers",
      keys: {
        "0": {
          name: "Last buffer in window",
          command: "workbench.action.lastEditorInGroup",
        },
        "1": {
          name: "First buffer in window",
          command: "workbench.action.openEditorAtIndex1",
        },
        "2": {
          name: "2nd buffer in window",
          command: "workbench.action.openEditorAtIndex2",
        },
        "3": {
          name: "3rd buffer in window",
          command: "workbench.action.openEditorAtIndex3",
        },
        "4": {
          name: "4th buffer in window",
          command: "workbench.action.openEditorAtIndex4",
        },
        "5": {
          name: "5th buffer in window",
          command: "workbench.action.openEditorAtIndex5",
        },
        "6": {
          name: "6th buffer in window",
          command: "workbench.action.openEditorAtIndex6",
        },
        "7": {
          name: "7th buffer in window",
          command: "workbench.action.openEditorAtIndex7",
        },
        "8": {
          name: "8th buffer in window",
          command: "workbench.action.openEditorAtIndex8",
        },
        "9": {
          name: "9th buffer in window",
          command: "workbench.action.openEditorAtIndex9",
        },
        b: {
          name: "Show all buffers",
          command: "workbench.action.showAllEditorsByMostRecentlyUsed",
        },
        d: {
          name: "Close active buffer",
          command: "workbench.action.closeActiveEditor",
        },
        h: {
          name: "Move buffer into left window",
          command: "workbench.action.moveEditorToLeftGroup",
        },
        j: {
          name: "Move buffer into below window",
          command: "workbench.action.moveEditorToBelowGroup",
        },
        k: {
          name: "Move buffer into above window",
          command: "workbench.action.moveEditorToAboveGroup",
        },
        l: {
          name: "Move buffer into right window",
          command: "workbench.action.moveEditorToRightGroup",
        },
        n: {
          name: "Next buffer",
          command: "workbench.action.nextEditor",
        },
        p: {
          name: "Previous buffer",
          command: "workbench.action.previousEditor",
        },
        s: {
          name: "Scratch buffer",
          command: "workbench.action.files.newUntitledFile",
        },
        t: {
          name: "Pin buffer",
          command: "workbench.action.pinEditor",
        },
        u: {
          name: "Reopen closed buffer",
          command: "workbench.action.reopenClosedEditor",
        },
        B: {
          name: "Show all buffers in active window",
          command: "workbench.action.showEditorsInActiveGroup",
        },
        H: {
          name: "Move buffer into left window",
          command: "workbench.action.moveEditorToLeftGroup",
        },
        J: {
          name: "Move buffer into below window",
          command: "workbench.action.moveEditorToBelowGroup",
        },
        K: {
          name: "Move buffer into above window",
          command: "workbench.action.moveEditorToAboveGroup",
        },
        L: {
          name: "Move buffer into right window",
          command: "workbench.action.moveEditorToRightGroup",
        },
        M: {
          name: "Close other buffers",
          command: "workbench.action.closeOtherEditors",
        },
        P: {
          name: "Paste clipboard to buffer",
          commands: [
            "editor.action.selectAll",
            "editor.action.clipboardPasteAction",
          ],
        },
        R: {
          name: "Revert the current buffer",
          command: "workbench.action.files.revert",
        },
        T: {
          name: "Unpin buffer",
          command: "workbench.action.unpinEditor",
        },
        Y: {
          name: "Copy buffer to clipboard",
          command: "vspacecode.copyWholeBuffer",
        },
        N: {
          name: "+New Buffer",
          keys: {
            h: {
              name: "New untitled buffer (split left)",
              commands: [
                "workbench.action.splitEditorLeft",
                "workbench.action.files.newUntitledFile",
                "workbench.action.closeOtherEditors",
              ],
            },
            j: {
              name: "New untitled buffer (split down)",
              commands: [
                "workbench.action.splitEditorDown",
                "workbench.action.files.newUntitledFile",
                "workbench.action.closeOtherEditors",
              ],
            },
            k: {
              name: "New untitled buffer (split up)",
              commands: [
                "workbench.action.splitEditorUp",
                "workbench.action.files.newUntitledFile",
                "workbench.action.closeOtherEditors",
              ],
            },
            l: {
              name: "New untitled buffer (split right)",
              commands: [
                "workbench.action.splitEditorRight",
                "workbench.action.files.newUntitledFile",
                "workbench.action.closeOtherEditors",
              ],
            },
            n: {
              name: "New untitled buffer",
              command: "workbench.action.files.newUntitledFile",
            },
          },
        },
      },
    },
    c: {
      name: "+Compile/Comments",
      keys: {
        c: {
          name: "Compile project",
          command: "workbench.action.tasks.build",
        },
        l: {
          name: "Toggle line comment",
          command: "editor.action.commentLine",
        },
        n: {
          name: "Next error",
          command: "editor.action.marker.nextInFiles",
        },
        N: {
          name: "Previous error",
          command: "editor.action.marker.prevInFiles",
        },
      },
    },
    d: {
      name: "+Debug",
      keys: {
        c: {
          name: "Continue debug",
          command: "workbench.action.debug.continue",
        },
        d: {
          name: "Start debug",
          command: "workbench.action.debug.start",
        },
        i: {
          name: "Step into",
          command: "workbench.action.debug.stepInto",
        },
        j: {
          name: "Jump to cursor",
          command: "debug.jumpToCursor",
        },
        o: {
          name: "Step out",
          command: "workbench.action.debug.stepOut",
        },
        p: {
          name: "Pause debug",
          command: "workbench.action.debug.pause",
        },
        s: {
          name: "Step over",
          command: "workbench.action.debug.stepOver",
        },
        v: {
          name: "REPL",
          command: "workbench.debug.action.toggleRepl",
        },
        w: {
          name: "Focus on watch window",
          command: "workbench.debug.action.focusWatchView",
        },
        C: {
          name: "Continue to cursor",
          command: "editor.debug.action.runToCursor",
        },
        D: {
          name: "Run without debugging",
          command: "workbench.action.debug.run",
        },
        R: {
          name: "Restart debug",
          command: "workbench.action.debug.restart",
        },
        S: {
          name: "Stop debug",
          command: "workbench.action.debug.stop",
        },
        W: {
          name: "Add to watch",
          command: "editor.debug.action.selectionToWatch",
        },
        b: {
          name: "+Breakpoint",
          keys: {
            b: {
              name: "Toggle breakpoint",
              command: "editor.debug.action.toggleBreakpoint",
            },
            c: {
              name: "Add conditional breakpoint",
              command: "editor.debug.action.conditionalBreakpoint",
            },
            d: {
              name: "Delete breakpoint",
              command: "debug.removeBreakpoint",
            },
            e: {
              name: "Enable breakpoint",
              command: "debug.enableOrDisableBreakpoint",
            },
            f: {
              name: "Add function breakpoint",
              command:
                "workbench.debug.viewlet.action.addFunctionBreakpointAction",
            },
            i: {
              name: "Toggle inline breakpoint",
              command: "editor.debug.action.toggleInlineBreakpoint",
            },
            n: {
              name: "Next breakpoint",
              command: "editor.debug.action.goToNextBreakpoint",
              keys: {
                n: {
                  name: "Next breakpoint",
                  command: "editor.debug.action.goToNextBreakpoint",
                },
                p: {
                  name: "Previous breakpoint",
                  command: "editor.debug.action.goToPreviousBreakpoint",
                },
              },
            },
            p: {
              name: "Previous breakpoint",
              command: "editor.debug.action.goToPreviousBreakpoint",
              keys: {
                n: {
                  name: "Next breakpoint",
                  command: "editor.debug.action.goToNextBreakpoint",
                },
                p: {
                  name: "Previous breakpoint",
                  command: "editor.debug.action.goToPreviousBreakpoint",
                },
              },
            },
            s: {
              name: "Disable breakpoint",
              command: "debug.enableOrDisableBreakpoint",
            },
            D: {
              name: "Delete all breakpoints",
              command: "workbench.debug.viewlet.action.removeAllBreakpoints",
            },
            E: {
              name: "Enable all breakpoints",
              command: "workbench.debug.viewlet.action.enableAllBreakpoints",
            },
            S: {
              name: "Disable all breakpoints",
              command: "workbench.debug.viewlet.action.disableAllBreakpoints",
            },
          },
        },
      },
    },
    e: {
      name: "+Errors",
      keys: {
        ".": {
          name: "Error transient",
          keys: {
            f: {
              name: "Fix error",
              command: "editor.action.quickFix",
            },
            n: {
              name: "Next error",
              command: "editor.action.marker.nextInFiles",
            },
            p: {
              name: "Previous error",
              command: "editor.action.marker.prevInFiles",
            },
            N: {
              name: "Previous error",
              command: "editor.action.marker.prevInFiles",
            },
          },
        },
        e: {
          name: "Show error",
          command: "editor.action.showHover",
        },
        f: {
          name: "Fix error",
          command: "editor.action.quickFix",
        },
        l: {
          name: "List errors",
          command: "workbench.actions.view.problems",
        },
        n: {
          name: "Next error",
          command: "editor.action.marker.nextInFiles",
        },
        p: {
          name: "Previous error",
          command: "editor.action.marker.prevInFiles",
        },
        N: {
          name: "Previous error",
          command: "editor.action.marker.prevInFiles",
        },
      },
    },
    f: {
      name: "+File",
      keys: {
        f: {
          name: "Open file/folder",
          command: "file-browser.open",
        },
        l: {
          name: "Change file language",
          command: "workbench.action.editor.changeLanguageMode",
        },
        n: {
          name: "New file",
          command: "explorer.newFile",
        },
        o: {
          name: "+Open with",
          command: "explorer.openWith",
        },
        r: {
          name: "+Open recent",
          command: "workbench.action.openRecent",
        },
        s: {
          name: "Save file",
          command: "workbench.action.files.save",
        },
        t: {
          name: "Toggle tree/explorer view",
          keys: {
            "": {
              name: "Show explorer view",
              command: "workbench.view.explorer",
            },
            "when:sideBarVisible && explorerViewletVisible": {
              name: "Hide side bar",
              command: "workbench.action.toggleSidebarVisibility",
            },
          },
        },
        w: {
          name: "Open active in new window",
          command: "workbench.action.files.showOpenedFileInNewWindow",
        },
        D: {
          name: "Delete current file",
          commands: [
            "workbench.files.action.showActiveFileInExplorer",
            "deleteFile",
          ],
        },
        L: {
          name: "Locate file",
          command: "revealFileInOS",
        },
        R: {
          name: "Rename file",
          commands: ["revealInExplorer", "renameFile"],
        },
        S: {
          name: "Save all files",
          command: "workbench.action.files.saveAll",
        },
        T: {
          name: "Show active file in tree/explorer view",
          command: "workbench.files.action.showActiveFileInExplorer",
        },
        e: {
          name: "+Emacs/VSpaceCode",
          keys: {
            d: {
              name: "Open settings",
              command: "workbench.action.openGlobalSettings",
            },
            k: {
              name: "Open global key bindings",
              command: "workbench.action.openGlobalKeybindings",
            },
            l: {
              name: "Open language settings",
              command: "workbench.action.configureLanguageBasedSettings",
            },
            s: {
              name: "Configure user snippets",
              command: "workbench.action.openSnippets",
            },
            w: {
              name: "Open workspace settings",
              command: "workbench.action.openWorkspaceSettings",
            },
            D: {
              name: "Open settings JSON",
              command: "workbench.action.openSettingsJson",
            },
            K: {
              name: "Open global key bindings JSON",
              command: "workbench.action.openGlobalKeybindingsFile",
            },
            W: {
              name: "Open workspace settings JSON",
              command: "workbench.action.openWorkspaceSettingsFile",
            },
          },
        },
        i: {
          name: "+Indentation",
          keys: {
            d: {
              name: "Detect indentation",
              command: "editor.action.detectIndentation",
            },
            i: {
              name: "Change indentation",
              command: "changeEditorIndentation",
            },
            r: {
              name: "Reindent",
              command: "editor.action.reindentlines",
            },
            s: {
              name: "Convert indentation to spaces",
              command: "editor.action.indentationToSpaces",
            },
            t: {
              name: "Convert indentation to tabs",
              command: "editor.action.indentationToTabs",
            },
            R: {
              name: "Reindent selected",
              command: "editor.action.reindentselectedlines",
            },
          },
        },
        y: {
          name: "+Yank",
          keys: {
            c: {
              name: "Copy path of active file with line and column",
              command: "vspacecode.copyPathWithLineColumn",
            },
            d: {
              name: "Copy directory path of the active file",
              command: "vspacecode.copyDirectoryPath",
            },
            l: {
              name: "Copy path of active file with line",
              command: "vspacecode.copyPathWithLine",
            },
            n: {
              name: "Copy filename of active file",
              command: "vspacecode.copyFilename",
            },
            y: {
              name: "Copy path of active file",
              command: "vspacecode.copyPath",
            },
            C: {
              name: "Copy relative path of active file with line and column",
              command: "vspacecode.copyRelativePathWithLineColumn",
            },
            D: {
              name: "Copy relative directory path of the active file",
              command: "vspacecode.copyRelativeDirectoryPath",
            },
            L: {
              name: "Copy relative path of active file with line",
              command: "vspacecode.copyRelativePathWithLine",
            },
            N: {
              name: "Copy filename without extension of active file",
              command: "vspacecode.copyFilenameBase",
            },
            Y: {
              name: "Copy relative path of active file",
              command: "vspacecode.copyRelativePath",
            },
          },
        },
      },
    },
    g: {
      name: "+Git",
      keys: {
        b: {
          name: "Blame file",
          command: "magit.blame-file",
        },
        c: {
          name: "Clone",
          command: "git.clone",
        },
        i: {
          name: "Initialize repository",
          command: "git.init",
        },
        m: {
          name: "Magit dispatch",
          command: "magit.dispatch",
        },
        s: {
          name: "Status",
          command: "magit.status",
        },
        S: {
          name: "Stage file",
          command: "magit.stage-file",
        },
        U: {
          name: "Unstage file",
          command: "magit.unstage-file",
        },
        f: {
          name: "+File",
          keys: {
            d: {
              name: "Diff",
              command: "magit.diff-file",
            },
            l: {
              name: "Show log/timeline",
              command: "timeline.focus",
            },
          },
        },
      },
    },
    h: {
      name: "+Help",
      keys: {
        d: {
          name: "Open VSCode Documentation",
          command: "workbench.action.openDocumentationUrl",
        },
        k: {
          name: "Open global key bindings",
          command: "workbench.action.openGlobalKeybindings",
        },
        D: {
          name: "Open VSpaceCode Documentation",
          command: "vspacecode.openDocumentationUrl",
        },
        I: {
          name: "Report VSCode Issue",
          command: "workbench.action.openIssueReporter",
        },
        T: {
          name: "Open VSCode Tutorial",
          command: "workbench.action.showInteractivePlayground",
        },
      },
    },
    i: {
      name: "+Insert",
      keys: {
        j: {
          name: "Insert line below",
          command: "editor.action.insertLineAfter",
        },
        k: {
          name: "Insert line above",
          command: "editor.action.insertLineBefore",
        },
        s: {
          name: "Insert snippet",
          command: "editor.action.insertSnippet",
        },
      },
    },
    j: {
      name: "+Jump/Join/Split",
      keys: {
        "+": {
          name: "Format buffer",
          command: "editor.action.formatDocument",
        },
        "=": {
          name: "Format region or buffer",
          command: "editor.action.format",
        },
        c: {
          name: "Jump to previous change",
          command: "workbench.action.editor.previousChange",
        },
        i: {
          name: "Jump to symbol in buffer",
          command: "workbench.action.gotoSymbol",
        },
        j: {
          name: "Jump to character",
          command: "vim.remap",
          args: {
            after: ["leader", "leader", "s"],
          },
        },
        l: {
          name: "Jump to line",
          command: "vim.remap",
          args: {
            after: ["leader", "leader", "leader", "b", "d", "j", "k"],
          },
        },
        n: {
          name: "Split new line",
          command: "lineBreakInsert",
        },
        v: {
          name: "Jump to outline/variables",
          command: "breadcrumbs.focusAndSelect",
        },
        w: {
          name: "Jump to word",
          command: "vim.remap",
          args: {
            after: ["leader", "leader", "leader", "b", "d", "w"],
          },
        },
        C: {
          name: "Jump to next change",
          command: "workbench.action.editor.nextChange",
        },
        I: {
          name: "Jump to symbol in project",
          command: "workbench.action.showAllSymbols",
        },
      },
    },
    l: {
      name: "+Layouts",
      keys: {
        d: {
          name: "Close workspace",
          command: "workbench.action.closeFolder",
        },
      },
    },

    p: {
      name: "+Project",
      keys: {
        c: {
          name: "Compile project",
          command: "workbench.action.tasks.build",
        },
        f: {
          name: "+Find file in project",
          command: "workbench.action.quickOpen",
        },
        l: {
          name: "+Switch project",
          command: "workbench.action.openRecent",
        },
        p: {
          name: "+Switch project",
          command: "workbench.action.openRecent",
        },
        t: {
          name: "Show tree/explorer view",
          command: "workbench.view.explorer",
        },
        R: {
          name: "+Replace in files",
          command: "workbench.action.replaceInFiles",
        },
        T: {
          name: "Test project",
          command: "workbench.action.tasks.test",
        },
      },
    },
    q: {
      name: "+Quit",
      keys: {
        f: {
          name: "Close frame",
          command: "workbench.action.closeWindow",
        },
        q: {
          name: "Close frame",
          command: "workbench.action.closeWindow",
        },
        r: {
          name: "Reload frame",
          command: "workbench.action.reloadWindow",
        },
        s: {
          name: "Save all and close frame",
          commands: [
            "workbench.action.files.saveAll",
            "workbench.action.closeWindow",
          ],
        },
        Q: {
          name: "Quit application",
          command: "workbench.action.quit",
        },
        R: {
          name: "Reload frame with extensions disabled",
          command: "workbench.action.reloadWindowWithExtensionsDisabled",
        },
      },
    },
    r: {
      name: "+Resume/Repeat",
      keys: {
        ".": {
          name: "Repeat recent actions",
          command: "whichkey.repeatRecent",
          args: "vspacecode.bindings",
        },
        b: {
          name: "Recent buffers",
          command: "workbench.action.showAllEditorsByMostRecentlyUsed",
        },
        s: {
          name: "Search in project",
          command: "workbench.action.findInFiles",
        },
      },
    },
    s: {
      name: "+Search/Symbol",
      keys: {
        c: {
          name: "Clear highlight",
          command: "vim.remap",
          args: {
            commands: [
              {
                command: ":noh",
              },
            ],
          },
        },
        e: {
          name: "Edit symbol",
          command: "editor.action.rename",
        },
        h: {
          name: "Highlight symbol",
          command: "editor.action.wordHighlight.trigger",
          keys: {
            "/": {
              name: "Search in project with selection",
              commands: [
                "editor.action.addSelectionToNextFindMatch",
                "workbench.action.findInFiles",
              ],
            },
            n: {
              name: "Next occurrence",
              command: "editor.action.wordHighlight.next",
            },
            p: {
              name: "Previous occurrence",
              command: "editor.action.wordHighlight.prev",
            },
            N: {
              name: "Previous occurrence",
              command: "editor.action.wordHighlight.prev",
            },
          },
        },
        j: {
          name: "Jump to symbol in buffer",
          command: "workbench.action.gotoSymbol",
        },
        p: {
          name: "Search in project",
          command: "workbench.action.findInFiles",
        },
        r: {
          name: "Search all references",
          command: "editor.action.referenceSearch.trigger",
        },
        s: {
          name: "Fuzzy search in current buffer",
          command: "fuzzySearch.activeTextEditorWithCurrentSelection",
        },
        J: {
          name: "Jump to symbol in project",
          command: "workbench.action.showAllSymbols",
        },
        P: {
          name: "Search in project with selection",
          commands: [
            "editor.action.addSelectionToNextFindMatch",
            "workbench.action.findInFiles",
          ],
        },
        R: {
          name: "Search all references in side bar",
          command: "references-view.find",
        },
        S: {
          name: "Fuzzy search with selection in current buffer",
          commands: [
            "editor.action.addSelectionToNextFindMatch",
            "fuzzySearch.activeTextEditorWithCurrentSelection",
          ],
        },
      },
    },
    t: {
      name: "+Toggles",
      keys: {
        c: {
          name: "Toggle find case sensitive",
          command: "toggleFindCaseSensitive",
        },
        l: {
          name: "Toggle word wrap",
          command: "editor.action.toggleWordWrap",
        },
        w: {
          name: "Toggle render whitespace",
          command: "editor.action.toggleRenderWhitespace",
        },
      },
    },
    w: {
      name: "+Window",
      keys: {
        "1": {
          name: "Single column window layout",
          command: "workbench.action.editorLayoutSingle",
        },
        "2": {
          name: "Double column window layout",
          command: "workbench.action.editorLayoutTwoColumns",
        },
        "3": {
          name: "Triple column window layout",
          command: "workbench.action.editorLayoutThreeColumns",
        },
        "4": {
          name: "Grid window layout",
          command: "workbench.action.editorLayoutTwoByTwoGrid",
        },
        "-": {
          name: "Split window below",
          command: "workbench.action.splitEditorDown",
        },
        "/": {
          name: "Split window right",
          command: "workbench.action.splitEditor",
        },
        "=": {
          name: "Reset window sizes",
          command: "workbench.action.evenEditorWidths",
        },
        "[": {
          name: "Shrink window",
          command: "workbench.action.decreaseViewSize",
          keys: {
            "[": {
              name: "Shrink window",
              command: "workbench.action.decreaseViewSize",
            },
            "]": {
              name: "Enlarge window",
              command: "workbench.action.increaseViewSize",
            },
          },
        },
        "]": {
          name: "Enlarge window",
          command: "workbench.action.increaseViewSize",
          keys: {
            "[": {
              name: "Shrink window",
              command: "workbench.action.decreaseViewSize",
            },
            "]": {
              name: "Enlarge window",
              command: "workbench.action.increaseViewSize",
            },
          },
        },
        d: {
          name: "Close window",
          command: "workbench.action.closeEditorsInGroup",
        },
        h: {
          name: "Focus window left",
          command: "workbench.action.navigateLeft",
        },
        j: {
          name: "Focus window down",
          command: "workbench.action.navigateDown",
        },
        k: {
          name: "Focus window up",
          command: "workbench.action.navigateUp",
        },
        l: {
          name: "Focus window right",
          command: "workbench.action.navigateRight",
        },
        m: {
          name: "Maximize window",
          command: "workbench.action.toggleMaximizeEditorGroup",
        },
        o: {
          name: "Switch frame",
          command: "workbench.action.quickSwitchWindow",
        },
        s: {
          name: "Split window below",
          command: "workbench.action.splitEditorDown",
        },
        v: {
          name: "Split window right",
          command: "workbench.action.splitEditor",
        },
        w: {
          name: "Focus next window",
          command: "workbench.action.focusNextGroup",
        },
        x: {
          name: "Close all windows",
          command: "workbench.action.closeAllGroups",
        },
        z: {
          name: "Combine all buffers",
          command: "workbench.action.joinAllGroups",
        },
        D: {
          name: "Close all other windows",
          command: "workbench.action.closeEditorsInOtherGroups",
        },
        F: {
          name: "Open new empty frame",
          command: "workbench.action.newWindow",
        },
        H: {
          name: "Move window left",
          command: "workbench.action.moveActiveEditorGroupLeft",
        },
        J: {
          name: "Move window down",
          command: "workbench.action.moveActiveEditorGroupDown",
        },
        K: {
          name: "Move window up",
          command: "workbench.action.moveActiveEditorGroupUp",
        },
        L: {
          name: "Move window right",
          command: "workbench.action.moveActiveEditorGroupRight",
        },
        M: {
          name: "Maximize window without hiding others",
          command: "workbench.action.toggleEditorWidths",
        },
        W: {
          name: "Focus previous window",
          command: "workbench.action.focusPreviousGroup",
        },
      },
    },
    x: {
      name: "+Text",
      keys: {
        ".": {
          name: "Quick fix",
          command: "editor.action.quickFix",
        },
        a: {
          name: "Find all references",
          command: "editor.action.referenceSearch.trigger",
        },
        i: {
          name: "Organize Imports",
          command: "editor.action.organizeImports",
        },
        o: {
          name: "Open link",
          command: "editor.action.openLink",
        },
        r: {
          name: "Rename symbol",
          command: "editor.action.rename",
        },
        u: {
          name: "To lower case",
          command: "editor.action.transformToLowercase",
        },
        J: {
          name: "Move lines down",
          command: "editor.action.moveLinesDownAction",
          keys: {
            J: {
              name: "Move lines down",
              command: "editor.action.moveLinesDownAction",
            },
            K: {
              name: "Move lines up",
              command: "editor.action.moveLinesUpAction",
            },
          },
        },
        K: {
          name: "Move lines up",
          command: "editor.action.moveLinesUpAction",
          keys: {
            J: {
              name: "Move lines down",
              command: "editor.action.moveLinesDownAction",
            },
            K: {
              name: "Move lines up",
              command: "editor.action.moveLinesUpAction",
            },
          },
        },
        R: {
          name: "Refactor",
          command: "editor.action.refactor",
        },
        U: {
          name: "To upper case",
          command: "editor.action.transformToUppercase",
        },
        d: {
          name: "+Delete",
          keys: {
            w: {
              name: "Delete trailing whitespace",
              command: "editor.action.trimTrailingWhitespace",
            },
          },
        },
        l: {
          name: "+Lines",
          keys: {
            d: {
              name: "Duplicate lines down",
              command: "editor.action.copyLinesDownAction",
            },
            s: {
              name: "Sort lines in ascending order",
              command: "editor.action.sortLinesAscending",
            },
            D: {
              name: "Duplicate lines up",
              command: "editor.action.copyLinesUpAction",
            },
            S: {
              name: "Sort lines in descending order",
              command: "editor.action.sortLinesDescending",
            },
          },
        },
        m: {
          name: "+Merge conflict",
          keys: {
            b: {
              name: "Accept both",
              command: "merge-conflict.accept.both",
            },
            c: {
              name: "Accept current",
              command: "merge-conflict.accept.current",
            },
            i: {
              name: "Accept incoming",
              command: "merge-conflict.accept.incoming",
            },
            k: {
              name: "Compare current conflict",
              command: "merge-conflict.compare",
            },
            n: {
              name: "Next Conflict",
              command: "merge-conflict.next",
            },
            s: {
              name: "Accept selection",
              command: "merge-conflict.accept.selection",
            },
            B: {
              name: "Accept all both",
              command: "merge-conflict.accept.all-both",
            },
            C: {
              name: "Accept all current",
              command: "merge-conflict.accept.all-current",
            },
            I: {
              name: "Accept all incoming",
              command: "merge-conflict.accept.all-incoming",
            },
            N: {
              name: "Previous Conflict",
              command: "merge-conflict.previous",
            },
          },
        },
      },
    },
    z: {
      name: "+Zoom/Fold",
      keys: {
        f: {
          name: "+Frame",
          keys: {
            "0": {
              name: "Reset zoom",
              command: "workbench.action.zoomReset",
            },
            "+": {
              name: "Zoom in",
              command: "workbench.action.zoomIn",
            },
            "-": {
              name: "Zoom out",
              command: "workbench.action.zoomOut",
            },
            "=": {
              name: "Zoom in",
              command: "workbench.action.zoomIn",
            },
            j: {
              name: "Zoom out",
              command: "workbench.action.zoomOut",
            },
            k: {
              name: "Zoom in",
              command: "workbench.action.zoomIn",
            },
          },
        },
        i: {
          name: "+Image preview",
          keys: {
            "+": {
              name: "Zoom in",
              command: "imagePreview.zoomIn",
            },
            "-": {
              name: "Zoom out",
              command: "imagePreview.zoomOut",
            },
            "=": {
              name: "Zoom in",
              command: "imagePreview.zoomIn",
            },
          },
        },
        x: {
          name: "+Font",
          keys: {
            "0": {
              name: "Reset zoom",
              command: "editor.action.fontZoomReset",
            },
            "+": {
              name: "Zoom in",
              command: "editor.action.fontZoomIn",
            },
            "-": {
              name: "Zoom out",
              command: "editor.action.fontZoomOut",
            },
            "=": {
              name: "Zoom in",
              command: "editor.action.fontZoomIn",
            },
            j: {
              name: "Zoom out",
              command: "editor.action.fontZoomOut",
            },
            k: {
              name: "Zoom in",
              command: "editor.action.fontZoomIn",
            },
          },
        },
        ".": {
          name: "+Fold",
          keys: {
            a: {
              name: "Toggle: around a point",
              command: "editor.toggleFold",
            },
            b: {
              name: "Close: all block comments",
              command: "editor.foldAllBlockComments",
            },
            c: {
              name: "Close: at a point",
              command: "editor.fold",
            },
            g: {
              name: "Close: all regions",
              command: "editor.foldAllMarkerRegions",
            },
            m: {
              name: "Close: all",
              command: "editor.foldAll",
            },
            o: {
              name: "Open: at a point",
              command: "editor.unfold",
            },
            r: {
              name: "Open: all",
              command: "editor.unfoldAll",
            },
            G: {
              name: "Open: all regions",
              command: "editor.unfoldAllMarkerRegions",
            },
            O: {
              name: "Open: recursively",
              command: "editor.unfoldRecursively",
            },
          },
        },
      },
    },
    D: {
      name: "+Diff/Compare",
      keys: {
        c: {
          name: "Compare active file with clipboard",
          command: "workbench.files.action.compareWithClipboard",
        },
        m: {
          name: "Compare current merge conflict",
          command: "merge-conflict.compare",
        },
        s: {
          name: "Compare active file with saved",
          command: "workbench.files.action.compareWithSaved",
        },
        w: {
          name: "Toggle ignore trim whitespace",
          command: "toggle.diff.ignoreTrimWhitespace",
        },
        D: {
          name: "+Compare active file with",
          command: "workbench.files.action.compareFileWith",
        },
      },
    },
    F: {
      name: "+Frame",
      keys: {
        n: {
          name: "Duplicate workspace in new frame",
          command: "workbench.action.duplicateWorkspaceInNewWindow",
        },
        o: {
          name: "Switch frame",
          command: "workbench.action.quickSwitchWindow",
        },
        N: {
          name: "Open new empty frame",
          command: "workbench.action.newWindow",
        },
      },
    },
    S: {
      name: "+Show",
      keys: {
        d: {
          name: "Show debug console",
          command: "workbench.debug.action.toggleRepl",
        },
        e: {
          name: "Show explorer",
          command: "workbench.view.explorer",
        },
        g: {
          name: "Show source control",
          command: "workbench.view.scm",
        },
        n: {
          name: "Show notification",
          command: "notifications.toggleList",
        },
        o: {
          name: "Show output",
          command: "workbench.action.output.toggleOutput",
        },
        p: {
          name: "Show problem",
          command: "workbench.actions.view.problems",
        },
        r: {
          name: "Show remote explorer",
          command: "workbench.view.remote",
        },
        s: {
          name: "Show search",
          command: "workbench.view.search",
        },
        t: {
          name: "Show test",
          command: "workbench.view.extension.test",
        },
        x: {
          name: "Show extensions",
          command: "workbench.view.extensions",
        },
      },
    },
    T: {
      name: "+UI toggles",
      keys: {
        b: {
          name: "Toggle side bar visibility",
          command: "workbench.action.toggleSidebarVisibility",
        },
        c: {
          name: "Toggle centered layout",
          command: "workbench.action.toggleCenteredLayout",
        },
        i: {
          name: "Select icon theme",
          command: "workbench.action.selectIconTheme",
        },
        j: {
          name: "Toggle panel visibility",
          command: "workbench.action.togglePanel",
        },
        m: {
          name: "Toggle maximized panel",
          command: "workbench.action.toggleMaximizedPanel",
        },
        s: {
          name: "Select theme",
          command: "workbench.action.selectTheme",
        },
        t: {
          name: "Toggle tool/activity bar visibility",
          command: "workbench.action.toggleActivityBarVisibility",
        },
        z: {
          name: "Toggle zen mode",
          command: "workbench.action.toggleZenMode",
        },
        F: {
          name: "Toggle full screen",
          command: "workbench.action.toggleFullScreen",
        },
        M: {
          name: "Toggle minimap",
          command: "editor.action.toggleMinimap",
        },
        T: {
          name: "Toggle tab visibility",
          command: "workbench.action.toggleTabsVisibility",
        },
      },
    },
  },
};

export const root = sanitize(rawRoot);

// const m: Bindings = {
//   name: "+Major",
//   keys: {
//     "languageId:agda": {
//       name: "Agda",
//       keys: {
//         ",": {
//           name: "Show goal type and context (simplified)",
//           command: "agda-mode.goal-type-and-context[Simplified]",
//         },
//         ".": {
//           name: "Show goal type, context and inferred type (simplified)",
//           command: "agda-mode.goal-type-context-and-inferred-type[Simplified]",
//         },
//         "=": {
//           name: "Show constraints",
//           command: "agda-mode.show-constraints",
//         },
//         "?": {
//           name: "Show all goals",
//           command: "agda-mode.show-goals",
//         },
//         a: {
//           name: "Automatic proof search",
//           command: "agda-mode.auto",
//         },
//         b: {
//           name: "Move to previous goal",
//           command: "agda-mode.previous-goal",
//         },
//         c: {
//           name: "Case split",
//           command: "agda-mode.case",
//         },
//         d: {
//           name: "Infer type (simplified)",
//           command: "agda-mode.infer-type[Simplified]",
//         },
//         e: {
//           name: "Show context (simplified)",
//           command: "agda-mode.context[Simplified]",
//         },
//         f: {
//           name: "Move to next goal",
//           command: "agda-mode.next-goal",
//         },
//         h: {
//           name: "Show helper function type (simplified)",
//           command: "agda-mode.helper-function-type[Simplified]",
//         },
//         l: {
//           name: "Load file",
//           command: "agda-mode.load",
//         },
//         n: {
//           name: "Compute normal form (simplified)",
//           command: "agda-mode.compute-normal-form[DefaultCompute]",
//         },
//         r: {
//           name: "Refine",
//           command: "agda-mode.refine",
//         },
//         s: {
//           name: "Solve constraints (simplified)",
//           command: "agda-mode.solve-constraints[Simplified]",
//         },
//         t: {
//           name: "Show goal type (simplified)",
//           command: "agda-mode.goal-type[Simplified]",
//         },
//         w: {
//           name: "Why in scope",
//           command: "agda-mode.why-in-scope",
//         },
//         x: {
//           name: "+Backend",
//           keys: {
//             c: {
//               name: "Compile module",
//               command: "agda-mode.compile",
//             },
//             h: {
//               name: "Toggle display of implicit arguments",
//               command: "agda-mode.toggle-display-of-implicit-arguments",
//             },
//             q: {
//               name: "Quit",
//               command: "agda-mode.quit",
//             },
//             r: {
//               name: "Restart",
//               command: "agda-mode.restart",
//             },
//           },
//         },
//       },
//     },
//     "languageId:clojure": {
//       name: "Clojure",
//       keys: {
//         "!": {
//           name: "Disconnect from REPL",
//           command: "calva.disconnect",
//         },
//         '"': {
//           name: "Jack-in to REPL",
//           command: "calva.jackIn",
//         },
//         "'": {
//           name: "Connect to REPL",
//           command: "calva.connect",
//         },
//         ".": {
//           name: "Connect or jack-in",
//           command: "calva.jackInOrConnect",
//         },
//         "=": {
//           name: "+Format",
//           keys: {
//             "=": {
//               name: "Format current form",
//               command: "calva-fmt.formatCurrentForm",
//             },
//             a: {
//               name: "Align current form",
//               command: "calva-fmt.alignCurrentForm",
//             },
//             d: {
//               name: "Dedent line",
//               command: "calva-fmt.tabDedent",
//             },
//             i: {
//               name: "Indent line",
//               command: "calva-fmt.tabIndent",
//             },
//           },
//         },
//         d: {
//           name: "+Debug",
//           keys: {
//             i: {
//               name: "Last evaluation results",
//               command: "calva.debug.instrument",
//             },
//             r: {
//               name: "Last evaluation results",
//               command: "calva.copyLastResults",
//             },
//             s: {
//               name: "Last stacktrace",
//               command: "calva.printLastStacktrace",
//             },
//           },
//         },
//         e: {
//           name: "+Evaluate",
//           keys: {
//             ":": {
//               name: "Evaluate current form as comment",
//               command: "calva.evaluateSelectionAsComment",
//             },
//             ";": {
//               name: "Evaluate top-level form as comment",
//               command: "calva.evaluateTopLevelFormAsComment",
//             },
//             e: {
//               name: "Evaluate current expression",
//               command: "calva.evaluateSelection",
//             },
//             f: {
//               name: "Evaluate top-level expression",
//               command: "calva.evaluateCurrentTopLevelForm",
//             },
//             i: {
//               name: "Interrupt evaluation",
//               command: "calva.interruptAllEvaluations",
//             },
//             l: {
//               name: "Clear inline evaluation results",
//               command: "calva.clearInlineResults",
//             },
//             n: {
//               name: "Evaluate all code in namespace",
//               command: "calva.loadFile",
//             },
//             s: {
//               name: "Select expression",
//               command: "calva.selectCurrentForm",
//             },
//             t: {
//               name: "Clear evaluation results",
//               command: "calva.requireREPLUtilities",
//             },
//             w: {
//               name: "Replace form with evaluation result",
//               command: "calva.evaluateSelectionReplace",
//             },
//           },
//         },
//         k: {
//           name: "+Structural editing",
//           keys: {
//             ".": {
//               name: "Toggle paredit mode",
//               command: "paredit.togglemode",
//             },
//             b: {
//               name: "Barf expression forward",
//               command: "paredit.barfSexpForward",
//             },
//             c: {
//               name: "Convolute expression",
//               command: "paredit.convolute",
//             },
//             h: {
//               name: "Backward expression",
//               command: "paredit.backwardSexp",
//             },
//             j: {
//               name: "Forward down expression",
//               command: "paredit.forwardDownSexp",
//             },
//             k: {
//               name: "Backward down expression",
//               command: "paredit.backwardDownSexp",
//             },
//             l: {
//               name: "Forward expression",
//               command: "paredit.forwardSexp",
//             },
//             r: {
//               name: "Raise expression",
//               command: "paredit.raiseSexp",
//             },
//             s: {
//               name: "Slurp expression forward",
//               command: "paredit.slurpSexpForward",
//             },
//             t: {
//               name: "Transpose expression",
//               command: "paredit.transpose",
//             },
//             B: {
//               name: "Barf expression backward",
//               command: "paredit.barfSexpBackward",
//             },
//             H: {
//               name: "Backward up expression",
//               command: "paredit.backwardUpSexp",
//             },
//             J: {
//               name: "Join expression",
//               command: "paredit.joinSexp",
//             },
//             L: {
//               name: "Forward up expression",
//               command: "paredit.forwardUpSexp",
//             },
//             S: {
//               name: "Slurp expression backward",
//               command: "paredit.slurpSexpBackward",
//             },
//             w: {
//               name: "+Wrap",
//               keys: {
//                 '"': {
//                   name: 'Wrap around ""',
//                   command: "paredit.wrapAroundQuote",
//                 },
//                 "(": {
//                   name: "Wrap around ()",
//                   command: "paredit.wrapAroundParens",
//                 },
//                 "[": {
//                   name: "Wrap around []",
//                   command: "paredit.wrapAroundSquare",
//                 },
//                 c: {
//                   name: "Rewrap {}",
//                   command: "paredit.rewrapCurly",
//                 },
//                 p: {
//                   name: "Rewrap ()",
//                   command: "paredit.rewrapParens",
//                 },
//                 q: {
//                   name: 'Rewrap ""',
//                   command: "paredit.rewrapQuote",
//                 },
//                 s: {
//                   name: "Rewrap []",
//                   command: "paredit.rewrapSquare",
//                 },
//                 "{": {
//                   name: "Wrap around {}",
//                   command: "paredit.wrapAroundCurly",
//                 },
//               },
//             },
//           },
//         },
//         m: {
//           name: "+Manage REPL session",
//           keys: {
//             ".": {
//               name: "Connect or jack-in",
//               command: "calva.jackInOrConnect",
//             },
//             c: {
//               name: "Connect to REPL server for project",
//               command: "calva.connect",
//             },
//             j: {
//               name: "Start REPL server for project (jack-in)",
//               command: "calva.jackIn",
//             },
//             q: {
//               name: "Disconnect (quit) from REPL server",
//               command: "calva.disconnect",
//             },
//             r: {
//               name: "Refresh changed namespaces",
//               command: "calva.refresh",
//             },
//             s: {
//               name: "Select cljs build connection",
//               command: "calva.switchCljsBuild",
//             },
//             t: {
//               name: "Toggle cljc session (clj, cljs)",
//               command: "calva.toggleCLJCSession",
//             },
//             C: {
//               name: "Run custom REPL command",
//               command: "calva.runCustomREPLCommand",
//             },
//             R: {
//               name: "Refresh all namespaces",
//               command: "calva.refreshAll",
//             },
//           },
//         },
//         r: {
//           name: "+Refactor",
//           keys: {
//             a: {
//               name: "+Add",
//               keys: {
//                 l: {
//                   name: "Add missing library specification",
//                   command: "clojureLsp.refactor.addMissingLibspec",
//                 },
//               },
//             },
//             c: {
//               name: "+Cycle clean convert",
//               keys: {
//                 n: {
//                   name: "Clean namespace definition",
//                   command: "clojureLsp.refactor.cleanNs",
//                 },
//                 p: {
//                   name: "Cycle privacy",
//                   command: "clojureLsp.refactor.cyclePrivacy",
//                 },
//               },
//             },
//             e: {
//               name: "+Extract expand",
//               keys: {
//                 f: {
//                   name: "Extract function",
//                   command: "clojureLsp.refactor.extractFunction",
//                 },
//                 l: {
//                   name: "Expand let",
//                   command: "clojureLsp.refactor.expandLet",
//                 },
//               },
//             },
//             i: {
//               name: "+Introduce inline",
//               keys: {
//                 l: {
//                   name: "Introduce let",
//                   command: "clojureLsp.refactor.introduceLet",
//                 },
//                 s: {
//                   name: "Inline symbol",
//                   command: "clojureLsp.refactor.inlineSymbol",
//                 },
//               },
//             },
//             m: {
//               name: "+Move",
//               keys: {
//                 l: {
//                   name: "Move to let",
//                   command: "clojureLsp.refactor.moveToLet",
//                 },
//               },
//             },
//             t: {
//               name: "+Thread macros",
//               keys: {
//                 f: {
//                   name: "Thread first",
//                   command: "clojureLsp.refactor.threadFirst",
//                 },
//                 l: {
//                   name: "Thread last",
//                   command: "clojureLsp.refactor.threadLast",
//                 },
//                 u: {
//                   name: "Unwind thread",
//                   command: "clojureLsp.refactor.unwindThread",
//                 },
//                 F: {
//                   name: "Thread first all",
//                   command: "clojureLsp.refactor.threadFirstAll",
//                 },
//                 L: {
//                   name: "Thread last all",
//                   command: "clojureLsp.refactor.threadLastAll",
//                 },
//                 U: {
//                   name: "Unwind thread all",
//                   command: "clojureLsp.refactor.unwindThread",
//                 },
//               },
//             },
//           },
//         },
//         t: {
//           name: "+Tests",
//           keys: {
//             a: {
//               name: "Run all tests",
//               command: "calva.runAllTests",
//             },
//             f: {
//               name: "Run failing tests",
//               command: "calva.rerunTests",
//             },
//             n: {
//               name: "Run tests in current namespace",
//               command: "calva.runNamespaceTests",
//             },
//             t: {
//               name: "Run current test",
//               command: "calva.runTestUnderCursor",
//             },
//           },
//         },
//         T: {
//           name: "+Toggle",
//           keys: {
//             p: {
//               name: "Toggle pretty print results",
//               command: "calva.togglePrettyPrint",
//             },
//           },
//         },
//       },
//     },
//     "languageId:coq": {
//       name: "coq",
//       keys: {
//         ".": {
//           name: "Proof goto current point",
//           command: "extension.coq.interpretToPoint",
//         },
//         b: {
//           name: "Proof step back",
//           command: "extension.coq.stepBackward",
//         },
//         f: {
//           name: "Proof step forward",
//           command: "extension.coq.stepForward",
//         },
//         g: {
//           name: "Go to the current focus location",
//           command: "extension.coq.moveCursorToFocus",
//         },
//         o: {
//           name: "Open proof view",
//           command: "extension.coq.proofView.open",
//         },
//         v: {
//           name: "View the proof-state at the cursor position",
//           command: "extension.coq.proofView.viewStateAt",
//         },
//         G: {
//           name: "Proof goto end",
//           command: "extension.coq.interpretToEnd",
//         },
//         a: {
//           name: "Ask prover",
//           keys: {
//             a: {
//               name: "About",
//               command: "extension.coq.query.prompt.about",
//             },
//             c: {
//               name: "Check",
//               command: "extension.coq.query.prompt.check",
//             },
//             f: {
//               name: "Find",
//               command: "extension.coq.query.prompt.search",
//             },
//             l: {
//               name: "Locate",
//               command: "extension.coq.query.prompt.locate",
//             },
//             p: {
//               name: "Print",
//               command: "extension.coq.query.prompt.print",
//             },
//           },
//         },
//         p: {
//           name: "Send command to prover",
//           keys: {
//             f: {
//               name: "Finish coq computations",
//               command: "extension.coq.finishComputations",
//             },
//             i: {
//               name: "Interrupt coqtop backend",
//               command: "extension.coq.interrupt",
//             },
//             q: {
//               name: "Quit coqtop backend",
//               command: "extension.coq.quit",
//             },
//             r: {
//               name: "Reset coqtop backend",
//               command: "extension.coq.reset",
//             },
//           },
//         },
//         q: {
//           name: "Query prover about foucsed symbol",
//           keys: {
//             a: {
//               name: "About",
//               command: "extension.coq.query.about",
//             },
//             c: {
//               name: "Check",
//               command: "extension.coq.query.check",
//             },
//             f: {
//               name: "Find",
//               command: "extension.coq.query.search",
//             },
//             l: {
//               name: "Locate",
//               command: "extension.coq.query.locate",
//             },
//             p: {
//               name: "Print",
//               command: "extension.coq.query.print",
//             },
//           },
//         },
//         T: {
//           name: "UI toggle",
//           keys: {
//             b: {
//               name: "Toggle display of all basic low level contents",
//               command: "extension.coq.display.toggle.allBasicLowLevelContents",
//             },
//             c: {
//               name: "Toggle display of coercions",
//               command: "extension.coq.display.toggle.coercions",
//             },
//             e: {
//               name: "Toggle display of existential variable instances",
//               command:
//                 "extension.coq.display.toggle.existentialVariableInstances",
//             },
//             i: {
//               name: "Toggle display of implicit arguments",
//               command: "extension.coq.display.toggle.implicitArguments",
//             },
//             l: {
//               name: "Toggle display of all lowLevel contents",
//               command: "extension.coq.display.toggle.allLowLevelContents",
//             },
//             n: {
//               name: "Toggle display of notations",
//               command: "extension.coq.display.toggle.notations",
//             },
//             r: {
//               name: "Toggle display of raw matching expressions",
//               command: "extension.coq.display.toggle.rawMatchingExpressions",
//             },
//             u: {
//               name: "Toggle display of universe levels",
//               command: "extension.coq.display.toggle.universeLevels",
//             },
//           },
//         },
//       },
//     },
//     "languageId:cpp": {
//       name: "C++",
//       keys: {
//         "=": {
//           name: "+Format",
//           keys: {
//             "=": {
//               name: "Format region or buffer",
//               command: "editor.action.format",
//             },
//             b: {
//               name: "Format buffer",
//               command: "editor.action.formatDocument",
//             },
//             c: {
//               name: "Format changes",
//               command: "editor.action.formatChanges",
//             },
//             s: {
//               name: "Format selection",
//               command: "editor.action.formatSelection",
//             },
//             B: {
//               name: "Format buffer with formatter",
//               command: "editor.action.formatDocument.multiple",
//             },
//             S: {
//               name: "Format selection with formatter",
//               command: "editor.action.formatSelection.multiple",
//             },
//           },
//         },
//         b: {
//           name: "+Backend",
//           keys: {
//             d: {
//               name: "Reset Database",
//               command: "C_Cpp.ResetDatabase",
//             },
//             w: {
//               name: "Rescan Workspace",
//               command: "C_Cpp.RescanWorkspace",
//             },
//           },
//         },
//         g: {
//           name: "+Go to",
//           keys: {
//             a: {
//               name: "Switch Header/Source",
//               command: "C_Cpp.SwitchHeaderSource",
//             },
//             d: {
//               name: "Go to declaration",
//               command: "editor.action.revealDeclaration",
//             },
//             e: {
//               name: "Go to errors/problems",
//               command: "workbench.actions.view.problems",
//             },
//             f: {
//               name: "Go to file in explorer",
//               command: "workbench.files.action.showActiveFileInExplorer",
//             },
//             g: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             r: {
//               name: "Go to reference",
//               command: "editor.action.goToReferences",
//             },
//             s: {
//               name: "Go to symbol in buffer",
//               command: "workbench.action.gotoSymbol",
//             },
//             R: {
//               name: "Find references",
//               command: "references-view.findReferences",
//             },
//             S: {
//               name: "Go to symbol in project",
//               command: "workbench.action.showAllSymbols",
//             },
//           },
//         },
//         r: {
//           name: "+Refactor",
//           keys: {
//             r: {
//               name: "Rename Symbol",
//               command: "editor.action.rename",
//             },
//           },
//         },
//         G: {
//           name: "+Peek",
//           keys: {
//             d: {
//               name: "Peek declaration",
//               command: "editor.action.peekDeclaration",
//             },
//             g: {
//               name: "Peek definition",
//               command: "editor.action.peekDefinition",
//             },
//             r: {
//               name: "Peek references",
//               command: "editor.action.referenceSearch.trigger",
//             },
//           },
//         },
//       },
//     },
//     "languageId:csharp": {
//       name: "C#",
//       keys: {
//         "=": {
//           name: "+Format",
//           keys: {
//             "=": {
//               name: "Format region or buffer",
//               command: "editor.action.format",
//             },
//             b: {
//               name: "Format buffer",
//               command: "editor.action.formatDocument",
//             },
//             c: {
//               name: "Format changes",
//               command: "editor.action.formatChanges",
//             },
//             s: {
//               name: "Format selection",
//               command: "editor.action.formatSelection",
//             },
//             B: {
//               name: "+Format buffer with formatter",
//               command: "editor.action.formatDocument.multiple",
//             },
//             S: {
//               name: "+Format selection with formatter",
//               command: "editor.action.formatSelection.multiple",
//             },
//           },
//         },
//         b: {
//           name: "+Backend/OmniSharp",
//           keys: {
//             o: {
//               name: "Show output",
//               command: "o.showOutput",
//             },
//             r: {
//               name: "Restart OmniSharp",
//               command: "o.restart",
//             },
//             s: {
//               name: "Select a project and start",
//               command: "o.pickProjectAndStart",
//             },
//           },
//         },
//         d: {
//           name: "+Debug",
//           keys: {
//             l: {
//               name: "List process for attach",
//               command: "csharp.listProcess",
//             },
//             L: {
//               name: "List remote processes for attach",
//               command: "csharp.listRemoteProcess",
//             },
//           },
//         },
//         g: {
//           name: "+Go to",
//           keys: {
//             d: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             e: {
//               name: "Go to errors/problems",
//               command: "workbench.action.problems.focus",
//             },
//             g: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             i: {
//               name: "Go to implementations",
//               command: "editor.action.goToImplementation",
//             },
//             r: {
//               name: "Go to references",
//               command: "editor.action.goToReferences",
//             },
//             I: {
//               name: "Find implementations",
//               command: "references-view.findImplementations",
//             },
//             R: {
//               name: "Find references",
//               command: "references-view.findReferences",
//             },
//           },
//         },
//         p: {
//           name: "+Project",
//           keys: {
//             r: {
//               name: "Restore project",
//               command: "dotnet.restore.project",
//             },
//             R: {
//               name: "Restore all projects",
//               command: "dotnet.restore.all",
//             },
//           },
//         },
//         r: {
//           name: "+Refactor",
//           keys: {
//             ".": {
//               name: "Quick fix",
//               command: "editor.action.quickFix",
//             },
//             r: {
//               name: "Rename symbol",
//               command: "editor.action.rename",
//             },
//           },
//         },
//         t: {
//           name: "+Test",
//           keys: {
//             d: {
//               name: "Debug test under cursor",
//               command: "dotnet.test.debugTestsInContext",
//             },
//             t: {
//               name: "Run test under cursor",
//               command: "dotnet.test.runTestsInContext",
//             },
//           },
//         },
//         G: {
//           name: "+Peek",
//           keys: {
//             d: {
//               name: "Peek definition",
//               command: "editor.action.peekDefinition",
//             },
//             i: {
//               name: "Peek implementations",
//               command: "editor.action.peekImplementation",
//             },
//             r: {
//               name: "Peek references",
//               command: "editor.action.referenceSearch.trigger",
//             },
//           },
//         },
//       },
//     },
//     "languageId:dart": {
//       name: "Dart/Flutter",
//       keys: {
//         ";": {
//           name: "Toggle Dartdoc comment",
//           command: "dart.toggleDartdocComment",
//         },
//         a: {
//           name: "Attach",
//           command: "flutter.attach",
//         },
//         c: {
//           name: "Clean",
//           command: "flutter.clean",
//         },
//         i: {
//           name: "Inspect widget",
//           command: "flutter.inspectWidget",
//         },
//         m: {
//           name: "Sort members",
//           command: "dart.sortMembers",
//         },
//         r: {
//           name: "+Refactor",
//           keys: {
//             ".": {
//               name: "Quick fix",
//               command: "editor.action.quickFix",
//             },
//             r: {
//               name: "Rename symbol",
//               command: "editor.action.rename",
//             },
//           },
//         },
//         s: {
//           name: "Select device",
//           command: "flutter.selectDevice",
//         },
//         u: {
//           name: "Flutter upgrade",
//           command: "flutter.upgrade",
//         },
//         A: {
//           name: "Attach to process",
//           command: "flutter.attachProcess",
//         },
//         D: {
//           name: "Flutter doctor",
//           command: "flutter.doctor",
//         },
//         E: {
//           name: "Launch emulator",
//           command: "flutter.launchEmulator",
//         },
//         P: {
//           name: "Profile app",
//           command: "flutter.runProfileMode",
//         },
//         R: {
//           name: "Hot restart",
//           command: "flutter.hotRestart",
//         },
//         S: {
//           name: "Screenshot",
//           command: "flutter.screenshot",
//         },
//         "=": {
//           name: "+Format",
//           keys: {
//             "=": {
//               name: "Format region or buffer",
//               command: "editor.action.format",
//             },
//             b: {
//               name: "Format buffer",
//               command: "editor.action.formatDocument",
//             },
//             c: {
//               name: "Format changes",
//               command: "editor.action.formatChanges",
//             },
//             s: {
//               name: "Format selection",
//               command: "editor.action.formatSelection",
//             },
//             B: {
//               name: "+Format buffer with formatter",
//               command: "editor.action.formatDocument.multiple",
//             },
//             S: {
//               name: "+Format selection with formatter",
//               command: "editor.action.formatSelection.multiple",
//             },
//           },
//         },
//         g: {
//           name: "+Go to",
//           keys: {
//             d: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             e: {
//               name: "Go to errors/problems",
//               command: "workbench.action.problems.focus",
//             },
//             g: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             i: {
//               name: "Go to implementations",
//               command: "editor.action.goToImplementation",
//             },
//             r: {
//               name: "Go to references",
//               command: "editor.action.goToReferences",
//             },
//             s: {
//               name: "Go to super",
//               command: "dart.goToSuper",
//             },
//             t: {
//               name: "Go to test/implementation file",
//               command: "dart.goToTestOrImplementationFile",
//             },
//             I: {
//               name: "Find implementations",
//               command: "references-view.findImplementations",
//             },
//             R: {
//               name: "Find references",
//               command: "references-view.findReferences",
//             },
//             T: {
//               name: "Go to tests",
//               command: "dart.goToTests",
//             },
//           },
//         },
//         l: {
//           name: "+Logging",
//           keys: {
//             a: {
//               name: "Start logging analysis server",
//               command: "dart.startLoggingAnalysisServer",
//             },
//             d: {
//               name: "Start logging debugging",
//               command: "dart.startLoggingDebugging",
//             },
//             e: {
//               name: "Start logging extension only",
//               command: "dart.startLoggingExtensionOnly",
//             },
//             s: {
//               name: "Start logging",
//               command: "dart.startLogging",
//             },
//             S: {
//               name: "Stop logging",
//               command: "dart.stopLogging",
//             },
//           },
//         },
//         o: {
//           name: "+Open",
//           keys: {
//             a: {
//               name: "Analyzer diagnostics",
//               command: "dart.openAnalyzerDiagnostics",
//             },
//             c: {
//               name: "DevTools CPU profiler",
//               command: "dart.startLoggingDebugging",
//             },
//             d: {
//               name: "Devtools",
//               command: "flutter.openDevTools",
//             },
//             l: {
//               name: "DevTools logging",
//               command: "dart.openDevToolsLogging",
//             },
//             m: {
//               name: "DevTools memory",
//               command: "dart.openDevToolsMemory",
//             },
//             n: {
//               name: "DevTools network",
//               command: "dart.openDevToolsNetwork",
//             },
//           },
//         },
//         p: {
//           name: "+Project/Packages",
//           keys: {
//             d: {
//               name: "Add dependency",
//               command: "dart.addDependency",
//             },
//             g: {
//               name: "Pub get",
//               command: "flutter.packages.get",
//             },
//             o: {
//               name: "Pub outdated",
//               command: "flutter.packages.outdated",
//             },
//             u: {
//               name: "Pub upgrade",
//               command: "flutter.packages.upgrade",
//             },
//             D: {
//               name: "Add dev dependency",
//               command: "dart.addDevDependency",
//             },
//             U: {
//               name: "Pub upgrade -major versions",
//               command: "flutter.packages.upgrade.majorVersions",
//             },
//             c: {
//               name: "+Create",
//               keys: {
//                 d: {
//                   name: "Dart project",
//                   command: "dart.createProject",
//                 },
//                 l: {
//                   name: "Flutter plugin project",
//                   command: "flutter.createProject.plugin",
//                 },
//                 m: {
//                   name: "Flutter module project",
//                   command: "flutter.createProject.module",
//                 },
//                 p: {
//                   name: "Flutter project",
//                   command: "flutter.createProject",
//                 },
//                 D: {
//                   name: "Create DartDoc",
//                   command: "dart.task.dartdoc",
//                 },
//                 P: {
//                   name: "Flutter package project",
//                   command: "flutter.createProject.package",
//                 },
//               },
//             },
//           },
//         },
//         t: {
//           name: "+Test",
//           keys: {
//             c: {
//               name: "Clear test results",
//               command: "testing.clearTestResults",
//             },
//             d: {
//               name: "Debug test at cursor",
//               command: "testing.debugTestAtCursor",
//             },
//             f: {
//               name: "Run failed tests",
//               command: "testing.reRunFailTests",
//             },
//             r: {
//               name: "Run tests",
//               command: "testing.runAll",
//             },
//             t: {
//               name: "Run test at cursor",
//               command: "testing.runTestAtCursor",
//             },
//           },
//         },
//         G: {
//           name: "+Peek",
//           keys: {
//             d: {
//               name: "Peek definition",
//               command: "editor.action.peekDefinition",
//             },
//             i: {
//               name: "Peek implementations",
//               command: "editor.action.peekImplementation",
//             },
//             r: {
//               name: "Peek references",
//               command: "editor.action.referenceSearch.trigger",
//             },
//           },
//         },
//         T: {
//           name: "+Toggle",
//           keys: {
//             b: {
//               name: "Brightness",
//               command: "flutter.toggleBrightness",
//             },
//             d: {
//               name: "Debug painting",
//               command: "flutter.toggleDebugPainting",
//             },
//             e: {
//               name: "Check elevations",
//               command: "flutter.toggleCheckElevations",
//             },
//             o: {
//               name: "Performance overlay",
//               command: "flutter.togglePerformanceOverlay",
//             },
//             p: {
//               name: "Paint baselines",
//               command: "flutter.togglePaintBaselines",
//             },
//             r: {
//               name: "Repaint rainbow",
//               command: "flutter.toggleRepaintRainbow",
//             },
//             s: {
//               name: "Slow animations",
//               command: "flutter.toggleSlowAnimations",
//             },
//             B: {
//               name: "Debug mode banner",
//               command: "flutter.toggleDebugModeBanner",
//             },
//           },
//         },
//       },
//     },
//     "languageId:elixir": {
//       name: "Elixir",
//       keys: {
//         o: {
//           name: "Expand selected macro",
//           command: "extension.expandMacro",
//         },
//         "=": {
//           name: "+Format",
//           keys: {
//             "=": {
//               name: "Format region or buffer",
//               command: "editor.action.format",
//             },
//             b: {
//               name: "Format buffer",
//               command: "editor.action.formatDocument",
//             },
//             c: {
//               name: "Format changes",
//               command: "editor.action.formatChanges",
//             },
//             s: {
//               name: "Format selection",
//               command: "editor.action.formatSelection",
//             },
//             B: {
//               name: "+Format buffer with formatter",
//               command: "editor.action.formatDocument.multiple",
//             },
//             S: {
//               name: "+Format selection with formatter",
//               command: "editor.action.formatSelection.multiple",
//             },
//           },
//         },
//         g: {
//           name: "+Go to",
//           keys: {
//             d: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             e: {
//               name: "Go to errors/problems",
//               command: "workbench.action.problems.focus",
//             },
//             g: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             i: {
//               name: "Go to implementations",
//               command: "editor.action.goToImplementation",
//             },
//             r: {
//               name: "Go to references",
//               command: "editor.action.goToReferences",
//             },
//             I: {
//               name: "Find implementations",
//               command: "references-view.findImplementations",
//             },
//             R: {
//               name: "Find references",
//               command: "references-view.findReferences",
//             },
//           },
//         },
//         r: {
//           name: "+Refactor",
//           keys: {
//             ".": {
//               name: "Quick fix",
//               command: "editor.action.quickFix",
//             },
//             p: {
//               name: "Transform function call to pipe operator",
//               command: "extension.toPipe",
//             },
//             r: {
//               name: "Rename symbol",
//               command: "editor.action.rename",
//             },
//             P: {
//               name: "Transform pipe operator to function call",
//               command: "extension.fromPipe",
//             },
//           },
//         },
//         G: {
//           name: "+Peek",
//           keys: {
//             d: {
//               name: "Peek definition",
//               command: "editor.action.peekDefinition",
//             },
//             i: {
//               name: "Peek implementations",
//               command: "editor.action.peekImplementation",
//             },
//             r: {
//               name: "Peek references",
//               command: "editor.action.referenceSearch.trigger",
//             },
//           },
//         },
//       },
//     },
//     "languageId:fsharp": {
//       name: "F#",
//       keys: {
//         "=": {
//           name: "+Format",
//           keys: {
//             "=": {
//               name: "Format region or buffer",
//               command: "editor.action.format",
//             },
//             b: {
//               name: "Format buffer",
//               command: "editor.action.formatDocument",
//             },
//             c: {
//               name: "Format changes",
//               command: "editor.action.formatChanges",
//             },
//             s: {
//               name: "Format selection",
//               command: "editor.action.formatSelection",
//             },
//             B: {
//               name: "+Format buffer with formatter",
//               command: "editor.action.formatDocument.multiple",
//             },
//             S: {
//               name: "+Format selection with formatter",
//               command: "editor.action.formatSelection.multiple",
//             },
//           },
//         },
//         c: {
//           name: "+Compile",
//           keys: {
//             c: {
//               name: "MSBuild: Build current solution",
//               command: "MSBuild.buildCurrentSolution",
//             },
//             d: {
//               name: "F#: Run default project",
//               command: "fsharp.runDefaultProject",
//             },
//             l: {
//               name: "MSBuild: Clean current solution",
//               command: "MSBuild.cleanCurrentSolution",
//             },
//             p: {
//               name: "MSBuild: Build current project",
//               command: "MSBuild.buildCurrent",
//             },
//             r: {
//               name: "MSBuild: Re-build current solution",
//               command: "MSBuild.rebuildCurrentSolution",
//             },
//             D: {
//               name: "F#: Debug default project",
//               command: "fsharp.debugDefaultProject",
//             },
//             L: {
//               name: "MSBuild: Clean current project",
//               command: "MSBuild.cleanCurrent",
//             },
//           },
//         },
//         g: {
//           name: "+Go to",
//           keys: {
//             d: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             e: {
//               name: "Go to errors/problems",
//               command: "workbench.action.problems.focus",
//             },
//             g: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             r: {
//               name: "Go to reference",
//               command: "editor.action.goToReferences",
//             },
//             s: {
//               name: "Go to symbol in buffer",
//               command: "workbench.action.gotoSymbol",
//             },
//             t: {
//               name: "Go to type definition",
//               command: "editor.action.goToTypeDefinition",
//             },
//             I: {
//               name: "Find implementations",
//               command: "references-view.findImplementations",
//             },
//             R: {
//               name: "Find references",
//               command: "references-view.findReferences",
//             },
//           },
//         },
//         r: {
//           name: "+Refactor",
//           keys: {
//             r: {
//               name: "Rename symbol",
//               command: "editor.action.rename",
//             },
//           },
//         },
//         s: {
//           name: "+FSI REPL",
//           keys: {
//             f: {
//               name: "FSI: Send file",
//               command: "fsi.SendFile",
//             },
//             l: {
//               name: "FSI: Send line",
//               command: "fsi.SendLine",
//             },
//             s: {
//               name: "FSI: Send selection",
//               command: "fsi.SendSelection",
//             },
//             G: {
//               name: "FSI: Generate project references",
//               command: "fsi.GenerateProjectReferences",
//             },
//             L: {
//               name: "FSI: Send last selection",
//               command: "fsi.SendLastSelection",
//             },
//             P: {
//               name: "FSI: Send references from project",
//               command: "fsi.SendProjectReferences",
//             },
//             S: {
//               name: "FSI: Start",
//               command: "fsi.Start",
//             },
//           },
//         },
//         G: {
//           name: "+Peek",
//           keys: {
//             d: {
//               name: "Peek definition",
//               command: "editor.action.peekDefinition",
//             },
//             r: {
//               name: "Peek references",
//               command: "editor.action.referenceSearch.trigger",
//             },
//             t: {
//               name: "Peek type definition",
//               command: "editor.action.peekTypeDefinition",
//             },
//           },
//         },
//       },
//     },
//     "languageId:go": {
//       name: "Go",
//       keys: {
//         " ": {
//           name: "Show all commands",
//           command: "go.show.commands",
//         },
//         "=": {
//           name: "+Format",
//           keys: {
//             "=": {
//               name: "Format region or buffer",
//               command: "editor.action.format",
//             },
//             b: {
//               name: "Format buffer",
//               command: "editor.action.formatDocument",
//             },
//             c: {
//               name: "Format changes",
//               command: "editor.action.formatChanges",
//             },
//             s: {
//               name: "Format selection",
//               command: "editor.action.formatSelection",
//             },
//             B: {
//               name: "+Format buffer with formatter",
//               command: "editor.action.formatDocument.multiple",
//             },
//             S: {
//               name: "+Format selection with formatter",
//               command: "editor.action.formatSelection.multiple",
//             },
//           },
//         },
//         a: {
//           name: "+Actions",
//           keys: {
//             P: {
//               name: "Run code on Go Playground",
//               command: "go.playground",
//             },
//             p: {
//               name: "+Package actions",
//               keys: {
//                 b: {
//                   name: "Build package",
//                   command: "go.build.package",
//                 },
//                 g: {
//                   name: "Get package",
//                   command: "go.get.package",
//                 },
//                 i: {
//                   name: "Install current package",
//                   command: "go.install.package",
//                 },
//                 l: {
//                   name: "Lint package",
//                   command: "go.lint.package",
//                 },
//                 s: {
//                   name: "Browse packages",
//                   command: "go.browse.packages",
//                 },
//                 v: {
//                   name: "Vet package",
//                   command: "go.vet.package",
//                 },
//               },
//             },
//             w: {
//               name: "+Workspace actions",
//               keys: {
//                 b: {
//                   name: "Build workspace",
//                   command: "go.build.workspace",
//                 },
//                 l: {
//                   name: "Lint workspace",
//                   command: "go.lint.workspace",
//                 },
//                 p: {
//                   name: "Add package to workspace",
//                   command: "go.add.package.workspace",
//                 },
//                 v: {
//                   name: "Vet workspace",
//                   command: "go.vet.workspace",
//                 },
//               },
//             },
//           },
//         },
//         b: {
//           name: "+Backend/environment",
//           keys: {
//             e: {
//               name: "Choose Go environment",
//               command: "go.environment.choose",
//             },
//             g: {
//               name: "Show current GOPATH",
//               command: "go.gopath",
//             },
//             i: {
//               name: "Install/update tools",
//               command: "go.tools.install",
//             },
//             l: {
//               name: "Locate configured Go tools",
//               command: "go.locate.tools",
//             },
//             R: {
//               name: "Restart language server",
//               command: "go.languageserver.restart",
//             },
//           },
//         },
//         g: {
//           name: "+Go to",
//           keys: {
//             d: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             e: {
//               name: "Go to errors/problems",
//               command: "workbench.action.problems.focus",
//             },
//             g: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             h: {
//               name: "Show call hierarchy",
//               command: "references-view.showCallHierarchy",
//             },
//             i: {
//               name: "Go to implementations",
//               command: "editor.action.goToImplementation",
//             },
//             r: {
//               name: "Go to references",
//               command: "editor.action.goToReferences",
//             },
//             t: {
//               name: "Go to type definition",
//               command: "editor.action.goToTypeDefinition",
//             },
//             I: {
//               name: "Find implementations",
//               command: "references-view.findImplementations",
//             },
//             R: {
//               name: "Find references",
//               command: "references-view.findReferences",
//             },
//           },
//         },
//         i: {
//           name: "+Insert/remove",
//           keys: {
//             f: {
//               name: "Fill struct",
//               command: "go.fill.struct",
//             },
//             i: {
//               name: "Add import",
//               command: "go.import.add",
//             },
//             t: {
//               name: "Add tags to struct fields",
//               command: "go.add.tags",
//             },
//             I: {
//               name: "Generate interface stubs",
//               command: "go.impl.cursor",
//             },
//             T: {
//               name: "Remove tags from struct fields",
//               command: "go.remove.tags",
//             },
//           },
//         },
//         r: {
//           name: "+Refactor",
//           keys: {
//             ".": {
//               name: "Quick fix",
//               command: "editor.action.quickFix",
//             },
//             e: {
//               name: "Extract to function or variable",
//               command: "editor.action.codeAction",
//               args: {
//                 kind: "refactor.extract",
//               },
//             },
//             r: {
//               name: "Rename symbol",
//               command: "editor.action.rename",
//             },
//           },
//         },
//         t: {
//           name: "+Test",
//           keys: {
//             c: {
//               name: "Cancel running tests",
//               command: "go.test.cancel",
//             },
//             d: {
//               name: "Debug test at cursor",
//               command: "go.debug.cursor",
//             },
//             f: {
//               name: "Test file",
//               command: "go.test.file",
//             },
//             l: {
//               name: "Test previous",
//               command: "go.test.previous",
//             },
//             p: {
//               name: "Test package",
//               command: "go.test.package",
//             },
//             s: {
//               name: "Subtest at cursor",
//               command: "go.subtest.cursor",
//             },
//             t: {
//               name: "Test function at cursor",
//               command: "go.test.cursor",
//             },
//             w: {
//               name: "Test packages in workspace",
//               command: "go.test.workspace",
//             },
//             P: {
//               name: "Apply cover profile",
//               command: "go.apply.coverprofile",
//             },
//             b: {
//               name: "+Benchmarks",
//               keys: {
//                 f: {
//                   name: "Benchmark function at cursor",
//                   command: "go.benchmark.cursor",
//                 },
//                 p: {
//                   name: "Benchmark package",
//                   command: "go.benchmark.package",
//                 },
//                 F: {
//                   name: "Benchmark file",
//                   command: "go.benchmark.file",
//                 },
//               },
//             },
//             g: {
//               name: "+Generate",
//               keys: {
//                 f: {
//                   name: "Generate unit tests for function",
//                   command: "go.test.generate.function",
//                 },
//                 p: {
//                   name: "Generate unit tests for package",
//                   command: "go.test.generate.package",
//                 },
//                 F: {
//                   name: "Generate unit tests for file",
//                   command: "go.test.generate.file",
//                 },
//               },
//             },
//             T: {
//               name: "+Toggle",
//               keys: {
//                 c: {
//                   name: "Toggle test coverage in current package",
//                   command: "go.test.coverage",
//                 },
//                 f: {
//                   name: "Toggle open test file",
//                   command: "go.toggle.test.file",
//                 },
//               },
//             },
//           },
//         },
//         G: {
//           name: "+Peek",
//           keys: {
//             d: {
//               name: "Peek definition",
//               command: "editor.action.peekDefinition",
//             },
//             h: {
//               name: "Peek call hierarchy",
//               command: "editor.showCallHierarchy",
//             },
//             i: {
//               name: "Peek implementations",
//               command: "editor.action.peekImplementation",
//             },
//             r: {
//               name: "Peek references",
//               command: "editor.action.referenceSearch.trigger",
//             },
//           },
//         },
//       },
//     },
//     "languageId:java": {
//       name: "Java",
//       keys: {
//         h: {
//           name: "Describe thing at point",
//           command: "editor.action.showHover",
//         },
//         D: {
//           name: "Debug Java file",
//           command: "java.debug.debugJavaFile",
//         },
//         R: {
//           name: "Run Java file",
//           command: "java.debug.runJavaFile",
//         },
//         "=": {
//           name: "+Format",
//           keys: {
//             "=": {
//               name: "Format region or buffer",
//               command: "editor.action.format",
//             },
//             b: {
//               name: "Format buffer",
//               command: "editor.action.formatDocument",
//             },
//             c: {
//               name: "Format changes",
//               command: "editor.action.formatChanges",
//             },
//             s: {
//               name: "Format selection",
//               command: "editor.action.formatSelection",
//             },
//             B: {
//               name: "Format buffer with formatter",
//               command: "editor.action.formatDocument.multiple",
//             },
//             S: {
//               name: "Format selection with formatter",
//               command: "editor.action.formatSelection.multiple",
//             },
//           },
//         },
//         a: {
//           name: "+Code actions",
//           keys: {
//             a: {
//               name: "Execute code action",
//               command: "editor.action.codeAction",
//             },
//             f: {
//               name: "Execute fix action",
//               command: "editor.action.quickFix",
//             },
//             r: {
//               name: "Refactor action",
//               command: "editor.action.refactor",
//             },
//             s: {
//               name: "Source action",
//               command: "editor.action.sourceAction",
//             },
//           },
//         },
//         g: {
//           name: "+Go to",
//           keys: {
//             d: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             e: {
//               name: "Go to error list",
//               command: "workbench.action.showErrorsWarnings",
//             },
//             h: {
//               name: "Show call hierarchy",
//               command: "references-view.showCallHierarchy",
//             },
//             i: {
//               name: "Go to implementations",
//               command: "editor.action.goToImplementation",
//             },
//             o: {
//               name: "Go to super implementation",
//               command: "java.action.navigateToSuperImplementation",
//             },
//             r: {
//               name: "Go to references",
//               command: "editor.action.goToReferences",
//             },
//             s: {
//               name: "Go to symbol in buffer",
//               command: "workbench.action.gotoSymbol",
//             },
//             t: {
//               name: "Go to type definition",
//               command: "editor.action.goToTypeDefinition",
//             },
//             u: {
//               name: "Go to subtype hierarchy",
//               command: "java.action.showSubtypeHierarchy",
//             },
//             H: {
//               name: "Go to type hierarchy",
//               command: "java.action.showTypeHierarchy",
//             },
//             I: {
//               name: "Find implementations",
//               command: "references-view.findImplementations",
//             },
//             R: {
//               name: "Find references",
//               command: "references-view.findReferences",
//             },
//             S: {
//               name: "Go to symbol in project",
//               command: "workbench.action.showAllSymbols",
//             },
//             T: {
//               name: "Go to test",
//               command: "java.test.goToTest",
//             },
//             U: {
//               name: "Go to supertype hierarchy",
//               command: "java.action.showSupertypeHierarchy",
//             },
//           },
//         },
//         r: {
//           name: "+Refactor",
//           keys: {
//             a: {
//               name: "Execute code actions",
//               command: "editor.action.codeAction",
//             },
//             e: {
//               name: "Extract to function or variable",
//               command: "editor.action.codeAction",
//               args: {
//                 kind: "refactor.extract",
//               },
//             },
//             o: {
//               name: "Organize imports",
//               command: "editor.action.organizeImports",
//             },
//             r: {
//               name: "Rename symbol",
//               command: "editor.action.rename",
//             },
//             R: {
//               name: "Refactor actions",
//               command: "editor.action.refactor",
//             },
//           },
//         },
//         t: {
//           name: "+Test",
//           keys: {
//             a: {
//               name: "Run all tests",
//               command: "testing.runAll",
//             },
//             b: {
//               name: "Run current test file",
//               command: "testing.runCurrentFile",
//             },
//             r: {
//               name: "Re-run failed tests",
//               command: "testing.reRunFailTests",
//             },
//             t: {
//               name: "Select and run test",
//               command: "testing.runSelected",
//             },
//             A: {
//               name: "Debug all tests",
//               command: "testing.debugAll",
//             },
//             T: {
//               name: "Select and debug test",
//               command: "testing.debugSelected",
//             },
//           },
//         },
//         G: {
//           name: "+Peek",
//           keys: {
//             d: {
//               name: "Peek definition",
//               command: "editor.action.peekDefinition",
//             },
//             h: {
//               name: "Peek call hierarchy",
//               command: "editor.showCallHierarchy",
//             },
//             i: {
//               name: "Peek implementations",
//               command: "editor.action.peekImplementation",
//             },
//             r: {
//               name: "Peek references",
//               command: "editor.action.referenceSearch.trigger",
//             },
//             t: {
//               name: "Peek type definition",
//               command: "editor.action.peekTypeDefinition",
//             },
//           },
//         },
//       },
//     },
//     "languageId:javascript": {
//       name: "JavaScript",
//       keys: {
//         "=": {
//           name: "+Format",
//           keys: {
//             "=": {
//               name: "Format region or buffer",
//               command: "editor.action.format",
//             },
//             b: {
//               name: "Format buffer",
//               command: "editor.action.formatDocument",
//             },
//             c: {
//               name: "Format changes",
//               command: "editor.action.formatChanges",
//             },
//             s: {
//               name: "Format selection",
//               command: "editor.action.formatSelection",
//             },
//             B: {
//               name: "+Format buffer with formatter",
//               command: "editor.action.formatDocument.multiple",
//             },
//             S: {
//               name: "+Format selection with formatter",
//               command: "editor.action.formatSelection.multiple",
//             },
//           },
//         },
//         g: {
//           name: "+Go to",
//           keys: {
//             d: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             h: {
//               name: "Show call hierarchy",
//               command: "references-view.showCallHierarchy",
//             },
//             r: {
//               name: "Go to reference",
//               command: "editor.action.goToReferences",
//             },
//             s: {
//               name: "Go to symbol in buffer",
//               command: "workbench.action.gotoSymbol",
//             },
//             t: {
//               name: "Go to type definition",
//               command: "editor.action.goToTypeDefinition",
//             },
//             I: {
//               name: "Find implementations",
//               command: "references-view.findImplementations",
//             },
//             R: {
//               name: "Find references",
//               command: "references-view.findReferences",
//             },
//             S: {
//               name: "Go to symbol in project",
//               command: "workbench.action.showAllSymbols",
//             },
//           },
//         },
//         G: {
//           name: "+Peek",
//           keys: {
//             d: {
//               name: "Peek definition",
//               command: "editor.action.peekDefinition",
//             },
//             h: {
//               name: "Peek call hierarchy",
//               command: "editor.showCallHierarchy",
//             },
//             i: {
//               name: "Peek implementations",
//               command: "editor.action.peekImplementation",
//             },
//             r: {
//               name: "Peek references",
//               command: "editor.action.referenceSearch.trigger",
//             },
//             t: {
//               name: "Peek type definition",
//               command: "editor.action.peekTypeDefinition",
//             },
//           },
//         },
//       },
//     },
//     "languageId:julia": {
//       name: "Julia",
//       keys: {
//         ",": {
//           name: "Execute code in REPL",
//           command: "language-julia.executeJuliaCodeInREPL",
//         },
//         d: {
//           name: "Show documentation",
//           command: "language-julia.show-documentation",
//         },
//         p: {
//           name: "Show plots",
//           command: "language-julia.show-plotpane",
//         },
//         w: {
//           name: "Focus on workspace view",
//           command: "REPLVariables.focus",
//         },
//         "=": {
//           name: "+Format",
//           keys: {
//             "=": {
//               name: "Format region or buffer",
//               command: "editor.action.format",
//             },
//             b: {
//               name: "Format buffer",
//               command: "editor.action.formatDocument",
//             },
//             c: {
//               name: "Format changes",
//               command: "editor.action.formatChanges",
//             },
//             s: {
//               name: "Format selection",
//               command: "editor.action.formatSelection",
//             },
//             B: {
//               name: "+Format buffer with formatter",
//               command: "editor.action.formatDocument.multiple",
//             },
//             S: {
//               name: "+Format selection with formatter",
//               command: "editor.action.formatSelection.multiple",
//             },
//           },
//         },
//         b: {
//           name: "+Backend",
//           keys: {
//             i: {
//               name: "Re-index language server cache",
//               command: "language-julia.refreshLanguageServer",
//             },
//             l: {
//               name: "Toggle linter",
//               command: "language-julia.toggleLinter",
//             },
//             r: {
//               name: "Restart language server",
//               command: "language-julia.restartLanguageServer",
//             },
//           },
//         },
//         c: {
//           name: "+Clear",
//           keys: {
//             c: {
//               name: "Clear current inline results",
//               command: "language-julia.clearCurrentInlineResult",
//             },
//             C: {
//               name: "Clear all inline results",
//               command: "language-julia.clearAllInlineResults",
//             },
//             K: {
//               name: "Clear all inline results in editor",
//               command: "language-julia.clearAllInlineResultsInEditor",
//             },
//           },
//         },
//         e: {
//           name: "+Environment/package",
//           keys: {
//             a: {
//               name: "Activate this environment",
//               command: "language-julia.changeCurrentEnvironment",
//             },
//             c: {
//               name: "Change current environment",
//               command: "language-julia.changeCurrentEnvironment",
//             },
//             m: {
//               name: "Choose module",
//               command: "language-julia.chooseModule",
//             },
//             p: {
//               name: "Activate parent environment",
//               command: "language-julia.changeCurrentEnvironment",
//             },
//             t: {
//               name: "Tag new package version",
//               command: "language-julia.tagNewPackageVersion",
//             },
//             P: {
//               name: "Open package directory",
//               command: "language-julia.openPackageDirectory",
//             },
//           },
//         },
//         g: {
//           name: "+Go to",
//           keys: {
//             d: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             e: {
//               name: "Go to errors/problems",
//               command: "workbench.action.problems.focus",
//             },
//             g: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             r: {
//               name: "Go to references",
//               command: "editor.action.goToReferences",
//             },
//             s: {
//               name: "Go to symbol in buffer",
//               command: "workbench.action.gotoSymbol",
//             },
//             R: {
//               name: "Find references",
//               command: "references-view.findReferences",
//             },
//             S: {
//               name: "Go to symbol in project",
//               command: "workbench.action.showAllSymbols",
//             },
//           },
//         },
//         s: {
//           name: "+Send/REPL",
//           keys: {
//             b: {
//               name: "Execute block or selection in REPL",
//               command: "language-julia.executeCodeBlockOrSelection",
//             },
//             c: {
//               name: "Execute code cell in REPL and move",
//               command: "language-julia.executeCellAndMove",
//             },
//             d: {
//               name: "Change directory here",
//               command: "language-julia.cdHere",
//             },
//             f: {
//               name: "Execute file in REPL",
//               command: "language-julia.executeFile",
//             },
//             i: {
//               name: "Start REPL",
//               command: "language-julia.startREPL",
//             },
//             m: {
//               name: "Execute code in REPL and move",
//               command: "language-julia.executeCodeBlockOrSelectionAndMove",
//             },
//             s: {
//               name: "Execute code in REPL",
//               command: "language-julia.executeJuliaCodeInREPL",
//             },
//             C: {
//               name: "Connect external REPL",
//               command: "language-julia.connectREPL",
//             },
//             D: {
//               name: "Stop REPL",
//               command: "language-julia.stopREPL",
//             },
//             F: {
//               name: "Execute active file in REPL",
//               command: "language-julia.executeActiveFile",
//             },
//           },
//         },
//       },
//     },
//     "languageId:latex": {
//       name: "LaTeX",
//       keys: {
//         "=": {
//           name: "+Format",
//           keys: {
//             "=": {
//               name: "Format region or buffer",
//               command: "editor.action.format",
//             },
//             b: {
//               name: "Format buffer",
//               command: "editor.action.formatDocument",
//             },
//             c: {
//               name: "Format changes",
//               command: "editor.action.formatChanges",
//             },
//             s: {
//               name: "Format selection",
//               command: "editor.action.formatSelection",
//             },
//           },
//         },
//         b: {
//           name: "+Backend",
//           keys: {
//             l: {
//               name: "View Workshop Messages",
//               command: "latex-workshop.log",
//             },
//             m: {
//               name: "Insert root magic comment",
//               command: "latex-workshop.addtexroot",
//             },
//             s: {
//               name: "Select the current environment name",
//               command: "latex-workshop.select-envname",
//             },
//             S: {
//               name: "Select the current environment content",
//               command: "latex-workshop.select-envcontent",
//             },
//           },
//         },
//         c: {
//           name: "+Build",
//           keys: {
//             c: {
//               name: "Build Project",
//               command: "latex-workshop.build",
//             },
//             i: {
//               name: "Show compilation info",
//               command: "latex-workshop.showCompilationPanel",
//             },
//             k: {
//               name: "Kill compiler process",
//               command: "latex-workshop.kill",
//             },
//             l: {
//               name: "View compiler logs",
//               command: "latex-workshop.compilerlog",
//             },
//             r: {
//               name: "Build with recipe",
//               command: "latex-workshop.recipes",
//             },
//           },
//         },
//         g: {
//           name: "+Go to",
//           keys: {
//             e: {
//               name: "Navigate to matching begin/end pair",
//               command: "latex-workshop.navigate-envpair",
//             },
//           },
//         },
//         i: {
//           name: "+Insert",
//           keys: {
//             e: {
//               name: "Close current environment",
//               command: "latex-workshop.close-env",
//             },
//             i: {
//               name: "item",
//               command: "latex-workshop.shortcut.item",
//             },
//             w: {
//               name: "Surround/wrap selection with begin/end",
//               command: "latex-workshop.wrap-env",
//             },
//           },
//         },
//         l: {
//           name: "+Bibtex",
//           keys: {
//             a: {
//               name: "Align",
//               command: "latex-workshop.bibalign",
//             },
//             s: {
//               name: "Sort",
//               command: "latex-workshop.bibsort",
//             },
//             S: {
//               name: "Sort & Align",
//               command: "latex-workshop.bibalignsort",
//             },
//           },
//         },
//         p: {
//           name: "+Preview",
//           keys: {
//             d: {
//               name: "View Document",
//               command: "latex-workshop.view",
//             },
//             m: {
//               name: "Toggle Math Preview Panel",
//               command: "latex-workshop.toggleMathPreviewPanel",
//             },
//             p: {
//               name: "SyncTeX from cursor",
//               command: "latex-workshop.synctex",
//             },
//             r: {
//               name: "Refresh all viewers",
//               command: "latex-workshop.refresh-viewer",
//             },
//           },
//         },
//         x: {
//           name: "+Text",
//           keys: {
//             b: {
//               name: "Bold",
//               command: "latex-workshop.shortcut.textbf",
//             },
//             c: {
//               name: "Small Caps",
//               command: "latex-workshop.shortcut.textsc",
//             },
//             e: {
//               name: "Emphasis",
//               command: "latex-workshop.shortcut.emph",
//             },
//             f: {
//               name: "Sans Serif",
//               command: "latex-workshop.shortcut.textsf",
//             },
//             i: {
//               name: "Italic",
//               command: "latex-workshop.shortcut.textit",
//             },
//             n: {
//               name: "Normal",
//               command: "latex-workshop.shortcut.textnormal",
//             },
//             r: {
//               name: "Roman",
//               command: "latex-workshop.shortcut.textrm",
//             },
//             t: {
//               name: "Terminal",
//               command: "latex-workshop.shortcut.texttt",
//             },
//             u: {
//               name: "Underline",
//               command: "latex-workshop.shortcut.underline",
//             },
//             m: {
//               name: "+Math Fonts",
//               keys: {
//                 a: {
//                   name: "Calligraphic",
//                   command: "latex-workshop.shortcut.mathcal",
//                 },
//                 b: {
//                   name: "Bold",
//                   command: "latex-workshop.shortcut.mathbf",
//                 },
//                 f: {
//                   name: "Sans Serif",
//                   command: "latex-workshop.shortcut.mathsf",
//                 },
//                 i: {
//                   name: "Italic",
//                   command: "latex-workshop.shortcut.mathit",
//                 },
//                 r: {
//                   name: "Roman",
//                   command: "latex-workshop.shortcut.mathrm",
//                 },
//                 t: {
//                   name: "Terminal",
//                   command: "latex-workshop.shortcut.mathtt",
//                 },
//               },
//             },
//           },
//         },
//       },
//     },
//     "languageId:markdown": {
//       name: "Markdown",
//       keys: {
//         c: {
//           name: "+Buffer commands",
//           keys: {
//             e: {
//               name: "Export to HTML",
//               command: "markdown.extension.printToHtml",
//             },
//             p: {
//               name: "Open preview to the side",
//               command: "markdown.showPreviewToSide",
//             },
//             P: {
//               name: "Open preview in current group",
//               command: "markdown.showPreview",
//             },
//           },
//         },
//         t: {
//           name: "+Table of Contents",
//           keys: {
//             c: {
//               name: "Create Table of Contents",
//               command: "markdown.extension.toc.create",
//             },
//             n: {
//               name: "Add section numbers",
//               command: "markdown.extension.toc.addSecNumbers",
//             },
//             u: {
//               name: "Update Table of Contents",
//               command: "markdown.extension.toc.update",
//             },
//             N: {
//               name: "Remove section numbers",
//               command: "markdown.extension.toc.removeSecNumbers",
//             },
//           },
//         },
//         x: {
//           name: "+Text",
//           keys: {
//             "[": {
//               name: "Decrease Heading level",
//               command: "markdown.extension.editing.toggleHeadingDown",
//               keys: {
//                 "[": {
//                   name: "Decrease Heading level",
//                   command: "markdown.extension.editing.toggleHeadingDown",
//                 },
//                 "]": {
//                   name: "Increase Heading level",
//                   command: "markdown.extension.editing.toggleHeadingUp",
//                 },
//               },
//             },
//             "]": {
//               name: "Increase Heading level",
//               command: "markdown.extension.editing.toggleHeadingUp",
//               keys: {
//                 "[": {
//                   name: "Decrease Heading level",
//                   command: "markdown.extension.editing.toggleHeadingDown",
//                 },
//                 "]": {
//                   name: "Increase Heading level",
//                   command: "markdown.extension.editing.toggleHeadingUp",
//                 },
//               },
//             },
//             "`": {
//               name: "Toggle inline code",
//               command: "markdown.extension.editing.toggleCodeSpan",
//             },
//             b: {
//               name: "Toggle bold",
//               command: "markdown.extension.editing.toggleBold",
//             },
//             i: {
//               name: "Toggle italic",
//               command: "markdown.extension.editing.toggleItalic",
//             },
//             l: {
//               name: "Toggle list",
//               command: "markdown.extension.editing.toggleList",
//             },
//             m: {
//               name: "Toggle math",
//               command: "markdown.extension.editing.toggleMath",
//             },
//             s: {
//               name: "Toggle strikethrough",
//               command: "markdown.extension.editing.toggleStrikethrough",
//             },
//             "~": {
//               name: "Toggle code block",
//               command: "markdown.extension.editing.toggleCodeBlock",
//             },
//           },
//         },
//       },
//     },
//     "languageId:objectpascal": {
//       name: "ObjectPascal",
//       keys: {
//         "=": {
//           name: "+Format",
//           keys: {
//             "=": {
//               name: "Format region or buffer",
//               command: "editor.action.format",
//             },
//             b: {
//               name: "Format buffer",
//               command: "editor.action.formatDocument",
//             },
//             c: {
//               name: "Format changes",
//               command: "editor.action.formatChanges",
//             },
//             s: {
//               name: "Format selection",
//               command: "editor.action.formatSelection",
//             },
//             B: {
//               name: "+Format buffer with formatter",
//               command: "editor.action.formatDocument.multiple",
//             },
//             S: {
//               name: "+Format selection with formatter",
//               command: "editor.action.formatSelection.multiple",
//             },
//           },
//         },
//         g: {
//           name: "+Go to",
//           keys: {
//             d: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             e: {
//               name: "Go to errors/problems",
//               command: "workbench.action.problems.focus",
//             },
//             g: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             r: {
//               name: "Go to references",
//               command: "editor.action.goToReferences",
//             },
//             s: {
//               name: "Go to symbol in buffer",
//               command: "workbench.action.gotoSymbol",
//             },
//             R: {
//               name: "Find references",
//               command: "references-view.findReferences",
//             },
//             S: {
//               name: "Go to symbol in project",
//               command: "workbench.action.showAllSymbols",
//             },
//           },
//         },
//         r: {
//           name: "+Refactor",
//           keys: {
//             ".": {
//               name: "Quick fix",
//               command: "editor.action.quickFix",
//             },
//             r: {
//               name: "Rename symbol",
//               command: "editor.action.rename",
//             },
//           },
//         },
//         G: {
//           name: "+Peek",
//           keys: {
//             d: {
//               name: "Peek definition",
//               command: "editor.action.peekDefinition",
//             },
//             r: {
//               name: "Peek references",
//               command: "editor.action.referenceSearch.trigger",
//             },
//           },
//         },
//       },
//     },
//     "languageId:php": {
//       name: "PHP",
//       keys: {
//         "=": {
//           name: "+Format",
//           keys: {
//             "=": {
//               name: "Format region or buffer",
//               command: "editor.action.format",
//             },
//             b: {
//               name: "Format buffer",
//               command: "editor.action.formatDocument",
//             },
//             c: {
//               name: "Format changes",
//               command: "editor.action.formatChanges",
//             },
//             s: {
//               name: "Format selection",
//               command: "editor.action.formatSelection",
//             },
//             B: {
//               name: "+Format buffer with formatter",
//               command: "editor.action.formatDocument.multiple",
//             },
//             S: {
//               name: "+Format selection with formatter",
//               command: "editor.action.formatSelection.multiple",
//             },
//           },
//         },
//         g: {
//           name: "+Go to",
//           keys: {
//             d: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             e: {
//               name: "Go to errors/problems",
//               command: "workbench.action.problems.focus",
//             },
//             g: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             r: {
//               name: "Go to references",
//               command: "editor.action.goToReferences",
//             },
//             s: {
//               name: "Go to symbol in buffer",
//               command: "workbench.action.gotoSymbol",
//             },
//             R: {
//               name: "Find references",
//               command: "references-view.findReferences",
//             },
//             S: {
//               name: "Go to symbol in project",
//               command: "workbench.action.showAllSymbols",
//             },
//           },
//         },
//         r: {
//           name: "+Refactor",
//           keys: {
//             ".": {
//               name: "Quick fix",
//               command: "editor.action.quickFix",
//             },
//             r: {
//               name: "Rename symbol",
//               command: "editor.action.rename",
//             },
//           },
//         },
//         G: {
//           name: "+Peek",
//           keys: {
//             d: {
//               name: "Peek definition",
//               command: "editor.action.peekDefinition",
//             },
//             r: {
//               name: "Peek references",
//               command: "editor.action.referenceSearch.trigger",
//             },
//           },
//         },
//       },
//     },
//     "languageId:python": {
//       name: "Python",
//       keys: {
//         v: {
//           name: "+Virtualenv",
//           command: "python.setInterpreter",
//         },
//         "=": {
//           name: "+Format",
//           keys: {
//             "=": {
//               name: "Format region or buffer",
//               command: "editor.action.format",
//             },
//             b: {
//               name: "Format buffer",
//               command: "editor.action.formatDocument",
//             },
//             c: {
//               name: "Format changes",
//               command: "editor.action.formatChanges",
//             },
//             s: {
//               name: "Format selection",
//               command: "editor.action.formatSelection",
//             },
//             B: {
//               name: "+Format buffer with formatter",
//               command: "editor.action.formatDocument.multiple",
//             },
//             S: {
//               name: "+Format selection with formatter",
//               command: "editor.action.formatSelection.multiple",
//             },
//           },
//         },
//         b: {
//           name: "+Backend",
//           keys: {
//             o: {
//               name: "Show LSP output",
//               command: "python.viewLanguageServerOutput",
//             },
//             r: {
//               name: "Restart LSP",
//               command: "python.analysis.restartLanguageServer",
//             },
//           },
//         },
//         c: {
//           name: "+Execute",
//           keys: {
//             c: {
//               name: "Execute file in terminal",
//               command: "python.execInTerminal",
//             },
//             C: {
//               name: "Execute file in terminal",
//               command: "python.execInTerminal",
//             },
//           },
//         },
//         g: {
//           name: "+Go to",
//           keys: {
//             d: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             e: {
//               name: "Go to errors/problems",
//               command: "workbench.action.problems.focus",
//             },
//             g: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             r: {
//               name: "Go to references",
//               command: "editor.action.goToReferences",
//             },
//             s: {
//               name: "Go to symbol in file",
//               command: "workbench.action.gotoSymbol",
//             },
//             R: {
//               name: "Find references",
//               command: "references-view.findReferences",
//             },
//             S: {
//               name: "Go to symbol in project",
//               command: "workbench.action.showAllSymbols",
//             },
//           },
//         },
//         r: {
//           name: "+Refactor",
//           keys: {
//             ".": {
//               name: "Refactor menu",
//               command: "editor.action.refactor",
//             },
//             r: {
//               name: "Rename symbol",
//               command: "editor.action.rename",
//             },
//             I: {
//               name: "Sort imports",
//               command: "python.sortImports",
//             },
//           },
//         },
//         s: {
//           name: "+REPL",
//           keys: {
//             i: {
//               name: "Start REPL",
//               command: "python.startREPL",
//             },
//             l: {
//               name: "Send line/selection to REPL",
//               command: "python.execSelectionInTerminal",
//             },
//             r: {
//               name: "Send line/selection to REPL",
//               command: "python.execSelectionInTerminal",
//             },
//           },
//         },
//         t: {
//           name: "+Test",
//           keys: {
//             a: {
//               name: "Run all tests",
//               command: "testing.runAll",
//             },
//             b: {
//               name: "Run current test file",
//               command: "testing.runCurrentFile",
//             },
//             r: {
//               name: "Re-run failed tests",
//               command: "testing.reRunFailTests",
//             },
//             t: {
//               name: "Select and run test",
//               command: "testing.runSelected",
//             },
//             A: {
//               name: "Debug all tests",
//               command: "testing.debugAll",
//             },
//             T: {
//               name: "Select and debug test",
//               command: "testing.debugSelected",
//             },
//           },
//         },
//         G: {
//           name: "+Peek",
//           keys: {
//             d: {
//               name: "Peek definition",
//               command: "editor.action.peekDefinition",
//             },
//             r: {
//               name: "Peek references",
//               command: "editor.action.referenceSearch.trigger",
//             },
//           },
//         },
//       },
//     },
//     "languageId:quarto": {
//       name: "quarto",
//       keys: {
//         d: {
//           name: "Debugonce R",
//           command: "r.runCommandWithSelectionOrWord",
//           args: "debugonce($$)",
//         },
//         h: {
//           name: "Help R",
//           command: "r.helpPanel.openForSelection",
//         },
//         i: {
//           name: "Insert cell",
//           command: "quarto.insertCodeCell",
//         },
//         m: {
//           name: "Run current cell",
//           command: "quarto.runCurrentCell",
//         },
//         o: {
//           name: "Objects in workspace R",
//           command: "r.runCommand",
//           args: "sort(sapply(ls(), function(x){object.size(get(x))})) ",
//         },
//         p: {
//           name: "Render",
//           command: "quarto.render",
//         },
//         s: {
//           name: "Run selection",
//           command: "quarto.runSelection",
//         },
//         R: {
//           name: "Restart R",
//           command: "r.runCommand",
//           args: "rstudioapi::restartSession()",
//         },
//         "=": {
//           name: "+Format",
//           keys: {
//             "=": {
//               name: "Format region or buffer",
//               command: "editor.action.format",
//             },
//             b: {
//               name: "Format buffer",
//               command: "editor.action.formatDocument",
//             },
//             c: {
//               name: "Format changes",
//               command: "editor.action.formatChanges",
//             },
//             s: {
//               name: "Format selection",
//               command: "editor.action.formatSelection",
//             },
//             B: {
//               name: "Format buffer with formatter",
//               command: "editor.action.formatDocument.multiple",
//             },
//             S: {
//               name: "Format selection with formatter",
//               command: "editor.action.formatSelection.multiple",
//             },
//           },
//         },
//         a: {
//           name: "+Code actions",
//           keys: {
//             a: {
//               name: "Execute code action",
//               command: "editor.action.codeAction",
//             },
//             f: {
//               name: "Execute fix action",
//               command: "editor.action.quickFix",
//             },
//             r: {
//               name: "Refactor action",
//               command: "editor.action.refactor",
//             },
//             s: {
//               name: "Source action",
//               command: "editor.action.sourceAction",
//             },
//           },
//         },
//         f: {
//           name: "+Fold",
//           keys: {
//             f: {
//               name: "Fold cell",
//               command: "editor.fold",
//             },
//             u: {
//               name: "Unfold cell",
//               command: "editor.unfold",
//             },
//             F: {
//               name: "Fold all cells",
//               command: "editor.foldAll",
//             },
//             U: {
//               name: "Unfold all cells",
//               command: "editor.unfoldAll",
//             },
//           },
//         },
//         g: {
//           name: "+Go to",
//           keys: {
//             d: {
//               name: "Go to declaration",
//               command: "editor.action.revealDeclaration",
//             },
//             e: {
//               name: "Go to errors/problems",
//               command: "workbench.actions.view.problems",
//             },
//             f: {
//               name: "Go to file in explorer",
//               command: "workbench.files.action.showActiveFileInExplorer",
//             },
//             g: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             r: {
//               name: "Go to reference",
//               command: "editor.action.goToReferences",
//             },
//             s: {
//               name: "Go to symbol in buffer",
//               command: "workbench.action.gotoSymbol",
//             },
//             R: {
//               name: "Find references",
//               command: "references-view.findReferences",
//             },
//             S: {
//               name: "Go to symbol in project",
//               command: "workbench.action.showAllSymbols",
//             },
//           },
//         },
//         r: {
//           name: "+Refactor",
//           keys: {
//             r: {
//               name: "Rename Symbol",
//               command: "editor.action.rename",
//             },
//           },
//         },
//         v: {
//           name: "+View R",
//           keys: {
//             c: {
//               name: "Column numbers",
//               command: "r.runCommandWithSelectionOrWord",
//               args: "ncol($$)",
//             },
//             h: {
//               name: "head",
//               command: "r.head",
//             },
//             l: {
//               name: "length",
//               command: "r.length",
//             },
//             n: {
//               name: "Names",
//               command: "r.names",
//             },
//             p: {
//               name: "print",
//               command: "r.runCommandWithSelectionOrWord",
//               args: "$$",
//             },
//             r: {
//               name: "Row numbers",
//               command: "r.nrow",
//             },
//             s: {
//               name: "str",
//               command: "r.runCommandWithSelectionOrWord",
//               args: "str($$)",
//             },
//             v: {
//               name: "View",
//               command: "r.view",
//             },
//             C: {
//               name: "Column names",
//               command: "r.runCommandWithSelectionOrWord",
//               args: "colnames($$)",
//             },
//             R: {
//               name: "Row names",
//               command: "r.runCommandWithSelectionOrWord",
//               args: "rownames($$)",
//             },
//           },
//         },
//         G: {
//           name: "+Peek",
//           keys: {
//             d: {
//               name: "Peek declaration",
//               command: "editor.action.peekDeclaration",
//             },
//             g: {
//               name: "Peek definition",
//               command: "editor.action.peekDefinition",
//             },
//             r: {
//               name: "Peek references",
//               command: "editor.action.referenceSearch.trigger",
//             },
//           },
//         },
//       },
//     },
//     "languageId:r": {
//       name: "R",
//       keys: {
//         d: {
//           name: "Debugonce",
//           command: "r.runCommandWithSelectionOrWord",
//           args: "debugonce($$)",
//         },
//         h: {
//           name: "Help",
//           command: "r.helpPanel.openForSelection",
//         },
//         o: {
//           name: "Objects in workspace R",
//           command: "r.runCommand",
//           args: "sort(sapply(ls(), function(x){object.size(get(x))})) ",
//         },
//         s: {
//           name: "Run selection",
//           command: "r.runSelection",
//         },
//         R: {
//           name: "Restart R",
//           command: "r.runCommand",
//           args: "rstudioapi::restartSession()",
//         },
//         "=": {
//           name: "+Format",
//           keys: {
//             "=": {
//               name: "Format region or buffer",
//               command: "editor.action.format",
//             },
//             b: {
//               name: "Format buffer",
//               command: "editor.action.formatDocument",
//             },
//             c: {
//               name: "Format changes",
//               command: "editor.action.formatChanges",
//             },
//             s: {
//               name: "Format selection",
//               command: "editor.action.formatSelection",
//             },
//             B: {
//               name: "Format buffer with formatter",
//               command: "editor.action.formatDocument.multiple",
//             },
//             S: {
//               name: "Format selection with formatter",
//               command: "editor.action.formatSelection.multiple",
//             },
//           },
//         },
//         a: {
//           name: "+Code actions",
//           keys: {
//             a: {
//               name: "Execute code action",
//               command: "editor.action.codeAction",
//             },
//             f: {
//               name: "Execute fix action",
//               command: "editor.action.quickFix",
//             },
//             r: {
//               name: "Refactor action",
//               command: "editor.action.refactor",
//             },
//             s: {
//               name: "Source action",
//               command: "editor.action.sourceAction",
//             },
//           },
//         },
//         g: {
//           name: "+Go to",
//           keys: {
//             d: {
//               name: "Go to declaration",
//               command: "editor.action.revealDeclaration",
//             },
//             e: {
//               name: "Go to errors/problems",
//               command: "workbench.actions.view.problems",
//             },
//             f: {
//               name: "Go to file in explorer",
//               command: "workbench.files.action.showActiveFileInExplorer",
//             },
//             g: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             r: {
//               name: "Go to reference",
//               command: "editor.action.goToReferences",
//             },
//             s: {
//               name: "Go to symbol in buffer",
//               command: "workbench.action.gotoSymbol",
//             },
//             R: {
//               name: "Find references",
//               command: "references-view.findReferences",
//             },
//             S: {
//               name: "Go to symbol in project",
//               command: "workbench.action.showAllSymbols",
//             },
//           },
//         },
//         r: {
//           name: "+Refactor",
//           keys: {
//             r: {
//               name: "Rename Symbol",
//               command: "editor.action.rename",
//             },
//           },
//         },
//         v: {
//           name: "+View",
//           keys: {
//             c: {
//               name: "Column numbers",
//               command: "r.runCommandWithSelectionOrWord",
//               args: "ncol($$)",
//             },
//             h: {
//               name: "head",
//               command: "r.head",
//             },
//             l: {
//               name: "length",
//               command: "r.length",
//             },
//             n: {
//               name: "Names",
//               command: "r.names",
//             },
//             p: {
//               name: "print",
//               command: "r.runCommandWithSelectionOrWord",
//               args: "$$",
//             },
//             r: {
//               name: "Row numbers",
//               command: "r.nrow",
//             },
//             s: {
//               name: "str",
//               command: "r.runCommandWithSelectionOrWord",
//               args: "str($$)",
//             },
//             v: {
//               name: "View",
//               command: "r.view",
//             },
//             C: {
//               name: "Column names",
//               command: "r.runCommandWithSelectionOrWord",
//               args: "colnames($$)",
//             },
//             R: {
//               name: "Row names",
//               command: "r.runCommandWithSelectionOrWord",
//               args: "rownames($$)",
//             },
//           },
//         },
//         G: {
//           name: "+Peek",
//           keys: {
//             d: {
//               name: "Peek declaration",
//               command: "editor.action.peekDeclaration",
//             },
//             g: {
//               name: "Peek definition",
//               command: "editor.action.peekDefinition",
//             },
//             r: {
//               name: "Peek references",
//               command: "editor.action.referenceSearch.trigger",
//             },
//           },
//         },
//       },
//     },
//     "languageId:ruby": {
//       name: "Ruby",
//       keys: {
//         "=": {
//           name: "+Format",
//           keys: {
//             "=": {
//               name: "Format region or buffer",
//               command: "editor.action.format",
//             },
//             b: {
//               name: "Format buffer",
//               command: "editor.action.formatDocument",
//             },
//             c: {
//               name: "Format changes",
//               command: "editor.action.formatChanges",
//             },
//             s: {
//               name: "Format selection",
//               command: "editor.action.formatSelection",
//             },
//             B: {
//               name: "+Format buffer with formatter",
//               command: "editor.action.formatDocument.multiple",
//             },
//             S: {
//               name: "+Format selection with formatter",
//               command: "editor.action.formatSelection.multiple",
//             },
//           },
//         },
//         g: {
//           name: "+Go to",
//           keys: {
//             d: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             e: {
//               name: "Go to errors/problems",
//               command: "workbench.action.problems.focus",
//             },
//             g: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             r: {
//               name: "Go to references",
//               command: "editor.action.goToReferences",
//             },
//             s: {
//               name: "Go to symbol in buffer",
//               command: "workbench.action.gotoSymbol",
//             },
//             R: {
//               name: "Find references",
//               command: "references-view.findReferences",
//             },
//             S: {
//               name: "Go to symbol in project",
//               command: "workbench.action.showAllSymbols",
//             },
//           },
//         },
//         r: {
//           name: "+Refactor",
//           keys: {
//             r: {
//               name: "Rename symbol",
//               command: "editor.action.rename",
//             },
//           },
//         },
//         G: {
//           name: "+Peek",
//           keys: {
//             d: {
//               name: "Peek definition",
//               command: "editor.action.peekDefinition",
//             },
//             r: {
//               name: "Peek references",
//               command: "editor.action.referenceSearch.trigger",
//             },
//           },
//         },
//       },
//     },
//     "languageId:rust": {
//       name: "Rust",
//       keys: {
//         T: {
//           name: "Toggle inlay hints",
//           command: "rust-analyzer.toggleInlayHints",
//         },
//         "=": {
//           name: "+Format",
//           keys: {
//             "=": {
//               name: "Format region or buffer",
//               command: "editor.action.format",
//             },
//             b: {
//               name: "Format buffer",
//               command: "editor.action.formatDocument",
//             },
//             s: {
//               name: "Format selection",
//               command: "editor.action.format",
//             },
//           },
//         },
//         a: {
//           name: "+Actions",
//           keys: {
//             a: {
//               name: "Execute code action",
//               command: "editor.action.codeAction",
//             },
//             f: {
//               name: "Execute fix action",
//               command: "editor.action.quickFix",
//             },
//             s: {
//               name: "Execute source action",
//               command: "editor.action.sourceAction",
//             },
//             r: {
//               name: "+Refactor",
//               keys: {
//                 ".": {
//                   name: "Execute refactor action",
//                   command: "editor.action.refactor",
//                 },
//                 r: {
//                   name: "Rename symbol",
//                   command: "editor.action.rename",
//                 },
//               },
//             },
//           },
//         },
//         b: {
//           name: "+Backend",
//           keys: {
//             d: {
//               name: "Rust analyzer: describe status",
//               command: "rust-analyzer.analyzerStatus",
//             },
//             r: {
//               name: "Rust analyzer: restart server",
//               command: "rust-analyzer.reload",
//             },
//             v: {
//               name: "Rust analyzer: Show version",
//               command: "rust-analyzer.serverVersion",
//             },
//             R: {
//               name: "Rust analyzer: reload workspace",
//               command: "rust-analyzer.reloadWorkspace",
//             },
//           },
//         },
//         g: {
//           name: "+Goto",
//           keys: {
//             d: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             h: {
//               name: "Show call hierarchy",
//               command: "references-view.showCallHierarchy",
//             },
//             i: {
//               name: "Go to implementations",
//               command: "editor.action.goToImplementation",
//             },
//             r: {
//               name: "Go to references",
//               command: "editor.action.goToReferences",
//             },
//             s: {
//               name: "Go to symbol in buffer",
//               command: "workbench.action.gotoSymbol",
//             },
//             t: {
//               name: "Go to type definition",
//               command: "editor.action.goToTypeDefinition",
//             },
//             I: {
//               name: "Find implementations",
//               command: "references-view.findImplementations",
//             },
//             R: {
//               name: "Find references",
//               command: "references-view.findReferences",
//             },
//             S: {
//               name: "Go to symbol in project",
//               command: "workbench.action.showAllSymbols",
//             },
//           },
//         },
//         r: {
//           name: "+Refactor",
//           keys: {
//             ".": {
//               name: "Refactor menu",
//               command: "editor.action.refactor",
//             },
//             r: {
//               name: "Rename symbol",
//               command: "editor.action.rename",
//             },
//           },
//         },
//         G: {
//           name: "+Peek",
//           keys: {
//             d: {
//               name: "Peek definition",
//               command: "editor.action.peekDefinition",
//             },
//             h: {
//               name: "Peek call hierarchy",
//               command: "editor.showCallHierarchy",
//             },
//             i: {
//               name: "Peek implementations",
//               command: "editor.action.peekImplementation",
//             },
//             r: {
//               name: "Peek references",
//               command: "editor.action.referenceSearch.trigger",
//             },
//           },
//         },
//       },
//     },
//     "languageId:typescript": {
//       name: "TypeScript",
//       keys: {
//         "=": {
//           name: "+Format",
//           keys: {
//             "=": {
//               name: "Format region or buffer",
//               command: "editor.action.format",
//             },
//             b: {
//               name: "Format buffer",
//               command: "editor.action.formatDocument",
//             },
//             c: {
//               name: "Format changes",
//               command: "editor.action.formatChanges",
//             },
//             s: {
//               name: "Format selection",
//               command: "editor.action.formatSelection",
//             },
//             B: {
//               name: "+Format buffer with formatter",
//               command: "editor.action.formatDocument.multiple",
//             },
//             S: {
//               name: "+Format selection with formatter",
//               command: "editor.action.formatSelection.multiple",
//             },
//           },
//         },
//         g: {
//           name: "+Go to",
//           keys: {
//             d: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             h: {
//               name: "Show call hierarchy",
//               command: "references-view.showCallHierarchy",
//             },
//             r: {
//               name: "Go to reference",
//               command: "editor.action.goToReferences",
//             },
//             s: {
//               name: "Go to symbol in buffer",
//               command: "workbench.action.gotoSymbol",
//             },
//             t: {
//               name: "Go to type definition",
//               command: "editor.action.goToTypeDefinition",
//             },
//             I: {
//               name: "Find implementations",
//               command: "references-view.findImplementations",
//             },
//             R: {
//               name: "Find references",
//               command: "references-view.findReferences",
//             },
//             S: {
//               name: "Go to symbol in project",
//               command: "workbench.action.showAllSymbols",
//             },
//           },
//         },
//         G: {
//           name: "+Peek",
//           keys: {
//             d: {
//               name: "Peek definition",
//               command: "editor.action.peekDefinition",
//             },
//             h: {
//               name: "Peek call hierarchy",
//               command: "editor.showCallHierarchy",
//             },
//             i: {
//               name: "Peek implementations",
//               command: "editor.action.peekImplementation",
//             },
//             r: {
//               name: "Peek references",
//               command: "editor.action.referenceSearch.trigger",
//             },
//             t: {
//               name: "Peek type definition",
//               command: "editor.action.peekTypeDefinition",
//             },
//           },
//         },
//       },
//     },
//     "languageId:cuda-cpp": {
//       name: "CUDA-C++",
//       keys: {
//         "=": {
//           name: "+Format",
//           keys: {
//             "=": {
//               name: "Format region or buffer",
//               command: "editor.action.format",
//             },
//             b: {
//               name: "Format buffer",
//               command: "editor.action.formatDocument",
//             },
//             c: {
//               name: "Format changes",
//               command: "editor.action.formatChanges",
//             },
//             s: {
//               name: "Format selection",
//               command: "editor.action.formatSelection",
//             },
//             B: {
//               name: "Format buffer with formatter",
//               command: "editor.action.formatDocument.multiple",
//             },
//             S: {
//               name: "Format selection with formatter",
//               command: "editor.action.formatSelection.multiple",
//             },
//           },
//         },
//         b: {
//           name: "+Backend",
//           keys: {
//             d: {
//               name: "Reset Database",
//               command: "C_Cpp.ResetDatabase",
//             },
//             w: {
//               name: "Rescan Workspace",
//               command: "C_Cpp.RescanWorkspace",
//             },
//           },
//         },
//         d: {
//           name: "+Debug",
//           keys: {
//             f: {
//               name: "Change debug focus",
//               command: "cuda.changeDebugFocus",
//             },
//           },
//         },
//         g: {
//           name: "+Go to",
//           keys: {
//             a: {
//               name: "Switch Header/Source",
//               command: "C_Cpp.SwitchHeaderSource",
//             },
//             d: {
//               name: "Go to declaration",
//               command: "editor.action.revealDeclaration",
//             },
//             e: {
//               name: "Go to errors/problems",
//               command: "workbench.actions.view.problems",
//             },
//             f: {
//               name: "Go to file in explorer",
//               command: "workbench.files.action.showActiveFileInExplorer",
//             },
//             g: {
//               name: "Go to definition",
//               command: "editor.action.revealDefinition",
//             },
//             r: {
//               name: "Go to reference",
//               command: "editor.action.goToReferences",
//             },
//             s: {
//               name: "Go to symbol in buffer",
//               command: "workbench.action.gotoSymbol",
//             },
//             R: {
//               name: "Find references",
//               command: "references-view.findReferences",
//             },
//             S: {
//               name: "Go to symbol in project",
//               command: "workbench.action.showAllSymbols",
//             },
//           },
//         },
//         r: {
//           name: "+Refactor",
//           keys: {
//             r: {
//               name: "Rename Symbol",
//               command: "editor.action.rename",
//             },
//           },
//         },
//         G: {
//           name: "+Peek",
//           keys: {
//             d: {
//               name: "Peek declaration",
//               command: "editor.action.peekDeclaration",
//             },
//             g: {
//               name: "Peek definition",
//               command: "editor.action.peekDefinition",
//             },
//             r: {
//               name: "Peek references",
//               command: "editor.action.referenceSearch.trigger",
//             },
//           },
//         },
//       },
//     },
//   },
// };

// = {
//     "name": "vspacecode",
//     "preview": true,
//     "displayName": "VSpaceCode",
//     "description": "Spacemacs like keybindings for Visual Studio Code",
//     "publisher": "VSpaceCode",
//     "author": {
//         "name": "Steven Guh"
//     },
//     "version": "0.10.18",
//     "engines": {
//         "vscode": "^1.67.0"
//     },
//     "icon": "resources/logo.png",
//     "galleryBanner": {
//         "color": "#3a3d41",
//         "theme": "dark"
//     },
//     "categories": [
//         "Keymaps",
//         "Other"
//     ],
//     "keywords": [
//         "spacemacs",
//         "vscode",
//         "vim",
//         "VSCodeVim"
//     ],
//     "extensionPack": [
//         "VSpaceCode.whichkey",
//         "vscodevim.vim",
//         "kahole.magit",
//         "jacobdufault.fuzzy-search",
//         "bodil.file-browser"
//     ],
//     "extensionDependencies": [
//         "VSpaceCode.whichkey"
//     ],
//     "extensionKind": [
//         "ui",
//         "workspace"
//     ],
//     "license": "SEE LICENSE IN LICENSE.txt",
//     "homepage": "https://github.com/VSpaceCode/VSpaceCode",
//     "repository": {
//         "type": "git",
//         "url": "https://github.com/VSpaceCode/VSpacecode.git"
//     },
//     "bugs": {
//         "url": "https://github.com/VSpaceCode/VSpaceCode/issues"
//     },
//     "activationEvents": [
//         "onStartupFinished",
//         "onCommand:vspacecode.space",
//         "onCommand:vspacecode.showMagitRefMenu",
//         "onCommand:vspacecode.showMagitRefreshMenu",
//         "onCommand:vspacecode.configure",
//         "onCommand:vspacecode.configureSettings",
//         "onCommand:vspacecode.configureKeybindings",
//         "onCommand:vspacecode.openDocumentationUrl"
//     ],
//     "main": "./dist/extension-node",
//     "browser": "./dist/extension-web",
//     "contributes": {
//         "commands": [
//             {
//                 "command": "vspacecode.space",
//                 "title": "Show VSpaceCode Menu",
//                 "category": "VSpaceCode"
//             },
//             {
//                 "command": "vspacecode.showMagitRefMenu",
//                 "title": "Show Magit Ref Menu",
//                 "category": "VSpaceCode"
//             },
//             {
//                 "command": "vspacecode.showMagitRefreshMenu",
//                 "title": "Show Magit Refresh Menu",
//                 "category": "VSpaceCode"
//             },
//             {
//                 "command": "vspacecode.configure",
//                 "title": "Configure Default Settings and Keybindings",
//                 "category": "VSpaceCode"
//             },
//             {
//                 "command": "vspacecode.configureSettings",
//                 "title": "Configure Default Settings",
//                 "category": "VSpaceCode"
//             },
//             {
//                 "command": "vspacecode.configureKeybindings",
//                 "title": "Configure Default Keybindings",
//                 "category": "VSpaceCode"
//             },
//             {
//                 "command": "vspacecode.openDocumentationUrl",
//                 "title": "Open Documentation",
//                 "category": "VSpaceCode"
//             }
//         ],
//         "keybindings": [
//             {
//                 "key": "t",
//                 "command": "whichkey.triggerKey",
//                 "args": {
//                     "key": "t",
//                     "when": "sideBarVisible && explorerViewletVisible"
//                 },
//                 "when": "whichkeyVisible && sideBarVisible && explorerViewletVisible"
//             }
//         ],
//         "configuration": [
//             {
//                 "title": "VSpaceCode",
//                 "type": "object",
//                 "properties": {
//                     "vspacecode.magitRefBindings": {
//                         "type": "array",
//                         "markdownDescription": "The bindings of magit ref menu",
//                         "default": [
//                             {
//                                 "key": "b",
//                                 "name": "Copy buffer revision",
//                                 "icon": "file",
//                                 "type": "command",
//                                 "command": "magit.copy-buffer-revision"
//                             },
//                             {
//                                 "key": "r",
//                                 "name": "Show Ref",
//                                 "icon": "eye",
//                                 "type": "command",
//                                 "command": "magit.show-refs"
//                             },
//                             {
//                                 "key": "s",
//                                 "name": "Copy section value",
//                                 "icon": "list-selection",
//                                 "type": "command",
//                                 "command": "magit.copy-section-value"
//                             },
//                             {
//                                 "key": "y",
//                                 "name": "Yank a line",
//                                 "icon": "list-flat",
//                                 "type": "command",
//                                 "command": "vim.remap",
//                                 "args": {
//                                     "after": [
//                                         "y",
//                                         "y"
//                                     ]
//                                 }
//                             }
//                         ]
//                     },
//                     "vspacecode.magitRefreshBindings": {
//                         "type": "array",
//                         "markdownDescription": "The bindings of magit refresh menu",
//                         "default": [
//                             {
//                                 "key": "g",
//                                 "name": "Go cursor to top",
//                                 "icon": "arrow-up",
//                                 "type": "command",
//                                 "command": "cursorTop"
//                             },
//                             {
//                                 "key": "r",
//                                 "name": "Refresh magit buffer",
//                                 "icon": "refresh",
//                                 "type": "command",
//                                 "command": "magit.refresh"
//                             }
//                         ]
//                     },
//                     "vspacecode.bindings":
//             }
//         ],
//         "walkthroughs": [
//             {
//                 "id": "vspacecode.welcome",
//                 "title": "get started with vspacecode",
//                 "description": "",
//                 "steps": [
//                     {
//                         "id": "vspacecode.welcome.configuration",
//                         "title": "setting up",
//                         "description": "this step will set up all the necessary configuration for vspacecode.\n[configure for you](command:vspacecode.configure)",
//                         "media": {
//                             "markdown": "walkthroughs/welcome/configuration.md"
//                         },
//                         "completionevents": [
//                             "oncommand:vspacecode.configure",
//                             "oncommand:vspacecode.opendocumentationurl"
//                         ]
//                     },
//                     {
//                         "id": "vspacecode.welcome.tryout",
//                         "title": "try it out",
//                         "media": {
//                             "markdown": "walkthroughs/welcome/tryout.md"
//                         },
//                         "completionevents": [
//                             "oncommand:vspacecode.space"
//                         ]
//                     },
//                     {
//                         "id": "vspacecode.welcome.customization",
//                         "title": "customization",
//                         "media": {
//                             "markdown": "walkthroughs/welcome/customization.md"
//                         },
//                         "completionevents": [
//                             "oncommand:vspacecode.opendocumentationurl"
//                         ]
//                     }
//                 ]
//             }
//         ]
//     },
//     "scripts": {
//         "vscode:prepublish": "webpack --mode production",
//         "compile": "webpack --mode development",
//         "watch": "webpack --watch",
//         "format": "prettier --write .",
//         "format-check": "prettier --check .",
//         "lint": "eslint src --ext ts",
//         "test": "npm run compile && npm run test-node && npm run test-web",
//         "test-node": "node ./dist/test/runtest-node.js",
//         "test-web": "node ./dist/test/runtest-web.js",
//         "generate-keybindings": "node ./scripts/keybindings.js",
//         "sort-bindings": "node ./scripts/sort.js"
//     },
//     "devdependencies": {
//         "@types/glob": "^7.1.3",
//         "@types/lodash": "^4.14.168",
//         "@types/mocha": "^9.0.0",
//         "@types/node": "16.x",
//         "@types/vscode": "^1.67.0",
//         "@types/webpack-env": "^1.16.0",
//         "@typescript-eslint/eslint-plugin": "^5.3.0",
//         "@typescript-eslint/parser": "^5.3.0",
//         "@vscode/test-electron": "^2.1.2",
//         "@vscode/test-web": "^0.0.50",
//         "adm-zip": "^0.5.7",
//         "assert": "^2.0.0",
//         "eslint": "^8.1.0",
//         "eslint-config-prettier": "^8.5.0",
//         "glob": "^7.1.6",
//         "markdown-table": "^2.0.0",
//         "mocha": "^9.1.3",
//         "prettier": "^2.6.2",
//         "process": "^0.11.10",
//         "ts-loader": "^9.2.6",
//         "typescript": "^4.2.3",
//         "vsce": "^2.6.3",
//         "vscode-test": "^1.5.1",
//         "webpack": "^5.76.0",
//         "webpack-cli": "^4.5.0"
//     },
//     "dependencies": {
//         "jsonc-parser": "^3.0.0",
//         "lodash": "^4.17.21",
//         "path-browserify": "^1.0.1"
//     }
// };
