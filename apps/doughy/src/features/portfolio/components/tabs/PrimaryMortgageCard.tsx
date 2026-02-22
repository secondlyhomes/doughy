// src/features/portfolio/components/tabs/PrimaryMortgageCard.tsx
// Primary mortgage display card with empty state

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Landmark, Plus } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { SPACING } from '@/constants/design-tokens';
import { formatLoanType } from '../../hooks/usePortfolioMortgages';
import { formatCurrency, formatPercent } from '@/lib/amortization';
import type { PrimaryMortgageCardProps } from './debt-tab-types';

export function PrimaryMortgageCard({
  primaryMortgage,
  payoffProgress,
  onEdit,
  onAdd,
}: PrimaryMortgageCardProps) {
  const colors = useThemeColors();

  if (!primaryMortgage) {
    return (
      <Card>
        <CardContent className="py-8 items-center">
          <Landmark size={40} color={colors.mutedForeground} />
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '500', marginTop: SPACING.md }}>
            No Mortgages Added
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
            Add your mortgage to track principal paydown and calculate payoff scenarios.
          </Text>
          <Button
            variant="default"
            size="sm"
            onPress={onAdd}
            className="mt-4"
          >
            <Plus size={16} color="white" />
            <Text style={{ color: 'white', marginLeft: 4 }}>Add Mortgage</Text>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <View className="flex-row justify-between items-center">
          <CardTitle className="flex-row items-center gap-2">
            <Landmark size={18} color={colors.primary} />
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
              Primary Mortgage
            </Text>
          </CardTitle>
          <Badge variant="secondary" size="sm">
            {formatLoanType(primaryMortgage.loan_type)}
          </Badge>
        </View>
      </CardHeader>
      <CardContent>
        <TouchableOpacity onPress={() => onEdit(primaryMortgage)}>
          {/* Lender */}
          {primaryMortgage.lender_name && (
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: SPACING.sm }}>
              {primaryMortgage.lender_name}
            </Text>
          )}

          {/* Balance with progress */}
          <View className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text style={{ color: colors.foreground, fontSize: 14 }}>Balance</Text>
              <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>
                {formatCurrency(primaryMortgage.current_balance)}
              </Text>
            </View>
            <Progress value={payoffProgress} className="h-2" />
            <View className="flex-row justify-between mt-1">
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
                {payoffProgress.toFixed(0)}% paid off
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
                Original: {formatCurrency(primaryMortgage.original_balance)}
              </Text>
            </View>
          </View>

          {/* Rate and Payment */}
          <View className="flex-row justify-between">
            <View>
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Rate</Text>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                {formatPercent(primaryMortgage.interest_rate)}
              </Text>
            </View>
            <View className="items-end">
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Payment</Text>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                {formatCurrency(primaryMortgage.monthly_payment)}/mo
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </CardContent>
    </Card>
  );
}
