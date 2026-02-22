// src/features/auth/context/useAuthActions.ts
// Auth action handlers: signIn, signUp, signOut, devBypassAuth, resetPassword, updatePassword

import { useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { DEV_MODE_CONFIG } from '@/config/devMode';
import type { AuthSessionSetters, AuthSessionRefs } from './useAuthSession';

interface UseAuthActionsParams {
  setters: AuthSessionSetters;
  refs: AuthSessionRefs;
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  devBypassAuth: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

/**
 * Hook that provides auth action handlers.
 * Receives state setters and refs from useAuthSession to coordinate state updates.
 */
export function useAuthActions({ setters, refs }: UseAuthActionsParams): AuthActions {
  const { setUser, setSession, setProfile, setIsLoading } = setters;
  const { signInInProgressRef } = refs;

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string) => {
    if (signInInProgressRef.current) {
      console.warn('[auth] signIn already in progress, ignoring duplicate call');
      return;
    }
    signInInProgressRef.current = true;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Let onAuthStateChange handle isLoading=false and state updates.
      // Safety: if onAuthStateChange doesn't fire within 5s, unblock the UI.
      setTimeout(() => {
        setIsLoading((current) => {
          if (current) console.warn('[auth] onAuthStateChange did not fire within 5s after signIn');
          return false;
        });
        signInInProgressRef.current = false;
      }, 5000);
    } catch (error) {
      setIsLoading(false);
      signInInProgressRef.current = false;
      throw error;
    }
  }, [setIsLoading, signInInProgressRef]);

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(async (email: string, password: string) => {
    if (signInInProgressRef.current) {
      console.warn('[auth] signUp already in progress, ignoring duplicate call');
      return;
    }
    signInInProgressRef.current = true;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Let onAuthStateChange handle isLoading=false.
      setTimeout(() => {
        setIsLoading((current) => {
          if (current) console.warn('[auth] onAuthStateChange did not fire within 5s after signUp');
          return false;
        });
        signInInProgressRef.current = false;
      }, 5000);
    } catch (error) {
      setIsLoading(false);
      signInInProgressRef.current = false;
      throw error;
    }
  }, [setIsLoading, signInInProgressRef]);

  /**
   * Sign out current user
   * Throws error on failure so callers can handle appropriately
   */
  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.warn('[auth] Sign out error:', error.message);
        // Still clear local state for UX, but propagate error
        setUser(null);
        setSession(null);
        setProfile(null);
        throw new Error(error.message);
      }

      // Clear state on success
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('[auth] Exception during sign out:', error);
      // Still clear state on error for UX
      setUser(null);
      setSession(null);
      setProfile(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setUser, setSession, setProfile]);

  /**
   * Dev bypass - skip authentication for testing (only works in __DEV__)
   */
  const devBypassAuth = useCallback(async () => {
    if (!__DEV__) {
      console.warn('[auth] devBypassAuth only works in development mode');
      return;
    }

    // Prevent concurrent calls — ref survives across renders (no stale closure issue)
    if (signInInProgressRef.current) {
      console.warn('[auth] Dev bypass already in progress, ignoring');
      return;
    }
    signInInProgressRef.current = true;

    console.log('[auth] Dev bypass: Authenticating for testing');

    // If using mock data, update the mock auth state
    if (DEV_MODE_CONFIG.useMockData) {
      const { mockSignIn } = await import('@/lib/mockData');
      mockSignIn();

      // Create mock user and session for development
      const mockUser = {
        id: 'dev-user-123',
        email: 'dev@example.com',
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        aud: 'authenticated',
        role: 'authenticated',
        app_metadata: {},
        user_metadata: {},
      } as User;

      const mockSession = {
        access_token: 'dev-token',
        refresh_token: 'dev-refresh-token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: mockUser,
      } as Session;

      setUser(mockUser);
      setSession(mockSession);
      setProfile({
        id: mockUser.id,
        email: mockUser.email!,
        role: 'admin',
        email_verified: true,
        onboarding_complete: true,
        full_name: 'Dev User',
      });
      setIsLoading(false);
      signInInProgressRef.current = false;
      return;
    }

    // Real Supabase: Actually sign in to create valid JWT token for RLS.
    // NOTE: We call signInWithPassword directly (not getSession first) because
    // getSession blocks on the Supabase client's initializePromise lock, which
    // can hang if token refresh is in progress. signInWithPassword makes a direct
    // HTTP POST and does not wait for the lock.
    setIsLoading(true);
    try {
      const devEmail = process.env.EXPO_PUBLIC_DEV_EMAIL || 'dev@example.com';
      const devPassword = process.env.EXPO_PUBLIC_DEV_PASSWORD || 'devpassword123';

      const { data, error } = await supabase.auth.signInWithPassword({
        email: devEmail,
        password: devPassword,
      });

      if (error) {
        console.error('[auth] Dev sign-in failed:', error.message);
        setIsLoading(false);
        signInInProgressRef.current = false;
        throw new Error(`Dev sign-in failed: ${error.message}`);
      }

      // Don't set state or isLoading here — onAuthStateChange handles it.
      // Safety: if onAuthStateChange doesn't fire within 5s, unblock the UI.
      console.log('[auth] Dev sign-in successful, waiting for auth state change...');
      setTimeout(() => {
        setIsLoading((current) => {
          if (current) console.warn('[auth] onAuthStateChange did not fire within 5s after devBypassAuth');
          return false;
        });
        signInInProgressRef.current = false;
      }, 5000);
    } catch (error) {
      console.error('[auth] Exception during dev sign-in:', error);
      setIsLoading(false);
      signInInProgressRef.current = false;
      throw error;
    }
  }, [setUser, setSession, setProfile, setIsLoading, signInInProgressRef]);  // M3: removed fetchProfile — not called in non-mock path

  /**
   * Send password reset email
   * After clicking the link, Supabase redirects to doughy://reset-password
   * with auth tokens in the URL fragment. useAuthDeepLink handles the rest.
   */
  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'doughy://reset-password',
    });

    if (error) {
      throw new Error(error.message);
    }
  }, []);

  /**
   * Update user password
   */
  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }
  }, []);

  return {
    signIn,
    signUp,
    signOut,
    devBypassAuth,
    resetPassword,
    updatePassword,
  };
}
