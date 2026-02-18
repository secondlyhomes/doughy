module.exports = function (api) {
  api.cache(true);
  const isTest = process.env.NODE_ENV === 'test';

  return {
    presets: isTest
      ? ['babel-preset-expo']
      : [
          ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
          'nativewind/babel',
        ],
    plugins: [
      // Transform import.meta for web compatibility
      ['babel-plugin-transform-import-meta', { module: 'ES6' }],
      // Note: expo-router/babel is now included in babel-preset-expo (SDK 50+)
    ],
    // Transform node_modules that use import.meta
    overrides: [
      {
        test: /node_modules/,
        plugins: [['babel-plugin-transform-import-meta', { module: 'ES6' }]],
      },
    ],
  };
};
