/**
 * Skeleton for DealCard
 * Matches the layout: header with deal name/status, metrics, property reference
 */

import React from 'react';
import { View, ViewProps } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';

export function DealCardSkeleton({ style, ...props }: ViewProps) {
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
      accessibilityLabel="Loading deal"
      {...props}
    >
      {/* Header row */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 mr-3">
          {/* Deal name */}
          <Skeleton className="w-3/4 h-5 mb-1" />
          {/* Property reference */}
          <Skeleton className="w-1/2 h-4" />
        </View>
        {/* Status badge */}
        <Skeleton className="w-20 h-6 rounded-full" />
      </View>

      {/* Metrics row */}
      <View className="flex-row gap-4 mb-3">
        <View className="flex-1">
          <Skeleton className="w-full h-4 mb-1" />
          <Skeleton className="w-2/3 h-6" />
        </View>
        <View className="flex-1">
          <Skeleton className="w-full h-4 mb-1" />
          <Skeleton className="w-2/3 h-6" />
        </View>
        <View className="flex-1">
          <Skeleton className="w-full h-4 mb-1" />
          <Skeleton className="w-2/3 h-6" />
        </View>
      </View>

      {/* Progress bar */}
      <Skeleton className="w-full h-2 rounded-full" />
    </View>
  );
}
