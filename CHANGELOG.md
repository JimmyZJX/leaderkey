# Change Log

All notable changes to the "leaderkey" extension will be documented in this
file.

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
