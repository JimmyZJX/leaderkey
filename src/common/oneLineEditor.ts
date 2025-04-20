export class OneLineEditor {
  private input: string;
  private cursor: number; // cursor at i => insert to i (0 <= cursor <= input.length)

  constructor(initInput: string) {
    this.input = initInput;
    this.cursor = this.input.length;
  }

  public tryKey(key: string): "handled" | undefined {
    return undefined;
  }
}
