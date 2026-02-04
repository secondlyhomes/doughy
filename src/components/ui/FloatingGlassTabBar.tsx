// src/components/ui/FloatingGlassTabBar.tsx
// Floating liquid glass tab bar for iOS 26+ with animated selector
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, LayoutChangeEvent } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlassView, LiquidGlassContainerView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, cancelAnimation, withTiming, interpolate } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme, useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { BADGE_CONSTANTS, FONT_SIZES, ICON_SIZES, BORDER_RADIUS, GLASS_INTENSITY, SPACING } from '@/constants/design-tokens';

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
// NOTE: With NativeTabs, iOS automatically handles tab bar + safe area insets.
// These values are for visual breathing room only, not to clear the tab bar.
export const TAB_BAR_HEIGHT = 49;           // Native iOS tab bar height (for reference)
export const TAB_BAR_BOTTOM_OFFSET = 0;
/** Minimal padding for visual breathing room (iOS handles tab bar clearance with NativeTabs) */
export const TAB_BAR_SAFE_PADDING = 16;

/** Standard FAB positioning (above tab bar + safe area) */
export const FAB_BOTTOM_OFFSET = 24;
export const FAB_RIGHT_MARGIN = 24;
export const FAB_LEFT_MARGIN = 24;

/** FAB z-index hierarchy */
export const FAB_Z_INDEX = {
  ASSISTANT: 1000,   // DealAssistant (draggable)
  EXPANDABLE: 900,   // QuickActionFAB (with backdrop)
  SIMPLE: 800,       // SimpleFAB (basic add button)
} as const;

/** Standard FAB size */
export const FAB_SIZE = 56;

const PILL_BORDER_RADIUS = 30;
const SELECTOR_SIZE = 70;
const SPRING_CONFIG = { damping: 42, stiffness: 180 };

