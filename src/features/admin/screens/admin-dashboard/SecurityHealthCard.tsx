// src/features/admin/screens/admin-dashboard/SecurityHealthCard.tsx
// Security health summary card

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Shield, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import type { SecurityHealthCardProps } from './types';

export function SecurityHealthCard({
  score,
  totalKeys,
  keysNeedingAttention,
  onPress,
}: SecurityHealthCardProps) {
  const colors = useThemeColors();

  const getScoreColor = () => {
    if (!score) return colors.mutedForeground;
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.destructive;
  };

  const getBackgroundColor = () => {
    if (!score) return colors.muted;
    if (score >= 80) return colors.success + '20';
    if (score >= 60) return colors.warning + '20';
    return colors.destructive + '20';
  };

  const getStatusText = () => {
    if (keysNeedingAttention > 0) {
      return `${keysNeedingAttention} key${keysNeedingAttention > 1 ? 's' : ''} need${keysNeedingAttention === 1 ? 's' : ''} attention`;
    }
    if (totalKeys) {
      return 'All keys current';
    }
    return 'No keys configured';
  };

  return (
    <View className="p-4">
      <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>
        Security
      </Text>
      <TouchableOpacity
        className="rounded-lg p-4"
        style={{ backgroundColor: colors.card }}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center">
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: getBackgroundColor() }}
          >
            <Shield size={24} color={getScoreColor()} />
          </View>
          <View className="flex-1 ml-3">
            <View className="flex-row items-center">
              <Text className="text-lg font-bold" style={{ color: colors.foreground }}>
                {score ? `${score}` : '--'}
              </Text>
              <Text className="text-sm ml-1" style={{ color: colors.mutedForeground }}>
                /100
              </Text>
            </View>
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              {getStatusText()}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.mutedForeground} />
        </View>
      </TouchableOpacity>
    </View>
  );
}
