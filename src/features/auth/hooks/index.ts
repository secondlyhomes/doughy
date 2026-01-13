// src/features/auth/hooks/index.ts
// Export all auth hooks

export { useAuth, useIsAuthenticated, useCurrentUser, useHasRole } from './useAuth';
export {
  usePermissions,
  useHasPermission,
  useHasAnyPermission,
  useHasAllPermissions,
  type Permissions,
} from './usePermissions';
export { useGoogleAuth, type UseGoogleAuthResult } from './useGoogleAuth';
