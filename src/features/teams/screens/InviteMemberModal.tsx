// src/features/teams/screens/InviteMemberModal.tsx
// Modal overlay for inviting a new team member

import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, useColorScheme } from 'react-native';
import { Mail } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { getBackdropColor } from '@/lib/design-utils';

interface InviteMemberModalProps {
  inviteEmail: string;
  onChangeEmail: (email: string) => void;
  isInviting: boolean;
  onInvite: () => void;
  onClose: () => void;
}

export function InviteMemberModal({
  inviteEmail,
  onChangeEmail,
  isInviting,
  onInvite,
  onClose,
}: InviteMemberModalProps) {
  const colors = useThemeColors();
  const colorScheme = useColorScheme();

  return (
    <View className="absolute inset-0 justify-end" style={{ backgroundColor: getBackdropColor(colorScheme === 'dark') }}>
      <View className="rounded-t-3xl p-6" style={{ backgroundColor: colors.background }}>
        <Text className="text-xl font-semibold mb-4" style={{ color: colors.foreground }}>Invite Team Member</Text>

        <View className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Email Address</Text>
          <View
            className="flex-row items-center rounded-lg"
            style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
          >
            <View className="pl-4">
              <Mail size={20} color={colors.mutedForeground} />
            </View>
            <TextInput
              className="flex-1 px-4 py-3"
              placeholder="colleague@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={inviteEmail}
              onChangeText={onChangeEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={{ color: colors.foreground }}
            />
          </View>
        </View>

        <View className="flex-row space-x-3">
          <TouchableOpacity
            className="flex-1 rounded-lg py-3 items-center mr-2"
            style={{ backgroundColor: colors.muted }}
            onPress={onClose}
          >
            <Text className="font-medium" style={{ color: colors.foreground }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 rounded-lg py-3 items-center ml-2"
            style={{ backgroundColor: colors.primary }}
            onPress={onInvite}
            disabled={isInviting}
          >
            {isInviting ? (
              <ActivityIndicator color={colors.primaryForeground} size="small" />
            ) : (
              <Text className="font-medium" style={{ color: colors.primaryForeground }}>Send Invite</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
