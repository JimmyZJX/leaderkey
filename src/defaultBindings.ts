import { Bindings, normalize } from "./command";

const selectWindow0To8: Bindings["keys"] = {
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
};

const SpcWTransientKeysExcluding0To8: Bindings["keys"] = {
  // Select
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
  o: {
    name: "Switch frame",
    command: "workbench.action.quickSwitchWindow",
  },
  w: {
    name: "Focus next window",
    command: "workbench.action.focusNextGroup",
  },

  W: {
    name: "Focus previous window",
    command: "workbench.action.focusPreviousGroup",
  },
  // Move
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
  // Split
  s: {
    name: "Split window below",
    command: "workbench.action.splitEditorDown",
  },
  v: {
    name: "Split window right",
    command: "workbench.action.splitEditor",
  },
  "-": {
    name: "Split window below",
    command: "workbench.action.splitEditorDown",
  },
  "/": {
    name: "Split window right",
    command: "workbench.action.splitEditor",
  },
  m: {
    name: "Maximize window",
    command: "workbench.action.toggleMaximizeEditorGroup",
  },
  M: {
    name: "Maximize window without hiding others",
    command: "workbench.action.toggleEditorWidths",
  },
  // Resize
  "[": {
    name: "Shrink window",
    command: "workbench.action.decreaseViewSize",
  },
  "]": {
    name: "Enlarge window",
    command: "workbench.action.increaseViewSize",
  },
  // Other
  d: {
    name: "Close window",
    command: "workbench.action.closeEditorsInGroup",
  },
  D: {
    name: "Close all other windows",
    command: "workbench.action.closeEditorsInOtherGroups",
  },
  q: {
    name: "Quit",
    command: "leaderkey.render",
    args: "",
  },
};

