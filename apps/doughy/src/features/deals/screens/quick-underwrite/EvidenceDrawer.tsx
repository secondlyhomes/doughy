// src/features/deals/screens/quick-underwrite/EvidenceDrawer.tsx
// Expandable evidence drawer showing calculation details

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronUp } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Deal } from '../../types';
import { DealMetrics, DEFAULT_FLIP_CONSTANTS } from '../../../real-estate/hooks/useDealAnalysis';

interface EvidenceDrawerProps {
  field: string;
  deal: Deal;
  metrics: DealMetrics;
  isExpanded: boolean;
  onToggle: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  mao: 'Maximum Allowable Offer',
  profit: 'Profit Calculation',
  risk: 'Risk Score',
  arv: 'After Repair Value',
  repair_cost: 'Repair Cost',
};

export function EvidenceDrawer({
  field,
  deal,
  metrics,
  isExpanded,
  onToggle,
}: EvidenceDrawerProps) {
  const colors = useThemeColors();

  const arvPercentage = Math.round(DEFAULT_FLIP_CONSTANTS.maoRulePct * 100);
  const arvMultiplier = DEFAULT_FLIP_CONSTANTS.maoRulePct;
  const evidence = deal.evidence?.filter((e) => e.field_key === field) || [];

  const getFieldExplanation = (f: string) => {
    switch (f) {
      case 'mao':
        return `MAO = (ARV × ${arvPercentage}%) - Repairs\n= ($${(metrics.arv || 0).toLocaleString()} × ${arvMultiplier.toFixed(2)}) - $${(metrics.repairCost || 0).toLocaleString()}\n= $${(metrics.mao || 0).toLocaleString()}`;
      case 'profit':
        return `Net Profit = ARV - Total Investment - Selling Costs\nTotal Investment = Purchase + Repairs + Closing + Holding`;
      case 'risk':
        return `Risk is calculated based on:\n• Data completeness\n• Market conditions\n• Property condition\n• Deal structure`;
      default:
        return 'No additional details available.';
    }
  };

  if (!isExpanded) return null;

  return (
    <View
      className="mx-4 mb-4 rounded-xl p-4"
      style={{ backgroundColor: colors.muted }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-semibold" style={{ color: colors.foreground }}>
          {FIELD_LABELS[field] || field}
        </Text>
        <TouchableOpacity onPress={onToggle}>
          <ChevronUp size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <Text
        className="text-sm mb-3 font-mono"
        style={{ color: colors.mutedForeground }}
      >
        {getFieldExplanation(field)}
      </Text>

      {evidence.length > 0 && (
        <View
          className="pt-3 mt-2"
          style={{ borderTopWidth: 1, borderTopColor: colors.border }}
        >
          <Text
            className="text-xs uppercase mb-2"
            style={{ color: colors.mutedForeground }}
          >
            Evidence Trail
          </Text>
          {evidence.map((e) => (
            <View key={e.id} className="flex-row items-center mb-2">
              <View
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: colors.info }}
              />
              <Text className="text-sm flex-1" style={{ color: colors.foreground }}>
                {e.source}: {e.value || 'N/A'}
              </Text>
              {e.changed_at && (
                <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                  {new Date(e.changed_at).toLocaleDateString()}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
