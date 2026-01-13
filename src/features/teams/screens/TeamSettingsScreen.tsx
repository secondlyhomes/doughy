// src/features/teams/screens/TeamSettingsScreen.tsx
// Team settings and member management screen for mobile

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Mail,
  Shield,
  MoreVertical,
  Crown,
  Trash2,
} from 'lucide-react-native';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useThemeColors } from '@/context/ThemeContext';
import { ThemedSafeAreaView } from '@/components';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  avatarInitials: string;
}

export function TeamSettingsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { profile, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    setIsLoading(true);
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown size={14} color={colors.warning} />;
      case 'admin':
        return <Shield size={14} color={colors.primary} />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Admin';
      default:
        return 'Member';
    }
  };

  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1 items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-border">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-foreground">Team</Text>
        </View>
        <TouchableOpacity
          className="bg-primary rounded-lg px-4 py-2 flex-row items-center"
          onPress={() => setShowInviteModal(true)}
        >
          <UserPlus size={18} color={colors.primaryForeground} />
          <Text className="text-primary-foreground font-medium ml-2">Invite</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {/* Team Info */}
        <View className="p-4">
          <View className="bg-card rounded-lg p-4">
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-primary items-center justify-center">
                <Users size={24} color={colors.primaryForeground} />
              </View>
              <View className="ml-4">
                <Text className="text-lg font-semibold text-foreground">My Workspace</Text>
                <Text className="text-sm text-muted-foreground">
                  {members.length} member{members.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Members List */}
        <View className="p-4">
          <Text className="text-sm font-medium text-muted-foreground mb-3 px-2">
            MEMBERS
          </Text>
          <View className="bg-card rounded-lg">
            {members.map((member, index) => (
              <View
                key={member.id}
                className={`flex-row items-center p-4 ${
                  index !== members.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                {/* Avatar */}
                <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                  <Text className="text-primary font-semibold">{member.avatarInitials}</Text>
                </View>

                {/* Info */}
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center">
                    <Text className="text-foreground font-medium">{member.name}</Text>
                    {getRoleIcon(member.role) && (
                      <View className="ml-2">{getRoleIcon(member.role)}</View>
                    )}
                  </View>
                  <Text className="text-sm text-muted-foreground">{member.email}</Text>
                </View>

                {/* Role Badge */}
                <View className="bg-muted px-2 py-1 rounded mr-2">
                  <Text className="text-xs text-muted-foreground capitalize">
                    {getRoleLabel(member.role)}
                  </Text>
                </View>

                {/* Actions */}
                {member.role !== 'owner' && (
                  <TouchableOpacity
                    className="p-2"
                    onPress={() => {
                      Alert.alert(
                        member.name,
                        'What would you like to do?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Change Role', onPress: () => handleChangeRole(member) },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => handleRemoveMember(member),
                          },
                        ]
                      );
                    }}
                  >
                    <MoreVertical size={20} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Pending Invites (placeholder) */}
        <View className="p-4">
          <Text className="text-sm font-medium text-muted-foreground mb-3 px-2">
            PENDING INVITES
          </Text>
          <View className="bg-card rounded-lg p-4">
            <Text className="text-muted-foreground text-center">No pending invites</Text>
          </View>
        </View>
      </ScrollView>

      {/* Invite Modal */}
      {showInviteModal && (
        <View className="absolute inset-0 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6">
            <Text className="text-xl font-semibold text-foreground mb-4">Invite Team Member</Text>

            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">Email Address</Text>
              <View className="flex-row items-center border border-input rounded-lg bg-background">
                <View className="pl-4">
                  <Mail size={20} color={colors.mutedForeground} />
                </View>
                <TextInput
                  className="flex-1 px-4 py-3 text-foreground"
                  placeholder="colleague@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-muted rounded-lg py-3 items-center mr-2"
                onPress={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                }}
              >
                <Text className="text-foreground font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-primary rounded-lg py-3 items-center ml-2"
                onPress={handleInviteMember}
                disabled={isInviting}
              >
                {isInviting ? (
                  <ActivityIndicator color={colors.primaryForeground} size="small" />
                ) : (
                  <Text className="text-primary-foreground font-medium">Send Invite</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ThemedSafeAreaView>
  );
}
