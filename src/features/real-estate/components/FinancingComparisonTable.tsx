// src/features/real-estate/components/FinancingComparisonTable.tsx
// Comparison table for financing scenarios

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { FinancingScenarioWithCalcs } from '../hooks/useFinancingScenarios';
import { formatCurrency } from '../utils/formatters';

interface FinancingComparisonTableProps {
  scenarios: FinancingScenarioWithCalcs[];
}

export function FinancingComparisonTable({ scenarios }: FinancingComparisonTableProps) {
  const colors = useThemeColors();

  if (scenarios.length < 2) return null;

  return (
    <View className="rounded-xl border overflow-hidden" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
      <View className="px-4 py-3 border-b" style={{ backgroundColor: colors.primary + '0D', borderColor: colors.border }}>
        <Text className="text-sm font-semibold" style={{ color: colors.foreground }}>Comparison</Text>
        <Text className="text-xs" style={{ color: colors.mutedForeground }}>
          Comparing {scenarios.length} scenarios
        </Text>
      </View>

      {/* Comparison Header */}
      <View className="flex-row border-b" style={{ borderColor: colors.border }}>
        <View className="flex-1 p-3 border-r" style={{ borderColor: colors.border }}>
          <Text className="text-xs text-center" style={{ color: colors.mutedForeground }}>Metric</Text>
        </View>
        {scenarios.map((scenario, index) => (
          <View
            key={scenario.id}
            className={`flex-1 p-3 ${index < scenarios.length - 1 ? 'border-r' : ''}`}
            style={index < scenarios.length - 1 ? { borderColor: colors.border } : undefined}
          >
            <Text className="text-xs text-center font-medium" style={{ color: colors.foreground }} numberOfLines={1}>
              {scenario.name}
            </Text>
          </View>
        ))}
      </View>

      {/* Monthly Payment Row */}
      <View className="flex-row border-b" style={{ borderColor: colors.border }}>
        <View className="flex-1 p-3 border-r" style={{ backgroundColor: colors.muted + '4D', borderColor: colors.border }}>
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>Monthly</Text>
        </View>
        {scenarios.map((scenario, index) => (
          <View
            key={scenario.id}
            className={`flex-1 p-3 ${index < scenarios.length - 1 ? 'border-r' : ''}`}
            style={index < scenarios.length - 1 ? { borderColor: colors.border } : undefined}
          >
            <Text className="text-xs text-center font-medium" style={{ color: colors.foreground }}>
              {formatCurrency(scenario.calculatedPayment)}
            </Text>
          </View>
        ))}
      </View>

      {/* Total Interest Row */}
      <View className="flex-row border-b" style={{ borderColor: colors.border }}>
        <View className="flex-1 p-3 border-r" style={{ backgroundColor: colors.muted + '4D', borderColor: colors.border }}>
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>Total Interest</Text>
        </View>
        {scenarios.map((scenario, index) => (
          <View
            key={scenario.id}
            className={`flex-1 p-3 ${index < scenarios.length - 1 ? 'border-r' : ''}`}
            style={index < scenarios.length - 1 ? { borderColor: colors.border } : undefined}
          >
            <Text className="text-xs text-center font-medium" style={{ color: colors.foreground }}>
              {formatCurrency(scenario.totalInterest)}
            </Text>
          </View>
        ))}
      </View>

      {/* Cash Required Row */}
      <View className="flex-row">
        <View className="flex-1 p-3 border-r" style={{ backgroundColor: colors.muted + '4D', borderColor: colors.border }}>
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>Cash Needed</Text>
        </View>
        {scenarios.map((scenario, index) => (
          <View
            key={scenario.id}
            className={`flex-1 p-3 ${index < scenarios.length - 1 ? 'border-r' : ''}`}
            style={index < scenarios.length - 1 ? { borderColor: colors.border } : undefined}
          >
            <Text className="text-xs text-center font-medium" style={{ color: colors.foreground }}>
              {formatCurrency(scenario.cashRequired)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
