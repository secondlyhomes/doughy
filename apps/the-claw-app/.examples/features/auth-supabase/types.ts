/**
 * Supabase Auth Types
 *
 * Type definitions for Supabase authentication
 */

import type { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js'

/**
 * User type (extended from Supabase User)
 */
export type User = SupabaseUser

/**
 * Auth session type
 */
export type AuthSession = Session

/**
 * OAuth provider types supported by Supabase
 */
export type OAuthProvider =
  | 'google'
  | 'apple'
  | 'github'
  | 'facebook'
  | 'twitter'
  | 'discord'
  | 'gitlab'
  | 'bitbucket'
  | 'azure'

/**
 * Auth event types from Supabase
 */
export type AuthEvent =
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'

/**
 * Sign up credentials
 */
export interface SignUpCredentials {
  email: string
  password: string
  metadata?: {
    name?: string
    [key: string]: any
  }
}

/**
 * Sign in credentials
 */
export interface SignInCredentials {
  email: string
  password: string
}

/**
 * Password reset credentials
 */
export interface PasswordResetCredentials {
  email: string
}

/**
 * Update password credentials
 */
export interface UpdatePasswordCredentials {
  newPassword: string
}

/**
 * Auth context value provided to the app
 */
export interface AuthContextValue {
  /**
   * Current authenticated user (null if not signed in)
   */
  user: User | null

  /**
   * Current auth session (null if not signed in)
   */
  session: AuthSession | null

  /**
   * Whether auth state is being initialized
   */
  loading: boolean

  /**
   * Whether user is authenticated
   */
  isAuthenticated: boolean

  /**
   * Sign up with email and password
   */
  signUp: (credentials: SignUpCredentials) => Promise<{ user: User | null; error: AuthError | null }>

  /**
   * Sign in with email and password
   */
  signIn: (credentials: SignInCredentials) => Promise<{ user: User | null; error: AuthError | null }>

  /**
   * Sign in with OAuth provider (Google, Apple, GitHub, etc.)
   */
  signInWithOAuth: (provider: OAuthProvider) => Promise<{ error: AuthError | null }>

  /**
   * Sign out current user
   */
  signOut: () => Promise<{ error: AuthError | null }>

  /**
   * Send password reset email
   */
  resetPassword: (credentials: PasswordResetCredentials) => Promise<{ error: AuthError | null }>

  /**
   * Update user password (must be signed in)
   */
  updatePassword: (credentials: UpdatePasswordCredentials) => Promise<{ error: AuthError | null }>

  /**
   * Refresh current session
   */
  refreshSession: () => Promise<{ session: AuthSession | null; error: AuthError | null }>

  /**
   * Resend email verification
   */
  resendVerificationEmail: () => Promise<{ error: AuthError | null }>
}

/**
 * Auth state change callback
 */
export type AuthStateChangeCallback = (event: AuthEvent, session: AuthSession | null) => void
