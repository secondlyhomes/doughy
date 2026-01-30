// src/components/ui/HubCard.tsx
// Navigation hub card component for property management dashboard
// Displays icon, badge count, and title - leads to focused sub-screens

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, FONT_SIZES, BORDER_RADIUS, ICON_SIZES, GLASS_INTENSITY, PRESS_OPACITY } from '@/constants/design-tokens';
import { GlassView } from './GlassView';

export interface HubCardProps {
  /** Icon to display at the top of the card */
  icon: LucideIcon;
  /** Title text displayed below the badge */
  title: string;
  /** Badge content - can be a number count or status text */
  badge?: string | number;
  /** Badge variant for different visual styles */
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  /** Press handler for navigation */
  onPress: () => void;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Card variant: 'default' for solid, 'glass' for glass effect */
  variant?: 'default' | 'glass';
  /** Custom style overrides */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

export function HubCard({
  icon: Icon,
  title,
  badge,
  badgeVariant = 'default',
  onPress,
  disabled = false,
  variant = 'default',
  style,
  testID,
}: HubCardProps) {
  const colors = useThemeColors();

  const getBadgeColor = () => {
    switch (badgeVariant) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'danger':
        return colors.destructive;
      case 'info':
        return colors.info;
      case 'muted':
        return colors.mutedForeground;
      default:
        return colors.primary;
    }
  };

  const getBadgeBackgroundColor = () => {
    switch (badgeVariant) {
      case 'success':
        return withOpacity(colors.success, 'light');
      case 'warning':
        return withOpacity(colors.warning, 'light');
      case 'danger':
        return withOpacity(colors.destructive, 'light');
      case 'info':
        return withOpacity(colors.info, 'light');
      case 'muted':
        return colors.muted;
      default:
        return withOpacity(colors.primary, 'light');
    }
  };

  const cardContent = (
    <>
      {/* Icon */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: withOpacity(colors.primary, 'subtle') },
        ]}
      >
        <Icon size={ICON_SIZES.lg} color={colors.primary} />
      </View>

      {/* Badge */}
      {badge !== undefined && badge !== null && (
        <View
          style={[
            styles.badgeContainer,
            { backgroundColor: getBadgeBackgroundColor() },
          ]}
        >
          <Text
            style={[styles.badgeText, { color: getBadgeColor() }]}
            numberOfLines={1}
          >
            {badge}
          </Text>
        </View>
      )}

      {/* Title */}
      <Text
        style={[
          styles.title,
          {
            color: disabled ? colors.mutedForeground : colors.foreground,
          },
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
    </>
  );

  if (variant === 'glass') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={PRESS_OPACITY.DEFAULT}
        testID={testID}
        style={style}
      >
        <GlassView
          intensity={GLASS_INTENSITY.medium}
          style={[
            styles.container,
            { borderColor: colors.border, opacity: disabled ? 0.5 : 1 },
          ]}
        >
          {cardContent}
        </GlassView>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={PRESS_OPACITY.DEFAULT}
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {cardContent}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    minWidth: 100,
    minHeight: 100,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  badgeContainer: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.xs,
    minWidth: 28,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  title: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default HubCard;
