// src/features/pipeline/screens/pipeline/DealCard.tsx
// Deal card component for pipeline list

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import type { Deal } from '@/features/deals/types';
import { DEAL_STAGE_CONFIG, getDealAddress, getDealLeadName } from '@/features/deals/types';
import { useNextAction } from '@/features/deals/hooks/useNextAction';
import { useDealAnalysis } from '@/features/real-estate/hooks/useDealAnalysis';
import type { Property } from '@/features/real-estate/types';

export interface DealCardProps {
  deal: Deal;
  onPress: () => void;
}

function formatCurrency(value: number | null | undefined): string {
  if (!value) return '-';
  return `$${value.toLocaleString()}`;
}

export function DealCard({ deal, onPress }: DealCardProps) {
  const colors = useThemeColors();
  const nextAction = useNextAction(deal);
  const stageConfig = DEAL_STAGE_CONFIG[deal.stage] || { label: deal.stage || 'Unknown', color: 'bg-gray-500', order: 0 };

  const propertyForAnalysis: Partial<Property> = {
    id: deal.property?.id || '',
    address: deal.property?.address || '',
    purchase_price: deal.property?.purchase_price || 0,
    repair_cost: deal.property?.repair_cost || 0,
    arv: deal.property?.arv || 0,
  };

  const analysis = useDealAnalysis(propertyForAnalysis as Property);
  const mao = analysis.mao > 0 ? analysis.mao : null;

  return (
    <TouchableOpacity
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
      }}
      onPress={onPress}
      accessibilityLabel={`${getDealLeadName(deal)} deal at ${getDealAddress(deal)}`}
      accessibilityRole="button"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: BORDER_RADIUS.full,
              backgroundColor: withOpacity(colors.primary, 'light'),
              marginRight: SPACING.sm,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>
              {stageConfig.label}
            </Text>
          </View>
          <Text
            style={{ fontSize: 15, fontWeight: '600', color: colors.foreground, flex: 1 }}
            numberOfLines={1}
          >
            {getDealLeadName(deal)}
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 13, color: colors.mutedForeground, marginBottom: SPACING.xs }} numberOfLines={1}>
        {getDealAddress(deal)}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
        <Text style={{ fontSize: 13, color: colors.foreground }}>
          MAO: <Text style={{ fontWeight: '600', color: colors.success }}>{formatCurrency(mao)}</Text>
        </Text>
        {deal.strategy && (
          <View style={{ backgroundColor: colors.muted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm }}>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, textTransform: 'capitalize' }}>
              {deal.strategy.replace('_', ' ')}
            </Text>
          </View>
        )}
      </View>

      {nextAction && (
        <View
          style={{
            marginTop: SPACING.sm,
            padding: SPACING.sm,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: withOpacity(colors.primary, 'muted'),
          }}
        >
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Next Action</Text>
          <Text style={{ fontSize: 13, color: colors.foreground }} numberOfLines={1}>
            {nextAction.action}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