// Tab labels fallback mapping (only used if options.title is not set)
const TAB_LABELS_FALLBACK: Record<string, string> = {
  index: 'Dashboard',
  deals: 'Deals',
  properties: 'Properties',
  settings: 'Settings',
};

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
  const [tabLayouts, setTabLayouts] = useState<{ x: number; width: number; contentWidth?: number }[]>([]);
  const selectorX = useSharedValue(0);

  // Drag state for visual feedback
  const selectorScale = useSharedValue(1);
  const selectorOpacity = useSharedValue(1);
  const dragStartX = useSharedValue(0);
  const containerWidth = useSharedValue(0);

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

  const selectorStyle = useAnimatedStyle(() => {
    'worklet';

    // Guard: Wait for all layouts to be measured with contentWidth
    if (tabLayouts.length === 0 || !tabLayouts.every(t => t && t.contentWidth)) {
      return { opacity: 0 };
    }

    // Create input/output ranges from tab positions and widths
    const inputRange = tabLayouts.map(tab =>
      tab.x + tab.width / 2 - SELECTOR_SIZE / 2
    );
    const outputRange = tabLayouts.map(tab => tab.contentWidth!);

    // Interpolate width based on current X position
    const dynamicWidth = interpolate(
      selectorX.value,
      inputRange,
      outputRange,
      'clamp'
    );

    return {
      transform: [
        { translateX: selectorX.value },
        { scale: selectorScale.value }
      ],
      width: dynamicWidth, // Automatically morphs during drag AND spring
      borderRadius: dynamicWidth / 2, // Maintains capsule shape
      opacity: selectorOpacity.value,
    };
  });

  const onTabLayout = useCallback((visibleIndex: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setTabLayouts(prev => {
      const updated = [...prev];
      updated[visibleIndex] = { x, width, contentWidth: updated[visibleIndex]?.contentWidth };
      return updated;
    });
  }, []);

  const onTabContentLayout = useCallback((visibleIndex: number, e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    setTabLayouts(prev => {
      const updated = [...prev];
      if (updated[visibleIndex]) {
        updated[visibleIndex] = {
          ...updated[visibleIndex],
          contentWidth: width + 32, // Add pill padding (16px each side)
        };
      }
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

  // Find nearest tab and navigate
  const findNearestTab = useCallback((currentX: number) => {
    if (tabLayouts.length === 0) return;

    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < visibleRoutes.length; i++) {
      const tabCenterX = getTabCenterX(i);
      const distance = Math.abs(currentX - tabCenterX);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }

    // Snap to nearest tab
    selectorX.value = withSpring(getTabCenterX(nearestIndex), SPRING_CONFIG);

    // Navigate to that tab
    navigateToTab(nearestIndex);
  }, [tabLayouts, visibleRoutes, getTabCenterX, navigateToTab, selectorX]);

  // Draggable selector gesture
  const selectorDragGesture = Gesture.Pan()
    .onBegin(() => {
      'worklet';
      cancelAnimation(selectorX);
      dragStartX.value = selectorX.value;

      // Visual feedback: grow + become transparent
      selectorScale.value = withSpring(1.2);
      selectorOpacity.value = withTiming(0.5);
    })
    .onUpdate((e) => {
      'worklet';
      // Update position as user drags
      const newX = dragStartX.value + e.translationX;

      // Clamp within bounds
      const minX = 8;
      const maxX = containerWidth.value - SELECTOR_SIZE - 8;
      selectorX.value = Math.max(minX, Math.min(newX, maxX));
    })
    .onEnd(() => {
      'worklet';
      // Visual feedback: return to normal size + opaque
      selectorScale.value = withSpring(1);
      selectorOpacity.value = withTiming(1);

      // Find nearest tab and snap
      runOnJS(findNearestTab)(selectorX.value);
    });

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
      <View
        style={[
          styles.wrapper,
          { bottom: insets.bottom + bottomOffset, left: horizontalMargin, right: horizontalMargin }
        ]}
      >
          <BlurView
            intensity={GLASS_INTENSITY.strong}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.pill, { overflow: 'hidden' }]}
          >
            <View style={styles.iconsLayer}>
            {visibleRoutes.map((route, visibleIndex) => {
              const { options } = descriptors[route.key];
              const isFocused = visibleIndex === activeVisibleIndex;
              const badge = options.tabBarBadge;
              const label = options.title || TAB_LABELS_FALLBACK[route.name] || route.name;
              const icon = options.tabBarIcon?.({
                focused: isFocused,
                color: isFocused ? colors.primary : colors.mutedForeground,
                size: ICON_SIZES.xl,
              });
              return (
                <View
                  key={route.key}
                  style={[
                    styles.tab,
                    isFocused && {
                      backgroundColor: withOpacity(colors.primary, 'light'),
                      borderRadius: BORDER_RADIUS.lg,
                      marginHorizontal: 4,
                    },
                  ]}
                  onLayout={(e) => onTabLayout(visibleIndex, e)}
                  onTouchEnd={() => navigateToTab(visibleIndex)}
                >
                  <View
                    style={styles.tabContent}
                    onLayout={(e) => onTabContentLayout(visibleIndex, e)}
                  >
                    <View style={styles.iconContainer}>
                      {icon}
                      {badge != null && (
                        <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                          <Text style={[styles.badgeText, { color: colors.destructiveForeground }]}>{formatBadge(badge)}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.label, { color: isFocused ? colors.primary : colors.mutedForeground }]}>
                      {label}
                    </Text>
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
  const isLayoutReady = tabLayouts.length === visibleRoutes.length && tabLayouts.every(t => t && t.contentWidth);

  return (
    <View
      style={[
        styles.wrapper,
        { bottom: insets.bottom + bottomOffset, left: horizontalMargin, right: horizontalMargin }
      ]}
      onLayout={(e) => {
        containerWidth.value = e.nativeEvent.layout.width;
      }}
    >
      {/* Glass layer - Allows selector to receive touches */}
      <LiquidGlassContainerView
        spacing={8}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="box-none"
      >
        {/* Pill background */}
        <LiquidGlassView
          style={styles.pill}
          effect="regular"
          colorScheme={isDark ? 'dark' : 'light'}
        />

        {/* Animated selector circle - DRAGGABLE */}
        {isLayoutReady && activeVisibleIndex >= 0 && (
          <GestureDetector gesture={selectorDragGesture}>
            <Animated.View style={[styles.selectorWrapper, selectorStyle]}>
              <LiquidGlassView
                style={styles.selector}
                effect="clear"
                colorScheme={isDark ? 'dark' : 'light'}
              />
            </Animated.View>
          </GestureDetector>
        )}
      </LiquidGlassContainerView>

      {/* Touch layer - handles taps */}
      <View style={styles.iconsLayer}>
        {visibleRoutes.map((route, visibleIndex) => {
          const { options } = descriptors[route.key];
          const isFocused = visibleIndex === activeVisibleIndex;
          const badge = options.tabBarBadge;
          const label = options.title || TAB_LABELS_FALLBACK[route.name] || route.name;
          const icon = options.tabBarIcon?.({
            focused: isFocused,
            color: isFocused ? colors.primary : colors.mutedForeground,
            size: ICON_SIZES.xl,
          });
          return (
            <View
              key={route.key}
              style={styles.tab}
              onLayout={(e) => onTabLayout(visibleIndex, e)}
              onTouchEnd={() => navigateToTab(visibleIndex)}
            >
              <View
                style={styles.tabContent}
                onLayout={(e) => onTabContentLayout(visibleIndex, e)}
              >
                <View style={styles.iconContainer}>
                  {icon}
                  {badge != null && (
                    <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                      <Text style={[styles.badgeText, { color: colors.destructiveForeground }]}>{formatBadge(badge)}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.label, { color: isFocused ? colors.primary : colors.mutedForeground }]}>
                  {label}
                </Text>
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
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: TAB_BAR_HEIGHT,
    gap: 4,
  },
  tabContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8, // Content padding for measurement
  },
  iconContainer: {
    position: 'relative',
  },
  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    marginTop: SPACING.xxs,
  },
  badge: {
    position: 'absolute',
    top: BADGE_CONSTANTS.OFFSET_TOP,
    right: BADGE_CONSTANTS.OFFSET_RIGHT,
    minWidth: BADGE_CONSTANTS.MIN_SIZE,
    height: BADGE_CONSTANTS.MIN_SIZE,
    borderRadius: BADGE_CONSTANTS.MIN_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: FONT_SIZES['2xs'],
    fontWeight: '600',
  },
});
