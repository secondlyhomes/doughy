// src/components/deals/MetricCardBreakdown.tsx
// Breakdown section for expanded MetricCard state

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES, DEFAULT_HIT_SLOP } from '@/constants/design-tokens';
import { formatValue } from './metric-card-helpers';
import type { MetricBreakdown } from './metric-card-types';

interface MetricCardBreakdownProps {
  breakdown: MetricBreakdown;
  onEvidencePress?: () => void;
}

export function MetricCardBreakdown({ breakdown, onEvidencePress }: MetricCardBreakdownProps) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: withOpacity(colors.background, 'medium'),
        gap: SPACING.sm,
      }}
    >
      {/* Formula */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text
          style={{
            fontSize: 12,
            fontFamily: 'monospace',
            color: colors.mutedForeground,
          }}
        >
          {breakdown.formula}
        </Text>
        {onEvidencePress && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onEvidencePress();
            }}
            hitSlop={DEFAULT_HIT_SLOP}
          >
            <Info size={ICON_SIZES.sm} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Breakdown Items */}
      {breakdown.items.map((item) => (
        <View
          key={`${item.label}-${item.value}`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: SPACING.xs,
            borderTopWidth: 1,
            borderTopColor: withOpacity(colors.border, 'light'),
          }}
        >
          <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
            {item.isSubtraction ? '\u2212' : '+'} {item.label}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: item.isSubtraction ? colors.destructive : colors.foreground,
            }}
          >
            {formatValue(item.value)}
          </Text>
        </View>
      ))}
    </View>
  );
}
