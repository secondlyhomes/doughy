/**
 * Organization Query Hooks
 *
 * Fetch operations for organizations, members, invitations, and usage.
 */

import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../services/supabase';
import {
  Organization,
  OrganizationMember,
  OrganizationInvitation,
  OrganizationUsage,
} from '../types';

interface UseOrganizationQueriesParams {
  userId: string | undefined;
  currentOrgId: string | undefined;
  onOrganizationsLoaded: (orgs: Organization[]) => void;
  onCurrentOrgSet: (org: Organization | null) => void;
  onMembersLoaded: (members: OrganizationMember[]) => void;
  onInvitationsLoaded: (invitations: OrganizationInvitation[]) => void;
  onUsageLoaded: (usage: OrganizationUsage | null) => void;
  onError: (error: Error) => void;
  onLoadingChange: (loading: boolean) => void;
}

export function useOrganizationQueries({
  userId,
  currentOrgId,
  onOrganizationsLoaded,
  onCurrentOrgSet,
  onMembersLoaded,
  onInvitationsLoaded,
  onUsageLoaded,
  onError,
  onLoadingChange,
}: UseOrganizationQueriesParams) {
  const fetchOrganizations = useCallback(async () => {
    if (!userId) {
      onOrganizationsLoaded([]);
      onCurrentOrgSet(null);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('organizations')
        .select(
          `
          id,
          name,
          slug,
          description,
          logo_url,
          website,
          settings,
          subscription_tier,
          subscription_status,
          subscription_ends_at,
          status,
          created_at,
          updated_at,
          organization_members!inner(role)
        `
        )
        .eq('organization_members.user_id', userId)
        .eq('organization_members.status', 'active')
        .eq('status', 'active');

      if (fetchError) throw fetchError;

      const orgsWithRoles: Organization[] = data.map((org: any) => ({
        ...org,
        role: org.organization_members[0].role,
        organization_members: undefined,
      }));

      onOrganizationsLoaded(orgsWithRoles);

      // Set current org from storage or default to first
      const storedOrgId = await AsyncStorage.getItem('current_org_id');
      const storedOrg = orgsWithRoles.find((o) => o.id === storedOrgId);

      if (storedOrg) {
        onCurrentOrgSet(storedOrg);
      } else if (orgsWithRoles.length > 0) {
        onCurrentOrgSet(orgsWithRoles[0]);
        await AsyncStorage.setItem('current_org_id', orgsWithRoles[0].id);
      }
    } catch (err) {
      onError(err as Error);
      console.error('Error fetching organizations:', err);
    } finally {
      onLoadingChange(false);
    }
  }, [userId, onOrganizationsLoaded, onCurrentOrgSet, onError, onLoadingChange]);

  const fetchMembers = useCallback(async () => {
    if (!currentOrgId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('organization_members')
        .select(
          `
          id,
          organization_id,
          user_id,
          role,
          custom_permissions,
          invited_by,
          invited_at,
          joined_at,
          last_active_at,
          status,
          user:user_id(
            id,
            email,
            user_metadata
          )
        `
        )
        .eq('organization_id', currentOrgId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false });

      if (fetchError) throw fetchError;

      onMembersLoaded(data as any);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  }, [currentOrgId, onMembersLoaded]);

  const fetchInvitations = useCallback(async () => {
    if (!currentOrgId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', currentOrgId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      onInvitationsLoaded(data);
    } catch (err) {
      console.error('Error fetching invitations:', err);
    }
  }, [currentOrgId, onInvitationsLoaded]);

  const fetchUsage = useCallback(async () => {
    if (!currentOrgId) return;

    try {
      const { data, error: fetchError } = await supabase.rpc(
        'get_organization_usage',
        { p_organization_id: currentOrgId }
      );

      if (fetchError) throw fetchError;

      onUsageLoaded(data);
    } catch (err) {
      console.error('Error fetching usage:', err);
    }
  }, [currentOrgId, onUsageLoaded]);

  return {
    fetchOrganizations,
    fetchMembers,
    fetchInvitations,
    fetchUsage,
  };
}
