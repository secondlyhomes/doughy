// src/components/ui/DetailRow.tsx
// Shared detail row component for displaying label/value pairs with optional icon and actions

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LucideIcon, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, ICON_SIZES, FONT_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';

export interface DetailRowProps {
  /** Optional icon to display on the left */
  icon?: LucideIcon;
  /** Label text (left side or top) */
  label: string;
  /** Value to display (right side or below label) */
  value: string | React.ReactNode;
  /** Press handler - makes the row tappable */
  onPress?: () => void;
  /** Custom content on the right side (replaces chevron) */
  accessoryRight?: React.ReactNode;
  /** Color for the icon */
  iconColor?: string;
  /** Color for the value text (overrides default) */
  valueColor?: string;
  /** Layout direction: 'horizontal' puts label/value side by side, 'vertical' stacks them */
  layout?: 'horizontal' | 'vertical';
  /** Show chevron on the right when tappable (default true when onPress exists) */
  showChevron?: boolean;
  /** Hide the row if value is null/undefined/empty */
  hideIfEmpty?: boolean;
}

/**
 * DetailRow - A flexible component for displaying label/value pairs
 *
 * Supports two layouts:
 * - horizontal: Label on left, value on right (good for compact info)
 * - vertical: Label on top, value below (good for longer values)
 *
 * @example
 * // Basic horizontal layout
 * <DetailRow label="Email" value="john@example.com" />
 *
 * // Vertical layout with icon
 * <DetailRow
 *   icon={Mail}
 *   label="Email"
 *   value="john@example.com"
 *   layout="vertical"
 * />
 *
 * // Tappable row with chevron
 * <DetailRow
 *   icon={Phone}
 *   label="Phone"
 *   value="(555) 123-4567"
 *   layout="vertical"
 *   onPress={() => makeCall()}
 * />
 *
 * // Custom accessory
 * <DetailRow
 *   label="Status"
 *   value="Active"
 *   accessoryRight={<Badge>Verified</Badge>}
 * />
 */
export function DetailRow({
  icon: Icon,
  label,
  value,
  onPress,
  accessoryRight,
  iconColor,
  valueColor,
  layout = 'vertical',
  showChevron,
  hideIfEmpty = false,
}: DetailRowProps) {
  const colors = useThemeColors();

  // Hide if empty when hideIfEmpty is true
  if (hideIfEmpty && (value === null || value === undefined || value === '')) {
    return null;
  }

  // Default showChevron to true when onPress is provided and no accessoryRight
  const shouldShowChevron = showChevron ?? (!!onPress && !accessoryRight);

  const resolvedIconColor = iconColor ?? colors.mutedForeground;
  const resolvedValueColor = valueColor ?? (onPress ? colors.primary : colors.foreground);

  const renderContent = () => {
    if (layout === 'horizontal') {
      return (
        <View style={styles.horizontalContainer}>
          {Icon && (
            <Icon
              size={ICON_SIZES.ml}
              color={resolvedIconColor}
              style={styles.icon}
            />
          )}
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            {label}
          </Text>
          <View style={styles.horizontalValueContainer}>
            {typeof value === 'string' ? (
              <Text
                style={[
                  styles.horizontalValue,
                  { color: resolvedValueColor },
                ]}
                numberOfLines={1}
              >
                {value}
              </Text>
            ) : (
              value
            )}
          </View>
          {accessoryRight}
          {shouldShowChevron && (
            <ChevronRight
              size={ICON_SIZES.lg}
              color={colors.mutedForeground}
              style={styles.chevron}
            />
          )}
        </View>
      );
    }

    // Vertical layout
    return (
      <View style={styles.verticalContainer}>
        {Icon && (
          <Icon
            size={ICON_SIZES.ml}
            color={resolvedIconColor}
            style={styles.icon}
          />
        )}
        <View style={styles.verticalContent}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            {label}
          </Text>
          {typeof value === 'string' ? (
            <Text
              style={[
                styles.verticalValue,
                { color: resolvedValueColor },
              ]}
            >
              {value}
            </Text>
          ) : (
            value
          )}
        </View>
        {accessoryRight}
        {shouldShowChevron && (
          <ChevronRight
            size={ICON_SIZES.lg}
            color={colors.mutedForeground}
            style={styles.chevron}
          />
        )}
      </View>
    );
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={PRESS_OPACITY.DEFAULT}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${typeof value === 'string' ? value : ''}`}
        style={styles.touchable}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return <View style={styles.nonTouchable}>{renderContent()}</View>;
}

const styles = StyleSheet.create({
  touchable: {
    paddingVertical: SPACING.md,
  },
  nonTouchable: {
    paddingVertical: SPACING.md,
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verticalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.xs,
  },
  horizontalValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: SPACING.sm,
  },
  horizontalValue: {
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
  },
  verticalContent: {
    flex: 1,
  },
  verticalValue: {
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
    marginTop: 2,
  },
  chevron: {
    marginLeft: SPACING.sm,
  },
});
