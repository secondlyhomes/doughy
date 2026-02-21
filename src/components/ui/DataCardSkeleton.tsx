/**
 * Generic data card and list item skeletons
 *
 * - DataCardSkeleton: Flexible layout for metrics/stats cards
 * - ListItemSkeleton: Simple row with icon, text, and optional action
 * - SkeletonList: Renders multiple skeletons of a given type
 */

import React from 'react';
import { View, ViewProps } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';

/**
 * Skeleton for generic data cards (metrics, stats)
 * Flexible layout for various card types
 */
export function DataCardSkeleton({
  style,
  rows = 3,
  ...props
}: ViewProps & { rows?: number }) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: BORDER_RADIUS.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: SPACING.lg,
        },
        style,
      ]}
      accessibilityLabel="Loading data"
      {...props}
    >
      {/* Title */}
      <Skeleton className="w-1/2 h-5 mb-4" />

      {/* Data rows */}
      {Array.from({ length: rows }).map((_, index) => (
        <View
          key={index}
          className="flex-row justify-between items-center"
          style={{ marginBottom: index < rows - 1 ? SPACING.md : 0 }}
        >
          <Skeleton className="w-1/3 h-4" />
          <Skeleton className="w-1/4 h-4" />
        </View>
      ))}
    </View>
  );
}

/**
 * Skeleton for list item rows
 * Simple row with icon, text, and optional action
 */
export function ListItemSkeleton({ style, ...props }: ViewProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          paddingVertical: SPACING.md,
          paddingHorizontal: SPACING.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
        },
        style,
      ]}
      accessibilityLabel="Loading item"
      {...props}
    >
      {/* Icon */}
      <Skeleton className="w-10 h-10 rounded-lg mr-3" />

      {/* Content */}
      <View className="flex-1">
        <Skeleton className="w-3/4 h-4 mb-1" />
        <Skeleton className="w-1/2 h-3" />
      </View>

      {/* Action arrow */}
      <Skeleton className="w-5 h-5 rounded-full" />
    </View>
  );
}

/**
 * Renders multiple skeletons of a given type
 */
export function SkeletonList({
  count = 3,
  component: Component,
  gap = SPACING.md,
  ...props
}: {
  count?: number;
  component: React.ComponentType<ViewProps>;
  gap?: number;
} & ViewProps) {
  return (
    <View style={{ gap }} {...props}>
      {Array.from({ length: count }).map((_, index) => (
        <Component key={index} />
      ))}
    </View>
  );
}
