// src/features/real-estate/components/PropertyAnalysisTab.tsx
// Deal analysis tab content for property detail
// Uses useThemeColors() for reliable dark mode support

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { TrendingUp, DollarSign, Percent, Calculator } from 'lucide-react-native';
import { Property } from '../types';
import { useDealAnalysis } from '../hooks/useDealAnalysis';
import { CashFlowAnalysis } from './CashFlowAnalysis';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { useThemeColors } from '@/context/ThemeContext';

interface PropertyAnalysisTabProps {
  property: Property;
}

type AnalysisMode = 'flip' | 'rental';

export function PropertyAnalysisTab({ property }: PropertyAnalysisTabProps) {
  const colors = useThemeColors();
  const [mode, setMode] = useState<AnalysisMode>('flip');
  const metrics = useDealAnalysis(property);

  // Check if we have enough data to show analysis
  const hasData = metrics.purchasePrice > 0 || metrics.arv > 0;

  if (!hasData) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <Calculator size={48} color={colors.mutedForeground} />
        <Text className="text-lg font-semibold mb-2 mt-4" style={{ color: colors.foreground }}>
          No Analysis Data
        </Text>
        <Text className="text-center px-8" style={{ color: colors.mutedForeground }}>
          Add purchase price and ARV to see deal analysis metrics.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <View className="gap-4">
        {/* Mode Toggle */}
        <View className="flex-row rounded-xl p-1" style={{ backgroundColor: colors.muted }}>
          <TouchableOpacity
            onPress={() => setMode('flip')}
            className="flex-1 py-2.5 rounded-lg"
            style={mode === 'flip' ? { backgroundColor: colors.primary } : undefined}
          >
            <Text
              className="text-center font-medium"
              style={{ color: mode === 'flip' ? colors.primaryForeground : colors.mutedForeground }}
            >
              Flip Analysis
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('rental')}
            className="flex-1 py-2.5 rounded-lg"
            style={mode === 'rental' ? { backgroundColor: colors.primary } : undefined}
          >
            <Text
              className="text-center font-medium"
              style={{ color: mode === 'rental' ? colors.primaryForeground : colors.mutedForeground }}
            >
              Rental Analysis
            </Text>
          </TouchableOpacity>
        </View>

        {/* Flip Analysis Mode */}
        {mode === 'flip' && (
          <>
            {/* Summary Card */}
            <View
              className="rounded-xl p-4"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
            >
              <View className="flex-row items-center mb-3">
                <TrendingUp size={18} color={colors.primary} />
                <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>
                  Deal Summary
                </Text>
              </View>

              <View className="flex-row flex-wrap gap-4">
                {/* Net Profit */}
                <View
                  className="flex-1 min-w-[45%] rounded-lg p-3"
                  style={{ backgroundColor: colors.muted }}
                >
                  <Text className="text-xs uppercase" style={{ color: colors.mutedForeground }}>
                    Net Profit
                  </Text>
                  <Text
                    className="text-xl font-bold"
                    style={{ color: metrics.netProfit >= 0 ? colors.success : colors.destructive }}
                  >
                    {formatCurrency(metrics.netProfit)}
                  </Text>
                </View>

                {/* ROI */}
                <View
                  className="flex-1 min-w-[45%] rounded-lg p-3"
                  style={{ backgroundColor: colors.muted }}
                >
                  <Text className="text-xs uppercase" style={{ color: colors.mutedForeground }}>
                    ROI
                  </Text>
                  <Text
                    className="text-xl font-bold"
                    style={{ color: metrics.roi >= 0 ? colors.success : colors.destructive }}
                  >
                    {formatPercentage(metrics.roi)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Purchase Analysis */}
            <View
              className="rounded-xl p-4"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
            >
              <View className="flex-row items-center mb-3">
                <DollarSign size={18} color={colors.primary} />
                <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>
                  Purchase Analysis
                </Text>
              </View>

              <View className="gap-3">
                <View className="flex-row justify-between">
                  <Text style={{ color: colors.mutedForeground }}>Purchase Price</Text>
                  <Text className="font-medium" style={{ color: colors.foreground }}>
                    {metrics.purchasePrice > 0 ? formatCurrency(metrics.purchasePrice) : 'Not set'}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text style={{ color: colors.mutedForeground }}>Repair Costs</Text>
                  <Text className="font-medium" style={{ color: colors.foreground }}>
                    {metrics.repairCost > 0 ? formatCurrency(metrics.repairCost) : 'Not set'}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text style={{ color: colors.mutedForeground }}>Closing Costs (est.)</Text>
                  <Text className="font-medium" style={{ color: colors.foreground }}>
                    {formatCurrency(metrics.closingCosts)}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text style={{ color: colors.mutedForeground }}>Holding Costs (est.)</Text>
                  <Text className="font-medium" style={{ color: colors.foreground }}>
                    {formatCurrency(metrics.holdingCosts)}
                  </Text>
                </View>
                <View className="h-px my-1" style={{ backgroundColor: colors.border }} />
                <View className="flex-row justify-between">
                  <Text className="font-semibold" style={{ color: colors.foreground }}>
                    Total Investment
                  </Text>
                  <Text className="font-bold" style={{ color: colors.foreground }}>
                    {formatCurrency(metrics.totalInvestment)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Profit Analysis */}
            <View
              className="rounded-xl p-4"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
            >
              <View className="flex-row items-center mb-3">
                <Percent size={18} color={colors.primary} />
                <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>
                  Profit Analysis
                </Text>
              </View>

              <View className="gap-3">
                <View className="flex-row justify-between">
                  <Text style={{ color: colors.mutedForeground }}>ARV (After Repair Value)</Text>
                  <Text className="font-medium" style={{ color: colors.foreground }}>
                    {metrics.arv > 0 ? formatCurrency(metrics.arv) : 'Not set'}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text style={{ color: colors.mutedForeground }}>Total Investment</Text>
                  <Text className="font-medium" style={{ color: colors.foreground }}>
                    {formatCurrency(metrics.totalInvestment)}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text style={{ color: colors.mutedForeground }}>Selling Costs (8% est.)</Text>
                  <Text className="font-medium" style={{ color: colors.foreground }}>
                    {formatCurrency(metrics.arv * 0.08)}
                  </Text>
                </View>
                <View className="h-px my-1" style={{ backgroundColor: colors.border }} />
                <View className="flex-row justify-between">
                  <Text style={{ color: colors.mutedForeground }}>Gross Profit</Text>
                  <Text
                    className="font-medium"
                    style={{ color: metrics.grossProfit >= 0 ? colors.success : colors.destructive }}
                  >
                    {formatCurrency(metrics.grossProfit)}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="font-semibold" style={{ color: colors.foreground }}>
                    Net Profit
                  </Text>
                  <Text
                    className="font-bold"
                    style={{ color: metrics.netProfit >= 0 ? colors.success : colors.destructive }}
                  >
                    {formatCurrency(metrics.netProfit)}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="font-semibold" style={{ color: colors.foreground }}>
                    Return on Investment
                  </Text>
                  <Text
                    className="font-bold"
                    style={{ color: metrics.roi >= 0 ? colors.success : colors.destructive }}
                  >
                    {formatPercentage(metrics.roi)}
                  </Text>
                </View>
              </View>
            </View>

            {/* MAO (Maximum Allowable Offer) */}
            {metrics.arv > 0 && (
              <View
                className="rounded-xl p-4"
                style={{
                  backgroundColor: `${colors.primary}15`,
                  borderWidth: 1,
                  borderColor: `${colors.primary}30`,
                }}
              >
                <Text className="text-sm font-medium mb-1" style={{ color: colors.primary }}>
                  Maximum Allowable Offer (70% Rule)
                </Text>
                <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                  {formatCurrency(metrics.mao)}
                </Text>
                <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
                  (ARV × 70%) - Repair Costs = {formatCurrency(metrics.arv * 0.7)} -{' '}
                  {formatCurrency(metrics.repairCost)}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Rental Analysis Mode */}
        {mode === 'rental' && <CashFlowAnalysis property={property} />}
      </View>
    </ScrollView>
  );
}
