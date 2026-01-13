// src/features/auth/context/AuthProvider.tsx
// Authentication context provider for React Native

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
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

  /**
   * Fetch user profile from Supabase
   */
  const fetchProfile = useCallback(async (userId: string, authUser?: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Get email verification status from Supabase auth user
      const emailVerified = !!authUser?.email_confirmed_at;

      if (error) {
        console.warn('[auth] Error fetching profile:', error.message);
        // Set default profile on error
        setProfile({
          id: userId,
          email: authUser?.email || '',
          role: 'user',
          email_verified: emailVerified,
          onboarding_complete: false,
        });
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
      setProfile({
        id: userId,
        email: authUser?.email || '',
        role: 'user',
        email_verified: !!authUser?.email_confirmed_at,
        onboarding_complete: false,
      });
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
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Session will be updated via onAuthStateChange
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // For mobile, we might want to handle email confirmation differently
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Session will be updated via onAuthStateChange
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  /**
   * Sign out current user
   */
  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.warn('[auth] Sign out error:', error.message);
      }

      // Clear state
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('[auth] Exception during sign out:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Send password reset email
   */
  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // For mobile, we'll need to handle this via deep linking
      redirectTo: undefined,
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
   * Initialize auth state and listen for changes
   */
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchProfile(initialSession.user.id, initialSession.user);
        }
      } catch (error) {
        console.error('[auth] Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[auth] Auth state changed:', event);

        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          await fetchProfile(newSession.user.id, newSession.user);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }

        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

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
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
