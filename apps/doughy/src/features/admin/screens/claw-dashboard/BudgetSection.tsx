// src/features/admin/screens/claw-dashboard/BudgetSection.tsx
// Budget limits display with progress bars

import React from 'react';
import { View, Text } from 'react-native';
import { DollarSign, AlertTriangle } from 'lucide-react-native';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import type { useThemeColors } from '@/contexts/ThemeContext';

import type { BudgetLimit } from './types';

interface BudgetSectionProps {
  limits: BudgetLimit[];
  colors: ReturnType<typeof useThemeColors>;
}

export function BudgetSection({ limits, colors }: BudgetSectionProps) {
  return (
    <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl }}>
      <View className="flex-row items-center" style={{ gap: SPACING.sm, marginBottom: SPACING.sm }}>
        <DollarSign size={18} color={colors.success} />
        <Text
          className="text-lg font-semibold"
          style={{ color: colors.foreground }}
        >
          Budget Limits
        </Text>
      </View>

      {limits.map((limit) => (
        <BudgetRow key={limit.id} limit={limit} colors={colors} />
      ))}
    </View>
  );
}

function BudgetRow({
  limit,
  colors,
}: {
  limit: BudgetLimit;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const percentage = limit.limitValue > 0
    ? Math.min((limit.currentValue / limit.limitValue) * 100, 100)
    : 0;

  const barColor = limit.isExceeded
    ? colors.destructive
    : percentage > 80
      ? colors.warning
      : colors.success;

  const typeLabel = formatLimitType(limit.limitType);
  const valueLabel = limit.limitType.includes('cost')
    ? `$${(limit.currentValue / 100).toFixed(2)} / $${(limit.limitValue / 100).toFixed(2)}`
    : `${limit.currentValue.toLocaleString()} / ${limit.limitValue.toLocaleString()}`;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
      }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-sm font-medium" style={{ color: colors.foreground }}>
            {limit.agentName || 'Global'}
          </Text>
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>
            {typeLabel}
          </Text>
        </View>
        <View className="flex-row items-center" style={{ gap: SPACING.xs }}>
          {limit.isExceeded && (
            <AlertTriangle size={14} color={colors.destructive} />
          )}
          <Text className="text-sm" style={{ color: barColor }}>
            {valueLabel}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View
        style={{
          height: 6,
          backgroundColor: colors.muted,
          borderRadius: 3,
          marginTop: SPACING.sm,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: 6,
            width: `${percentage}%`,
            backgroundColor: barColor,
            borderRadius: 3,
          }}
        />
      </View>

      {/* Percentage */}
      <Text
        className="text-xs text-right"
        style={{ color: colors.mutedForeground, marginTop: 4 }}
      >
        {percentage.toFixed(0)}%
      </Text>
    </View>
  );
}

function formatLimitType(type: string): string {
  switch (type) {
    case 'daily_cost': return 'Daily Cost Limit';
    case 'daily_tokens': return 'Daily Token Limit';
    case 'monthly_cost': return 'Monthly Cost Limit';
    case 'monthly_tokens': return 'Monthly Token Limit';
    default: return type.replace(/_/g, ' ');
  }
}
