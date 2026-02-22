// src/features/auth/context/AuthProvider.tsx
// Authentication context provider for React Native

import React, { createContext, useMemo } from 'react';
import type { AuthContextType } from '../types';
import { useAuthSession } from './useAuthSession';
import { useAuthActions } from './useAuthActions';

// Create the context with undefined default
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider component that wraps the app and provides authentication state.
 * Delegates to useAuthSession (state machine + profile) and useAuthActions (sign in/out).
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { state, setters, refs, refetchProfile } = useAuthSession();
  const { signIn, signUp, signOut, devBypassAuth, resetPassword, updatePassword } =
    useAuthActions({ setters, refs });

  const { user, session, profile, isLoading } = state;

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
