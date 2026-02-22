// src/features/auth/hooks/usePermissions.ts
// Role-based permissions hook for access control

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import type { UserRole } from '../types';

export interface Permissions {
  // Role checks
  isAdmin: boolean;
  isSupport: boolean;
  isUser: boolean;
  role: UserRole;

  // Feature permissions
  canManageUsers: boolean;
  canViewAdminPanel: boolean;
  canManageBilling: boolean;
  canManageTeam: boolean;
  canInviteMembers: boolean;
  canViewAnalytics: boolean;
  canManageProperties: boolean;
  canManageLeads: boolean;
  canAccessAI: boolean;

  // Status checks
  isEmailVerified: boolean;
  isOnboardingComplete: boolean;
  hasCompletedSetup: boolean;
}

/**
 * Hook to check user permissions based on role
 * Used by guards and UI components to control access
 */
export function usePermissions(): Permissions {
  const { profile, isAuthenticated } = useAuth();

  return useMemo(() => {
    const role = profile?.role || 'user';
    // Role hierarchy: admin > support > standard/user
    const isAdmin = role === 'admin';
    const isSupport = role === 'support';
    const isUser = role === 'user' || role === 'standard';
    const hasAdminAccess = isAdmin || isSupport;

    // Status from profile
    const isEmailVerified = profile?.email_verified ?? false;
    const isOnboardingComplete = profile?.onboarding_complete ?? false;

    return {
      // Role checks
      isAdmin,
      isSupport,
      isUser,
      role,

      // Feature permissions - based on role hierarchy
      // admin can manage users, support can view admin panel but not manage users
      canManageUsers: isAdmin,
      canViewAdminPanel: hasAdminAccess,
      canManageBilling: isAdmin,
      canManageTeam: isAdmin,
      canInviteMembers: hasAdminAccess,
      canViewAnalytics: isAuthenticated,
      canManageProperties: isAuthenticated,
      canManageLeads: isAuthenticated,
      canAccessAI: isAuthenticated,

      // Status checks
      isEmailVerified,
      isOnboardingComplete,
      hasCompletedSetup: isEmailVerified && isOnboardingComplete,
    };
  }, [profile, isAuthenticated]);
}

/**
 * Hook to check if user has a specific permission
 */
export function useHasPermission(permission: keyof Omit<Permissions, 'role'>): boolean {
  const permissions = usePermissions();
  return permissions[permission];
}

/**
 * Hook to check if user has any of the specified permissions
 */
export function useHasAnyPermission(permissionList: (keyof Omit<Permissions, 'role'>)[]): boolean {
  const permissions = usePermissions();
  return permissionList.some(p => permissions[p]);
}

/**
 * Hook to check if user has all of the specified permissions
 */
export function useHasAllPermissions(permissionList: (keyof Omit<Permissions, 'role'>)[]): boolean {
  const permissions = usePermissions();
  return permissionList.every(p => permissions[p]);
}
