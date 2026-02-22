// src/features/portfolio/components/tabs/ComparisonRow.tsx
// Comparison row for actuals vs projected

import React from 'react';
import { View, Text } from 'react-native';
import type { ThemeColors } from './financials-types';

export function ComparisonRow({
  label,
  projected,
  actual,
  invertColors,
  colors,
}: {
  label: string;
  projected: number;
  actual: number;
  invertColors?: boolean;
  colors: ThemeColors;
}) {
  const diff = actual - projected;
  const percentDiff = projected > 0 ? ((diff / projected) * 100) : 0;
  const isPositive = invertColors ? diff <= 0 : diff >= 0;

  return (
    <View className="flex-row justify-between items-center">
      <View className="flex-1">
        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500' }}>{label}</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
          Projected: ${projected.toFixed(0)}/mo
        </Text>
      </View>
      <View className="items-end">
        <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '600' }}>
          ${actual.toFixed(0)}/mo
        </Text>
        <Text
          style={{
            color: isPositive ? colors.success : colors.destructive,
            fontSize: 12,
          }}
        >
          {diff >= 0 ? '+' : ''}${diff.toFixed(0)} ({percentDiff.toFixed(1)}%)
        </Text>
      </View>
    </View>
  );
}
