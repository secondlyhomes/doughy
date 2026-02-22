// src/features/portfolio/screens/portfolio-property-detail/QuickStat.tsx

import React from 'react';
import { View, Text } from 'react-native';
import { ThemeColors } from './portfolio-property-detail-types';

// Quick stat component for header
export function QuickStat({
  label,
  value,
  trend,
  colors,
}: {
  label: string;
  value: string;
  trend?: 'up' | 'down';
  colors: ThemeColors;
}) {
  return (
    <View className="items-center">
      <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '500' }}>
        {label}
      </Text>
      <Text
        style={{
          color: trend === 'up' ? colors.success : trend === 'down' ? colors.destructive : colors.foreground,
          fontSize: 15,
          fontWeight: '600',
          marginTop: 2,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
