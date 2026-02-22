// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "apps/*"],
  },
  {
    settings: {
      "import/ignore": ["@expo/vector-icons", "expo-print", "react-native"],
    },
    rules: {
      "import/no-unresolved": ["error", { ignore: ["@expo/vector-icons", "expo-print"] }],
      "import/namespace": "off",
    },
  },
]);
