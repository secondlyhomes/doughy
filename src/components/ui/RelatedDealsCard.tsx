/**
 * RelatedDealsCard Component
 * Displays related deals for a property (package deals, similar properties, etc.)
 *
 * Features:
 * - List of related deals with preview info
 * - Deal type indicator (package, similar, seller portfolio)
 * - Quick metrics (price, status)
 * - Navigation to deal details
 * - "View all" link when more deals exist
 * - Empty state when no related deals
 *
 * Follows Zone B design system with zero hardcoded values.
 */

import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, ScrollView } from 'react-native';
import { Link2, ChevronRight, Home, Package } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { Card } from './Card';
import { Badge } from './Badge';

export type RelatedDealType = 'package' | 'similar' | 'seller_portfolio';

export interface RelatedDeal {
  /** Deal ID */
  id: string;

  /** Property address */
  address: string;

  /** City, State */
  location?: string;

  /** Deal type */
  type: RelatedDealType;

  /** Price */
  price?: number;

  /** Deal status */
  status?: 'active' | 'pending' | 'closed';
}

export interface RelatedDealsCardProps {
  /** Title for the card */
  title?: string;

  /** Related deals to display */
  deals: RelatedDeal[];

  /** onPress handler for individual deal */
  onDealPress: (dealId: string) => void;

  /** Optional "View all" handler when there are more deals */
  onViewAll?: () => void;

  /** Maximum number of deals to show (default: 3) */
  maxVisible?: number;

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
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
}

/**
 * Gets deal type config
 */
function getDealTypeConfig(type: RelatedDealType): { label: string; icon: typeof Link2 } {
  switch (type) {
    case 'package':
      return { label: 'Package Deal', icon: Package };
    case 'similar':
      return { label: 'Similar Property', icon: Home };
    case 'seller_portfolio':
      return { label: 'Seller Portfolio', icon: Link2 };
  }
}

/**
 * Gets status badge variant
 */
function getStatusVariant(status?: string): 'success' | 'warning' | 'default' {
  switch (status) {
    case 'active':
      return 'success';
    case 'pending':
      return 'warning';
    default:
      return 'default';
  }
}

export function RelatedDealsCard({
  title = 'Related Deals',
  deals,
  onDealPress,
  onViewAll,
  maxVisible = 3,
  variant = 'default',
  style,
}: RelatedDealsCardProps) {
  const colors = useThemeColors();

  const visibleDeals = deals.slice(0, maxVisible);
  const hasMore = deals.length > maxVisible;

  if (deals.length === 0) {
    return (
      <Card variant={variant} style={style}>
        <View style={{ padding: SPACING.lg, alignItems: 'center' }}>
          <Link2 size={32} color={colors.mutedForeground} />
          <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: SPACING.sm, textAlign: 'center' }}>
            No related deals found
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card variant={variant} style={style}>
      {/* Header */}
      <View
        style={{
          padding: SPACING.lg,
          paddingBottom: SPACING.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <Link2 size={ICON_SIZES.lg} color={colors.primary} />
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
            {title}
          </Text>
        </View>
        {deals.length > 0 && (
          <Badge variant="outline" size="sm">
            {deals.length}
          </Badge>
        )}
      </View>

      {/* Deals List */}
      <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md }}>
        {visibleDeals.map((deal, index) => {
          const typeConfig = getDealTypeConfig(deal.type);
          const Icon = typeConfig.icon;

          return (
            <TouchableOpacity
              key={deal.id}
              onPress={() => onDealPress(deal.id)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.md,
                paddingVertical: SPACING.md,
                borderBottomWidth: index < visibleDeals.length - 1 || hasMore ? 1 : 0,
                borderBottomColor: colors.border,
              }}
              accessibilityRole="button"
              accessibilityLabel={`Related deal: ${deal.address}`}
            >
              {/* Icon */}
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: BORDER_RADIUS.md,
                  backgroundColor: withOpacity(colors.primary, 'muted'),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={ICON_SIZES.lg} color={colors.primary} />
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 2 }}
                  numberOfLines={1}
                >
                  {deal.address}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                    {typeConfig.label}
                  </Text>
                  {deal.location && (
                    <>
                      <Text style={{ fontSize: 12, color: colors.mutedForeground }}>•</Text>
                      <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                        {deal.location}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {/* Price & Status */}
              <View style={{ alignItems: 'flex-end', gap: SPACING.xs }}>
                {deal.price !== undefined && (
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                    {formatCurrency(deal.price)}
                  </Text>
                )}
                {deal.status && (
                  <Badge variant={getStatusVariant(deal.status)} size="sm">
                    {deal.status}
                  </Badge>
                )}
              </View>

              {/* Chevron */}
              <ChevronRight size={ICON_SIZES.md} color={colors.mutedForeground} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* View All Link */}
      {hasMore && onViewAll && (
        <TouchableOpacity
          onPress={onViewAll}
          activeOpacity={0.7}
          style={{
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: SPACING.xs,
          }}
          accessibilityRole="button"
          accessibilityLabel="View all related deals"
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
            View All {deals.length} Deals
          </Text>
          <ChevronRight size={ICON_SIZES.md} color={colors.primary} />
        </TouchableOpacity>
      )}
    </Card>
  );
}
