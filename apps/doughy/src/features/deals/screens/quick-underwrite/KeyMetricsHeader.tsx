// src/features/deals/screens/quick-underwrite/KeyMetricsHeader.tsx
// Big 3 numbers header for quick underwrite screen (MAO, Profit, Risk)

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { DollarSign, TrendingUp, Shield, Info } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { getShadowStyle } from '@/lib/design-utils';
import { Deal, getDealRiskScore } from '../../types';
import { DealMetrics, DEFAULT_FLIP_CONSTANTS } from '../../../real-estate/hooks/useDealAnalysis';
import { formatCurrencyShort } from './utils';

interface KeyMetricsHeaderProps {
  deal: Deal;
  metrics: DealMetrics;
  onEvidencePress: (field: string) => void;
}

export function KeyMetricsHeader({ deal, metrics, onEvidencePress }: KeyMetricsHeaderProps) {
  const colors = useThemeColors();
  const riskScore = getDealRiskScore(deal);

  // Get the ARV percentage used in MAO calculation (default 70%)
  const arvPercentage = Math.round(DEFAULT_FLIP_CONSTANTS.maoRulePct * 100);

  // Determine which profit metric to show based on strategy
  const showCashFlow = deal.strategy === 'seller_finance' || deal.strategy === 'subject_to';
  const profitValue = showCashFlow ? metrics.monthlyCashFlow : metrics.netProfit;
  const profitLabel = showCashFlow ? 'Monthly CF' : 'Net Profit';

  return (
    <View
      className="mx-4 mb-4 rounded-2xl p-4"
      style={{
        backgroundColor: colors.card,
        ...getShadowStyle(colors, { size: 'md' }),
      }}
    >
      {/* Big 3 Numbers Row */}
      <View className="flex-row items-stretch">
        {/* MAO */}
        <TouchableOpacity
          className="flex-1 items-center py-2"
          onPress={() => onEvidencePress('mao')}
          accessibilityLabel={`Maximum Allowable Offer: ${formatCurrencyShort(metrics.mao)}. Tap for details.`}
        >
          <View className="flex-row items-center mb-1">
            <DollarSign size={16} color={colors.success} />
            <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>
              MAO
            </Text>
            <Info size={12} color={colors.mutedForeground} style={{ marginLeft: 4 }} />
          </View>
          <Text className="text-2xl font-bold" style={{ color: colors.foreground }}>
            {formatCurrencyShort(metrics.mao)}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
            {arvPercentage}% Rule
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View className="w-px mx-2" style={{ backgroundColor: colors.border }} />

        {/* Profit / Cash Flow */}
        <TouchableOpacity
          className="flex-1 items-center py-2"
          onPress={() => onEvidencePress('profit')}
          accessibilityLabel={`${profitLabel}: ${formatCurrencyShort(profitValue)}. Tap for details.`}
        >
          <View className="flex-row items-center mb-1">
            <TrendingUp size={16} color={colors.info} />
            <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>
              {profitLabel}
            </Text>
            <Info size={12} color={colors.mutedForeground} style={{ marginLeft: 4 }} />
          </View>
          <Text
            className="text-2xl font-bold"
            style={{ color: profitValue >= 0 ? colors.success : colors.destructive }}
          >
            {formatCurrencyShort(profitValue)}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
            {showCashFlow ? 'per month' : 'after costs'}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View className="w-px mx-2" style={{ backgroundColor: colors.border }} />

        {/* Risk Score */}
        <TouchableOpacity
          className="flex-1 items-center py-2"
          onPress={() => onEvidencePress('risk')}
          accessibilityLabel={`Risk Score: ${riskScore !== undefined ? `${riskScore} out of 5` : 'Not calculated'}. Tap for details.`}
        >
          <View className="flex-row items-center mb-1">
            <Shield size={16} color={colors.warning} />
            <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>
              Risk
            </Text>
            <Info size={12} color={colors.mutedForeground} style={{ marginLeft: 4 }} />
          </View>
          <Text
            className="text-2xl font-bold"
            style={{
              color:
                riskScore !== undefined
                  ? riskScore <= 2
                    ? colors.success
                    : riskScore <= 3
                      ? colors.warning
                      : colors.destructive
                  : colors.mutedForeground,
            }}
          >
            {riskScore !== undefined ? `${riskScore}/5` : '-'}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
            {riskScore !== undefined
              ? riskScore <= 2
                ? 'Low Risk'
                : riskScore <= 3
                  ? 'Medium'
                  : 'High Risk'
              : 'Not set'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
