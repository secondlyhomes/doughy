/**
 * Skeleton for ConversationCard
 * Matches the layout: channel icon, contact name, property, status badges
 */

import React from 'react';
import { View, ViewProps } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';

export function ConversationCardSkeleton({ style, ...props }: ViewProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: BORDER_RADIUS.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: SPACING.md,
          flexDirection: 'row',
        },
        style,
      ]}
      accessibilityLabel="Loading conversation"
      {...props}
    >
      {/* Channel icon */}
      <Skeleton className="w-11 h-11 rounded-full mr-3" />

      {/* Content */}
      <View className="flex-1">
        {/* Name and time row */}
        <View className="flex-row justify-between items-center mb-2">
          <Skeleton className="w-1/2 h-5" />
          <Skeleton className="w-12 h-3" />
        </View>

        {/* Property info */}
        <Skeleton className="w-2/3 h-3 mb-2" />

        {/* Status badges */}
        <View className="flex-row gap-2">
          <Skeleton className="w-20 h-5 rounded-full" />
          <Skeleton className="w-12 h-5 rounded-full" />
        </View>
      </View>
    </View>
  );
}
