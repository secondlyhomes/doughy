// src/features/real-estate/components/RelatedDealsCard.tsx
// Card showing deals related to a property

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight, Briefcase, Plus } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { DEAL_STAGE_CONFIG, DealStage } from '@/features/deals/types';
import type { PropertyDeal } from '@/features/deals/hooks/usePropertyDeals';

interface RelatedDealsCardProps {
  deals: PropertyDeal[];
  onDealPress: (dealId: string) => void;
  onCreateDeal?: () => void;
  /** Handler for "View all" button - if not provided, button won't show */
  onViewAll?: () => void;
  maxDeals?: number;
}

export function RelatedDealsCard({
  deals,
  onDealPress,
  onCreateDeal,
  onViewAll,
  maxDeals = 3,
}: RelatedDealsCardProps) {
  const colors = useThemeColors();

  const displayedDeals = deals.slice(0, maxDeals);
  const hasMore = deals.length > maxDeals;

  const getStageColor = (stage: DealStage) => {
    switch (stage) {
      case 'closed_won':
        return colors.success;
      case 'closed_lost':
        return colors.destructive;
      case 'under_contract':
      case 'negotiating':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View
      className="rounded-xl p-4"
      style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Briefcase size={18} color={colors.mutedForeground} />
          <Text className="text-base font-semibold ml-2" style={{ color: colors.foreground }}>
            Related Deals
          </Text>
          {deals.length > 0 && (
            <View
              className="px-2 py-0.5 rounded-full ml-2"
              style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}
            >
              <Text className="text-xs font-medium" style={{ color: colors.primary }}>
                {deals.length}
              </Text>
            </View>
          )}
        </View>
        {onCreateDeal && (
          <TouchableOpacity
            onPress={onCreateDeal}
            className="p-1"
            accessibilityLabel="Create new deal"
          >
            <Plus size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Empty State */}
      {deals.length === 0 && (
        <View className="py-4 items-center">
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>
            No deals for this property yet
          </Text>
          {onCreateDeal && (
            <TouchableOpacity
              onPress={onCreateDeal}
              className="mt-2 px-4 py-2 rounded-lg"
              style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}
            >
              <Text className="text-sm font-medium" style={{ color: colors.primary }}>
                Create Deal
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Deal List */}
      {displayedDeals.map((deal, index) => {
        // Handle unknown stages from database
        const stageConfig = DEAL_STAGE_CONFIG[deal.stage] || { label: deal.stage || 'Unknown', color: 'bg-gray-500', order: 0 };
        const stageColor = getStageColor(deal.stage);

        return (
          <TouchableOpacity
            key={deal.id}
            onPress={() => onDealPress(deal.id)}
            className="flex-row items-center py-3"
            style={{
              borderTopWidth: index > 0 ? 1 : 0,
              borderTopColor: colors.border,
            }}
            accessibilityLabel={`Deal with ${deal.lead?.name || 'Unknown'}, ${stageConfig.label}`}
          >
            {/* Stage Indicator */}
            <View
              className="w-2 h-2 rounded-full mr-3"
              style={{ backgroundColor: stageColor }}
            />

            {/* Deal Info */}
            <View className="flex-1">
              <Text className="font-medium" style={{ color: colors.foreground }}>
                {deal.lead?.name || 'Unknown Lead'}
              </Text>
              <View className="flex-row items-center mt-0.5">
                <Text className="text-xs" style={{ color: stageColor }}>
                  {stageConfig.label}
                </Text>
                {deal.created_at && (
                  <>
                    <Text className="text-xs mx-1" style={{ color: colors.mutedForeground }}>•</Text>
                    <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                      {formatDate(deal.created_at)}
                    </Text>
                  </>
                )}
              </View>
            </View>

            <ChevronRight size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        );
      })}

      {/* Show More - only render when onViewAll is provided */}
      {hasMore && onViewAll && (
        <TouchableOpacity
          onPress={onViewAll}
          className="pt-3 items-center"
          style={{ borderTopWidth: 1, borderTopColor: colors.border }}
          accessibilityLabel={`View all ${deals.length} deals`}
        >
          <Text className="text-sm font-medium" style={{ color: colors.primary }}>
            View all {deals.length} deals
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
