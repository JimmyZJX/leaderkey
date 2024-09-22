import * as assert from "assert";
import { readFileSync } from "fs";

import * as vscode from "vscode";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Sample test", () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });

  const allKeys = [
    ..."abcdefghijklmnopqrstuvwxyz0123456789`-=[]\\;',./",
    "enter",
    "tab",
    "escape",
  ];

  test("package.json", () => {
    const packageJson = readFileSync("package.json");
    assert.equal(packageJson.length, 3000);
  });
});
