// src/features/admin/screens/admin-dashboard/StatCard.tsx
// Stat card component for dashboard metrics

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { PRESS_OPACITY } from '@/constants/design-tokens';
import type { StatCardProps } from './types';

export const StatCard = React.memo(function StatCard({
  icon,
  title,
  value,
  subtitle,
  onPress,
  cardColor,
}: StatCardProps) {
  const colors = useThemeColors();

  const content = (
    <View className="rounded-lg p-4" style={{ backgroundColor: cardColor }}>
      {icon}
      <Text className="text-2xl font-bold mt-2" style={{ color: colors.foreground }}>
        {value}
      </Text>
      <Text className="text-sm" style={{ color: colors.foreground }}>
        {title}
      </Text>
      <Text className="text-xs" style={{ color: colors.mutedForeground }}>
        {subtitle}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        className="w-1/2 p-2"
        onPress={onPress}
        activeOpacity={PRESS_OPACITY.DEFAULT}
        accessibilityLabel={`${title}: ${value}. ${subtitle}`}
        accessibilityRole="button"
        accessibilityHint={`Tap to view ${title.toLowerCase()} details`}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      className="w-1/2 p-2"
      accessibilityLabel={`${title}: ${value}. ${subtitle}`}
      accessibilityRole="text"
    >
      {content}
    </View>
  );
});
