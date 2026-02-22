// src/features/portfolio/components/tabs/AmortizationCard.tsx
// Amortization chart and summary stats

import React from 'react';
import { View, Text } from 'react-native';
import { Calculator } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/amortization';
import { AmortizationChart } from '../charts/AmortizationChart';
import type { AmortizationCardProps } from './debt-tab-types';

export function AmortizationCard({
  amortization,
  onViewFullSchedule,
}: AmortizationCardProps) {
  const colors = useThemeColors();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex-row items-center gap-2">
          <Calculator size={18} color={colors.primary} />
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
            Amortization
          </Text>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AmortizationChart
          schedule={amortization}
          onViewFullSchedule={onViewFullSchedule}
        />

        {/* Summary Stats */}
        <View className="mt-4 pt-4 border-t gap-2" style={{ borderColor: colors.border }}>
          <View className="flex-row justify-between">
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Payoff Date</Text>
            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500' }}>
              {new Date(amortization.summary.payoffDate).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Remaining Payments</Text>
            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500' }}>
              {amortization.summary.totalPayments} months
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Total Interest</Text>
            <Text style={{ color: colors.destructive, fontSize: 14, fontWeight: '500' }}>
              {formatCurrency(amortization.summary.totalInterest)}
            </Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}
