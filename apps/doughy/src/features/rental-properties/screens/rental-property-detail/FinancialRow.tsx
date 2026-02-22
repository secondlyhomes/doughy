// src/features/rental-properties/screens/rental-property-detail/FinancialRow.tsx
// Financial row item component for property detail

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FONT_SIZES } from '@/constants/design-tokens';

export interface FinancialRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

export function FinancialRow({ label, value, valueColor }: FinancialRowProps) {
  const colors = useThemeColors();

  return (
    <View className="flex-row justify-between py-2">
      <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm }}>
        {label}
      </Text>
      <Text
        style={{
          color: valueColor || colors.foreground,
          fontSize: FONT_SIZES.sm,
          fontWeight: '600',
        }}
      >
        {value}
      </Text>
    </View>
  );
}
