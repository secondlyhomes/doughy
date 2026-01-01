// Polyfill for import.meta in non-module contexts
if (typeof globalThis !== 'undefined' && !globalThis.import) {
  // Create a mock import object with meta property
  globalThis.import = {
    meta: {
      url: typeof window !== 'undefined' ? window.location.href : 'file://',
      resolve: (specifier) => specifier,
    }
  };
}
