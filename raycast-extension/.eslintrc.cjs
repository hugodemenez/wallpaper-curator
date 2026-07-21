/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ["@raycast"],
  rules: {
    // Parent monorepo ESLint can break this rule's options; disable for Raycast build.
    "@typescript-eslint/no-unused-expressions": "off",
    "@next/next/no-html-link-for-pages": "off",
  },
};
