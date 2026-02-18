// src/components/ui/PlatformSwitcher.tsx
// Toggle/segmented control for switching between investor and landlord platforms
// Only renders when user has both platforms enabled

import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, LayoutChangeEvent, StyleSheet } from 'react-native';
import { TrendingUp, Home } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { usePlatform, Platform } from '@/contexts/PlatformContext';
import { useThemeColors } from '@/contexts/ThemeContext';
import { getShadowStyle, withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES, FONT_SIZES } from '@/constants/design-tokens';

// ============================================
// Types
// ============================================

export interface PlatformSwitcherProps {
  /** Compact mode for header, full mode for settings */
  mode?: 'compact' | 'full';
  /** Optional className for container */
  className?: string;
  /** Whether to show platform labels */
  showLabels?: boolean;
}

interface PlatformOption {
  id: Platform;
  label: string;
  icon: (color: string, size: number) => React.ReactNode;
}

// ============================================
// Platform Options
// ============================================

const platformOptions: PlatformOption[] = [
  {
    id: 'investor',
    label: 'Investor',
    icon: (color: string, size: number) => <TrendingUp size={size} color={color} />,
  },
  {
    id: 'landlord',
    label: 'Landlord',
    icon: (color: string, size: number) => <Home size={size} color={color} />,
  },
];

// ============================================
// PlatformSwitcher Component
// ============================================

export function PlatformSwitcher({
  mode = 'compact',
  className,
  showLabels = true,
}: PlatformSwitcherProps) {
  const colors = useThemeColors();
  const { enabledPlatforms, activePlatform, switchPlatform, isLoading } = usePlatform();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [segmentWidths, setSegmentWidths] = React.useState<number[]>([]);

  // Only show if user has both platforms enabled
  const hasBothPlatforms = enabledPlatforms.includes('investor') && enabledPlatforms.includes('landlord');

  // Filter to only show enabled platforms
  const availableOptions = platformOptions.filter((opt) => enabledPlatforms.includes(opt.id));
  const activeIndex = availableOptions.findIndex((opt) => opt.id === activePlatform);

  // Update animation when active index changes
  // IMPORTANT: All hooks must be called unconditionally before any early returns
  useEffect(() => {
    if (!hasBothPlatforms || isLoading) return;
    if (segmentWidths.length === availableOptions.length && activeIndex >= 0) {
      const targetX = segmentWidths.slice(0, activeIndex).reduce((sum, w) => sum + w, 0);

      Animated.spring(slideAnim, {
        toValue: targetX,
        useNativeDriver: true,
        tension: 300,
        friction: 30,
      }).start();
    }
  }, [activeIndex, segmentWidths, slideAnim, availableOptions.length, hasBothPlatforms, isLoading]);

  // Handle segment layout
  const handleSegmentLayout = useCallback(
    (index: number, event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      setSegmentWidths((prev) => {
        const newWidths = [...prev];
        newWidths[index] = width;
        return newWidths;
      });
    },
    []
  );

  // Handle press
  const handlePress = useCallback(
    async (platform: Platform) => {
      if (platform !== activePlatform) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await switchPlatform(platform);
      }
    },
    [activePlatform, switchPlatform]
  );

  // Early return AFTER all hooks have been called
  if (!hasBothPlatforms || isLoading) {
    return null;
  }

  // Size configuration based on mode
  const isCompact = mode === 'compact';
  const paddingY = isCompact ? SPACING.xs : SPACING.sm;
  const paddingX = isCompact ? SPACING.sm : SPACING.md;
  const iconSize = isCompact ? ICON_SIZES.md : ICON_SIZES.lg;
  const fontSize = isCompact ? FONT_SIZES.xs : FONT_SIZES.sm;
  const containerPadding = isCompact ? 2 : 3;

  // Get the width of the active pill
  const activePillWidth = segmentWidths[activeIndex] || 0;

  return (
    <View
      className={className}
      style={[
        styles.container,
        {
          padding: containerPadding,
          backgroundColor: withOpacity(colors.muted, 'strong'),
          borderRadius: BORDER_RADIUS.full,
        },
      ]}
    >
      {/* Animated pill indicator */}
      {segmentWidths.length === availableOptions.length && activeIndex >= 0 && (
        <Animated.View
          style={[
            styles.pill,
            {
              top: containerPadding,
              left: containerPadding,
              width: activePillWidth,
              backgroundColor: colors.background,
              borderRadius: BORDER_RADIUS.full,
              ...getShadowStyle(colors, { size: 'sm' }),
              transform: [{ translateX: slideAnim }],
            },
          ]}
        />
      )}

      {/* Segments */}
      {availableOptions.map((option, index) => {
        const isActive = option.id === activePlatform;
        const iconColor = isActive ? colors.foreground : colors.mutedForeground;

        return (
          <Pressable
            key={option.id}
            onLayout={(e) => handleSegmentLayout(index, e)}
            onPress={() => handlePress(option.id)}
            accessibilityLabel={`Switch to ${option.label} platform`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={[
              styles.segment,
              {
                paddingVertical: paddingY,
                paddingHorizontal: paddingX,
              },
            ]}
          >
            {option.icon(iconColor, iconSize)}
            {showLabels && (
              <Text
                style={[
                  styles.label,
                  {
                    fontSize,
                    color: isActive ? colors.foreground : colors.mutedForeground,
                    marginLeft: SPACING.xs,
                  },
                ]}
              >
                {option.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
  },
  pill: {
    position: 'absolute',
    height: '100%',
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
  },
});

export default PlatformSwitcher;
