// src/features/real-estate/components/PropertyAnalysisTab.tsx
// Deal analysis tab content for property detail

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { TrendingUp, DollarSign, Percent, Calculator, Home, ChevronRight } from 'lucide-react-native';
import { Property } from '../types';
import { useDealAnalysis } from '../hooks/useDealAnalysis';
import { CashFlowAnalysis } from './CashFlowAnalysis';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface PropertyAnalysisTabProps {
  property: Property;
}

type AnalysisMode = 'flip' | 'rental';

export function PropertyAnalysisTab({ property }: PropertyAnalysisTabProps) {
  const [mode, setMode] = useState<AnalysisMode>('flip');
  const metrics = useDealAnalysis(property);

  // Check if we have enough data to show analysis
  const hasData = metrics.purchasePrice > 0 || metrics.arv > 0;

  if (!hasData) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <Calculator size={48} className="text-muted-foreground mb-4" />
        <Text className="text-lg font-semibold text-foreground mb-2">No Analysis Data</Text>
        <Text className="text-muted-foreground text-center px-8">
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
        <View className="flex-row bg-muted rounded-xl p-1">
          <TouchableOpacity
            onPress={() => setMode('flip')}
            className={`flex-1 py-2.5 rounded-lg ${mode === 'flip' ? 'bg-primary' : ''}`}
          >
            <Text className={`text-center font-medium ${mode === 'flip' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
              Flip Analysis
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('rental')}
            className={`flex-1 py-2.5 rounded-lg ${mode === 'rental' ? 'bg-primary' : ''}`}
          >
            <Text className={`text-center font-medium ${mode === 'rental' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
              Rental Analysis
            </Text>
          </TouchableOpacity>
        </View>

        {/* Flip Analysis Mode */}
        {mode === 'flip' && (
          <>
            {/* Summary Card */}
            <View className="bg-card rounded-xl p-4 border border-border">
              <View className="flex-row items-center mb-3">
                <TrendingUp size={18} className="text-primary" />
                <Text className="text-lg font-semibold text-foreground ml-2">Deal Summary</Text>
              </View>

              <View className="flex-row flex-wrap gap-4">
                {/* Net Profit */}
                <View className="flex-1 min-w-[45%] bg-muted rounded-lg p-3">
                  <Text className="text-xs text-muted-foreground uppercase">Net Profit</Text>
                  <Text className={`text-xl font-bold ${metrics.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(metrics.netProfit)}
                  </Text>
                </View>

                {/* ROI */}
                <View className="flex-1 min-w-[45%] bg-muted rounded-lg p-3">
                  <Text className="text-xs text-muted-foreground uppercase">ROI</Text>
                  <Text className={`text-xl font-bold ${metrics.roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatPercentage(metrics.roi)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Purchase Analysis */}
            <View className="bg-card rounded-xl p-4 border border-border">
              <View className="flex-row items-center mb-3">
                <DollarSign size={18} className="text-primary" />
                <Text className="text-lg font-semibold text-foreground ml-2">Purchase Analysis</Text>
              </View>

              <View className="gap-3">
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Purchase Price</Text>
                  <Text className="text-foreground font-medium">
                    {metrics.purchasePrice > 0 ? formatCurrency(metrics.purchasePrice) : 'Not set'}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Repair Costs</Text>
                  <Text className="text-foreground font-medium">
                    {metrics.repairCost > 0 ? formatCurrency(metrics.repairCost) : 'Not set'}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Closing Costs (est.)</Text>
                  <Text className="text-foreground font-medium">
                    {formatCurrency(metrics.closingCosts)}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Holding Costs (est.)</Text>
                  <Text className="text-foreground font-medium">
                    {formatCurrency(metrics.holdingCosts)}
                  </Text>
                </View>
                <View className="h-px bg-border my-1" />
                <View className="flex-row justify-between">
                  <Text className="text-foreground font-semibold">Total Investment</Text>
                  <Text className="text-foreground font-bold">
                    {formatCurrency(metrics.totalInvestment)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Profit Analysis */}
            <View className="bg-card rounded-xl p-4 border border-border">
              <View className="flex-row items-center mb-3">
                <Percent size={18} className="text-primary" />
                <Text className="text-lg font-semibold text-foreground ml-2">Profit Analysis</Text>
              </View>

              <View className="gap-3">
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">ARV (After Repair Value)</Text>
                  <Text className="text-foreground font-medium">
                    {metrics.arv > 0 ? formatCurrency(metrics.arv) : 'Not set'}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Total Investment</Text>
                  <Text className="text-foreground font-medium">
                    {formatCurrency(metrics.totalInvestment)}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Selling Costs (8% est.)</Text>
                  <Text className="text-foreground font-medium">
                    {formatCurrency(metrics.arv * 0.08)}
                  </Text>
                </View>
                <View className="h-px bg-border my-1" />
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Gross Profit</Text>
                  <Text className={`font-medium ${metrics.grossProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(metrics.grossProfit)}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-foreground font-semibold">Net Profit</Text>
                  <Text className={`font-bold ${metrics.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(metrics.netProfit)}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-foreground font-semibold">Return on Investment</Text>
                  <Text className={`font-bold ${metrics.roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatPercentage(metrics.roi)}
                  </Text>
                </View>
              </View>
            </View>

            {/* MAO (Maximum Allowable Offer) */}
            {metrics.arv > 0 && (
              <View className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                <Text className="text-sm text-primary font-medium mb-1">
                  Maximum Allowable Offer (70% Rule)
                </Text>
                <Text className="text-2xl font-bold text-primary">
                  {formatCurrency(metrics.mao)}
                </Text>
                <Text className="text-xs text-muted-foreground mt-1">
                  (ARV × 70%) - Repair Costs = {formatCurrency(metrics.arv * 0.7)} - {formatCurrency(metrics.repairCost)}
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
