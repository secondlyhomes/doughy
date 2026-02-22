// src/features/portfolio/components/tabs/ActualsVsProjectedCard.tsx
// Actuals vs projected comparison card for the financials tab

import React from 'react';
import { View, Text } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ComparisonRow } from './ComparisonRow';
import type { ActualsVsProjectedCardProps } from './financials-types';

export function ActualsVsProjectedCard({
  entry,
  summary,
  colors,
}: ActualsVsProjectedCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex-row items-center gap-2">
          <TrendingUp size={18} color={colors.primary} />
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
            Actuals vs Projected
          </Text>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <View className="gap-3">
          <ComparisonRow
            label="Monthly Income"
            projected={entry.projected_monthly_rent || entry.monthly_rent}
            actual={summary.averageMonthlyRent}
            colors={colors}
          />
          <ComparisonRow
            label="Monthly Expenses"
            projected={entry.projected_monthly_expenses || entry.monthly_expenses}
            actual={summary.averageMonthlyExpenses}
            invertColors
            colors={colors}
          />
          <View className="border-t pt-3" style={{ borderColor: colors.border }}>
            <ComparisonRow
              label="Net Cash Flow"
              projected={(entry.projected_monthly_rent || entry.monthly_rent) - (entry.projected_monthly_expenses || entry.monthly_expenses)}
              actual={summary.averageMonthlyCashFlow}
              colors={colors}
            />
          </View>
        </View>
      </CardContent>
    </Card>
  );
}
