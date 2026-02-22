// src/features/deals/screens/cockpit/DealClosedBanner.tsx
// Banner shown when a deal is in a closed state (won or lost)

import React from 'react';
import { View, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import { ICON_SIZES } from '@/constants/design-tokens';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { formatDate } from '@/lib/formatters';
import type { Deal } from '../../types';

interface DealClosedBannerProps {
  deal: Deal;
}

export function DealClosedBanner({ deal }: DealClosedBannerProps) {
  const colors = useThemeColors();

  return (
    <View
      className="mx-4 mb-4 rounded-xl p-4 flex-row items-center"
      style={{
        backgroundColor:
          deal.stage === 'closed_won'
            ? withOpacity(colors.success, 'light')
            : colors.muted,
      }}
    >
      <Check
        size={ICON_SIZES.xl}
        color={
          deal.stage === 'closed_won' ? colors.success : colors.mutedForeground
        }
      />
      <View className="ml-3">
        <Text
          className="font-semibold"
          style={{
            color:
              deal.stage === 'closed_won'
                ? colors.success
                : colors.mutedForeground,
          }}
        >
          {deal.stage === 'closed_won' ? 'Deal Closed - Won!' : 'Deal Closed'}
        </Text>
        <Text className="text-sm" style={{ color: colors.mutedForeground }}>
          {deal.updated_at
            ? `Closed on ${formatDate(deal.updated_at)}`
            : 'Deal has been finalized'}
        </Text>
      </View>
    </View>
  );
}
