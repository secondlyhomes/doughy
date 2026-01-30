// src/features/property-inventory/screens/inventory-detail/DetailRow.tsx
// Detail row component for inventory detail screen

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FONT_SIZES } from '@/constants/design-tokens';

export interface DetailRowProps {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  valueColor?: string;
}

export function DetailRow({ icon: Icon, label, value, valueColor }: DetailRowProps) {
  const colors = useThemeColors();

  if (!value) return null;

  return (
    <View className="flex-row items-center py-3">
      <Icon size={18} color={colors.mutedForeground} />
      <View className="ml-3 flex-1">
        <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.xs }}>
          {label}
        </Text>
        <Text
          style={{
            color: valueColor || colors.foreground,
            fontSize: FONT_SIZES.base,
            fontWeight: '500',
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}
