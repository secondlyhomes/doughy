// src/features/portfolio/components/tabs/DebtSummaryCard.tsx
// Total debt summary card

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Card, CardContent } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/amortization';
import type { DebtSummaryCardProps } from './debt-tab-types';

export function DebtSummaryCard({ totalDebt, totalMonthlyPayment }: DebtSummaryCardProps) {
  const colors = useThemeColors();

  return (
    <Card>
      <CardContent className="py-3">
        <View className="flex-row justify-between">
          <View>
            <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Total Debt</Text>
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>
              {formatCurrency(totalDebt)}
            </Text>
          </View>
          <View className="items-end">
            <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Total Payment</Text>
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>
              {formatCurrency(totalMonthlyPayment)}/mo
            </Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}
