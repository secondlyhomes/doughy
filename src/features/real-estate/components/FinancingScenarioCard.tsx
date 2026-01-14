// src/features/real-estate/components/FinancingScenarioCard.tsx
// Individual financing scenario card display
// Now uses DataCard for consistency

import React from 'react';
import { View, Text } from 'react-native';
import { Edit2, Trash2 } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { DataCard } from '@/components/ui';
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

  // Build fields array
  const fields = [
    { label: 'Loan Amount', value: formatCurrency(input.loanAmount || 0) },
    { label: 'Down Payment', value: formatCurrency(input.downPayment || 0) },
    { label: 'Total Interest', value: formatCurrency(scenario.totalInterest) },
    { label: 'Cash Required', value: formatCurrency(scenario.cashRequired) },
  ];

  // Build actions array
  const actions = [
    { icon: Edit2, label: 'Edit', onPress: onEdit },
    { icon: Trash2, label: 'Delete', onPress: onDelete, variant: 'destructive' as const },
  ];

  return (
    <DataCard
      onPress={onSelect}
      title={scenario.name}
      subtitle={`${getLoanTypeLabel(scenario.scenario_type)} • ${input.loanTerm || 30} years`}
      headerBadge={
        isSelected
          ? {
              label: 'Selected',
              variant: 'default',
              size: 'sm',
            }
          : undefined
      }
      highlightLabel="Monthly Payment"
      highlightValue={
        <View className="flex-row items-end justify-between w-full">
          <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
            {formatCurrency(scenario.calculatedPayment)}
          </Text>
          <View className="items-end">
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>Interest Rate</Text>
            <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
              {formatPercentage(input.interestRate || 0)}
            </Text>
          </View>
        </View>
      }
      highlightColor={colors.primary}
      fields={fields}
      actions={actions}
      footerContent={
        scenario.description && (
          <Text className="text-xs mb-2" style={{ color: colors.mutedForeground }}>
            {scenario.description}
          </Text>
        )
      }
      isSelected={isSelected}
    />
  );
}
