import { findFileAtPointInLine, parseFileAtPoint } from "./fileAtPoint";

describe("parseFileAtPoint", () => {
  test("parses a plain path", () => {
    expect(parseFileAtPoint("app/vscode/foo.ts")).toEqual({
      path: "app/vscode/foo.ts",
      line: undefined,
      column: undefined,
    });
  });

  test("parses one-based line and column suffixes", () => {
    expect(parseFileAtPoint("app/vscode/foo.ts:12:3")).toEqual({
      path: "app/vscode/foo.ts",
      line: 12,
      column: 3,
    });
  });

  test("strips quotes and sentence punctuation", () => {
    expect(parseFileAtPoint('"../foo/bar.ml:7".')).toEqual({
      path: "../foo/bar.ml",
      line: 7,
      column: undefined,
    });
  });
});

describe("findFileAtPointInLine", () => {
  test("finds a path under the cursor", () => {
    const path = "app/vscode/optional-extensions/leaderkey/leaderkey/src/extension.ts";
    const line = `see ${path}:15`;
    expect(findFileAtPointInLine(line, line.indexOf("leaderkey/src"))).toEqual({
      path,
      line: 15,
      column: undefined,
    });
  });

  test("finds a path when the cursor is just after the token", () => {
    const line = "../foo/bar.ml next";
    expect(findFileAtPointInLine(line, "../foo/bar.ml".length)).toEqual({
      path: "../foo/bar.ml",
      line: undefined,
      column: undefined,
    });
  });

  test("returns undefined on whitespace that is not adjacent to a token", () => {
    expect(findFileAtPointInLine("foo.ml  bar.ml", "foo.ml ".length)).toBeUndefined();
  });
});
