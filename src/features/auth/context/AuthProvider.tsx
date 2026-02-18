// src/features/auth/context/AuthProvider.tsx
// Authentication context provider for React Native

import React, { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { DEV_MODE_CONFIG } from '@/config/devMode';
import type { AuthContextType, Profile, UserRole } from '../types';

// Create the context with undefined default
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Normalize role string to UserRole type
 * Must match Database["public"]["Enums"]["user_role"]: admin | standard | user | support
 */
function normalizeRole(role: string | null | undefined): UserRole {
  if (!role) return 'user';
  const normalized = role.toLowerCase() as UserRole;
  // Validate against known DB enum values
  if (['admin', 'standard', 'user', 'support'].includes(normalized)) {
    return normalized;
  }
  return 'user';
}

/**
 * AuthProvider component that wraps the app and provides authentication state
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitializedRef = useRef(false);
  const signInInProgressRef = useRef(false);
  // Tracks whether getSession() has returned at least once, proving the
  // Supabase init lock (initializePromise) is released. onAuthStateChange
  // must NOT set isLoading=false until this is true, otherwise tabs mount
  // before the lock releases and all REST queries hang on _getAccessToken().
  const initCompleteRef = useRef(false);

  /**
   * Fetch user profile from Supabase
   * On error, sets profile to null and logs the error - callers should handle the null case
   */
  const fetchProfile = useCallback(async (userId: string, authUser?: User) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Get email verification status from Supabase auth user
      const emailVerified = !!authUser?.email_confirmed_at;

      if (error) {
        // PGRST116 = not found - create minimal profile from auth user
        if (error.code === 'PGRST116') {
          console.warn('[auth] Profile not found for user, using minimal profile');
          setProfile({
            id: userId,
            email: authUser?.email || '',
            role: 'user',
            email_verified: emailVerified,
            onboarding_complete: false,
          });
          return;
        }
        // For other errors, log and set profile to null so UI can show error state
        console.error('[auth] Error fetching profile:', error.message);
        setProfile(null);
        return;
      }

      // Map database fields to our Profile type
      // Database has: first_name, last_name, name (not full_name, avatar_url)
      const fullName = data.name ||
        [data.first_name, data.last_name].filter(Boolean).join(' ') ||
        undefined;

      setProfile({
        id: data.id,
        email: data.email,
        role: normalizeRole(data.role),
        workspace_id: data.workspace_id,
        email_verified: emailVerified, // From Supabase auth user.email_confirmed_at
        onboarding_complete: false, // Not in DB schema, default to false
        full_name: fullName,
        avatar_url: undefined, // Not in DB schema
      });
    } catch (error) {
      console.error('[auth] Exception fetching profile:', error);
      // Set profile to null on exception - don't create fake profiles
      setProfile(null);
    }
  }, []);

  /**
   * Refetch profile data
   */
  const refetchProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id, user);
    }
  }, [user, fetchProfile]);

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
  }, []);

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
  }, []);

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
  }, []);

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
  }, []);  // M3: removed fetchProfile — not called in non-mock path

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

  /**
   * Initialize auth state and listen for changes.
   * Runs exactly once on mount. The onAuthStateChange listener handles
   * all subsequent auth events (sign-in, sign-out, token refresh).
   * Dev authentication is triggered by LoginScreen's dev buttons,
   * NOT auto-initiated here, to avoid race conditions with manual presses.
   */
  useEffect(() => {
    const initializeAuth = async () => {
      // Guard: only run initialization once to prevent infinite loops
      // (devBypassAuth → SIGNED_IN → effect re-run → devBypassAuth → ...)
      if (hasInitializedRef.current) return;
      hasInitializedRef.current = true;

      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        // getSession() blocks until initializePromise resolves. Once it
        // returns, the Supabase init lock is released and REST queries
        // (which call _getAccessToken → getSession) will no longer hang.
        initCompleteRef.current = true;

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          // Await profile but with a timeout so we never hang
          const profileTimeout = new Promise<'timeout'>((resolve) =>
            setTimeout(() => resolve('timeout'), 3000)
          );
          const profilePromise = fetchProfile(initialSession.user.id, initialSession.user);
          const result = await Promise.race([
            profilePromise.then(() => 'done' as const),
            profileTimeout,
          ]);
          if (result === 'timeout') {
            console.warn('[auth] Profile fetch timed out after 3s — continuing with null profile. Fetch continues in background.');
            // Catch the background promise so it doesn't become an unhandled rejection
            profilePromise.catch((err) =>
              console.error('[auth] Background profile fetch failed after timeout:', err)
            );
          }
          setIsLoading(false);
        } else {
          // No session — show login screen. Dev auth is handled by LoginScreen buttons.
          setIsLoading(false);
        }
      } catch (error) {
        initCompleteRef.current = true; // Lock released even on error
        console.error('[auth] Error initializing auth:', error);
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[auth] Auth state changed:', event);

        // H2: TOKEN_REFRESHED fires every ~55min — just update session, skip profile refetch
        if (event === 'TOKEN_REFRESHED') {
          if (newSession) {
            setSession(newSession);
            setUser(newSession.user);
          }
          return;
        }

        // INITIAL_SESSION is handled by initializeAuth above — skip to avoid double profile fetch
        if (event === 'INITIAL_SESSION') return;

        try {
          if (newSession) {
            setSession(newSession);
            setUser(newSession.user);
            // C4: Timeout profile fetch (same pattern as initializeAuth)
            const profileTimeout = new Promise<'timeout'>((resolve) =>
              setTimeout(() => resolve('timeout'), 3000)
            );
            const result = await Promise.race([
              fetchProfile(newSession.user.id, newSession.user).then(() => 'done' as const),
              profileTimeout,
            ]);
            if (result === 'timeout') {
              console.warn('[auth] Profile fetch timed out in onAuthStateChange');
            }
            // Clean up stale sessions: revoke all sessions except the current one.
            // Each signInWithPassword creates a new server-side session without revoking
            // old ones. Hot reloads, app restarts, and auth retries accumulate sessions.
            // scope:'others' keeps current session, revokes the rest. Dev-only to avoid
            // logging out multi-device users in production.
            if (event === 'SIGNED_IN' && __DEV__) {
              supabase.auth.signOut({ scope: 'others' }).catch((err) => {
                console.warn('[auth] Failed to clean up other sessions:', err);
              });
            }
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        } catch (error) {
          console.error('[auth] Error handling auth state change:', error);
          if (newSession) {
            setSession(newSession);
            setUser(newSession.user);
          }
        } finally {
          // Only set isLoading=false if the Supabase init lock has been released.
          // _recoverAndRefresh fires SIGNED_IN before the lock releases — if we
          // set isLoading=false here, tabs mount and all REST queries hang on
          // _getAccessToken() → getSession() → initializePromise (still held).
          // initializeAuth handles setting isLoading=false during startup.
          if (initCompleteRef.current) {
            setIsLoading(false);
          }
          signInInProgressRef.current = false;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount; fetchProfile/devBypassAuth are stable refs
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AuthContextType>(() => ({
    user,
    session,
    profile,
    isLoading,
    isAuthenticated: !!session && !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refetchProfile,
    devBypassAuth,
  }), [
    user,
    session,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refetchProfile,
    devBypassAuth,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
