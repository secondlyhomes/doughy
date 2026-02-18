// src/features/deals/screens/deals-list/DealCard.tsx
// Memoized DealCard component for deals list

import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, Calendar, DollarSign, ChevronRight } from 'lucide-react-native';

import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

import {
  Deal,
  DEAL_STAGE_CONFIG,
  getDealAddress,
  getDealLeadName,
  getDealRiskScore,
} from '../../types';
import { useNextAction } from '../../hooks/useNextAction';
import { useDealAnalysis } from '../../../real-estate/hooks/useDealAnalysis';
import type { Property } from '../../../real-estate/types';

import { formatCurrency, formatRelativeDate } from './utils';

export interface DealCardProps {
  deal: Deal;
  onPress: () => void;
}

export const DealCard = memo(function DealCard({ deal, onPress }: DealCardProps) {
  const colors = useThemeColors();
  const nextAction = useNextAction(deal);
  // Handle unknown stages from database
  const stageConfig = DEAL_STAGE_CONFIG[deal.stage] || { label: deal.stage || 'Unknown', color: 'bg-gray-500', order: 0 };
  const riskScore = getDealRiskScore(deal);

  // Get risk color based on score
  const getRiskColorValue = (score: number | undefined) => {
    if (score === undefined) return colors.mutedForeground;
    if (score <= 2) return colors.success;
    if (score <= 3) return colors.warning;
    return colors.destructive;
  };

  // Create a minimal Property object for analysis
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

  // Use the centralized analysis hook for MAO calculation
  const analysis = useDealAnalysis(propertyForAnalysis as Property);
  const mao = analysis.mao > 0 ? analysis.mao : null;

  return (
    <TouchableOpacity
      className="rounded-xl p-4"
      style={{ backgroundColor: colors.card }}
      onPress={onPress}
      accessibilityLabel={`${getDealLeadName(deal)} deal at ${getDealAddress(deal)}, stage ${stageConfig.label}`}
      accessibilityRole="button"
    >
      {/* Header: Stage Badge + Lead Name */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <View
            className="px-2 py-1 rounded-full mr-2"
            style={{ backgroundColor: withOpacity(colors.primary, 'light') }}
          >
            <Text className="text-xs font-medium" style={{ color: colors.primary }}>
              {stageConfig.label}
            </Text>
          </View>
          <Text className="text-base font-semibold flex-1 flex-shrink" style={{ color: colors.foreground }} numberOfLines={1}>
            {getDealLeadName(deal)}
          </Text>
        </View>
        <ChevronRight size={20} color={colors.mutedForeground} />
      </View>

      {/* Address */}
      <View className="flex-row items-center mb-3">
        <MapPin size={14} color={colors.mutedForeground} />
        <Text className="text-sm ml-1" style={{ color: colors.mutedForeground }} numberOfLines={1}>
          {getDealAddress(deal)}
        </Text>
      </View>

      {/* Metrics Row: MAO | Profit | Risk */}
      <View className="flex-row items-center gap-4 mb-3">
        <View className="flex-row items-center">
          <DollarSign size={14} color={colors.success} />
          <Text className="text-sm font-medium ml-1" style={{ color: colors.foreground }}>
            MAO: {formatCurrency(mao)}
          </Text>
        </View>
        {riskScore !== undefined && (
          <View className="flex-row items-center">
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>Risk: </Text>
            <Text className="text-sm font-medium" style={{ color: getRiskColorValue(riskScore) }}>
              {riskScore}/5
            </Text>
          </View>
        )}
        {deal.strategy && (
          <View className="px-2 py-0.5 rounded" style={{ backgroundColor: colors.muted }}>
            <Text className="text-xs capitalize" style={{ color: colors.mutedForeground }}>
              {deal.strategy.replace('_', ' ')}
            </Text>
          </View>
        )}
      </View>

      {/* Next Action */}
      {nextAction && (
        <View
          className="rounded-lg p-2 flex-row items-center"
          style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}
        >
          <View
            className="w-6 h-6 rounded-full items-center justify-center mr-2"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-xs font-bold" style={{ color: colors.primaryForeground }}>!</Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>Next Action</Text>
            <Text className="text-sm" style={{ color: colors.foreground }} numberOfLines={1}>
              {nextAction.action}
            </Text>
          </View>
          {nextAction.isOverdue && (
            <View className="px-2 py-0.5 rounded" style={{ backgroundColor: colors.destructive }}>
              <Text className="text-xs font-medium" style={{ color: colors.destructiveForeground }}>Overdue</Text>
            </View>
          )}
        </View>
      )}

      {/* Footer: Updated date */}
      <View className="flex-row items-center justify-end mt-2">
        <Calendar size={12} color={colors.mutedForeground} />
        <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>
          {formatRelativeDate(deal.updated_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  // Note: onPress is included to prevent stale closure bugs when parent recreates callback
  return (
    prevProps.deal.id === nextProps.deal.id &&
    prevProps.deal.stage === nextProps.deal.stage &&
    prevProps.deal.updated_at === nextProps.deal.updated_at &&
    prevProps.deal.next_action === nextProps.deal.next_action &&
    prevProps.onPress === nextProps.onPress
  );
});
