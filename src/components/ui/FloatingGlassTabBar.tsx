// src/components/ui/FloatingGlassTabBar.tsx
// Floating liquid glass tab bar for iOS 26+ with animated selector
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, LayoutChangeEvent, PanResponder } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlassView, LiquidGlassContainerView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, cancelAnimation } from 'react-native-reanimated';
import { useTheme, useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

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
export const TAB_BAR_HEIGHT = 80;
export const TAB_BAR_BOTTOM_OFFSET = 0;
/** Safe padding for content to clear the floating tab bar */
export const TAB_BAR_SAFE_PADDING = 100;

/** Standard FAB positioning */
export const FAB_BOTTOM_OFFSET = 148;
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

// Tab labels mapping
const TAB_LABELS: Record<string, string> = {
  index: 'Inbox',
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
  const [tabLayouts, setTabLayouts] = useState<{ x: number; width: number }[]>([]);
  const selectorX = useSharedValue(0);

  // Drag state management
  const isDragging = useRef(false);
  const dragStartX = useRef(0); // Store initial position when drag starts
  const containerWidth = useRef(0);

  // PanResponder for draggable selector
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // EDGE CASE 1: Prevent drag if container not measured
        if (containerWidth.current === 0) return false;

        // EDGE CASE 2: Prevent drag if tab layouts not ready
        if (tabLayouts.length === 0 || !tabLayouts.every(t => t)) return false;

        // 5px threshold prevents accidental drag (preserves tap)
        // Horizontal-only drag
        return Math.abs(gestureState.dx) > 5 &&
               Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },

      onPanResponderGrant: () => {
        isDragging.current = true;

        // EDGE CASE 3: Cancel any running spring animation
        cancelAnimation(selectorX);

        // Store the starting position
        dragStartX.current = selectorX.value;
      },

      onPanResponderMove: (_, gestureState) => {
        // Update selectorX directly (Reanimated shared value)
        const newX = dragStartX.current + gestureState.dx;

        const minX = 8; // Left padding
        const maxX = containerWidth.current - SELECTOR_SIZE - 8; // Right boundary

        // EDGE CASE 4: Clamp to boundaries (prevents infinity loops)
        selectorX.value = Math.max(minX, Math.min(newX, maxX));
      },

      onPanResponderRelease: () => {
        isDragging.current = false;

        // Find nearest tab based on current position
        const centerX = selectorX.value + SELECTOR_SIZE / 2;

        let nearestIndex = 0;
        let minDistance = Infinity;

        tabLayouts.forEach((layout, index) => {
          if (!layout) return;
          const tabCenterX = layout.x + layout.width / 2;
          const distance = Math.abs(tabCenterX - centerX);
          if (distance < minDistance) {
            minDistance = distance;
            nearestIndex = index;
          }
        });

        // EDGE CASE 5: Don't call withSpring here - let useEffect handle it
        // The useEffect watches activeVisibleIndex and will spring selector
        // to the correct position when navigation completes
        runOnJS(navigateToTab)(nearestIndex);

        // Selector stays at release position, then useEffect springs it to tab
      },
    })
  ).current;

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
    // Don't navigate if dragging to avoid conflicts
    if (isDragging.current) return;

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
      <View
        style={[
          styles.wrapper,
          { bottom: insets.bottom + bottomOffset, left: horizontalMargin, right: horizontalMargin }
        ]}
        onLayout={(e) => {
          containerWidth.current = e.nativeEvent.layout.width;
        }}
      >
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
              const label = TAB_LABELS[route.name] || route.name;
              const icon = options.tabBarIcon?.({
                focused: isFocused,
                color: isFocused ? colors.primary : colors.mutedForeground,
                size: 24,
              });
              return (
                <View
                  key={route.key}
                  style={[
                    styles.tab,
                    isFocused && {
                      backgroundColor: withOpacity(colors.primary, 'light'),
                      borderRadius: 12,
                      marginHorizontal: 4,
                    },
                  ]}
                  onTouchEnd={() => navigateToTab(visibleIndex)}
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
    <View
      style={[
        styles.wrapper,
        { bottom: insets.bottom + bottomOffset, left: horizontalMargin, right: horizontalMargin }
      ]}
      onLayout={(e) => {
        containerWidth.current = e.nativeEvent.layout.width;
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

        {/* Animated selector circle - Draggable */}
        {isLayoutReady && activeVisibleIndex >= 0 && (
          <Animated.View
            style={[styles.selectorWrapper, selectorStyle]}
            pointerEvents="auto"
            {...panResponder.panHandlers}
          >
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
          const label = TAB_LABELS[route.name] || route.name;
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
              <Text style={[styles.label, { color: isFocused ? colors.primary : colors.mutedForeground }]}>
                {label}
              </Text>
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
  iconContainer: {
    position: 'relative',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
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
    fontSize: 10,
    fontWeight: '600',
  },
});