const SpaceRoot: Bindings = {
  name: "<SPC>",
  keys: {
    ...selectWindow0To8,
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
    // ".": {
    //   name: "Repeat most recent action",
    //   command: "whichkey.repeatMostRecent",
    //   args: "vspacecode.bindings",
    // },
    "/": {
      name: "Search in project",
      command: "workbench.action.findInFiles",
    },
    ";": {
      name: "Toggle comment",
      command: "editor.action.commentLine",
    },
    // "?": {
    //   name: "Search keybindings",
    //   command: "whichkey.searchBindings",
    // },
    "v:transient": {
      name: "Smart expand transient",
      transient: true,
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
    v: {
      name: "Smart select/expand region",
      command: "editor.action.smartSelect.grow",
      goto: "SPC v:transient",
    },
    V: {
      name: "Smart shrink region",
      command: "editor.action.smartSelect.shrink",
      goto: "SPC v:transient",
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
          commands: ["editor.action.selectAll", "editor.action.clipboardPasteAction"],
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
              command: "workbench.debug.viewlet.action.addFunctionBreakpointAction",
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
          name: "Toggle (show) explorer view",
          command: "workbench.view.explorer",
        },
        "t:explorerVisible": {
          name: "Toggle (hide) explorer view",
          command: "workbench.action.toggleSidebarVisibility",
        },
        w: {
          name: "Open active in new window",
          command: "workbench.action.files.showOpenedFileInNewWindow",
        },
        D: {
          name: "Delete current file",
          commands: ["workbench.files.action.showActiveFileInExplorer", "deleteFile"],
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
              name: "Open settings JSON",
              command: "workbench.action.openSettingsJson",
            },
            D: {
              name: "Open settings",
              command: "workbench.action.openGlobalSettings",
            },
            k: {
              name: "Open global key bindings JSON",
              command: "workbench.action.openGlobalKeybindingsFile",
            },
            K: {
              name: "Open global key bindings",
              command: "workbench.action.openGlobalKeybindings",
            },
            l: {
              name: "Open language settings",
              command: "workbench.action.configureLanguageBasedSettings",
            },
            r: {
              name: "Open workspace settings JSON",
              command: "workbench.action.openRemoteSettingsFile",
            },
            R: {
              name: "Open workspace settings",
              command: "workbench.action.openRemoteSettings",
            },
            s: {
              name: "Configure user snippets",
              command: "workbench.action.openSnippets",
            },
            w: {
              name: "Open workspace settings JSON",
              command: "workbench.action.openWorkspaceSettingsFile",
            },
            W: {
              name: "Open workspace settings",
              command: "workbench.action.openWorkspaceSettings",
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
          commands: ["workbench.action.files.saveAll", "workbench.action.closeWindow"],
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
        // ".": {
        //   name: "Repeat recent actions",
        //   command: "whichkey.repeatRecent",
        //   args: "vspacecode.bindings",
        // },
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
        ...SpcWTransientKeysExcluding0To8,
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
        "=": {
          name: "Reset window sizes",
          command: "workbench.action.evenEditorWidths",
        },
        ".": {
          name: "Window Transient State",
          transient: true,
          keys: {
            ...selectWindow0To8,
            ...SpcWTransientKeysExcluding0To8,
          },
        },
        "[": {
          name: "Shrink window",
          command: "workbench.action.decreaseViewSize",
          goto: "SPC w .",
        },
        "]": {
          name: "Enlarge window",
          command: "workbench.action.increaseViewSize",
          goto: "SPC w .",
        },
        x: {
          name: "Close all windows",
          command: "workbench.action.closeAllGroups",
        },
        z: {
          name: "Combine all buffers",
          command: "workbench.action.joinAllGroups",
        },
        F: {
          name: "Open new empty frame",
          command: "workbench.action.newWindow",
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
          name: "Frame Zooming Transient",
          transient: true,
          keys: {
            q: {
              name: "Quit",
              command: "leaderkey.render",
              args: "",
            },
            "0": {
              name: "Reset zoom",
              command: "workbench.action.zoomReset",
              goto: "",
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
          name: "Font Zooming Transient",
          transient: true,
          keys: {
            q: {
              name: "Quit",
              command: "leaderkey.render",
              args: "",
            },
            "0": {
              name: "Reset zoom",
              command: "editor.action.fontZoomReset",
              goto: "",
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

const CommaRoot: Bindings = {
  name: "<comma>",
  keys: {
    "=": {
      name: "+Format",
      keys: {
        "=": {
          name: "Format region or buffer",
          command: "editor.action.format",
        },
        b: {
          name: "Format buffer",
          command: "editor.action.formatDocument",
        },
        c: {
          name: "Format changes",
          command: "editor.action.formatChanges",
        },
        s: {
          name: "Format selection",
          command: "editor.action.formatSelection",
        },
        B: {
          name: "+Format buffer with formatter",
          command: "editor.action.formatDocument.multiple",
        },
        S: {
          name: "+Format selection with formatter",
          command: "editor.action.formatSelection.multiple",
        },
      },
    },
    g: {
      name: "+Go to",
      keys: {
        b: {
          name: "Jump back from last go-to command",
          command: "leaderkey.popGotoStack",
        },
        d: {
          name: "Go to definition",
          command: "leaderkey.pushGotoStack",
          args: "editor.action.revealDefinition",
        },
        D: {
          command: "editor.action.goToDeclaration",
          name: "Go to declaration",
        },
        g: {
          name: "Go to definition",
          command: "leaderkey.pushGotoStack",
          args: "editor.action.revealDefinition",
        },
        h: {
          name: "Show call hierarchy",
          command: "references-view.showCallHierarchy",
        },
        r: {
          name: "Go to reference",
          command: "editor.action.goToReferences",
        },
        s: {
          name: "Go to symbol in buffer",
          command: "workbench.action.gotoSymbol",
        },
        t: {
          name: "Go to type definition",
          command: "leaderkey.pushGotoStack",
          args: "editor.action.goToTypeDefinition",
        },
        I: {
          name: "Find implementations",
          command: "references-view.findImplementations",
        },
        R: {
          name: "Find references",
          command: "references-view.findReferences",
        },
        S: {
          name: "Go to symbol in project",
          command: "workbench.action.showAllSymbols",
        },
      },
    },
    G: {
      name: "+Peek",
      keys: {
        d: {
          name: "Peek definition",
          command: "editor.action.peekDefinition",
        },
        h: {
          name: "Peek call hierarchy",
          command: "editor.showCallHierarchy",
        },
        i: {
          name: "Peek implementations",
          command: "editor.action.peekImplementation",
        },
        r: {
          name: "Peek references",
          command: "editor.action.referenceSearch.trigger",
        },
        t: {
          name: "Peek type definition",
          command: "editor.action.peekTypeDefinition",
        },
      },
    },
  },
};

export const defaultBindings: Bindings = normalize({
  name: "root",
  keys: { SPC: SpaceRoot, ",": CommaRoot },
});
