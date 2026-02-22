// src/features/deals/screens/cockpit/DealMetrics.tsx
// Deal metrics display component with progressive disclosure

import React from 'react';
import { View } from 'react-native';
import { DollarSign, TrendingUp, Shield } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { MetricCard } from '@/components/deals';
import {
  useDealAnalysis,
  DEFAULT_FLIP_CONSTANTS,
} from '../../../real-estate/hooks/useDealAnalysis';
import type { Property } from '../../../real-estate/types';
import type { Deal } from '../../types';
import { getDealRiskScore } from '../../types';

interface DealMetricsProps {
  deal: Deal;
  onEvidencePress?: (field: 'mao' | 'profit' | 'risk') => void;
}

export function DealMetrics({ deal, onEvidencePress }: DealMetricsProps) {
  const colors = useThemeColors();

  // Create a properly typed Property object for analysis
  // This ensures type safety while handling missing property data
  const propertyForAnalysis: Partial<Property> = {
    id: deal.property?.id || '',
    address: deal.property?.address || '',
    city: deal.property?.city || '',
    state: deal.property?.state || '',
    zip: deal.property?.zip || '',
    propertyType: deal.property?.property_type || 'other',
    square_feet: deal.property?.square_feet || 0,
    bedrooms: deal.property?.bedrooms || 0,
    bathrooms: deal.property?.bathrooms || 0,
    purchase_price: deal.property?.purchase_price || 0,
    repair_cost: deal.property?.repair_cost || 0,
    arv: deal.property?.arv || 0,
  };

  const analysis = useDealAnalysis(propertyForAnalysis as Property);
  const riskScore = getDealRiskScore(deal);

  // Determine which profit metric to show based on strategy
  const showCashFlow =
    deal.strategy === 'seller_finance' || deal.strategy === 'subject_to';
  const profitValue = showCashFlow
    ? analysis.monthlyCashFlow
    : analysis.netProfit;
  const profitLabel = showCashFlow ? 'Monthly CF' : 'Net Profit';

  const formatCurrency = (value: number) => {
    if (!value || value === 0) return '-';
    const prefix = value < 0 ? '-' : '';
    return `${prefix}$${Math.abs(value).toLocaleString()}`;
  };

  // Calculate confidence based on data completeness
  const getConfidence = (
    hasData: boolean,
    hasMultipleSources: boolean
  ): 'high' | 'medium' | 'low' => {
    if (hasData && hasMultipleSources) return 'high';
    if (hasData) return 'medium';
    return 'low';
  };

  const arvPercentage = Math.round(DEFAULT_FLIP_CONSTANTS.maoRulePct * 100);

  // Build MAO breakdown
  const maoBreakdown = {
    formula: `${arvPercentage}% ARV - Repairs - Costs`,
    items: [
      {
        label: `ARV × ${arvPercentage}%`,
        value: formatCurrency(
          (analysis.arv || 0) * DEFAULT_FLIP_CONSTANTS.maoRulePct
        ),
      },
      {
        label: 'Repairs',
        value: formatCurrency(analysis.repairCost || 0),
        isSubtraction: true,
      },
      {
        label: 'Closing costs',
        value: formatCurrency((analysis.arv || 0) * 0.03),
        isSubtraction: true,
      },
    ],
  };

  // Build profit breakdown
  const profitBreakdown = showCashFlow
    ? {
        formula: 'Rent - PITI - Expenses',
        items: [
          {
            label: 'Monthly rent',
            value: formatCurrency(analysis.monthlyRent || 0),
          },
          {
            label: 'PITI',
            value: formatCurrency((analysis.monthlyRent || 0) * 0.5),
            isSubtraction: true,
          },
        ],
      }
    : {
        formula: 'ARV - Purchase - Repairs - Costs',
        items: [
          { label: 'ARV', value: formatCurrency(analysis.arv || 0) },
          {
            label: 'Purchase price',
            value: formatCurrency(analysis.purchasePrice || 0),
            isSubtraction: true,
          },
          {
            label: 'Repairs',
            value: formatCurrency(analysis.repairCost || 0),
            isSubtraction: true,
          },
          {
            label: 'Holding + Closing',
            value: formatCurrency((analysis.arv || 0) * 0.08),
            isSubtraction: true,
          },
        ],
      };

  return (
    <View className="gap-3 mb-4">
      {/* MAO */}
      <MetricCard
        label="MAO"
        value={formatCurrency(analysis.mao)}
        icon={<DollarSign size={16} color={colors.success} />}
        confidence={getConfidence(!!analysis.arv, !!deal.property?.arv)}
        breakdown={maoBreakdown}
        actions={[
          {
            label: 'Override',
            onPress: () => onEvidencePress?.('mao'),
            variant: 'outline',
          },
          { label: 'View Comps', onPress: () => {}, variant: 'ghost' },
        ]}
        onEvidencePress={() => onEvidencePress?.('mao')}
      />

      {/* Profit / Cash Flow */}
      <MetricCard
        label={profitLabel}
        value={formatCurrency(profitValue)}
        icon={<TrendingUp size={16} color={colors.info} />}
        confidence={getConfidence(
          !!analysis.arv && !!analysis.repairCost,
          false
        )}
        breakdown={profitBreakdown}
        actions={[
          {
            label: 'Override',
            onPress: () => onEvidencePress?.('profit'),
            variant: 'outline',
          },
          { label: 'Scenarios', onPress: () => {}, variant: 'ghost' },
        ]}
        onEvidencePress={() => onEvidencePress?.('profit')}
      />

      {/* Risk Score */}
      <MetricCard
        label="Risk Score"
        value={riskScore !== undefined ? `${riskScore}/5` : '-'}
        icon={<Shield size={16} color={colors.warning} />}
        confidence={
          riskScore !== undefined
            ? riskScore <= 2
              ? 'high'
              : riskScore <= 3
                ? 'medium'
                : 'low'
            : 'low'
        }
        breakdown={{
          formula: 'Data + Market + Structure',
          items: [
            {
              label: 'Data completeness',
              value: deal.property?.arv ? 'Good' : 'Missing',
            },
            { label: 'Market conditions', value: 'Stable' },
            { label: 'Deal structure', value: deal.strategy || 'Not set' },
          ],
        }}
        onEvidencePress={() => onEvidencePress?.('risk')}
      />
    </View>
  );
}
