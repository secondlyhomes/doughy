/**
 * Skeleton for LeadCard
 * Matches the layout: contact info, status, last contact
 */

import React from 'react';
import { View, ViewProps } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';

export function LeadCardSkeleton({ style, ...props }: ViewProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: BORDER_RADIUS.xl,
          borderWidth: 1,
          borderColor: colors.border,
          padding: SPACING.lg,
        },
        style,
      ]}
      accessibilityLabel="Loading lead"
      {...props}
    >
      {/* Header row with avatar */}
      <View className="flex-row items-center mb-3">
        {/* Avatar */}
        <Skeleton className="w-12 h-12 rounded-full mr-3" />

        <View className="flex-1">
          {/* Name */}
          <Skeleton className="w-3/4 h-5 mb-1" />
          {/* Contact info */}
          <Skeleton className="w-1/2 h-4" />
        </View>

        {/* Status badge */}
        <Skeleton className="w-16 h-6 rounded-full" />
      </View>

      {/* Property interest */}
      <Skeleton className="w-full h-4 mb-2" />

      {/* Last contact */}
      <View className="flex-row items-center">
        <Skeleton className="w-3 h-3 mr-1 rounded-full" />
        <Skeleton className="w-1/3 h-3" />
      </View>
    </View>
  );
}
