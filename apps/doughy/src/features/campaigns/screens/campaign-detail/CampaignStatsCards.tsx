// src/features/campaigns/screens/campaign-detail/CampaignStatsCards.tsx
// Stats cards showing campaign metrics

import React from 'react';
import { View, Text } from 'react-native';
import { Users, MessageSquare, Target } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';

interface CampaignStatsCardsProps {
  enrolledCount: number;
  respondedCount: number;
  convertedCount: number;
}

export function CampaignStatsCards({
  enrolledCount,
  respondedCount,
  convertedCount,
}: CampaignStatsCardsProps) {
  const colors = useThemeColors();

  const conversionRate =
    enrolledCount > 0 ? ((convertedCount / enrolledCount) * 100).toFixed(0) : 0;

  return (
    <View className="px-4 pb-4">
      <View className="flex-row gap-3">
        <View
          className="flex-1 rounded-xl p-4"
          style={{ backgroundColor: colors.card }}
        >
          <Users size={20} color={colors.primary} />
          <Text
            className="text-2xl font-bold mt-2"
            style={{ color: colors.foreground }}
          >
            {enrolledCount}
          </Text>
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>
            Enrolled
          </Text>
        </View>

        <View
          className="flex-1 rounded-xl p-4"
          style={{ backgroundColor: colors.card }}
        >
          <MessageSquare size={20} color={colors.success} />
          <Text
            className="text-2xl font-bold mt-2"
            style={{ color: colors.foreground }}
          >
            {respondedCount}
          </Text>
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>
            Responded
          </Text>
        </View>

        <View
          className="flex-1 rounded-xl p-4"
          style={{ backgroundColor: colors.card }}
        >
          <Target size={20} color={colors.info} />
          <Text
            className="text-2xl font-bold mt-2"
            style={{ color: colors.foreground }}
          >
            {conversionRate}%
          </Text>
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>
            Conversion
          </Text>
        </View>
      </View>
    </View>
  );
}
