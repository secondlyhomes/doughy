// src/features/auth/context/useAuthSession.ts
// Auth state machine: session initialization, state management, and auth event listener

import { useState, useEffect, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '../types';

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

export interface AuthSessionState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
}

export interface AuthSessionSetters {
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface AuthSessionRefs {
  signInInProgressRef: React.MutableRefObject<boolean>;
}

export interface UseAuthSessionReturn {
  state: AuthSessionState;
  setters: AuthSessionSetters;
  refs: AuthSessionRefs;
  fetchProfile: (userId: string, authUser?: User) => Promise<void>;
  refetchProfile: () => Promise<void>;
}

/**
 * Hook that manages auth session state, profile fetching, and auth event listening.
 * Runs initialization exactly once on mount. The onAuthStateChange listener handles
 * all subsequent auth events (sign-in, sign-out, token refresh).
 */
export function useAuthSession(): UseAuthSessionReturn {
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
   * Initialize auth state and listen for changes.
   * Runs exactly once on mount. The onAuthStateChange listener handles
   * all subsequent auth events (sign-in, sign-out, token refresh).
   * Dev authentication is triggered by LoginScreen's dev buttons,
   * NOT auto-initiated here, to avoid race conditions with manual presses.
   */
  useEffect(() => {
    const initializeAuth = async () => {
      // Guard: only run initialization once to prevent infinite loops
      // (devBypassAuth -> SIGNED_IN -> effect re-run -> devBypassAuth -> ...)
      if (hasInitializedRef.current) return;
      hasInitializedRef.current = true;

      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        // getSession() blocks until initializePromise resolves. Once it
        // returns, the Supabase init lock is released and REST queries
        // (which call _getAccessToken -> getSession) will no longer hang.
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
          // _getAccessToken() -> getSession() -> initializePromise (still held).
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount; fetchProfile is a stable ref
  }, []);

  return {
    state: { user, session, profile, isLoading },
    setters: { setUser, setSession, setProfile, setIsLoading },
    refs: { signInInProgressRef },
    fetchProfile,
    refetchProfile,
  };
}
