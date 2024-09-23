"use strict";
exports.window = {
  showWarningMessage: console.error,
  showErrorMessage: console.error,
  createOutputChannel: () => ({
    appendLine: console.error,
  }),
};
