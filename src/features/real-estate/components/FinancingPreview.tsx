// src/features/real-estate/components/FinancingPreview.tsx
// Payment preview component for financing scenarios

import React from 'react';
import { View, Text } from 'react-native';
import { Calculator } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { FinancingCalculations } from '../hooks/useFinancingForm';
import { formatCurrency } from '../utils/formatters';

interface FinancingPreviewProps {
  calculations: FinancingCalculations;
}

export function FinancingPreview({ calculations }: FinancingPreviewProps) {
  const colors = useThemeColors();
  const { purchasePrice, loanAmount, monthlyPayment, totalInterest, cashRequired } = calculations;

  if (purchasePrice <= 0 || loanAmount <= 0) {
    return null;
  }

  return (
    <View
      className="rounded-xl p-4 mb-6"
      style={{
        backgroundColor: `${colors.primary}0D`,
        borderWidth: 1,
        borderColor: `${colors.primary}1A`,
      }}
    >
      <View className="flex-row items-center mb-3">
        <Calculator size={16} color={colors.primary} />
        <Text className="text-sm font-semibold ml-2" style={{ color: colors.foreground }}>Payment Preview</Text>
      </View>

      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm" style={{ color: colors.mutedForeground }}>Monthly Payment (P&I)</Text>
        <Text className="text-lg font-bold" style={{ color: colors.primary }}>{formatCurrency(monthlyPayment)}</Text>
      </View>

      <View className="h-px my-2" style={{ backgroundColor: colors.border }} />

      <View className="gap-1">
        <View className="flex-row justify-between">
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>Loan Amount</Text>
          <Text className="text-xs" style={{ color: colors.foreground }}>{formatCurrency(loanAmount)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>Total Interest</Text>
          <Text className="text-xs" style={{ color: colors.foreground }}>{formatCurrency(totalInterest)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>Cash Required at Close</Text>
          <Text className="text-xs" style={{ color: colors.foreground }}>{formatCurrency(cashRequired)}</Text>
        </View>
      </View>
    </View>
  );
}
