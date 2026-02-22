// src/components/deals/MetricCardCompact.tsx
// Compact mode rendering for MetricCard (sticky headers)

import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/design-tokens';
import { formatValue } from './metric-card-helpers';
import type { ConfidenceLevel } from './metric-card-types';

interface MetricCardCompactProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  confidence?: ConfidenceLevel;
  confidenceIndicatorColor?: string;
  style?: ViewStyle;
}

export function MetricCardCompact({
  label,
  value,
  icon,
  confidence,
  confidenceIndicatorColor,
  style,
}: MetricCardCompactProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: 'center',
          paddingVertical: SPACING.sm,
          paddingHorizontal: SPACING.sm,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
        {icon}
        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, marginTop: SPACING.xxs }}>
        {formatValue(value)}
      </Text>
      {confidence && (
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: confidenceIndicatorColor,
            marginTop: SPACING.xs,
          }}
        />
      )}
    </View>
  );
}
