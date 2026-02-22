// src/features/settings/components/SettingsItem.tsx
// Reusable settings row component with icon, title, subtitle, and chevron

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';

export interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  hideBorder?: boolean;
}

export function SettingsItem({ icon, title, subtitle, onPress, hideBorder }: SettingsItemProps) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      className="flex-row items-center p-4"
      style={!hideBorder ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
      onPress={onPress}
    >
      {icon}
      <View className="flex-1 ml-3">
        <Text style={{ color: colors.foreground }}>{title}</Text>
        {subtitle && <Text className="text-sm" style={{ color: colors.mutedForeground }}>{subtitle}</Text>}
      </View>
      <ChevronRight size={20} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}
