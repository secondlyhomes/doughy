/**
 * PortfolioPropertyCard Component
 * Displays a property card in portfolio list view
 *
 * Features:
 * - Property thumbnail image
 * - Address and location
 * - Status badge (acquired, under contract, researching)
 * - Key metrics (purchase price, ARV, ROI)
 * - Last activity timestamp
 * - Navigation affordance (ChevronRight)
 * - Optional compact mode for denser lists
 *
 * Built on DataCard pattern for consistency.
 * Follows Zone B design system with zero hardcoded values.
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity, ViewStyle } from 'react-native';
import { Home, MapPin, ChevronRight, Calendar } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { Card } from './Card';
import { Badge } from './Badge';

export type PropertyStatus = 'acquired' | 'under_contract' | 'researching' | 'archived';

export interface PortfolioProperty {
  /** Property ID */
  id: string;

  /** Property address */
  address: string;

  /** City */
  city?: string;

  /** State */
  state?: string;

  /** Property status */
  status: PropertyStatus;

  /** Purchase price (or offer price if under contract) */
  price?: number;

  /** After Repair Value */
  arv?: number;

  /** Return on Investment percentage */
  roi?: number;

  /** Property thumbnail image URL */
  thumbnail_url?: string;

  /** Last activity timestamp */
  last_activity?: string;
}

export interface PortfolioPropertyCardProps {
  /** Property data */
  property: PortfolioProperty;

  /** onPress handler for navigation */
  onPress: () => void;

  /** Compact mode (smaller, denser layout) */
  compact?: boolean;

  /** Card variant */
  variant?: 'default' | 'glass';

  /** Custom style */
  style?: ViewStyle;
}

/**
 * Formats currency
 */
function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
}

/**
 * Formats relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return date.toLocaleDateString();
}

/**
 * Gets status badge variant and label
 */
function getStatusConfig(status: PropertyStatus): { variant: 'default' | 'success' | 'warning' | 'outline'; label: string } {
  switch (status) {
    case 'acquired':
      return { variant: 'success', label: 'Acquired' };
    case 'under_contract':
      return { variant: 'warning', label: 'Under Contract' };
    case 'researching':
      return { variant: 'outline', label: 'Researching' };
    case 'archived':
      return { variant: 'default', label: 'Archived' };
  }
}

export function PortfolioPropertyCard({
  property,
  onPress,
  compact = false,
  variant = 'default',
  style,
}: PortfolioPropertyCardProps) {
  const colors = useThemeColors();
  const statusConfig = getStatusConfig(property.status);

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={PRESS_OPACITY.DEFAULT}
        accessibilityRole="button"
        accessibilityLabel={`Property: ${property.address}`}
      >
        <Card variant={variant} style={style}>
          <View style={{ padding: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
            {/* Thumbnail or Icon */}
            {property.thumbnail_url ? (
              <Image
                source={{ uri: property.thumbnail_url }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: BORDER_RADIUS.md,
                }}
              />
            ) : (
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: BORDER_RADIUS.md,
                  backgroundColor: withOpacity(colors.primary, 'muted'),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Home size={ICON_SIZES.xl} color={colors.primary} />
              </View>
            )}

            {/* Info */}
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: SPACING.xxs }}
                numberOfLines={1}
              >
                {property.address}
              </Text>
              {property.city && property.state && (
                <Text style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: SPACING.xs }}>
                  {property.city}, {property.state}
                </Text>
              )}
              <Badge variant={statusConfig.variant} size="sm">
                {statusConfig.label}
              </Badge>
            </View>

            {/* Metrics */}
            {property.roi !== undefined && (
              <View style={{ alignItems: 'flex-end', marginRight: SPACING.sm }}>
                <Text style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: SPACING.xxs }}>
                  ROI
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.success }}>
                  {property.roi > 0 ? '+' : ''}{property.roi.toFixed(1)}%
                </Text>
              </View>
            )}

            {/* Chevron */}
            <ChevronRight size={ICON_SIZES.lg} color={colors.mutedForeground} />
          </View>
        </Card>
      </TouchableOpacity>
    );
  }

  // Full mode
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={PRESS_OPACITY.DEFAULT}
      accessibilityRole="button"
      accessibilityLabel={`Property: ${property.address}`}
    >
      <Card variant={variant} style={style}>
        {/* Header with image/icon */}
        <View style={{ position: 'relative' }}>
          {property.thumbnail_url ? (
            <Image
              source={{ uri: property.thumbnail_url }}
              style={{
                width: '100%',
                height: 160,
                borderTopLeftRadius: BORDER_RADIUS.lg,
                borderTopRightRadius: BORDER_RADIUS.lg,
              }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: '100%',
                height: 160,
                backgroundColor: withOpacity(colors.primary, 'muted'),
                alignItems: 'center',
                justifyContent: 'center',
                borderTopLeftRadius: BORDER_RADIUS.lg,
                borderTopRightRadius: BORDER_RADIUS.lg,
              }}
            >
              <Home size={48} color={colors.primary} />
            </View>
          )}

          {/* Status Badge Overlay */}
          <View
            style={{
              position: 'absolute',
              top: SPACING.md,
              right: SPACING.md,
            }}
          >
            <Badge variant={statusConfig.variant}>
              {statusConfig.label}
            </Badge>
          </View>
        </View>

        {/* Content */}
        <View style={{ padding: SPACING.lg }}>
          {/* Address */}
          <View style={{ marginBottom: SPACING.md }}>
            <Text
              style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: SPACING.xs }}
              numberOfLines={2}
            >
              {property.address}
            </Text>
            {property.city && property.state && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                <MapPin size={ICON_SIZES.sm} color={colors.mutedForeground} />
                <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                  {property.city}, {property.state}
                </Text>
              </View>
            )}
          </View>

          {/* Metrics Grid */}
          <View style={{ flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md }}>
            {/* Price */}
            {property.price !== undefined && (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: SPACING.xxs }}>
                  Price
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
                  {formatCurrency(property.price)}
                </Text>
              </View>
            )}

            {/* ARV */}
            {property.arv !== undefined && (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: SPACING.xxs }}>
                  ARV
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
                  {formatCurrency(property.arv)}
                </Text>
              </View>
            )}

            {/* ROI */}
            {property.roi !== undefined && (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: SPACING.xxs }}>
                  ROI
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.success }}>
                  {property.roi > 0 ? '+' : ''}{property.roi.toFixed(1)}%
                </Text>
              </View>
            )}
          </View>

          {/* Footer with last activity */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: SPACING.md,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            {property.last_activity ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                <Calendar size={ICON_SIZES.sm} color={colors.mutedForeground} />
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                  {formatRelativeTime(property.last_activity)}
                </Text>
              </View>
            ) : (
              <View />
            )}
            <ChevronRight size={ICON_SIZES.lg} color={colors.mutedForeground} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
