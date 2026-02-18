/**
 * Test Utilities - Type Definitions
 *
 * TypeScript types for test utilities, mock data, and test configuration.
 */

import { RenderOptions } from '@testing-library/react-native'

// ============================================================================
// PROVIDER OPTIONS
// ============================================================================

export interface TestProviderOptions {
  /**
   * Initial theme
   * @default 'light'
   */
  theme?: 'light' | 'dark'

  /**
   * Initial authenticated state
   * @default false
   */
  authenticated?: boolean

  /**
   * Mock user data
   */
  user?: TestUser | null

  /**
   * Mock session data
   */
  session?: TestSession | null

  /**
   * Navigation initial route
   */
  initialRoute?: string

  /**
   * Custom provider props
   */
  providerProps?: Record<string, any>
}

// ============================================================================
// USER & SESSION TYPES
// ============================================================================

export interface TestUser {
  id: string
  email: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

export interface TestSession {
  access_token: string
  refresh_token: string
  expires_at?: number
  user: TestUser
}

// ============================================================================
// ENTITY TYPES
// ============================================================================

export interface TestTask {
  id: string
  title: string
  description?: string
  completed: boolean
  user_id: string
  created_at: string
  updated_at: string
}

// ============================================================================
// SUPABASE TYPES
// ============================================================================

export interface MockSupabaseResponse<T> {
  data: T | null
  error: { message: string } | null
  count: null
  status: number
  statusText: string
}

// ============================================================================
// RENDER TYPES
// ============================================================================

export type RenderWithProvidersOptions = TestProviderOptions & RenderOptions

// ============================================================================
// MOCK TYPES
// ============================================================================

export interface MockNavigation {
  navigate: jest.Mock
  goBack: jest.Mock
  replace: jest.Mock
  push: jest.Mock
  pop: jest.Mock
  reset: jest.Mock
  setParams: jest.Mock
  dispatch: jest.Mock
  isFocused: jest.Mock
  canGoBack: jest.Mock
  getState: jest.Mock
  addListener: jest.Mock
  removeListener: jest.Mock
}

export interface MockRoute {
  key: string
  name: string
  params: Record<string, any>
}

export interface MockAuthContext {
  user: TestUser | null
  session: TestSession | null
  loading: boolean
  signIn: jest.Mock
  signUp: jest.Mock
  signOut: jest.Mock
  resetPassword: jest.Mock
  updateProfile: jest.Mock
}
