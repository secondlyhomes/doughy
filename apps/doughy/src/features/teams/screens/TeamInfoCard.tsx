// src/features/teams/screens/TeamInfoCard.tsx
// Team workspace info card

import React from 'react';
import { View, Text } from 'react-native';
import { Users } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';

interface TeamInfoCardProps {
  memberCount: number;
}

export function TeamInfoCard({ memberCount }: TeamInfoCardProps) {
  const colors = useThemeColors();

  return (
    <View className="p-4">
      <View className="rounded-lg p-4" style={{ backgroundColor: colors.card }}>
        <View className="flex-row items-center">
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Users size={24} color={colors.primaryForeground} />
          </View>
          <View className="ml-4">
            <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>My Workspace</Text>
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              {memberCount} member{memberCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
