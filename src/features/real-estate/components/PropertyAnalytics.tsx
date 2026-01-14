/**
 * PropertyAnalytics
 *
 * Mobile component for displaying property investment analytics and metrics.
 * Shows key financial indicators in a card-based layout.
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  PieChart,
  Home,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
}

function MetricCard({ label, value, icon, trend = 'neutral', subtitle }: MetricCardProps) {
  const colors = useThemeColors();

  const getTrendBackgroundColor = () => {
    switch (trend) {
      case 'positive': return `${colors.success}1A`; // 10% opacity
      case 'negative': return `${colors.destructive}1A`; // 10% opacity
      default: return colors.card;
    }
  };

  const getTrendBorderColor = () => {
    switch (trend) {
      case 'positive': return `${colors.success}4D`; // 30% opacity
      case 'negative': return `${colors.destructive}4D`; // 30% opacity
      default: return colors.border;
    }
  };

  const getTextColor = () => {
    switch (trend) {
      case 'positive': return colors.success;
      case 'negative': return colors.destructive;
      default: return colors.foreground;
    }
  };

  return (
    <View style={{ backgroundColor: getTrendBackgroundColor(), borderColor: getTrendBorderColor() }} className="p-4 rounded-xl border">
      <View className="flex-row items-center justify-between mb-2">
        <Text style={{ color: colors.mutedForeground }} className="text-sm font-medium">{label}</Text>
        {icon}
      </View>
      <Text style={{ color: getTextColor() }} className="text-xl font-bold">{value}</Text>
      {subtitle && (
        <Text style={{ color: colors.mutedForeground }} className="text-xs mt-1">{subtitle}</Text>
      )}
    </View>
  );
}

export interface PropertyAnalyticsProps {
  // Financial metrics
  purchasePrice?: number;
  arv?: number;
  monthlyRent?: number;
  monthlyExpenses?: number;
  monthlyCashFlow?: number;
  totalRepairCost?: number;

  // Investment metrics
  cashOnCashReturn?: number;
  capRate?: number;
  ltvRatio?: number;
  totalInvestment?: number;

  // Deal metrics
  profitPotential?: number;
  equityPosition?: number;
}

export function PropertyAnalytics({
  purchasePrice = 0,
  arv = 0,
  monthlyRent = 0,
  monthlyExpenses = 0,
  monthlyCashFlow,
  totalRepairCost = 0,
  cashOnCashReturn = 0,
  capRate = 0,
  ltvRatio = 0,
  totalInvestment = 0,
  profitPotential,
  equityPosition,
}: PropertyAnalyticsProps) {
  const colors = useThemeColors();
  // Calculate derived values if not provided
  const calculatedCashFlow = monthlyCashFlow ?? (monthlyRent - monthlyExpenses);
  const calculatedProfitPotential = profitPotential ?? (arv - purchasePrice - totalRepairCost);
  const calculatedEquity = equityPosition ?? (arv > 0 ? ((arv - purchasePrice) / arv) * 100 : 0);

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* Deal Overview Section */}
      <View className="mb-6">
        <Text style={{ color: colors.foreground }} className="text-lg font-bold mb-3">Deal Overview</Text>
        <View className="flex-row flex-wrap gap-3">
          <View className="flex-1 min-w-[45%]">
            <MetricCard
              label="Purchase Price"
              value={formatCurrency(purchasePrice)}
              icon={<Home size={18} color={colors.mutedForeground} />}
            />
          </View>
          <View className="flex-1 min-w-[45%]">
            <MetricCard
              label="ARV"
              value={formatCurrency(arv)}
              icon={<TrendingUp size={18} color={colors.mutedForeground} />}
            />
          </View>
          <View className="flex-1 min-w-[45%]">
            <MetricCard
              label="Repair Costs"
              value={formatCurrency(totalRepairCost)}
              icon={<DollarSign size={18} color={colors.mutedForeground} />}
              trend={totalRepairCost > 50000 ? 'negative' : 'neutral'}
            />
          </View>
          <View className="flex-1 min-w-[45%]">
            <MetricCard
              label="Profit Potential"
              value={formatCurrency(calculatedProfitPotential)}
              icon={
                calculatedProfitPotential >= 0 ? (
                  <TrendingUp size={18} color={colors.success} />
                ) : (
                  <TrendingDown size={18} color={colors.destructive} />
                )
              }
              trend={calculatedProfitPotential >= 0 ? 'positive' : 'negative'}
            />
          </View>
        </View>
      </View>

      {/* Cash Flow Section */}
      <View className="mb-6">
        <Text style={{ color: colors.foreground }} className="text-lg font-bold mb-3">Cash Flow Analysis</Text>
        <View className="flex-row flex-wrap gap-3">
          <View className="flex-1 min-w-[45%]">
            <MetricCard
              label="Monthly Rent"
              value={formatCurrency(monthlyRent)}
              icon={<DollarSign size={18} color={colors.success} />}
              trend="positive"
            />
          </View>
          <View className="flex-1 min-w-[45%]">
            <MetricCard
              label="Monthly Expenses"
              value={formatCurrency(monthlyExpenses)}
              icon={<DollarSign size={18} color={colors.destructive} />}
              trend="negative"
            />
          </View>
          <View className="w-full">
            <MetricCard
              label="Monthly Cash Flow"
              value={formatCurrency(calculatedCashFlow)}
              icon={
                calculatedCashFlow >= 0 ? (
                  <TrendingUp size={18} color={colors.success} />
                ) : (
                  <TrendingDown size={18} color={colors.destructive} />
                )
              }
              trend={calculatedCashFlow >= 0 ? 'positive' : 'negative'}
              subtitle={`${calculatedCashFlow >= 0 ? '+' : ''}${formatCurrency(calculatedCashFlow * 12)}/year`}
            />
          </View>
        </View>
      </View>

      {/* Investment Returns Section */}
      <View className="mb-6">
        <Text style={{ color: colors.foreground }} className="text-lg font-bold mb-3">Investment Returns</Text>
        <View className="flex-row flex-wrap gap-3">
          <View className="flex-1 min-w-[45%]">
            <MetricCard
              label="Cash on Cash"
              value={formatPercent(cashOnCashReturn)}
              icon={<Percent size={18} color={colors.mutedForeground} />}
              trend={cashOnCashReturn >= 8 ? 'positive' : cashOnCashReturn >= 5 ? 'neutral' : 'negative'}
              subtitle={cashOnCashReturn >= 8 ? 'Good' : cashOnCashReturn >= 5 ? 'Fair' : 'Below target'}
            />
          </View>
          <View className="flex-1 min-w-[45%]">
            <MetricCard
              label="Cap Rate"
              value={formatPercent(capRate)}
              icon={<PieChart size={18} color={colors.mutedForeground} />}
              trend={capRate >= 6 ? 'positive' : capRate >= 4 ? 'neutral' : 'negative'}
              subtitle={capRate >= 6 ? 'Good' : capRate >= 4 ? 'Fair' : 'Below target'}
            />
          </View>
          <View className="flex-1 min-w-[45%]">
            <MetricCard
              label="LTV Ratio"
              value={formatPercent(ltvRatio)}
              icon={<Percent size={18} color={colors.mutedForeground} />}
              trend={ltvRatio <= 75 ? 'positive' : ltvRatio <= 85 ? 'neutral' : 'negative'}
              subtitle={ltvRatio <= 75 ? 'Conservative' : ltvRatio <= 85 ? 'Moderate' : 'High leverage'}
            />
          </View>
          <View className="flex-1 min-w-[45%]">
            <MetricCard
              label="Equity Position"
              value={formatPercent(calculatedEquity)}
              icon={<TrendingUp size={18} color={colors.mutedForeground} />}
              trend={calculatedEquity >= 20 ? 'positive' : calculatedEquity >= 10 ? 'neutral' : 'negative'}
            />
          </View>
        </View>
      </View>

      {/* Total Investment */}
      {totalInvestment > 0 && (
        <View className="mb-6">
          <View style={{ backgroundColor: `${colors.primary}1A`, borderColor: `${colors.primary}33` }} className="rounded-xl p-4 border">
            <Text style={{ color: colors.primary }} className="text-sm font-medium mb-1">Total Investment Required</Text>
            <Text style={{ color: colors.primary }} className="text-2xl font-bold">{formatCurrency(totalInvestment)}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

export default PropertyAnalytics;
