// Pre-setup file to mock Expo's winter runtime before anything else loads
// This must run before jest.setup.js

// Mock the expo winter runtime to prevent import issues
jest.mock('expo/src/winter/runtime.native.ts', () => ({}), { virtual: true });
jest.mock('expo/src/winter/runtime', () => ({}), { virtual: true });

// Mock expo module
jest.mock('expo', () => ({
  __esModule: true,
  default: {},
  registerRootComponent: jest.fn(),
}));

// Mock expo constants
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { extra: {} },
    manifest: {},
  },
}));

// Mock expo-modules-core to prevent the winter runtime issues
jest.mock('expo-modules-core', () => ({
  EventEmitter: jest.fn(),
  NativeModule: jest.fn(),
  SharedObject: jest.fn(),
  SharedRef: jest.fn(),
  requireNativeModule: jest.fn(),
  requireOptionalNativeModule: jest.fn(),
}));
