/**
 * PortfolioSummaryCard Component
 * Dashboard card displaying key portfolio metrics and statistics
 *
 * Features:
 * - Total properties count and value
 * - ROI and deal metrics
 * - Property status breakdown with progress bars
 * - Trend indicators (up/down)
 * - Glass and default variants
 *
 * Built on DataCard pattern for consistency.
 * Follows Zone B design system with zero hardcoded values.
 */

import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Home, DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { Card } from './Card';
import { Progress } from './Progress';
import { Badge } from './Badge';

export interface PortfolioMetrics {
  /** Total number of properties in portfolio */
  totalProperties: number;

  /** Total portfolio value in dollars */
  totalValue: number;

  /** Average ROI percentage across all deals */
  averageROI: number;

  /** Number of active deals */
  activeDeals: number;

  /** Property breakdown by status */
  propertyStatus: {
    acquired: number;
    underContract: number;
    researching: number;
  };

  /** Optional trend data */
  trends?: {
    /** Properties change from previous period */
    propertiesChange?: number;
    /** Value change percentage from previous period */
    valueChange?: number;
    /** ROI change from previous period */
    roiChange?: number;
  };
}

export interface PortfolioSummaryCardProps {
  /** Portfolio metrics data */
  metrics: PortfolioMetrics;

  /** Card variant */
  variant?: 'default' | 'glass';

  /** Optional onPress handler for navigation */
  onPress?: () => void;

  /** Custom style */
  style?: ViewStyle;
}

/**
 * Formats a number as currency
 */
function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Formats a number as percentage
 */
function formatPercentage(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

/**
 * Renders a trend indicator
 */
function TrendIndicator({ value, type = 'neutral' }: { value?: number; type?: 'positive' | 'negative' | 'neutral' }) {
  const colors = useThemeColors();

  if (value === undefined || value === 0) {
    return null;
  }

  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const color = type === 'positive'
    ? isPositive ? colors.success : colors.destructive
    : type === 'negative'
    ? isPositive ? colors.destructive : colors.success
    : colors.mutedForeground;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
      <Icon size={ICON_SIZES.sm} color={color} />
      <Text style={{ fontSize: 12, fontWeight: '600', color }}>
        {formatPercentage(Math.abs(value))}
      </Text>
    </View>
  );
}

export function PortfolioSummaryCard({
  metrics,
  variant = 'default',
  onPress,
  style,
}: PortfolioSummaryCardProps) {
  const colors = useThemeColors();

  const { totalProperties, totalValue, averageROI, activeDeals, propertyStatus, trends } = metrics;
  const totalStatusProperties = propertyStatus.acquired + propertyStatus.underContract + propertyStatus.researching;

  return (
    <Card
      variant={variant}
      onPress={onPress}
      style={style}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={onPress ? 'Portfolio summary' : undefined}
    >
      {/* Header */}
      <View style={{ padding: SPACING.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
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
              <Home size={ICON_SIZES.lg} color={colors.primary} />
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                Portfolio Overview
              </Text>
              <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                {activeDeals} active {activeDeals === 1 ? 'deal' : 'deals'}
              </Text>
            </View>
          </View>
          <Badge variant="outline" size="sm">
            {totalProperties} {totalProperties === 1 ? 'Property' : 'Properties'}
          </Badge>
        </View>
      </View>

      {/* Metrics Grid */}
      <View
        style={{
          paddingHorizontal: SPACING.lg,
          paddingBottom: SPACING.md,
          flexDirection: 'row',
          gap: SPACING.md,
        }}
      >
        {/* Total Value */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.xs }}>
            <DollarSign size={ICON_SIZES.sm} color={colors.mutedForeground} />
            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Total Value</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>
            {formatCurrency(totalValue)}
          </Text>
          {trends?.valueChange !== undefined && (
            <View style={{ marginTop: SPACING.xs }}>
              <TrendIndicator value={trends.valueChange} type="positive" />
            </View>
          )}
        </View>

        {/* Average ROI */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.xs }}>
            <Activity size={ICON_SIZES.sm} color={colors.mutedForeground} />
            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Avg ROI</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.success }}>
            {formatPercentage(averageROI)}
          </Text>
          {trends?.roiChange !== undefined && (
            <View style={{ marginTop: SPACING.xs }}>
              <TrendIndicator value={trends.roiChange} type="positive" />
            </View>
          )}
        </View>
      </View>

      {/* Property Status Breakdown */}
      <View
        style={{
          padding: SPACING.lg,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground, marginBottom: SPACING.md }}>
          Property Status
        </Text>

        {/* Acquired */}
        <View style={{ marginBottom: SPACING.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs }}>
            <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Acquired</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>
              {propertyStatus.acquired}
            </Text>
          </View>
          <Progress
            value={(propertyStatus.acquired / totalStatusProperties) * 100}
            variant="success"
            size="sm"
          />
        </View>

        {/* Under Contract */}
        <View style={{ marginBottom: SPACING.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs }}>
            <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Under Contract</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>
              {propertyStatus.underContract}
            </Text>
          </View>
          <Progress
            value={(propertyStatus.underContract / totalStatusProperties) * 100}
            variant="warning"
            size="sm"
          />
        </View>

        {/* Researching */}
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs }}>
            <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Researching</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>
              {propertyStatus.researching}
            </Text>
          </View>
          <Progress
            value={(propertyStatus.researching / totalStatusProperties) * 100}
            variant="default"
            size="sm"
          />
        </View>
      </View>
    </Card>
  );
}
