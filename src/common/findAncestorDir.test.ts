import { findAncestorDir } from "./findAncestorDir";

const NAMES = ["+share+", "+clone+"];

describe("findAncestorDir", () => {
  test("finds the matching ancestor", () => {
    expect(findAncestorDir("/ws/fe-1/+share+/app/vscode", NAMES)).toBe(
      "/ws/fe-1/+share+",
    );
    expect(findAncestorDir("/ws/fe-1/+clone+/lib", NAMES)).toBe("/ws/fe-1/+clone+");
  });

  test("includes the directory itself", () => {
    expect(findAncestorDir("/ws/fe-1/+share+", NAMES)).toBe("/ws/fe-1/+share+");
    expect(findAncestorDir("/ws/fe-1/+share+/", NAMES)).toBe("/ws/fe-1/+share+");
  });

  test("prefers the nearest ancestor", () => {
    expect(findAncestorDir("/a/+clone+/b/+share+/c", NAMES)).toBe("/a/+clone+/b/+share+");
  });

  test("matches whole basenames only", () => {
    expect(findAncestorDir("/ws/x+share+/app", NAMES)).toBeUndefined();
  });

  test("returns undefined without a match", () => {
    expect(findAncestorDir("/usr/local/home/me", NAMES)).toBeUndefined();
    expect(findAncestorDir("/", NAMES)).toBeUndefined();
    expect(findAncestorDir("/a/b", [])).toBeUndefined();
  });
});
