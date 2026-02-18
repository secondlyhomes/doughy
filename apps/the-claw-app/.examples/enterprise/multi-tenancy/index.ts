/**
 * Multi-tenancy Module
 *
 * Provides multi-tenancy context for the application.
 * Manages organization switching, member management, and organization-scoped operations.
 *
 * Features:
 * - Organization listing and switching
 * - Member management (invite, remove, update roles)
 * - Organization settings
 * - Usage tracking
 * - Audit logging
 *
 * Usage:
 * ```tsx
 * import { OrganizationProvider, useOrganization } from './multi-tenancy';
 *
 * // Wrap your app
 * <OrganizationProvider>
 *   <App />
 * </OrganizationProvider>
 *
 * // Use in components
 * const { currentOrg, switchOrganization, hasRole } = useOrganization();
 * ```
 */

// Provider
export { OrganizationProvider } from './OrganizationProvider';

// Hook
export { useOrganization } from './useOrganization';

// Types
export type {
  Organization,
  OrganizationMember,
  OrganizationInvitation,
  OrganizationUsage,
  OrganizationSettings,
  OrganizationRole,
  SubscriptionTier,
  SubscriptionStatus,
  CreateOrganizationParams,
  OrganizationContextValue,
} from './types';
