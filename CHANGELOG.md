# Change Log

All notable changes to the "leaderkey" extension will be documented in this
file.

## v1.6.4

- Improved ripgrep panel
  - Last query (`SPC s l` or `SPC r l`) now remembers last query result and cursor
    location, if the query was finished
  - When query string is empty, `TAB` restores the last query result, just like `SPC s l`
  - `C-<up>` and `C-<down>` to navigate through the history of queries

## v1.6.3

- Fix a bug where findFile or ripgrep mode is not quit properly.

## v1.6.2

- Add config option `leaderkey.find-file.ignore` to filter out file entries when in `ls`
  mode.

## v1.6.1

- Add a minor helper `isMultiCursor` context. Trying to fix some bad interaction between
  the vim extension and Python Jupyter notebook.

## v1.6.0

- Add `leaderkey.registerInferPathCommand(regexOfUri: string, command: string)` for 3rd
  party extensions to provide context on the current path for custom documents.

## v1.5.8

- Add config option `leaderkey.dired.exe` (should point to an `ls` exe)

## v1.5.6

- Add config option `leaderkey.hideLeaderkeyMenu`. If set to `true`, the
  leaderkey menu will not show in the editor until `?` is pressed.

## v1.5.5

- Bugfix: `files.exclude` sometimes includes an entry `{"": true}` (don't know why)

## v1.5.4

- Improve light/dark theme detection

## v1.5.3

- Fix a bug in the new `fzf` with `fd` command

## v1.5.2

- Disable `alt+,` in terminal

## v1.5.1

- `fzf` excludes files in `files.exclude` if `fd` is available

## v1.5.0

- Implement `SPC s {s,S}` and remove dependency to `jacobdufault.fuzzy-search`

## v1.4.10

- Leaderkey menu now only grabs focus if it's currently focused on the terminal

## v1.4.9

- Fix `ctrl+.` in ripgrep panel

## v1.4.8

- Improve find-file when typing and hitting `RET` too fast. Now it waits for the result
  before deciding to jump to file or to create one.

## v1.4.7

- Fix `leaderkey.findFile` stack on each other when run multiple times

## v1.4.6

- Remove `shift+space` keybinding

## v1.4.5

- Fix `Tab` key behavior in find-file when the prefix typed does not have the same case as
  the first candidate. (E.g. input `re` matches `README.md`, `Tab` should replace the
  input with `RE`)

## v1.4.4

- find-file panel now renders the path with ellipsis when it is longer than 70 characters

## v1.4.3

- `SPC p f` by default uses fzf

## v1.4.2

- Add default bindings `{alt,shift}+space` and `alt+,` for non-vim users
- Remove `vscodevim` dependency
- Hide uninteresting commands in Command Palette

## v1.4.1

- Add `SPC w {<left>,<up>,<down>,<right>}` bindings that are equivalent to
  `SPC w {h,j,k,l}`

## v1.4.0

- Add `SPC = {a,b,c}` comparison commands
  - `SPC = a` remembers the current selection
  - `SPC = b` compares the current selection with last remembered `SPC = a`
  - `SPC = c` compares clipboard to the current selection

## v1.3.1

- Fix font weight being bold when the underlying text is bold.

## v1.3.0

- Support fzf when query in find-file contains space. Use `leaderkey.fzf.exe` to
  set path to the fzf executable (recommend 0.62.0 or above).
  - Due to limitation of a headless mode in fzf, `script` (executable) is
    required on Linux/MacOS, and a background terminal window is used on
    Windows.
  - See https://github.com/junegunn/fzf/issues/3372#issuecomment-2888764204 for
    the feature request.

## v1.2.x

- Support multi-query in ripgrep by using space to split query string. E.g. "abc
  def" will seach on lines that contains both "abc" and "def".
  - corner cases like escaping space with `\ `, spaces within capture groups
    (e.g. `a( |_)bc`) are handled with some best-effort hack.
  - supports up to 4 sub-queries.
  - Now ` -- -additional-args` section in the end of the query string are
    highlighted with gray background indicator

## v1.0.x

- Introduce find-file, basic dired mode and ripgrep integration
  - Please configure executable paths under `leaderkey.ripgrep.exe`

## v0.4.0

- Support `, g b` with the help of a go-to stack. `, g g`, `, g d` and `, g t` pushes files and cursor locations to the stack.

## v0.3.0

- Light theme adaption (according to spacemacs-light but not vscode)
- The `space` key automatically registered for sidebars and when no editors are opened

## v0.2.0

- UI and statusbar improvements
- Support for transient state
- Add migration command (for VSpaceCode users)
- README updates

## v0.1.1

- Initial release
