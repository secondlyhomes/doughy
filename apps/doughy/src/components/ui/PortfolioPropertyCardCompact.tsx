/**
 * PortfolioPropertyCardCompact
 * Compact (dense) variant of the portfolio property card.
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Home, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { Card } from './Card';
import { Badge } from './Badge';
import { getStatusConfig } from './portfolio-property-card-helpers';
import type { PortfolioPropertyCardProps } from './portfolio-property-card-types';

export function PortfolioPropertyCardCompact({
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
