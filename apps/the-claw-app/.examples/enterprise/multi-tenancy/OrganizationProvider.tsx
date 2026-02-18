/**
 * OrganizationProvider
 *
 * Provides multi-tenancy context for the application.
 * Manages organization switching, member management, and organization-scoped operations.
 */

import React, { createContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOrganizationQueries } from './hooks/useOrganizationQueries';
import { useOrganizationMutations } from './hooks/useOrganizationMutations';
import {
  Organization,
  OrganizationMember,
  OrganizationInvitation,
  OrganizationUsage,
  OrganizationRole,
  OrganizationContextValue,
} from './types';

const OrganizationContext = createContext<OrganizationContextValue | undefined>(
  undefined
);

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [usage, setUsage] = useState<OrganizationUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Query hooks
  const { fetchOrganizations, fetchMembers, fetchInvitations, fetchUsage } =
    useOrganizationQueries({
      userId: user?.id,
      currentOrgId: currentOrg?.id,
      onOrganizationsLoaded: setOrganizations,
      onCurrentOrgSet: setCurrentOrg,
      onMembersLoaded: setMembers,
      onInvitationsLoaded: setInvitations,
      onUsageLoaded: setUsage,
      onError: setError,
      onLoadingChange: setLoading,
    });

  // Mutation hooks
  const mutations = useOrganizationMutations({
    userId: user?.id,
    currentOrg,
    organizations,
    refreshOrganizations: fetchOrganizations,
    refreshMembers: fetchMembers,
    refreshInvitations: fetchInvitations,
    onCurrentOrgSet: setCurrentOrg,
    onMembersReset: () => setMembers([]),
    onInvitationsReset: () => setInvitations([]),
    onUsageReset: () => setUsage(null),
  });

  // Role utilities
  const hasRole = useCallback(
    (minRole: OrganizationRole): boolean => {
      if (!currentOrg) return false;

      const roleHierarchy: Record<OrganizationRole, number> = {
        guest: 1,
        member: 2,
        admin: 3,
        owner: 4,
      };

      return roleHierarchy[currentOrg.role] >= roleHierarchy[minRole];
    },
    [currentOrg]
  );

  const canManageMembers = useCallback((): boolean => {
    return hasRole('admin');
  }, [hasRole]);

  const canManageSettings = useCallback((): boolean => {
    return hasRole('owner');
  }, [hasRole]);

  // Effects
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  useEffect(() => {
    if (currentOrg) {
      fetchMembers();
      fetchInvitations();
      fetchUsage();
    }
  }, [currentOrg, fetchMembers, fetchInvitations, fetchUsage]);

  const value: OrganizationContextValue = {
    organizations,
    currentOrg,
    members,
    invitations,
    usage,
    loading,
    error,
    ...mutations,
    refreshOrganizations: fetchOrganizations,
    refreshMembers: fetchMembers,
    refreshUsage: fetchUsage,
    hasRole,
    canManageMembers,
    canManageSettings,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export { OrganizationContext };
