// Jest setup file
// Runs before each test suite

// ============================================================================
// REACT NATIVE & EXPO MOCKS
// ============================================================================

// Mock Expo Constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      supabaseUrl: 'https://test.supabase.co',
      supabaseAnonKey: 'test-anon-key',
    },
  },
  manifest: {
    version: '1.0.0',
    sdkVersion: '54.0.0',
  },
  deviceName: 'Test Device',
  platform: {
    ios: {
      platform: 'ios',
    },
  },
}))

// Mock Expo Secure Store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key) => Promise.resolve(null)),
  setItemAsync: jest.fn((key, value) => Promise.resolve()),
  deleteItemAsync: jest.fn((key) => Promise.resolve()),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}))

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

// Mock Expo Status Bar
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
  setStatusBarStyle: jest.fn(),
  setStatusBarHidden: jest.fn(),
}))

// Mock Expo Font
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
  isLoading: jest.fn(() => false),
}))

// Mock Expo Haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}))

// Mock Expo Router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  usePathname: jest.fn(() => '/'),
  useSegments: jest.fn(() => []),
  Link: 'Link',
  Redirect: 'Redirect',
  Stack: {
    Screen: 'StackScreen',
  },
  Tabs: {
    Screen: 'TabsScreen',
  },
}))

// ============================================================================
// SUPABASE MOCKS
// ============================================================================

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signInWithOAuth: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    onAuthStateChange: jest.fn((callback) => {
      // Return unsubscribe function
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      }
    }),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
    refreshSession: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
    then: jest.fn((resolve) => resolve({ data: [], error: null })),
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(() => Promise.resolve({ data: null, error: null })),
      download: jest.fn(() => Promise.resolve({ data: null, error: null })),
      remove: jest.fn(() => Promise.resolve({ data: null, error: null })),
      list: jest.fn(() => Promise.resolve({ data: [], error: null })),
      getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://test.com/file.jpg' } })),
      createSignedUrl: jest.fn(() => Promise.resolve({ data: { signedUrl: 'https://test.com/signed' }, error: null })),
    })),
  },
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn((callback) => {
      if (callback) callback()
      return {
        unsubscribe: jest.fn(),
      }
    }),
  })),
  removeChannel: jest.fn(),
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

// Export mock client for use in tests
global.mockSupabaseClient = mockSupabaseClient

// ============================================================================
// REACT NATIVE TESTING LIBRARY
// ============================================================================

// @testing-library/react-native@12.9+ includes built-in matchers

// ============================================================================
// CUSTOM MATCHERS
// ============================================================================

expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      }
    }
  },
  toHaveBeenCalledWithMatch(received, expected) {
    const calls = received.mock.calls
    const pass = calls.some((call) =>
      call.some((arg) => {
        if (typeof expected === 'function') {
          return expected(arg)
        }
        return JSON.stringify(arg).includes(JSON.stringify(expected))
      })
    )
    return {
      message: () =>
        pass
          ? `expected function not to have been called with matching argument`
          : `expected function to have been called with matching argument`,
      pass,
    }
  },
})

// ============================================================================
// GLOBAL TEST UTILITIES
// ============================================================================

// Mock timers helper
global.flushPromises = () => new Promise((resolve) => setImmediate(resolve))

// Wait for next tick
global.waitForNextTick = () => new Promise((resolve) => process.nextTick(resolve))

// Async wait helper
global.wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// ============================================================================
// CONSOLE CONFIGURATION
// ============================================================================

// Store original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
}

// Silence specific console messages in tests
const consoleSilencePatterns = [
  /Warning: ReactDOM.render/,
  /Warning: useLayoutEffect/,
  /Warning: An update to/,
  /Not implemented: HTMLFormElement.prototype.submit/,
]

global.console = {
  ...console,
  log: jest.fn((...args) => {
    const message = args.join(' ')
    if (!consoleSilencePatterns.some((pattern) => pattern.test(message))) {
      originalConsole.log(...args)
    }
  }),
  warn: jest.fn((...args) => {
    const message = args.join(' ')
    if (!consoleSilencePatterns.some((pattern) => pattern.test(message))) {
      originalConsole.warn(...args)
    }
  }),
  error: jest.fn((...args) => {
    const message = args.join(' ')
    if (!consoleSilencePatterns.some((pattern) => pattern.test(message))) {
      originalConsole.error(...args)
    }
  }),
  info: originalConsole.info,
  debug: originalConsole.debug,
}

// ============================================================================
// TEST LIFECYCLE
// ============================================================================

// Set test timeout
jest.setTimeout(10000)

// Global beforeEach
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks()
})

// Global afterEach
afterEach(() => {
  // Cleanup
  jest.clearAllTimers()
})

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

process.env.NODE_ENV = 'test'
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key'
