// src/features/portfolio/components/tabs/OtherLoansCard.tsx
// Secondary/other loans list card

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Landmark, Plus, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatLoanType } from '../../hooks/usePortfolioMortgages';
import { formatCurrency, formatPercent } from '@/lib/amortization';
import type { OtherLoansCardProps } from './debt-tab-types';

export function OtherLoansCard({ mortgages, onEdit, onAdd }: OtherLoansCardProps) {
  const colors = useThemeColors();

  return (
    <Card>
      <CardHeader>
        <View className="flex-row justify-between items-center">
          <CardTitle className="flex-row items-center gap-2">
            <Landmark size={18} color={colors.primary} />
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
              Other Loans
            </Text>
          </CardTitle>
          <TouchableOpacity
            onPress={onAdd}
            className="flex-row items-center gap-1"
          >
            <Plus size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 13 }}>Add</Text>
          </TouchableOpacity>
        </View>
      </CardHeader>
      <CardContent>
        <View className="gap-2">
          {mortgages
            .filter((m) => !m.is_primary)
            .map((mortgage) => (
              <TouchableOpacity
                key={mortgage.id}
                onPress={() => onEdit(mortgage)}
                className="flex-row justify-between items-center p-3 rounded-lg"
                style={{ backgroundColor: colors.muted }}
              >
                <View>
                  <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500' }}>
                    {mortgage.lender_name || formatLoanType(mortgage.loan_type)}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                    {formatPercent(mortgage.interest_rate)} • {formatCurrency(mortgage.monthly_payment)}/mo
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '600' }}>
                    {formatCurrency(mortgage.current_balance)}
                  </Text>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </View>
              </TouchableOpacity>
            ))}
        </View>
      </CardContent>
    </Card>
  );
}
