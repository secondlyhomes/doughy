// src/features/teams/screens/useTeamMembers.ts
// State management and handlers for team members

import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { TeamMember } from './team-settings-types';

export function useTeamMembers() {
  const { profile, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // TODO: Fetch real team members from API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock team members
      setMembers([
        {
          id: '1',
          email: user?.email || 'owner@example.com',
          name: profile?.full_name || 'Team Owner',
          role: 'owner',
          joinedAt: new Date().toISOString(),
          avatarInitials: (profile?.full_name || 'TO').slice(0, 2).toUpperCase(),
        },
        {
          id: '2',
          email: 'jane@example.com',
          name: 'Jane Smith',
          role: 'admin',
          joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          avatarInitials: 'JS',
        },
        {
          id: '3',
          email: 'bob@example.com',
          name: 'Bob Johnson',
          role: 'member',
          joinedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          avatarInitials: 'BJ',
        },
      ]);
    } catch (error) {
      console.error('Failed to load team members:', error);
      setLoadError('Unable to load team members. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address.');
      return;
    }

    setIsInviting(true);
    try {
      // TODO: Send invite via API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert('Success', `Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setShowInviteModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to send invitation. Please try again.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = (member: TeamMember) => {
    if (member.role === 'owner') {
      Alert.alert('Error', 'Cannot remove the team owner.');
      return;
    }

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.name} from the team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            // TODO: Remove member via API
            setMembers((prev) => prev.filter((m) => m.id !== member.id));
          },
        },
      ]
    );
  };

  const handleChangeRole = (member: TeamMember) => {
    if (member.role === 'owner') {
      Alert.alert('Error', 'Cannot change the owner role.');
      return;
    }

    Alert.alert(
      'Change Role',
      `Select a new role for ${member.name}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Make Admin',
          onPress: () => {
            setMembers((prev) =>
              prev.map((m) => (m.id === member.id ? { ...m, role: 'admin' } : m))
            );
          },
        },
        {
          text: 'Make Member',
          onPress: () => {
            setMembers((prev) =>
              prev.map((m) => (m.id === member.id ? { ...m, role: 'member' } : m))
            );
          },
        },
      ]
    );
  };

  return {
    isLoading,
    loadError,
    members,
    showInviteModal,
    setShowInviteModal,
    inviteEmail,
    setInviteEmail,
    isInviting,
    loadTeamMembers,
    handleInviteMember,
    handleRemoveMember,
    handleChangeRole,
  };
}
