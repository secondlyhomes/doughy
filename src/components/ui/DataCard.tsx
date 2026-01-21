/**
 * DataCard Component
 * A flexible, reusable card component for displaying structured data
 *
 * Consolidates patterns from:
 * - LeadCard
 * - PropertyCard
 * - CompCard
 * - FinancingScenarioCard
 * - RepairSummaryCard
 *
 * Features:
 * - Flexible header with title, subtitle, icon, and badge
 * - Optional highlight section for primary metrics
 * - Data fields with icons
 * - Footer with badges and action buttons
 * - Theme-aware with full dark mode support
 */

import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { getShadowStyle, withOpacity } from '@/lib/design-utils';
import { BORDER_RADIUS, SPACING, ICON_SIZES } from '@/constants/design-tokens';
import { Card } from './Card';
import { Badge } from './Badge';

export interface DataCardField {
  icon?: LucideIcon;
  label?: string;
  value: string | React.ReactNode;
  iconColor?: string;
  valueColor?: string;
  iconSize?: number;
}

export interface DataCardBadge {
  label: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'danger' | 'inactive';
  size?: 'sm' | 'default' | 'lg';
}

export interface DataCardAction {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'destructive';
}

export interface DataCardProps {
  /** Card press handler */
  onPress?: () => void;

  /** Header section */
  title: string;
  subtitle?: string;
  headerIcon?: LucideIcon;
  headerBadge?: DataCardBadge;
  headerRight?: React.ReactNode;

  /** Highlight section (optional) - for primary metrics like price, score, etc. */
  highlightLabel?: string;
  highlightValue?: string | React.ReactNode;
  highlightColor?: string;

  /** Data fields - displayed as icon + value rows */
  fields?: DataCardField[];

  /** Footer section */
  badges?: DataCardBadge[];
  actions?: DataCardAction[];
  footerContent?: React.ReactNode;

  /** Styling */
  isSelected?: boolean;
  className?: string;
  style?: ViewStyle;

  /** Card variant: 'default' for solid, 'glass' for glass effect */
  variant?: 'default' | 'glass';
  /** Blur intensity for glass variant (0-100). Default: 60 */
  glassIntensity?: number;
}

export function DataCard({
  onPress,
  title,
  subtitle,
  headerIcon: HeaderIcon,
  headerBadge,
  headerRight,
  highlightLabel,
  highlightValue,
  highlightColor,
  fields = [],
  badges = [],
  actions = [],
  footerContent,
  isSelected = false,
  className,
  style,
  variant = 'default',
  glassIntensity = 60,
}: DataCardProps) {
  const colors = useThemeColors();

  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, activeOpacity: 0.7 } : {};

  return (
    <Wrapper {...wrapperProps}>
      <Card
        variant={variant}
        glassIntensity={glassIntensity}
        className={className}
        style={[
          {
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected ? colors.primary : colors.border,
          },
          style,
        ]}
      >
        {/* Header */}
        <View className="p-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 flex-row items-start">
              {HeaderIcon && (
                <View className="mr-3 pt-0.5">
                  <HeaderIcon size={ICON_SIZES.lg} color={colors.mutedForeground} />
                </View>
              )}
              <View className="flex-1">
                <View className="flex-row items-center flex-wrap">
                  <Text
                    className="text-base font-semibold flex-1"
                    style={{ color: colors.foreground }}
                    numberOfLines={1}
                  >
                    {title}
                  </Text>
                  {headerBadge && (
                    <Badge
                      variant={headerBadge.variant}
                      size={headerBadge.size || 'sm'}
                      className="ml-2"
                    >
                      {headerBadge.label}
                    </Badge>
                  )}
                </View>
                {subtitle && (
                  <Text
                    className="text-sm mt-0.5"
                    style={{ color: colors.mutedForeground }}
                    numberOfLines={1}
                  >
                    {subtitle}
                  </Text>
                )}
              </View>
            </View>
            {headerRight}
          </View>
        </View>

        {/* Highlight Section */}
        {(highlightLabel || highlightValue) && (
          <View
            className="px-4 py-3"
            style={{ backgroundColor: withOpacity(highlightColor || colors.primary, 'subtle') }}
          >
            <View className="flex-row justify-between items-center">
              <View>
                {highlightLabel && (
                  <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                    {highlightLabel}
                  </Text>
                )}
                {typeof highlightValue === 'string' ? (
                  <Text
                    className="text-2xl font-bold mt-0.5"
                    style={{ color: highlightColor || colors.primary }}
                  >
                    {highlightValue}
                  </Text>
                ) : (
                  highlightValue
                )}
              </View>
            </View>
          </View>
        )}

        {/* Data Fields */}
        {fields.length > 0 && (
          <View className="px-4 pb-3">
            <View className="flex-row flex-wrap gap-3">
              {fields.map((field, index) => (
                <DataCardFieldItem key={index} field={field} />
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        {(badges.length > 0 || actions.length > 0 || footerContent) && (
          <View className="px-4 pb-4">
            {footerContent}
            {badges.length > 0 && (
              <View className="flex-row items-center gap-2 flex-wrap mb-2">
                {badges.map((badge, index) => (
                  <Badge key={index} variant={badge.variant} size={badge.size || 'sm'}>
                    {badge.label}
                  </Badge>
                ))}
              </View>
            )}
            {actions.length > 0 && (
              <View className="flex-row gap-2">
                {actions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={action.onPress}
                    className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-md"
                    style={{
                      backgroundColor:
                        action.variant === 'destructive'
                          ? withOpacity(colors.destructive, 'muted')
                          : colors.muted,
                    }}
                  >
                    <action.icon
                      size={ICON_SIZES.sm}
                      color={
                        action.variant === 'destructive'
                          ? colors.destructive
                          : colors.mutedForeground
                      }
                    />
                    <Text
                      className="text-sm font-medium"
                      style={{
                        color:
                          action.variant === 'destructive'
                            ? colors.destructive
                            : colors.mutedForeground,
                      }}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </Card>
    </Wrapper>
  );
}

function DataCardFieldItem({ field }: { field: DataCardField }) {
  const colors = useThemeColors();
  const Icon = field.icon;

  return (
    <View className="flex-row items-center flex-1 min-w-[30%] max-w-full">
      {Icon && (
        <Icon
          size={field.iconSize || ICON_SIZES.sm}
          color={field.iconColor || colors.mutedForeground}
        />
      )}
      <View className={`flex-1 flex-shrink ${Icon ? 'ml-1.5' : ''}`}>
        {field.label && (
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>
            {field.label}
          </Text>
        )}
        {typeof field.value === 'string' ? (
          <Text
            className="text-sm"
            style={{ color: field.valueColor || colors.foreground }}
            numberOfLines={1}
          >
            {field.value}
          </Text>
        ) : (
          field.value
        )}
      </View>
    </View>
  );
}
