module.exports = {
  preset: 'jest-expo',

  // Test environment
  testEnvironment: 'node',

  // Module paths
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  // Transform ignore patterns - critical for React Native and Expo
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '(jest-)?react-native' +
      '|@react-native(-community)?' +
      '|expo(nent)?' +
      '|@expo(nent)?/.*' +
      '|@expo-google-fonts/.*' +
      '|react-navigation' +
      '|@react-navigation/.*' +
      '|@unimodules/.*' +
      '|unimodules' +
      '|sentry-expo' +
      '|native-base' +
      '|react-native-svg' +
      '|@supabase/.*' +
      ')/)',
  ],

  // Module name mapper for path aliases and static assets
  moduleNameMapper: {
    // Path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@theme/(.*)$': '<rootDir>/src/theme/$1',
    '^@assets/(.*)$': '<rootDir>/assets/$1',

    // Static assets
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)',
    '**/*.(test|spec).(ts|tsx|js|jsx)',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.expo/',
    '/dist/',
    '/build/',
    '/coverage/',
    '/android/',
    '/ios/',
    '/.examples/',
    '/e2e/',
  ],

  // Watch ignore patterns
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/.expo/',
    '/dist/',
    '/build/',
    '/coverage/',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx,js,jsx}',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx,js,jsx}',
    '!src/**/*.spec.{ts,tsx,js,jsx}',
    '!src/types/**',
    '!src/**/index.{ts,tsx}',
    '!src/**/*.types.{ts,tsx}',
  ],

  // Coverage thresholds - enforced on CI
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
  },

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json-summary',
  ],

  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Reset mocks between tests
  resetMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Maximum number of concurrent workers
  maxWorkers: process.env.CI ? 2 : '50%',

  // Test timeout
  testTimeout: 10000,

  // Bail on first failure in CI
  bail: process.env.CI ? 1 : 0,

  // Error on deprecated APIs
  errorOnDeprecated: true,

  // Notify mode (for watch mode)
  notify: false,

  // Detect open handles
  detectOpenHandles: false,

  // Force exit after tests complete
  forceExit: true,

  // Globals
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
    __DEV__: true,
  },

  // Projects configuration for different test types
  projects: undefined, // Can be used to separate unit/integration tests

  // Runner (default is jest-runner)
  runner: 'jest-runner',

  // Snapshot serializers
  snapshotSerializers: ['@relmify/jest-serializer-strip-ansi'],

  // Test result processor
  testResultsProcessor: undefined,

  // Timers (modern by default)
  timers: 'real',

  // Unmocked module path patterns
  unmockedModulePathPatterns: undefined,
}
