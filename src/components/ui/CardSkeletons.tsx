/**
 * Card Skeleton Components
 *
 * Pre-styled skeleton placeholders for common card types.
 * Use these while loading data to provide visual continuity.
 *
 * @example
 * import { PropertyCardSkeleton, DealCardSkeleton } from '@/components/ui/CardSkeletons';
 *
 * // In a list
 * {isLoading ? (
 *   <>
 *     <PropertyCardSkeleton />
 *     <PropertyCardSkeleton />
 *     <PropertyCardSkeleton />
 *   </>
 * ) : (
 *   properties.map(p => <PropertyCard key={p.id} property={p} />)
 * )}
 */

import React from 'react';
import { View, ViewProps } from 'react-native';
import { Skeleton } from './Skeleton';
import { useThemeColors } from '@/context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';

interface CardSkeletonProps extends ViewProps {
  /** Compact mode for grid layouts */
  compact?: boolean;
}

/**
 * Skeleton for PropertyCard
 * Matches the layout: image, price/badge, address, location, stats
 */
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

/**
 * Skeleton for DealCard
 * Matches the layout: header with deal name/status, metrics, property reference
 */
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

/**
 * Skeleton for LeadCard
 * Matches the layout: contact info, status, last contact
 */
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
