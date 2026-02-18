// src/features/settings/screens/landlord-ai-settings/SettingSection.tsx
// Reusable section wrapper for settings

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import type { SettingSectionProps } from './types';

export function SettingSection({ children, title }: SettingSectionProps) {
  const colors = useThemeColors();

  return (
    <View className="p-4">
      <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>
        {title}
      </Text>
      {children}
    </View>
  );
}
