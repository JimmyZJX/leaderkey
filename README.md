# Leaderkey

This extension provides the leaderkey (which-key) functionality with Spacemacs-like
configurations and Spacemacs-like UI.

It can be considered an alternative implementation to
[VSpaceCode](https://github.com/VSpaceCode/VSpaceCode) +
[vscode-which-key](https://github.com/VSpaceCode/vscode-which-key).
The default keybindings are mostly copied from VSpaceCode.

Leaderkey is designed with the following considerations in mind:
- Reliable key sequence handling (less likely to miss keys on lag spikes)
- Easy and intuitive way to customize by the user
- Better support in customizing keys from 3rd party libraries (infinite layers of configs)
- Very similar UI to Spacemacs

## Installation

Leaderkey works the best with the [Vim](https://aka.ms/vscodevim) extension. Here is all
the customization you need:

```json
"vim.normalModeKeyBindingsNonRecursive": [
    {
        "before": [ "<space>" ],
        "commands": [
            { "command": "_setContext", "args": [ "leaderkeyState", "SPC" ] },
            { "command": "leaderkey.render", "args": "SPC" }
        ]
    },
    {
        "before": [ "," ],
        "commands": [
            { "command": "_setContext", "args": [ "leaderkeyState", "," ] },
            { "command": "leaderkey.render", "args": "," }
        ]
    },
],
"vim.visualModeKeyBindingsNonRecursive": [
    {
        "before": [ "<space>" ],
        "commands": [
            { "command": "_setContext", "args": [ "leaderkeyState", "SPC" ] },
            { "command": "leaderkey.render", "args": "SPC" }
        ]
    },
    {
        "before": [ "," ],
        "commands": [
            { "command": "_setContext", "args": [ "leaderkeyState", "," ] },
            { "command": "leaderkey.render", "args": "," }
        ]
    },
],
```

If you are not using vscodevim, the command
```json
{ "command": "leaderkey.render", "args": "SPC" }
```
is all you need to bind a key to trigger the `SPC` menu.
(The `_setContext` command is used to improve reliability but is totally optional)


## Documentation

### To use

If vim is installed and configured as above, `SPC` in normal/visual mode should trigger
the a menu that looks like this in your active editor

![leaderkey SPC menu](img/leaderkey_SPC_menu.png)

You can keep pressing keys to go to further sub-menus or run commands.

Press `backspace` to erase the last key you typed! (not a standard Spacemacs behavior)

The `,` (comma) menu is also useful to perform some language-level operations like go-to
definitions.

### To customize

Leaderkey is extremely straightfoward to customize in your user `settings.json`. Examples
are shown below

```json
"leaderkey.overrides.user": {
    "SPC b TAB": {
        "name": "focus the other side (diff view)",
        "commands": [
            "workbench.action.compareEditor.focusOtherSide",
            {
                "command": "cursorMove",
                "args": {
                    "to": "viewPortCenter"
                }
            }
        ]
    },
    ", h": "Hover...",
    ", h t": {
        "name": "show type",
        "command": "editor.action.showDefinitionPreviewHover"
    },
}
```

I've added two commands (`SPC b TAB` and `, h t`) and one menu (`, h`) to the default
bindings in the example above.

Commands can be defined with "command" and "args" keys or a "commands" structure
which is passed to the builtin "runCommands" command.

Menus are totally optional and is only used to show the name on it's parent menu. (e.g. in
the above screenshot, the `b` sub-menu is named `Buffers` by default)


### For 3rd party libraries

If you write an extension that depends on leaderkey and want to provide some default
bindings, leaderkey is happy to cooperate!

Basically you just need to declare a configuration contribution point with default value.
```json
{
  "contributes": {
    "configuration": {
      "title": "<some title>",
      "properties": {
        "leaderkey.overrides._your_extension_name": {
          "type": "any",
          "description": "leaderkey additional bindings",
          "default": {
            "SPC b TAB": {
              "name": "focus the other side (diff view)",
              "commands": [
                "workbench.action.compareEditor.focusOtherSide",
                {
                  "command": "cursorMove",
                  "args": {
                    "to": "viewPortCenter"
                  }
                }
              ]
            }
} } } } } }
```

Additionally, you should depend on leaderkey
```json
"extensionPack": [
    "JimmyZJX.leaderkey"
],
"extensionDependencies": [
    "JimmyZJX.leaderkey"
],
```

and call the following command while initializing your extension. The reason is that the
order of extension loading is not deterministic and leaderkey might be initialized too
early and miss you additional bindings during the initial scan.
```ts
await vscode.commands.executeCommand("leaderkey.refreshConfigs");
```
