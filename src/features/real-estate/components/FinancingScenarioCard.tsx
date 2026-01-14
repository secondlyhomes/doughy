// src/features/real-estate/components/FinancingScenarioCard.tsx
// Individual financing scenario card display

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Edit2, Trash2 } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { Button } from '@/components/ui';
import { FinancingScenario, ScenarioDetails } from '../types';
import { FinancingScenarioWithCalcs, LOAN_TYPES, LoanType } from '../hooks/useFinancingScenarios';
import { formatCurrency, formatPercentage } from '../utils/formatters';

// Default empty scenario details for safe property access
const EMPTY_SCENARIO_DETAILS: ScenarioDetails = {
  purchasePrice: null,
  loanAmount: null,
  interestRate: null,
};

interface FinancingScenarioCardProps {
  scenario: FinancingScenarioWithCalcs;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function getLoanTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Unknown';
  return LOAN_TYPES.find(t => t.id === type)?.label || type;
}

export function FinancingScenarioCard({
  scenario,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: FinancingScenarioCardProps) {
  const colors = useThemeColors();
  const input: ScenarioDetails = scenario.input_json || EMPTY_SCENARIO_DETAILS;

  return (
    <TouchableOpacity
      onPress={onSelect}
      className="rounded-xl border overflow-hidden"
      style={{
        backgroundColor: colors.card,
        borderColor: isSelected ? colors.primary : colors.border,
        borderWidth: isSelected ? 2 : 1,
      }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b" style={{ borderColor: colors.border }}>
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="font-semibold" style={{ color: colors.foreground }}>{scenario.name}</Text>
            {isSelected && (
              <View className="ml-2 px-2 py-0.5 rounded" style={{ backgroundColor: colors.primary }}>
                <Text className="text-xs" style={{ color: colors.primaryForeground }}>Selected</Text>
              </View>
            )}
          </View>
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>
            {getLoanTypeLabel(scenario.scenario_type)} • {input.loanTerm || 30} years
          </Text>
        </View>

        <View className="flex-row gap-1">
          <Button variant="ghost" size="icon" onPress={onEdit} style={{ backgroundColor: colors.muted }}>
            <Edit2 size={14} color={colors.mutedForeground} />
          </Button>
          <Button variant="ghost" size="icon" onPress={onDelete} style={{ backgroundColor: colors.destructive + '1A' }}>
            <Trash2 size={14} color={colors.destructive} />
          </Button>
        </View>
      </View>

      {/* Payment Highlight */}
      <View className="p-4" style={{ backgroundColor: colors.primary + '0D' }}>
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>Monthly Payment</Text>
            <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
              {formatCurrency(scenario.calculatedPayment)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>Interest Rate</Text>
            <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
              {formatPercentage(input.interestRate || 0)}
            </Text>
          </View>
        </View>
      </View>

      {/* Details */}
      <View className="p-4">
        <View className="flex-row flex-wrap gap-x-4 gap-y-2">
          <View className="min-w-[45%]">
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>Loan Amount</Text>
            <Text className="text-sm font-medium" style={{ color: colors.foreground }}>
              {formatCurrency(input.loanAmount || 0)}
            </Text>
          </View>
          <View className="min-w-[45%]">
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>Down Payment</Text>
            <Text className="text-sm font-medium" style={{ color: colors.foreground }}>
              {formatCurrency(input.downPayment || 0)}
            </Text>
          </View>
          <View className="min-w-[45%]">
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>Total Interest</Text>
            <Text className="text-sm font-medium" style={{ color: colors.foreground }}>
              {formatCurrency(scenario.totalInterest)}
            </Text>
          </View>
          <View className="min-w-[45%]">
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>Cash Required</Text>
            <Text className="text-sm font-medium" style={{ color: colors.foreground }}>
              {formatCurrency(scenario.cashRequired)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {scenario.description && (
          <Text className="text-xs mt-3" style={{ color: colors.mutedForeground }}>
            {scenario.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
