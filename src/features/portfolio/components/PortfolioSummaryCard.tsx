// src/features/portfolio/components/PortfolioSummaryCard.tsx
// Summary card showing portfolio totals

import React from 'react';
import { View, Text } from 'react-native';
import { TrendingUp, DollarSign, Home, Wallet } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import type { PortfolioSummary } from '../types';

interface PortfolioSummaryCardProps {
  summary: PortfolioSummary;
}

export function PortfolioSummaryCard({ summary }: PortfolioSummaryCardProps) {
  const colors = useThemeColors();

  const formatCurrency = (value: number, compact = false) => {
    if (compact && value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (compact && value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  return (
    <View
      className="rounded-2xl p-5"
      style={{ backgroundColor: colors.primary }}
    >
      {/* Main Value */}
      <View className="mb-4">
        <Text className="text-sm opacity-80" style={{ color: colors.primaryForeground }}>
          Total Portfolio Value
        </Text>
        <Text className="text-3xl font-bold" style={{ color: colors.primaryForeground }}>
          {formatCurrency(summary.totalValue)}
        </Text>
      </View>

      {/* Metrics Grid */}
      <View className="flex-row gap-3">
        {/* Properties */}
        <View
          className="flex-1 rounded-xl p-3"
          style={{ backgroundColor: withOpacity(colors.primaryForeground, 'light') }}
        >
          <View className="flex-row items-center mb-1">
            <Home size={14} color={colors.primaryForeground} />
            <Text className="text-xs ml-1 opacity-80" style={{ color: colors.primaryForeground }}>
              Properties
            </Text>
          </View>
          <Text className="text-xl font-bold" style={{ color: colors.primaryForeground }}>
            {summary.totalProperties}
          </Text>
        </View>

        {/* Equity */}
        <View
          className="flex-1 rounded-xl p-3"
          style={{ backgroundColor: withOpacity(colors.primaryForeground, 'light') }}
        >
          <View className="flex-row items-center mb-1">
            <TrendingUp size={14} color={colors.primaryForeground} />
            <Text className="text-xs ml-1 opacity-80" style={{ color: colors.primaryForeground }}>
              Equity
            </Text>
          </View>
          <Text className="text-xl font-bold" style={{ color: colors.primaryForeground }}>
            {formatCurrency(summary.totalEquity, true)}
          </Text>
        </View>

        {/* Monthly Cash Flow */}
        <View
          className="flex-1 rounded-xl p-3"
          style={{ backgroundColor: withOpacity(colors.primaryForeground, 'light') }}
        >
          <View className="flex-row items-center mb-1">
            <Wallet size={14} color={colors.primaryForeground} />
            <Text className="text-xs ml-1 opacity-80" style={{ color: colors.primaryForeground }}>
              Cash Flow
            </Text>
          </View>
          <Text className="text-xl font-bold" style={{ color: colors.primaryForeground }}>
            {formatCurrency(summary.monthlyCashFlow)}/mo
          </Text>
        </View>
      </View>
    </View>
  );
}
