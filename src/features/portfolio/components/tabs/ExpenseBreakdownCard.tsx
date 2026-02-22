// src/features/portfolio/components/tabs/ExpenseBreakdownCard.tsx
// Expense breakdown card for the financials tab

import React from 'react';
import { View, Text } from 'react-native';
import { PieChart } from 'lucide-react-native';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ExpenseRow } from './ExpenseRow';
import type { ExpenseBreakdownCardProps } from './financials-types';

const EXPENSE_CATEGORIES = [
  { key: 'mortgage_piti' as const, label: 'Mortgage PITI' },
  { key: 'insurance' as const, label: 'Insurance' },
  { key: 'property_tax' as const, label: 'Property Tax' },
  { key: 'hoa' as const, label: 'HOA' },
  { key: 'repairs' as const, label: 'Repairs' },
  { key: 'property_management' as const, label: 'Property Mgmt' },
  { key: 'utilities' as const, label: 'Utilities' },
  { key: 'other' as const, label: 'Other' },
];

export function ExpenseBreakdownCard({
  currentMonth,
  colors,
}: ExpenseBreakdownCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex-row items-center gap-2">
          <PieChart size={18} color={colors.primary} />
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
            Expense Breakdown
          </Text>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <View className="gap-2">
          {EXPENSE_CATEGORIES.map(({ key, label }) => {
            const amount = currentMonth.expenses[key];
            if (!amount || amount <= 0) return null;
            return (
              <ExpenseRow
                key={key}
                label={label}
                amount={amount}
                total={currentMonth.expenses.total}
                colors={colors}
              />
            );
          })}
        </View>
      </CardContent>
    </Card>
  );
}
