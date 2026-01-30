// src/components/ui/PlatformBadge.tsx
// Small badge showing current platform with icon and name
// Color-coded: blue for investor, green for landlord

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { TrendingUp, Home } from 'lucide-react-native';
import { usePlatform, Platform } from '@/contexts/PlatformContext';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES, FONT_SIZES } from '@/constants/design-tokens';

// ============================================
// Types
// ============================================

export interface PlatformBadgeProps {
  /** Override the platform to display (defaults to active platform) */
  platform?: Platform;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Whether to show the platform label */
  showLabel?: boolean;
  /** Optional additional style */
  style?: ViewStyle;
  /** Optional className for container */
  className?: string;
}

// ============================================
// Platform Colors (semantic)
// ============================================

const PLATFORM_COLORS = {
  investor: {
    light: '#3b82f6', // blue-500
    dark: '#60a5fa',  // blue-400
  },
  landlord: {
    light: '#22c55e', // green-500
    dark: '#4ade80',  // green-400
  },
} as const;

// ============================================
// PlatformBadge Component
// ============================================

export function PlatformBadge({
  platform,
  size = 'sm',
  showLabel = true,
  style,
  className,
}: PlatformBadgeProps) {
  const colors = useThemeColors();
  const { activePlatform, isLoading } = usePlatform();

  // Use provided platform or fall back to active platform
  const displayPlatform = platform ?? activePlatform;

  if (isLoading) {
    return null;
  }

  // Determine if we're in dark mode by checking background color
  const isDark = colors.background === '#0f172a';

  // Get platform-specific color
  const platformColor = PLATFORM_COLORS[displayPlatform][isDark ? 'dark' : 'light'];

  // Get platform label and icon
  const platformLabel = displayPlatform === 'investor' ? 'Investor' : 'Landlord';
  const PlatformIcon = displayPlatform === 'investor' ? TrendingUp : Home;

  // Size configuration
  const isSmall = size === 'sm';
  const iconSize = isSmall ? ICON_SIZES.sm : ICON_SIZES.md;
  const fontSize = isSmall ? FONT_SIZES['2xs'] : FONT_SIZES.xs;
  const paddingH = isSmall ? SPACING.sm : SPACING.md;
  const paddingV = isSmall ? SPACING.xs - 1 : SPACING.xs;
  const gap = isSmall ? SPACING.xs - 2 : SPACING.xs;

  return (
    <View
      className={className}
      style={[
        styles.container,
        {
          backgroundColor: withOpacity(platformColor, 'medium'),
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
          borderRadius: BORDER_RADIUS.full,
        },
        style,
      ]}
      accessibilityLabel={`Current platform: ${platformLabel}`}
      accessibilityRole="text"
    >
      <PlatformIcon size={iconSize} color={platformColor} />
      {showLabel && (
        <Text
          style={[
            styles.label,
            {
              fontSize,
              color: platformColor,
              marginLeft: gap,
            },
          ]}
        >
          {platformLabel}
        </Text>
      )}
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '600',
  },
});

export default PlatformBadge;
