// src/features/portfolio/components/tabs/PayoffCalculatorCard.tsx
// Extra payment scenarios for accelerated payoff

import React from 'react';
import { View, Text } from 'react-native';
import { TrendingDown } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SPACING } from '@/constants/design-tokens';
import { formatCurrency, formatMonthsAsYearsMonths } from '@/lib/amortization';
import type { PayoffCalculatorCardProps } from './debt-tab-types';

export function PayoffCalculatorCard({ scenarios }: PayoffCalculatorCardProps) {
  const colors = useThemeColors();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex-row items-center gap-2">
          <TrendingDown size={18} color={colors.primary} />
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
            Payoff Calculator
          </Text>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: SPACING.md }}>
          See how extra payments can accelerate your payoff:
        </Text>

        <View className="gap-3">
          {scenarios.map((scenario) => (
            <View
              key={scenario.extraMonthlyAmount}
              className="flex-row justify-between items-center p-3 rounded-lg"
              style={{ backgroundColor: colors.muted }}
            >
              <View>
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500' }}>
                  +{formatCurrency(scenario.extraMonthlyAmount)}/mo
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                  Payoff: {new Date(scenario.newPayoffDate).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View className="items-end">
                <Badge variant="default" size="sm">
                  {formatMonthsAsYearsMonths(scenario.monthsSaved)} sooner
                </Badge>
                <Text style={{ color: colors.success, fontSize: 12, marginTop: 2 }}>
                  Save {formatCurrency(scenario.interestSaved)} interest
                </Text>
              </View>
            </View>
          ))}
        </View>
      </CardContent>
    </Card>
  );
}
