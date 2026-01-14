// src/components/ui/FloatingGlassTabBar.tsx
// Floating liquid glass tab bar for iOS 26+ with animated selector
import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, LayoutChangeEvent } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlassView, LiquidGlassContainerView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme, useThemeColors } from '@/context/ThemeContext';

// Safe haptics - requires native rebuild to work
const triggerHaptic = async () => {
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics not available - native module not linked yet
  }
};

// Constants - exported for use in layouts
export const TAB_BAR_HEIGHT = 60;
export const TAB_BAR_BOTTOM_OFFSET = 0;
/** Safe padding for content to clear the floating tab bar */
export const TAB_BAR_SAFE_PADDING = 80;

const PILL_BORDER_RADIUS = 30;
const SELECTOR_SIZE = 52;
const SPRING_CONFIG = { damping: 42, stiffness: 180 };

// Format badge text (caps at 99+)
const formatBadge = (badge: number | string): string => {
  if (typeof badge === 'number' && badge > 99) return '99+';
  return String(badge);
};

export interface FloatingGlassTabBarProps extends BottomTabBarProps {
  /** Horizontal margin from screen edges. Default: 16 */
  horizontalMargin?: number;
  /** Bottom offset from safe area. Default: 0 */
  bottomOffset?: number;
}

export function FloatingGlassTabBar({
  state,
  descriptors,
  navigation,
  horizontalMargin = 16,
  bottomOffset = TAB_BAR_BOTTOM_OFFSET,
}: FloatingGlassTabBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { isDark } = useTheme();

  // Filter routes to only show visible tabs
  // tabBarButton: () => null is the standard React Navigation way to hide tabs
  // This works with custom tab bars (unlike href: null which only works with default)
  const visibleRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    // Check if tabBarButton exists and returns null when called
    if (typeof options.tabBarButton === 'function') {
      try {
        const result = options.tabBarButton({} as any);
        if (result === null) return false;
      } catch {
        return false;
      }
    }
    return true;
  });

  // Map from visible index to actual route index
  const visibleToActualIndex = visibleRoutes.map((route) =>
    state.routes.findIndex((r) => r.key === route.key)
  );

  // Find the visible index for the current active tab
  const activeVisibleIndex = visibleToActualIndex.findIndex(
    (actualIndex) => actualIndex === state.index
  );

  // Track tab positions for selector animation
  const [tabLayouts, setTabLayouts] = useState<{ x: number; width: number }[]>([]);
  const selectorX = useSharedValue(0);

  // Calculate selector position for a given visible tab index
  const getTabCenterX = useCallback((visibleIndex: number) => {
    if (tabLayouts[visibleIndex]) {
      return tabLayouts[visibleIndex].x + tabLayouts[visibleIndex].width / 2 - SELECTOR_SIZE / 2;
    }
    return 0;
  }, [tabLayouts]);

  // Animate selector when tab changes or layouts update
  useEffect(() => {
    if (tabLayouts.length === visibleRoutes.length && tabLayouts.every(t => t) && activeVisibleIndex >= 0) {
      selectorX.value = withSpring(getTabCenterX(activeVisibleIndex), SPRING_CONFIG);
    }
  }, [activeVisibleIndex, tabLayouts, getTabCenterX, selectorX, visibleRoutes.length]);

  const selectorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: selectorX.value }],
  }));

  const onTabLayout = useCallback((visibleIndex: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setTabLayouts(prev => {
      const updated = [...prev];
      updated[visibleIndex] = { x, width };
      return updated;
    });
  }, []);

  // Navigate to tab with haptic feedback (takes visible index)
  const navigateToTab = useCallback((visibleIndex: number) => {
    const actualIndex = visibleToActualIndex[visibleIndex];
    if (actualIndex === state.index) return; // Already on this tab

    const route = state.routes[actualIndex];
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      triggerHaptic();
      navigation.navigate(route.name);
    }
  }, [state.index, state.routes, navigation, visibleToActualIndex]);

  // ─────────────────────────────────────────────────────────────
  // FALLBACK: Non-iOS 26 devices get blurred pill tab bar
  // ─────────────────────────────────────────────────────────────
  // Debug logging - remove after confirming liquid glass works
  if (__DEV__) {
    console.log('LiquidGlass Debug:', {
      platform: Platform.OS,
      isSupported: isLiquidGlassSupported,
    });
  }

  if (Platform.OS !== 'ios' || !isLiquidGlassSupported) {
    return (
      <View style={[
        styles.wrapper,
        { bottom: insets.bottom + bottomOffset, left: horizontalMargin, right: horizontalMargin }
      ]}>
        <BlurView
          intensity={60}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.pill, { overflow: 'hidden' }]}
        >
          <View style={styles.iconsLayer}>
            {visibleRoutes.map((route, visibleIndex) => {
              const { options } = descriptors[route.key];
              const isFocused = visibleIndex === activeVisibleIndex;
              const badge = options.tabBarBadge;
              const icon = options.tabBarIcon?.({
                focused: isFocused,
                color: isFocused ? colors.primary : colors.mutedForeground,
                size: 24,
              });
              return (
                <View
                  key={route.key}
                  style={[styles.tab, isFocused && styles.tabFocused]}
                  onTouchEnd={() => navigateToTab(visibleIndex)}
                >
                  <View style={styles.iconContainer}>
                    {icon}
                    {badge != null && (
                      <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                        <Text style={styles.badgeText}>{formatBadge(badge)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </BlurView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // LIQUID GLASS: iOS 26+ with true glass effect and animated selector
  // ─────────────────────────────────────────────────────────────
  const isLayoutReady = tabLayouts.length === visibleRoutes.length && tabLayouts.every(t => t);

  return (
    <View style={[
      styles.wrapper,
      { bottom: insets.bottom + bottomOffset, left: horizontalMargin, right: horizontalMargin }
    ]}>
      {/* Glass layer - NO touch handling (pointerEvents="none") */}
      <LiquidGlassContainerView
        spacing={8}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      >
        {/* Pill background */}
        <LiquidGlassView
          style={styles.pill}
          effect="regular"
          colorScheme={isDark ? 'dark' : 'light'}
        />

        {/* Animated selector circle */}
        {isLayoutReady && activeVisibleIndex >= 0 && (
          <Animated.View style={[styles.selectorWrapper, selectorStyle]}>
            <LiquidGlassView
              style={styles.selector}
              effect="clear"
              colorScheme={isDark ? 'dark' : 'light'}
            />
          </Animated.View>
        )}
      </LiquidGlassContainerView>

      {/* Touch layer - handles taps */}
      <View style={styles.iconsLayer}>
        {visibleRoutes.map((route, visibleIndex) => {
          const { options } = descriptors[route.key];
          const isFocused = visibleIndex === activeVisibleIndex;
          const badge = options.tabBarBadge;
          const icon = options.tabBarIcon?.({
            focused: isFocused,
            color: isFocused ? colors.primary : colors.mutedForeground,
            size: 24,
          });
          return (
            <View
              key={route.key}
              style={styles.tab}
              onLayout={(e) => onTabLayout(visibleIndex, e)}
              onTouchEnd={() => navigateToTab(visibleIndex)}
            >
              <View style={styles.iconContainer}>
                {icon}
                {badge != null && (
                  <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                    <Text style={styles.badgeText}>{formatBadge(badge)}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    height: TAB_BAR_HEIGHT,
  },
  pill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: PILL_BORDER_RADIUS,
  },
  selectorWrapper: {
    position: 'absolute',
    top: (TAB_BAR_HEIGHT - SELECTOR_SIZE) / 2,
    left: 0,
  },
  selector: {
    width: SELECTOR_SIZE,
    height: SELECTOR_SIZE,
    borderRadius: SELECTOR_SIZE / 2,
  },
  iconsLayer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: TAB_BAR_HEIGHT,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  tabFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    marginHorizontal: 4,
  },
});
