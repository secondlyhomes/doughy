// src/lib/mockData/index.ts
// Main mock data module - provides mock Supabase client

import { MockDataStore, MockQueryBuilder } from './queryBuilder';
import { seedMockData, DEV_USER_ID, DEV_USER_EMAIL } from './seed';
import { DEV_MODE_CONFIG, logMockOperation } from '@/config/devMode';

// Global mock store instance
let mockStoreInstance: MockDataStore | null = null;

/**
 * Get or create the mock data store
 * Automatically seeds with initial data on first access
 */
export function getMockStore(): MockDataStore {
  if (!mockStoreInstance) {
    mockStoreInstance = new MockDataStore();
    seedMockData(mockStoreInstance);
  }
  return mockStoreInstance;
}

/**
 * Reset the mock store (useful for testing)
 */
export function resetMockStore(): void {
  mockStoreInstance = null;
}

/**
 * Track mock auth state - starts unauthenticated
 */
let isSignedIn = false;
let authChangeCallback: ((event: string, session: unknown) => void) | null = null;

/**
 * Mock auth state for dev mode
 */
const mockSession = {
  user: {
    id: DEV_USER_ID,
    email: DEV_USER_EMAIL,
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  },
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
};

/**
 * Mock auth object that mimics Supabase auth API
 */
export const mockAuth = {
  getSession: async () => {
    logMockOperation('auth.getSession');
    return { data: { session: isSignedIn ? mockSession : null }, error: null };
  },

  getUser: async () => {
    logMockOperation('auth.getUser');
    return { data: { user: isSignedIn ? mockSession.user : null }, error: null };
  },

  signInWithPassword: async (credentials: { email: string; password: string }) => {
    logMockOperation('auth.signInWithPassword', { email: credentials.email });
    isSignedIn = true;
    if (authChangeCallback) {
      authChangeCallback('SIGNED_IN', mockSession);
    }
    return { data: { user: mockSession.user, session: mockSession }, error: null };
  },

  signUp: async (credentials: { email: string; password: string }) => {
    logMockOperation('auth.signUp', { email: credentials.email });
    isSignedIn = true;
    if (authChangeCallback) {
      authChangeCallback('SIGNED_IN', mockSession);
    }
    return { data: { user: mockSession.user, session: mockSession }, error: null };
  },

  signOut: async () => {
    logMockOperation('auth.signOut');
    isSignedIn = false;
    if (authChangeCallback) {
      authChangeCallback('SIGNED_OUT', null);
    }
    return { error: null };
  },

  resetPasswordForEmail: async (email: string) => {
    logMockOperation('auth.resetPasswordForEmail', { email });
    return { data: {}, error: null };
  },

  updateUser: async (attributes: Record<string, unknown>) => {
    logMockOperation('auth.updateUser', attributes);
    return { data: { user: mockSession.user }, error: null };
  },

  onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
    logMockOperation('auth.onAuthStateChange');
    authChangeCallback = callback;
    // Fire INITIAL_SESSION with current state (null if not signed in)
    setTimeout(() => callback('INITIAL_SESSION', isSignedIn ? mockSession : null), 0);
    return { data: { subscription: { unsubscribe: () => { authChangeCallback = null; } } } };
  },

  mfa: {
    getAuthenticatorAssuranceLevel: async () => ({
      data: { currentLevel: 'aal1', nextLevel: null, currentAuthenticationMethods: [] },
      error: null,
    }),
    enroll: async () => ({
      data: { id: 'mock-factor-id', type: 'totp', totp: { qr_code: '', secret: '', uri: '' } },
      error: null,
    }),
    challenge: async () => ({ data: { id: 'mock-challenge-id' }, error: null }),
    verify: async () => ({ data: { user: mockSession.user, session: mockSession }, error: null }),
    unenroll: async () => ({ data: {}, error: null }),
    listFactors: async () => ({ data: { all: [], totp: [] }, error: null }),
  },
};

/**
 * Mock storage object
 */
export const mockStorage = {
  from: (bucket: string) => ({
    upload: async (path: string, _file: unknown) => {
      logMockOperation('storage.upload', { bucket, path });
      return { data: { path }, error: null };
    },
    download: async (path: string) => {
      logMockOperation('storage.download', { bucket, path });
      return { data: new Blob(), error: null };
    },
    remove: async (paths: string[]) => {
      logMockOperation('storage.remove', { bucket, paths });
      return { data: paths.map((p) => ({ name: p })), error: null };
    },
    getPublicUrl: (path: string) => {
      logMockOperation('storage.getPublicUrl', { bucket, path });
      return { data: { publicUrl: `https://mock-storage.com/${bucket}/${path}` } };
    },
    list: async (prefix?: string) => {
      logMockOperation('storage.list', { bucket, prefix });
      return { data: [], error: null };
    },
  }),
};

/**
 * Mock functions (edge functions)
 */
export const mockFunctions = {
  invoke: async (name: string, options?: { body?: unknown }) => {
    logMockOperation('functions.invoke', { name, body: options?.body });
    return { data: { success: true }, error: null };
  },
};

/**
 * Create a mock Supabase client
 * This mimics the real Supabase client interface
 */
export function createMockClient() {
  const store = getMockStore();

  return {
    from: <T extends Record<string, unknown>>(
      table: string
    ): MockQueryBuilder<T> => {
      return store.getQueryBuilder<T>(table);
    },
    auth: mockAuth,
    storage: mockStorage,
    functions: mockFunctions,
    // For compatibility
    realtime: {
      setAuth: () => {},
    },
  };
}

/**
 * Helper to programmatically sign in (for devBypassAuth)
 */
export function mockSignIn() {
  isSignedIn = true;
  if (authChangeCallback) {
    authChangeCallback('SIGNED_IN', mockSession);
  }
}

// Export types and utilities
export { MockDataStore, MockQueryBuilder } from './queryBuilder';
export * from './factories';
export { DEV_USER_ID, DEV_USER_EMAIL } from './seed';

// Export a ready-to-use mock client
export const mockClient = DEV_MODE_CONFIG.useMockData ? createMockClient() : null;
