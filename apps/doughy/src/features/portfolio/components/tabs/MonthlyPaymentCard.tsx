// src/features/portfolio/components/tabs/MonthlyPaymentCard.tsx
// This month's payment breakdown (principal vs interest)

import React from 'react';
import { View, Text } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/amortization';
import type { MonthlyPaymentCardProps } from './debt-tab-types';

export function MonthlyPaymentCard({ breakdown }: MonthlyPaymentCardProps) {
  const colors = useThemeColors();
  const total = breakdown.principal + breakdown.interest;
  const principalPercent = ((breakdown.principal / total) * 100).toFixed(0);
  const interestPercent = ((breakdown.interest / total) * 100).toFixed(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex-row items-center gap-2">
          <Calendar size={18} color={colors.primary} />
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
            This Month{'\''} Payment
          </Text>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <View className="flex-row justify-between">
          <View className="items-center flex-1">
            <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Principal</Text>
            <Text style={{ color: colors.success, fontSize: 18, fontWeight: '600' }}>
              {formatCurrency(breakdown.principal)}
            </Text>
          </View>
          <View className="items-center flex-1">
            <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Interest</Text>
            <Text style={{ color: colors.destructive, fontSize: 18, fontWeight: '600' }}>
              {formatCurrency(breakdown.interest)}
            </Text>
          </View>
        </View>

        {/* Visual split */}
        <View className="flex-row mt-4 h-3 rounded-full overflow-hidden">
          <View
            style={{
              flex: breakdown.principal,
              backgroundColor: colors.success,
            }}
          />
          <View
            style={{
              flex: breakdown.interest,
              backgroundColor: colors.destructive,
            }}
          />
        </View>
        <View className="flex-row justify-between mt-1">
          <Text style={{ color: colors.success, fontSize: 11 }}>
            {principalPercent}% to principal
          </Text>
          <Text style={{ color: colors.destructive, fontSize: 11 }}>
            {interestPercent}% to interest
          </Text>
        </View>
      </CardContent>
    </Card>
  );
}
