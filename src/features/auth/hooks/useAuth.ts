// src/features/auth/hooks/useAuth.ts
// Custom hook for accessing auth context

import { useContext } from 'react';
import { AuthContext } from '../context/AuthProvider';
import type { AuthContextType } from '../types';

/**
 * Hook to access authentication state and methods
 * Must be used within an AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

/**
 * Hook to get current user
 */
export function useCurrentUser() {
  const { user, profile } = useAuth();
  return { user, profile };
}

/**
 * Hook to check if user has a specific role
 * Roles: admin > support > standard/user
 */
export function useHasRole(role: 'user' | 'admin' | 'support'): boolean {
  const { profile } = useAuth();

  if (!profile) return false;

  // Role hierarchy check
  if (role === 'user') {
    // Everyone has at least user-level access
    return ['user', 'standard', 'support', 'admin'].includes(profile.role);
  }
  if (role === 'support') {
    // Support and admin have support-level access
    return ['support', 'admin'].includes(profile.role);
  }
  if (role === 'admin') {
    // Only admin has admin-level access
    return profile.role === 'admin';
  }

  return profile.role === role;
}
