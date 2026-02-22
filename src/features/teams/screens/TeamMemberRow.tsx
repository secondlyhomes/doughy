// src/features/teams/screens/TeamMemberRow.tsx
// Individual team member row in the members list

import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { TeamMember } from './team-settings-types';
import { getRoleIcon, getRoleLabel } from './team-settings-helpers';

interface TeamMemberRowProps {
  member: TeamMember;
  isLast: boolean;
  onChangeRole: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
}

export function TeamMemberRow({ member, isLast, onChangeRole, onRemove }: TeamMemberRowProps) {
  const colors = useThemeColors();

  return (
    <View
      className="flex-row items-center p-4"
      style={!isLast ? { borderBottomWidth: 1, borderBottomColor: colors.border } : {}}
    >
      {/* Avatar */}
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: withOpacity(colors.primary, 'light') }}
      >
        <Text className="font-semibold" style={{ color: colors.primary }}>{member.avatarInitials}</Text>
      </View>

      {/* Info */}
      <View className="flex-1 ml-3">
        <View className="flex-row items-center">
          <Text className="font-medium" style={{ color: colors.foreground }}>{member.name}</Text>
          {getRoleIcon(member.role, colors) && (
            <View className="ml-2">{getRoleIcon(member.role, colors)}</View>
          )}
        </View>
        <Text className="text-sm" style={{ color: colors.mutedForeground }}>{member.email}</Text>
      </View>

      {/* Role Badge */}
      <View className="px-2 py-1 rounded mr-2" style={{ backgroundColor: colors.muted }}>
        <Text className="text-xs capitalize" style={{ color: colors.mutedForeground }}>
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
                { text: 'Change Role', onPress: () => onChangeRole(member) },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () => onRemove(member),
                },
              ]
            );
          }}
        >
          <MoreVertical size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  );
}
