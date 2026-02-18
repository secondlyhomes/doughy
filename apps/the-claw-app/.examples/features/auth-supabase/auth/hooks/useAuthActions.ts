/**
 * useAuthActions Hook
 *
 * Provides authentication actions for sign in/out/up operations.
 * All methods return { error } or { user, error } for consistent error handling.
 */

import { useCallback } from 'react'
import { supabase } from '@/services/supabase'
import type { AuthError } from '@supabase/supabase-js'
import type {
  AuthActions,
  SignUpCredentials,
  SignInCredentials,
  PasswordResetCredentials,
  UpdatePasswordCredentials,
  OAuthProvider,
  User,
} from '../types'

interface UseAuthActionsOptions {
  /** Current user, used for resendVerificationEmail */
  user: User | null
}

/**
 * Hook for auth actions (sign in, sign out, sign up, etc.)
 *
 * @param options - Options including current user reference
 * @returns Auth action methods
 */
export function useAuthActions({ user }: UseAuthActionsOptions): AuthActions {
  /**
   * Sign up with email and password
   */
  const signUp = useCallback(async (credentials: SignUpCredentials) => {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: credentials.metadata,
      },
    })

    return { user: data.user, error }
  }, [])

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (credentials: SignInCredentials) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    return { user: data.user, error }
  }, [])

  /**
   * Sign in with OAuth provider
   * Opens the provider's auth page in browser.
   * Requires deep linking setup for redirect.
   */
  const signInWithOAuth = useCallback(async (provider: OAuthProvider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // Redirect URL after OAuth (configure in Supabase Dashboard)
        redirectTo: 'your-app-scheme://auth-callback',
      },
    })

    return { error }
  }, [])

  /**
   * Sign out current user
   * Clears session and tokens from secure storage.
   */
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }, [])

  /**
   * Send password reset email
   * User will receive email with reset link.
   * Link opens app with token to update password.
   */
  const resetPassword = useCallback(async (credentials: PasswordResetCredentials) => {
    const { error } = await supabase.auth.resetPasswordForEmail(credentials.email, {
      redirectTo: 'your-app-scheme://reset-password',
    })

    return { error }
  }, [])

  /**
   * Update user password
   * User must be signed in.
   * Use after password reset or in settings.
   */
  const updatePassword = useCallback(async (credentials: UpdatePasswordCredentials) => {
    const { error } = await supabase.auth.updateUser({
      password: credentials.newPassword,
    })

    return { error }
  }, [])

  /**
   * Refresh current session
   * Manually refresh auth token.
   * Usually handled automatically by Supabase.
   */
  const refreshSession = useCallback(async () => {
    const { data, error } = await supabase.auth.refreshSession()
    return { session: data.session, error }
  }, [])

  /**
   * Resend email verification
   * Sends verification email to current user's email.
   * User must be signed in.
   */
  const resendVerificationEmail = useCallback(async () => {
    if (!user?.email) {
      return { error: { message: 'No user email found' } as AuthError }
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    })

    return { error }
  }, [user?.email])

  return {
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    resetPassword,
    updatePassword,
    refreshSession,
    resendVerificationEmail,
  }
}
