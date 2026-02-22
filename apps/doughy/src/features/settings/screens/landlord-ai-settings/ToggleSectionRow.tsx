// src/features/settings/screens/landlord-ai-settings/ToggleSectionRow.tsx
// Reusable toggle row for settings sections

import React from 'react';
import { View, Text, Switch } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import type { ToggleSectionRowProps } from './types';

export function ToggleSectionRow({
  icon,
  title,
  description,
  value,
  onValueChange,
  isLast = false,
}: ToggleSectionRowProps) {
  const colors = useThemeColors();

  return (
    <View
      className="flex-row items-center p-4"
      style={!isLast ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
    >
      {icon && icon}
      <View className={`flex-1 ${icon ? 'ml-3' : ''}`}>
        <Text style={{ color: colors.foreground }}>{title}</Text>
        <Text className="text-sm" style={{ color: colors.mutedForeground }}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.muted, true: colors.primary }}
        thumbTintColor={colors.card}
      />
    </View>
  );
}
