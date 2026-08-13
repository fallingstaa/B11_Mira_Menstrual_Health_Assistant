// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // .expo/ holds Expo's own generated cache/template files (e.g. static-tmp/_error.js),
    // not project source — linting them was never intentional, it just didn't surface
    // as an error under the SDK 57 config.
    ignores: ["dist/*", ".expo/**"],
  }
]);
