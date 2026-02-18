// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Packages that use import.meta and should be excluded from web bundle
const excludeFromWeb = [
  '@react-native/debugger-frontend',
  '@react-native/dev-middleware',
  'react-devtools-core',
  'sucrase/dist/esm',
  'jiti',
  // zustand/middleware was patched to use process.env instead of import.meta.env
];

const originalResolveRequest = config.resolver?.resolveRequest;

config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // Block packages with import.meta on web
    if (platform === 'web') {
      for (const pkg of excludeFromWeb) {
        if (moduleName.includes(pkg)) {
          return { type: 'empty' };
        }
      }
    }
    // Use original resolver or default
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = withNativeWind(config, { input: "./global.css" });
