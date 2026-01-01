module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Transform import.meta for web compatibility
      ["babel-plugin-transform-import-meta", { module: "ES6" }],
    ],
    // Transform node_modules that use import.meta
    overrides: [
      {
        test: /node_modules/,
        plugins: [
          ["babel-plugin-transform-import-meta", { module: "ES6" }],
        ],
      },
    ],
  };
};
