// src/features/real-estate/components/FinancingPreview.tsx
// Payment preview component for financing scenarios

import React from 'react';
import { View, Text } from 'react-native';
import { Calculator } from 'lucide-react-native';
import { FinancingCalculations } from '../hooks/useFinancingForm';
import { formatCurrency } from '../utils/formatters';

interface FinancingPreviewProps {
  calculations: FinancingCalculations;
}

export function FinancingPreview({ calculations }: FinancingPreviewProps) {
  const { purchasePrice, loanAmount, monthlyPayment, totalInterest, cashRequired } = calculations;

  if (purchasePrice <= 0 || loanAmount <= 0) {
    return null;
  }

  return (
    <View className="bg-primary/5 rounded-xl p-4 border border-primary/10 mb-6">
      <View className="flex-row items-center mb-3">
        <Calculator size={16} className="text-primary" />
        <Text className="text-sm font-semibold text-foreground ml-2">Payment Preview</Text>
      </View>

      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm text-muted-foreground">Monthly Payment (P&I)</Text>
        <Text className="text-lg font-bold text-primary">{formatCurrency(monthlyPayment)}</Text>
      </View>

      <View className="h-px bg-border my-2" />

      <View className="gap-1">
        <View className="flex-row justify-between">
          <Text className="text-xs text-muted-foreground">Loan Amount</Text>
          <Text className="text-xs text-foreground">{formatCurrency(loanAmount)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-xs text-muted-foreground">Total Interest</Text>
          <Text className="text-xs text-foreground">{formatCurrency(totalInterest)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-xs text-muted-foreground">Cash Required at Close</Text>
          <Text className="text-xs text-foreground">{formatCurrency(cashRequired)}</Text>
        </View>
      </View>
    </View>
  );
}
