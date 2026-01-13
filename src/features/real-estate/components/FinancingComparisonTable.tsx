// src/features/real-estate/components/FinancingComparisonTable.tsx
// Comparison table for financing scenarios

import React from 'react';
import { View, Text } from 'react-native';
import { FinancingScenarioWithCalcs } from '../hooks/useFinancingScenarios';
import { formatCurrency } from '../utils/formatters';

interface FinancingComparisonTableProps {
  scenarios: FinancingScenarioWithCalcs[];
}

export function FinancingComparisonTable({ scenarios }: FinancingComparisonTableProps) {
  if (scenarios.length < 2) return null;

  return (
    <View className="bg-card rounded-xl border border-border overflow-hidden">
      <View className="px-4 py-3 bg-primary/5 border-b border-border">
        <Text className="text-sm font-semibold text-foreground">Comparison</Text>
        <Text className="text-xs text-muted-foreground">
          Comparing {scenarios.length} scenarios
        </Text>
      </View>

      {/* Comparison Header */}
      <View className="flex-row border-b border-border">
        <View className="flex-1 p-3 border-r border-border">
          <Text className="text-xs text-muted-foreground text-center">Metric</Text>
        </View>
        {scenarios.map((scenario, index) => (
          <View
            key={scenario.id}
            className={`flex-1 p-3 ${index < scenarios.length - 1 ? 'border-r border-border' : ''}`}
          >
            <Text className="text-xs text-foreground text-center font-medium" numberOfLines={1}>
              {scenario.name}
            </Text>
          </View>
        ))}
      </View>

      {/* Monthly Payment Row */}
      <View className="flex-row border-b border-border">
        <View className="flex-1 p-3 border-r border-border bg-muted/30">
          <Text className="text-xs text-muted-foreground">Monthly</Text>
        </View>
        {scenarios.map((scenario, index) => (
          <View
            key={scenario.id}
            className={`flex-1 p-3 ${index < scenarios.length - 1 ? 'border-r border-border' : ''}`}
          >
            <Text className="text-xs text-foreground text-center font-medium">
              {formatCurrency(scenario.calculatedPayment)}
            </Text>
          </View>
        ))}
      </View>

      {/* Total Interest Row */}
      <View className="flex-row border-b border-border">
        <View className="flex-1 p-3 border-r border-border bg-muted/30">
          <Text className="text-xs text-muted-foreground">Total Interest</Text>
        </View>
        {scenarios.map((scenario, index) => (
          <View
            key={scenario.id}
            className={`flex-1 p-3 ${index < scenarios.length - 1 ? 'border-r border-border' : ''}`}
          >
            <Text className="text-xs text-foreground text-center font-medium">
              {formatCurrency(scenario.totalInterest)}
            </Text>
          </View>
        ))}
      </View>

      {/* Cash Required Row */}
      <View className="flex-row">
        <View className="flex-1 p-3 border-r border-border bg-muted/30">
          <Text className="text-xs text-muted-foreground">Cash Needed</Text>
        </View>
        {scenarios.map((scenario, index) => (
          <View
            key={scenario.id}
            className={`flex-1 p-3 ${index < scenarios.length - 1 ? 'border-r border-border' : ''}`}
          >
            <Text className="text-xs text-foreground text-center font-medium">
              {formatCurrency(scenario.cashRequired)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
