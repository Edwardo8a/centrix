const util = require("util");
if (typeof util.styleText !== "function") {
  util.styleText = (color, text) => text;
}
if (typeof globalThis.structuredClone !== "function") {
  globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "readonly",
        process: "readonly",
        __dirname: "readonly",
        console: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        jest: "readonly"
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
    },
  },
  {
    ignores: ["node_modules/", "dist/"],
  },
];