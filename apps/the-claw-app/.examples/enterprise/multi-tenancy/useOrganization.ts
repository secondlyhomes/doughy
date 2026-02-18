/**
 * useOrganization Hook
 *
 * Access organization context for multi-tenancy features.
 *
 * @example
 * ```tsx
 * const { currentOrg, switchOrganization, hasRole } = useOrganization();
 *
 * if (hasRole('admin')) {
 *   // Show admin features
 * }
 * ```
 */

import { useContext } from 'react';
import { OrganizationContext } from './OrganizationProvider';

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}
