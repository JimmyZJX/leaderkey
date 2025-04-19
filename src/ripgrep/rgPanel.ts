interface ToggleableModes {
  regex: "on" | "off";
  case_: "smart" | "strict" | "ignore";
  word: "on" | "off";
}

interface Mode extends ToggleableModes {
  cwd: string;
  docDir?: string;
  workspaceRoot?: string;
  docOrWorkspaceDir: "doc" | "workspace" | undefined;
}

export class RgPanel {
  private mode: Mode;

  constructor(mode: Mode) {
    this.mode = mode;
  }
}
