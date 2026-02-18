/**
 * Test Utilities - Mock Creation Utilities
 *
 * Utilities for creating mocks for navigation, Supabase, and other services.
 */

import { MockNavigation, MockRoute } from './types'

// ============================================================================
// NAVIGATION MOCKS
// ============================================================================

/**
 * Create mock navigation object
 */
export function createMockNavigation(overrides?: Partial<MockNavigation>): MockNavigation {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
    pop: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    dispatch: jest.fn(),
    isFocused: jest.fn(() => true),
    canGoBack: jest.fn(() => true),
    getState: jest.fn(() => ({})),
    addListener: jest.fn(() => jest.fn()),
    removeListener: jest.fn(),
    ...overrides,
  }
}

/**
 * Create mock route object
 */
export function createMockRoute(overrides?: Partial<MockRoute>): MockRoute {
  return {
    key: 'test-route',
    name: 'TestScreen',
    params: {},
    ...overrides,
  }
}

// ============================================================================
// SUPABASE MOCKS
// ============================================================================

/**
 * Create mock Supabase client with full API surface
 */
export function createMockSupabaseClient() {
  return {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      })),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      refreshSession: jest.fn(),
    },
    from: jest.fn(() => createMockQueryBuilder()),
    storage: {
      from: jest.fn(() => createMockStorageBucket()),
    },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn((callback) => {
        if (callback) callback()
        return { unsubscribe: jest.fn() }
      }),
    })),
    removeChannel: jest.fn(),
  }
}

/**
 * Create mock Supabase query builder
 */
function createMockQueryBuilder() {
  const builder = {
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
  }
  return builder
}

/**
 * Create mock Supabase storage bucket
 */
function createMockStorageBucket() {
  return {
    upload: jest.fn(() => Promise.resolve({ data: null, error: null })),
    download: jest.fn(() => Promise.resolve({ data: null, error: null })),
    remove: jest.fn(() => Promise.resolve({ data: null, error: null })),
    list: jest.fn(() => Promise.resolve({ data: [], error: null })),
    getPublicUrl: jest.fn(() => ({
      data: { publicUrl: 'https://test.com/file.jpg' },
    })),
    createSignedUrl: jest.fn(() =>
      Promise.resolve({ data: { signedUrl: 'https://test.com/signed' }, error: null })
    ),
  }
}
