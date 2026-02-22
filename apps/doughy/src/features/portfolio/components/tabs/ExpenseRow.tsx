// src/features/portfolio/components/tabs/ExpenseRow.tsx
// Expense row with percentage bar

import React from 'react';
import { View, Text } from 'react-native';
import type { ThemeColors } from './financials-types';

export function ExpenseRow({
  label,
  amount,
  total,
  colors,
}: {
  label: string;
  amount: number;
  total: number;
  colors: ThemeColors;
}) {
  const percentage = total > 0 ? (amount / total) * 100 : 0;

  return (
    <View className="gap-1">
      <View className="flex-row justify-between">
        <Text style={{ color: colors.foreground, fontSize: 13 }}>{label}</Text>
        <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '500' }}>
          ${amount.toFixed(0)} ({percentage.toFixed(0)}%)
        </Text>
      </View>
      <View
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: colors.muted }}
      >
        <View
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: colors.primary,
          }}
        />
      </View>
    </View>
  );
}
