/**
 * PortfolioPropertyCardFull
 * Full (expanded) variant of the portfolio property card with image header and metrics grid.
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Home, MapPin, ChevronRight, Calendar } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { Card } from './Card';
import { Badge } from './Badge';
import { formatCurrency, formatRelativeTime, getStatusConfig } from './portfolio-property-card-helpers';
import type { PortfolioPropertyCardProps } from './portfolio-property-card-types';

export function PortfolioPropertyCardFull({
  property,
  onPress,
  variant = 'default',
  style,
}: Omit<PortfolioPropertyCardProps, 'compact'>) {
  const colors = useThemeColors();
  const statusConfig = getStatusConfig(property.status);

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
