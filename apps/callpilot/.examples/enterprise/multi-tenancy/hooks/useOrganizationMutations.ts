/**
 * Organization Mutation Hooks
 *
 * Create, update, delete operations for organizations and members.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../services/supabase';
import {
  Organization,
  OrganizationRole,
  OrganizationSettings,
  OrganizationInvitation,
  CreateOrganizationParams,
} from '../types';

interface UseOrganizationMutationsParams {
  userId: string | undefined;
  currentOrg: Organization | null;
  organizations: Organization[];
  refreshOrganizations: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  refreshInvitations: () => Promise<void>;
  onCurrentOrgSet: (org: Organization | null) => void;
  onMembersReset: () => void;
  onInvitationsReset: () => void;
  onUsageReset: () => void;
}

export function useOrganizationMutations({
  userId,
  currentOrg,
  organizations,
  refreshOrganizations,
  refreshMembers,
  refreshInvitations,
  onCurrentOrgSet,
  onMembersReset,
  onInvitationsReset,
  onUsageReset,
}: UseOrganizationMutationsParams) {
  const createOrganization = async (
    params: CreateOrganizationParams
  ): Promise<Organization> => {
    if (!userId) throw new Error('Must be authenticated to create organization');

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: params.name,
        slug: params.slug,
        description: params.description,
        settings: params.settings
          ? {
              ...params.settings,
              timezone: params.settings.timezone || 'UTC',
              date_format: params.settings.date_format || 'YYYY-MM-DD',
            }
          : undefined,
      })
      .select()
      .single();

    if (orgError) throw orgError;

    // Add current user as owner
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner',
      });

    if (memberError) throw memberError;

    await refreshOrganizations();

    return { ...org, role: 'owner' };
  };

  const updateOrganization = async (
    id: string,
    updates: Partial<Organization>
  ) => {
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        name: updates.name,
        description: updates.description,
        logo_url: updates.logo_url,
        website: updates.website,
        settings: updates.settings,
      })
      .eq('id', id);

    if (updateError) throw updateError;

    await refreshOrganizations();
  };

  const deleteOrganization = async (id: string) => {
    // Soft delete
    const { error: deleteError } = await supabase
      .from('organizations')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (deleteError) throw deleteError;

    await refreshOrganizations();

    // Switch to another org if current was deleted
    if (currentOrg?.id === id) {
      const nextOrg = organizations.find((o) => o.id !== id);
      if (nextOrg) {
        await switchOrganization(nextOrg.id);
      } else {
        onCurrentOrgSet(null);
      }
    }
  };

  const switchOrganization = async (id: string) => {
    const org = organizations.find((o) => o.id === id);
    if (!org) throw new Error('Organization not found');

    onCurrentOrgSet(org);
    await AsyncStorage.setItem('current_org_id', id);

    // Reset dependent state
    onMembersReset();
    onInvitationsReset();
    onUsageReset();
  };

  const inviteMember = async (
    email: string,
    role: OrganizationRole,
    message?: string
  ): Promise<OrganizationInvitation> => {
    if (!currentOrg) throw new Error('No organization selected');
    if (!userId) throw new Error('Must be authenticated');

    // Check if user already exists
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', currentOrg.id)
      .eq('user_id', email) // This would need to be a lookup by email
      .single();

    if (existingMember) {
      throw new Error('User is already a member of this organization');
    }

    const { data, error: inviteError } = await supabase
      .from('organization_invitations')
      .insert({
        organization_id: currentOrg.id,
        email,
        role,
        message,
        invited_by: userId,
      })
      .select()
      .single();

    if (inviteError) throw inviteError;

    await refreshInvitations();

    return data;
  };

  const updateMemberRole = async (memberId: string, role: OrganizationRole) => {
    const { error: updateError } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('id', memberId);

    if (updateError) throw updateError;

    await refreshMembers();
  };

  const removeMember = async (memberId: string) => {
    if (!userId) throw new Error('Must be authenticated');

    const { error: removeError } = await supabase
      .from('organization_members')
      .update({
        status: 'removed',
        removed_at: new Date().toISOString(),
        removed_by: userId,
      })
      .eq('id', memberId);

    if (removeError) throw removeError;

    await refreshMembers();
  };

  const acceptInvitation = async (token: string) => {
    if (!userId) throw new Error('Must be authenticated');

    // Get invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (inviteError) throw inviteError;
    if (!invitation) throw new Error('Invitation not found or expired');

    // Add member
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: invitation.organization_id,
        user_id: userId,
        role: invitation.role,
        invited_by: invitation.invited_by,
        invitation_accepted_at: new Date().toISOString(),
      });

    if (memberError) throw memberError;

    // Update invitation
    const { error: updateError } = await supabase
      .from('organization_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (updateError) throw updateError;

    await refreshOrganizations();
  };

  const declineInvitation = async (token: string) => {
    const { error: updateError } = await supabase
      .from('organization_invitations')
      .update({
        status: 'declined',
        declined_at: new Date().toISOString(),
      })
      .eq('token', token);

    if (updateError) throw updateError;

    await refreshInvitations();
  };

  const updateSettings = async (settings: Partial<OrganizationSettings>) => {
    if (!currentOrg) throw new Error('No organization selected');

    const newSettings = {
      ...currentOrg.settings,
      ...settings,
    };

    await updateOrganization(currentOrg.id, { settings: newSettings });
  };

  return {
    createOrganization,
    updateOrganization,
    deleteOrganization,
    switchOrganization,
    inviteMember,
    updateMemberRole,
    removeMember,
    acceptInvitation,
    declineInvitation,
    updateSettings,
  };
}
