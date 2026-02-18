// src/features/deals/screens/quick-underwrite/StickyMetricsHeader.tsx
// Zone G: Sticky compact metrics header that shows when scrolled

import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { DollarSign, TrendingUp, Shield } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { getShadowStyle } from '@/lib/design-utils';
import { SPACING } from '@/constants/design-tokens';
import { MetricCard } from '@/components/deals';
import { DealMetrics } from '../../../real-estate/hooks/useDealAnalysis';
import { formatCurrencyShort } from './utils';

interface StickyMetricsHeaderProps {
  metrics: DealMetrics;
  riskScore: number | undefined;
  visible: boolean;
  topOffset?: number;
}

export function StickyMetricsHeader({
  metrics,
  riskScore,
  visible,
  topOffset = 0,
}: StickyMetricsHeaderProps) {
  const colors = useThemeColors();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(visible ? 1 : 0, [0, 1], [0, 1]),
    transform: [{ translateY: interpolate(visible ? 1 : 0, [0, 1], [-20, 0]) }],
    pointerEvents: visible ? 'auto' : 'none',
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: topOffset,
          left: 0,
          right: 0,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.sm,
          zIndex: 100,
          flexDirection: 'row',
          justifyContent: 'space-around',
          ...getShadowStyle(colors, { size: 'sm' }),
        },
        animatedStyle,
      ]}
    >
      <MetricCard
        label="MAO"
        value={formatCurrencyShort(metrics.mao)}
        icon={<DollarSign size={12} color={colors.success} />}
        compact
      />
      <View style={{ width: 1, backgroundColor: colors.border }} />
      <MetricCard
        label="Profit"
        value={formatCurrencyShort(metrics.netProfit)}
        icon={<TrendingUp size={12} color={colors.info} />}
        compact
      />
      <View style={{ width: 1, backgroundColor: colors.border }} />
      <MetricCard
        label="Risk"
        value={riskScore !== undefined ? `${riskScore}/5` : '-'}
        icon={<Shield size={12} color={colors.warning} />}
        compact
      />
    </Animated.View>
  );
}
