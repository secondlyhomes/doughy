/**
 * Skeleton for PropertyCard
 * Matches the layout: image, price/badge, address, location, stats
 */

import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import { CardSkeletonProps } from '@/components/ui/card-skeleton-types';

export function PropertyCardSkeleton({ compact = false, style, ...props }: CardSkeletonProps) {
  const colors = useThemeColors();

  if (compact) {
    return (
      <View
        style={[
          {
            backgroundColor: colors.card,
            borderRadius: BORDER_RADIUS.xl,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
          },
          style,
        ]}
        accessibilityLabel="Loading property"
        {...props}
      >
        {/* Image placeholder */}
        <Skeleton className="w-full h-32" style={{ borderRadius: 0 }} />

        {/* Text content */}
        <View style={{ padding: SPACING.md }}>
          {/* Title */}
          <Skeleton className="w-3/4 h-4 mb-1" />
          {/* Location */}
          <Skeleton className="w-1/2 h-3 mb-2" />
          {/* Price */}
          <Skeleton className="w-1/3 h-4" />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: BORDER_RADIUS.xl,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        },
        style,
      ]}
      accessibilityLabel="Loading property"
      {...props}
    >
      {/* Image placeholder */}
      <Skeleton className="w-full h-48" style={{ borderRadius: 0 }} />

      {/* Content */}
      <View style={{ padding: SPACING.lg }}>
        {/* Price and badge row */}
        <View className="flex-row justify-between items-start mb-2">
          <Skeleton className="w-1/3 h-6" />
          <Skeleton className="w-16 h-6 rounded-md" />
        </View>

        {/* Address */}
        <Skeleton className="w-4/5 h-5 mb-1" />

        {/* Location */}
        <View className="flex-row items-center mb-3">
          <Skeleton className="w-3 h-3 mr-1 rounded-full" />
          <Skeleton className="w-2/3 h-4" />
        </View>

        {/* Stats row */}
        <View className="flex-row gap-4">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-20 h-4" />
        </View>
      </View>
    </View>
  );
}
