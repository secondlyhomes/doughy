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
 */
export function useHasRole(role: 'user' | 'admin' | 'super_admin'): boolean {
  const { profile } = useAuth();
  
  if (!profile) return false;
  
  // Admin roles have higher permissions
  if (role === 'user') {
    return ['user', 'admin', 'super_admin'].includes(profile.role);
  }
  if (role === 'admin') {
    return ['admin', 'super_admin'].includes(profile.role);
  }
  
  return profile.role === role;
}
