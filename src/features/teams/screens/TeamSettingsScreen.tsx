// src/features/teams/screens/TeamSettingsScreen.tsx
// Team settings and member management screen for mobile
// Uses useThemeColors() for reliable dark mode support

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, UserPlus } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { GlassButton } from '@/components/ui';
import { useTeamMembers } from './useTeamMembers';
import { TeamInfoCard } from './TeamInfoCard';
import { TeamMemberRow } from './TeamMemberRow';
import { InviteMemberModal } from './InviteMemberModal';

export function TeamSettingsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const {
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
  } = useTeamMembers();

  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1 items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedSafeAreaView>
    );
  }

  if (loadError) {
    return (
      <ThemedSafeAreaView className="flex-1 items-center justify-center px-4" edges={['top']}>
        <Users size={48} color={colors.destructive} />
        <Text className="text-center mt-4 mb-4" style={{ color: colors.foreground }}>
          {loadError}
        </Text>
        <TouchableOpacity
          className="rounded-lg px-6 py-3"
          style={{ backgroundColor: colors.primary }}
          onPress={loadTeamMembers}
        >
          <Text className="font-medium" style={{ color: colors.primaryForeground }}>Retry</Text>
        </TouchableOpacity>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between p-4"
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <View className="flex-row items-center">
          <GlassButton
            icon={<ArrowLeft size={18} color={colors.foreground} />}
            onPress={() => router.back()}
            size={32}
            effect="clear"
            containerStyle={{ marginRight: 16 }}
            accessibilityLabel="Go back"
          />
          <Text className="text-xl font-semibold" style={{ color: colors.foreground }}>Team</Text>
        </View>
        <TouchableOpacity
          className="rounded-lg px-4 py-2 flex-row items-center"
          style={{ backgroundColor: colors.primary }}
          onPress={() => setShowInviteModal(true)}
        >
          <UserPlus size={18} color={colors.primaryForeground} />
          <Text className="font-medium ml-2" style={{ color: colors.primaryForeground }}>Invite</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {/* Team Info */}
        <TeamInfoCard memberCount={members.length} />

        {/* Members List */}
        <View className="p-4">
          <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>
            MEMBERS
          </Text>
          <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
            {members.map((member, index) => (
              <TeamMemberRow
                key={member.id}
                member={member}
                isLast={index === members.length - 1}
                onChangeRole={handleChangeRole}
                onRemove={handleRemoveMember}
              />
            ))}
          </View>
        </View>

        {/* Pending Invites (placeholder) */}
        <View className="p-4">
          <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>
            PENDING INVITES
          </Text>
          <View className="rounded-lg p-4" style={{ backgroundColor: colors.card }}>
            <Text className="text-center" style={{ color: colors.mutedForeground }}>No pending invites</Text>
          </View>
        </View>
      </ScrollView>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteMemberModal
          inviteEmail={inviteEmail}
          onChangeEmail={setInviteEmail}
          isInviting={isInviting}
          onInvite={handleInviteMember}
          onClose={() => {
            setShowInviteModal(false);
            setInviteEmail('');
          }}
        />
      )}
    </ThemedSafeAreaView>
  );
}
