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
    [key: string]: unknown
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
 * Auth session state returned by useAuthSession hook
 */
export interface AuthSessionState {
  user: User | null
  session: AuthSession | null
  loading: boolean
  isAuthenticated: boolean
}

/**
 * Auth actions returned by useAuthActions hook
 */
export interface AuthActions {
  signUp: (credentials: SignUpCredentials) => Promise<{ user: User | null; error: AuthError | null }>
  signIn: (credentials: SignInCredentials) => Promise<{ user: User | null; error: AuthError | null }>
  signInWithOAuth: (provider: OAuthProvider) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (credentials: PasswordResetCredentials) => Promise<{ error: AuthError | null }>
  updatePassword: (credentials: UpdatePasswordCredentials) => Promise<{ error: AuthError | null }>
  refreshSession: () => Promise<{ session: AuthSession | null; error: AuthError | null }>
  resendVerificationEmail: () => Promise<{ error: AuthError | null }>
}

/**
 * Auth context value provided to the app
 */
export interface AuthContextValue extends AuthSessionState, AuthActions {}

/**
 * Auth state change callback
 */
export type AuthStateChangeCallback = (event: AuthEvent, session: AuthSession | null) => void
