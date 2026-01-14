// src/features/admin/components/UserInfoRow.tsx
// Reusable info row for user details

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/context/ThemeContext';

interface UserInfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  hideBorder?: boolean;
}

export function UserInfoRow({ icon, label, value, hideBorder }: UserInfoRowProps) {
  const colors = useThemeColors();
  return (
    <View
      className={`flex-row items-center p-4 ${!hideBorder ? 'border-b' : ''}`}
      style={!hideBorder ? { borderColor: colors.border } : undefined}
    >
      {icon}
      <Text className="ml-3 w-28" style={{ color: colors.mutedForeground }}>{label}</Text>
      <Text className="flex-1" style={{ color: colors.foreground }}>{value}</Text>
    </View>
  );
}
