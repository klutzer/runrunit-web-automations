/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  "extends": [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    "@vue/eslint-config-typescript",
  ],
  "plugins": [
    "no-floating-promise",
  ],
  "rules": {
    // ESLint Rules
    "arrow-spacing": "error",
    "no-useless-escape": "off",
    "max-len": ["error", { "code": 120, "ignoreStrings": true, "ignoreTemplateLiterals": true }],
    "max-statements": ["error", { "max": 14 }],
    "max-statements-per-line": "error",
    "max-params": ["error", { "max": 3 }],
    "no-template-curly-in-string": "error",
    "quotes": ["error", "double"],
    "no-void": "error",
    "indent": ["error", 2],
    "keyword-spacing": ["error", { "before": true, "after": true }],
    "key-spacing": ["error", { "afterColon": true }],
    "no-trailing-spaces": "error",
    "comma-dangle": ["error", "always-multiline"],
    "comma-spacing": ["error", { "before": false, "after": true }],
    "array-bracket-spacing": ["error", "never"],
    "object-curly-spacing": ["error", "always"],
    "newline-before-return": "error",
    "max-classes-per-file": ["error", 1],
    "no-console": "error",
    "eqeqeq": "error",
    "no-floating-promise/no-floating-promise": "error",
    "semi": "error",
    "semi-spacing": "error",
    "no-multiple-empty-lines": ["error", { "max": 1, "maxEOF": 0, "maxBOF": 0 }],
    "eol-last": "error",
    "space-before-function-paren": ["error", { "anonymous": "ignore", "named": "ignore", "asyncArrow": "always" }],
    "no-multi-spaces": "error",
  },
  parserOptions: {
    ecmaVersion: "latest",
  },
};
