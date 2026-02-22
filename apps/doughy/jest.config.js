module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|expo-modules-core|expo-router|expo-linking|expo-constants|expo-web-browser|expo-auth-session|expo-crypto|@react-navigation|@supabase|nativewind|react-native-css-interop|react-native-safe-area-context|react-native-gesture-handler|lucide-react-native|react-native-reanimated|react-native-screens|react-native-svg|react-native-worklets)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo/src/winter/(.*)$': '<rootDir>/__mocks__/expo-winter-runtime.js',
    '^expo/build/winter/(.*)$': '<rootDir>/__mocks__/expo-winter-runtime.js',
  },
  collectCoverageFrom: [
    // Zone B: Admin
    'src/features/admin/**/*.{ts,tsx}',
    'src/routes/AdminNavigator.tsx',
    // Zone C: Real Estate (Phase 8-9)
    'src/features/real-estate/hooks/usePropertyDocuments.ts',
    'src/features/real-estate/hooks/usePropertyActions.ts',
    'src/features/real-estate/components/PropertyDocsTab.tsx',
    'src/features/real-estate/components/UploadDocumentSheet.tsx',
    'src/features/real-estate/components/PropertyActionsSheet.tsx',
    'src/features/real-estate/utils/formatters.ts',
    // Zone D: Dashboard, Leads, Conversations, Analytics
    'src/utils/sanitize.ts',
    'src/features/layout/hooks/*.{ts,tsx}',
    'src/features/layout/components/*.{ts,tsx}',
    'src/features/leads/components/*.{ts,tsx}',
    'src/features/leads/screens/*.{ts,tsx}',
    'src/features/conversations/hooks/*.{ts,tsx}',
    'src/features/conversations/screens/*.{ts,tsx}',
    'src/features/dashboard/screens/*.{ts,tsx}',
    'src/features/analytics/screens/*.{ts,tsx}',
    // Exclusions
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testPathIgnorePatterns: [],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  globals: {
    __DEV__: true,
  },
};
