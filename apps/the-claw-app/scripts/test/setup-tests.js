/**
 * Test Setup and Utilities
 *
 * Provides test helpers, mocks, and factories for comprehensive testing
 */

import '@testing-library/react-native/extend-expect'

// Mock Expo modules
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}))

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
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

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        supabaseUrl: 'http://localhost:54321',
        supabaseAnonKey: 'test-anon-key',
      },
    },
  },
}))

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn((keys) =>
      Promise.resolve(keys.map((key) => [key, null]))
    ),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  },
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}))

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(() =>
        Promise.resolve({ data: { session: null }, error: null })
      ),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(() =>
        Promise.resolve({ data: null, error: null })
      ),
      then: jest.fn((resolve) =>
        resolve({ data: [], error: null })
      ),
    })),
  })),
}))

// Silence console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}

// Mock timers
global.setTimeout = jest.fn((fn) => fn())
global.setInterval = jest.fn()
global.clearTimeout = jest.fn()
global.clearInterval = jest.fn()

/**
 * Test Data Factories
 */
export const factories = {
  /**
   * Create test user
   */
  user: (overrides = {}) => ({
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test@example.com',
    full_name: 'Test User',
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  /**
   * Create test task
   */
  task: (overrides = {}) => ({
    id: '00000000-0000-0000-0000-000000000002',
    title: 'Test Task',
    description: 'Test description',
    status: 'todo',
    user_id: '00000000-0000-0000-0000-000000000001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  /**
   * Create test session
   */
  session: (overrides = {}) => ({
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    user: factories.user(),
    ...overrides,
  }),
}

/**
 * Mock Generators
 */
export const mocks = {
  /**
   * Mock Supabase client
   */
  supabase: () => {
    const mockClient = {
      auth: {
        signUp: jest.fn(() =>
          Promise.resolve({
            data: { user: factories.user(), session: factories.session() },
            error: null,
          })
        ),
        signInWithPassword: jest.fn(() =>
          Promise.resolve({
            data: { user: factories.user(), session: factories.session() },
            error: null,
          })
        ),
        signOut: jest.fn(() =>
          Promise.resolve({ error: null })
        ),
        getSession: jest.fn(() =>
          Promise.resolve({
            data: { session: factories.session() },
            error: null,
          })
        ),
        onAuthStateChange: jest.fn(() => ({
          data: {
            subscription: {
              unsubscribe: jest.fn(),
            },
          },
        })),
      },
      from: jest.fn((table) => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
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
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn(() =>
          Promise.resolve({
            data: table === 'tasks' ? factories.task() : null,
            error: null,
          })
        ),
        then: jest.fn((resolve) =>
          resolve({
            data: table === 'tasks' ? [factories.task()] : [],
            error: null,
          })
        ),
      })),
    }

    return mockClient
  },

  /**
   * Mock AsyncStorage
   */
  asyncStorage: () => {
    const storage = new Map()

    return {
      getItem: jest.fn((key) =>
        Promise.resolve(storage.get(key) || null)
      ),
      setItem: jest.fn((key, value) => {
        storage.set(key, value)
        return Promise.resolve()
      }),
      removeItem: jest.fn((key) => {
        storage.delete(key)
        return Promise.resolve()
      }),
      clear: jest.fn(() => {
        storage.clear()
        return Promise.resolve()
      }),
      getAllKeys: jest.fn(() =>
        Promise.resolve(Array.from(storage.keys()))
      ),
      multiGet: jest.fn((keys) =>
        Promise.resolve(
          keys.map((key) => [key, storage.get(key) || null])
        )
      ),
      multiSet: jest.fn((keyValuePairs) => {
        keyValuePairs.forEach(([key, value]) => storage.set(key, value))
        return Promise.resolve()
      }),
      multiRemove: jest.fn((keys) => {
        keys.forEach((key) => storage.delete(key))
        return Promise.resolve()
      }),
    }
  },

  /**
   * Mock navigation
   */
  navigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    push: jest.fn(),
    pop: jest.fn(),
    popToTop: jest.fn(),
    replace: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    dispatch: jest.fn(),
    isFocused: jest.fn(() => true),
    canGoBack: jest.fn(() => false),
    addListener: jest.fn(() => jest.fn()),
    removeListener: jest.fn(),
  }),

  /**
   * Mock route
   */
  route: (params = {}) => ({
    key: 'test-route-key',
    name: 'TestScreen',
    params,
  }),
}

/**
 * Test Helpers
 */
export const helpers = {
  /**
   * Wait for async operations
   */
  wait: (ms = 0) =>
    new Promise((resolve) => setTimeout(resolve, ms)),

  /**
   * Wait for condition to be true
   */
  waitFor: async (condition, timeout = 1000) => {
    const start = Date.now()
    while (!condition()) {
      if (Date.now() - start > timeout) {
        throw new Error('Timeout waiting for condition')
      }
      await helpers.wait(10)
    }
  },

  /**
   * Flush promises
   */
  flushPromises: () =>
    new Promise((resolve) => setImmediate(resolve)),

  /**
   * Create test wrapper with providers
   */
  createWrapper: (providers = []) => {
    return function Wrapper({ children }) {
      return providers.reduceRight(
        (acc, Provider) => <Provider>{acc}</Provider>,
        children
      )
    }
  },

  /**
   * Mock successful API call
   */
  mockSuccess: (data) =>
    Promise.resolve({ data, error: null }),

  /**
   * Mock failed API call
   */
  mockError: (message) =>
    Promise.resolve({
      data: null,
      error: { message, status: 500 },
    }),

  /**
   * Assert error thrown
   */
  expectError: async (fn, message) => {
    try {
      await fn()
      throw new Error('Expected error but none was thrown')
    } catch (error) {
      if (message) {
        expect(error.message).toContain(message)
      }
    }
  },

  /**
   * Suppress console errors
   */
  suppressConsole: () => {
    const originalError = console.error
    const originalWarn = console.warn

    beforeAll(() => {
      console.error = jest.fn()
      console.warn = jest.fn()
    })

    afterAll(() => {
      console.error = originalError
      console.warn = originalWarn
    })
  },
}

/**
 * Custom Matchers
 */
expect.extend({
  /**
   * Check if value is valid UUID
   */
  toBeValidUUID(received) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const pass = uuidRegex.test(received)

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid UUID`
          : `Expected ${received} to be a valid UUID`,
    }
  },

  /**
   * Check if value is valid ISO date
   */
  toBeValidISODate(received) {
    const date = new Date(received)
    const pass = !isNaN(date.getTime()) && received === date.toISOString()

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid ISO date`
          : `Expected ${received} to be a valid ISO date`,
    }
  },

  /**
   * Check if array contains object with properties
   */
  toContainObjectMatching(received, expected) {
    const pass = received.some((item) =>
      Object.keys(expected).every((key) => item[key] === expected[key])
    )

    return {
      pass,
      message: () =>
        pass
          ? `Expected array not to contain object matching ${JSON.stringify(
              expected
            )}`
          : `Expected array to contain object matching ${JSON.stringify(
              expected
            )}`,
    }
  },
})

/**
 * Setup and Teardown
 */
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks()
})

afterEach(() => {
  // Clean up
  jest.restoreAllMocks()
})
