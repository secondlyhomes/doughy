// src/components/ui/FloatingGlassTabBar.tsx
// Production-ready floating liquid glass tab bar with draggable selector
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LiquidGlassView,
  LiquidGlassContainerView,
  isLiquidGlassSupported,
} from '@callstack/liquid-glass';
import { BlurView } from 'expo-blur';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
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

// Constants
const SELECTOR_SIZE = 52;
const TAB_BAR_HEIGHT = 60;
const PILL_BORDER_RADIUS = 30;
const SPRING_CONFIG = { damping: 20, stiffness: 300 };

export interface FloatingGlassTabBarProps extends BottomTabBarProps {
  /** Show the draggable selector. Default: true */
  showSelector?: boolean;
  /** Horizontal margin from screen edges. Default: 16 */
  horizontalMargin?: number;
  /** Bottom offset from safe area. Default: 8 */
  bottomOffset?: number;
}

export function FloatingGlassTabBar({
  state,
  descriptors,
  navigation,
  showSelector = true,
  horizontalMargin = 16,
  bottomOffset = 8,
}: FloatingGlassTabBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { isDark } = useTheme();

  // Track tab positions for hit detection
  const [tabLayouts, setTabLayouts] = useState<{ x: number; width: number }[]>([]);
  const containerWidth = useRef(0);
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  // Animated selector position
  const selectorX = useSharedValue(0);

  // Calculate tab center X position
  const getTabCenterX = useCallback((index: number) => {
    if (tabLayouts[index]) {
      return tabLayouts[index].x + tabLayouts[index].width / 2 - SELECTOR_SIZE / 2;
    }
    return 0;
  }, [tabLayouts]);

  // Initialize selector position when layouts are ready
  useEffect(() => {
    if (tabLayouts.length === state.routes.length && tabLayouts.every(t => t)) {
      setIsLayoutReady(true);
      selectorX.value = withSpring(getTabCenterX(state.index), SPRING_CONFIG);
    }
  }, [tabLayouts, state.routes.length, getTabCenterX, state.index, selectorX]);

  // Update selector when active tab changes externally
  useEffect(() => {
    if (isLayoutReady) {
      selectorX.value = withSpring(getTabCenterX(state.index), SPRING_CONFIG);
    }
  }, [state.index, isLayoutReady, getTabCenterX, selectorX]);

  // Navigate to tab with haptic feedback
  const navigateToTab = useCallback((index: number) => {
    if (index === state.index) return; // Already on this tab

    const route = state.routes[index];
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      triggerHaptic(); // Safe - won't crash if native module not linked
      navigation.navigate(route.name);
    }
  }, [state.index, state.routes, navigation]);

  // Find nearest tab index from X position
  const findNearestTab = useCallback((centerX: number): number => {
    let nearestIndex = state.index;
    let nearestDistance = Infinity;

    for (let i = 0; i < tabLayouts.length; i++) {
      const tab = tabLayouts[i];
      if (tab) {
        const tabCenter = tab.x + tab.width / 2;
        const distance = Math.abs(centerX - tabCenter);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }
    }
    return nearestIndex;
  }, [tabLayouts, state.index]);

  // Pan gesture for dragging selector
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const maxX = containerWidth.current - SELECTOR_SIZE - 8;
      selectorX.value = Math.max(8, Math.min(e.x - SELECTOR_SIZE / 2, maxX));
    })
    .onEnd(() => {
      const centerX = selectorX.value + SELECTOR_SIZE / 2;
      const targetIndex = findNearestTab(centerX);
      selectorX.value = withSpring(getTabCenterX(targetIndex), SPRING_CONFIG);
      runOnJS(navigateToTab)(targetIndex);
    });

  // Tap gesture for direct tab selection
  const tapGesture = Gesture.Tap()
    .onEnd((e) => {
      for (let i = 0; i < tabLayouts.length; i++) {
        const tab = tabLayouts[i];
        if (tab && e.x >= tab.x && e.x <= tab.x + tab.width) {
          selectorX.value = withSpring(getTabCenterX(i), SPRING_CONFIG);
          runOnJS(navigateToTab)(i);
          break;
        }
      }
    });

  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  const selectorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: selectorX.value }],
  }));

  const onTabLayout = useCallback((index: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setTabLayouts(prev => {
      const updated = [...prev];
      updated[index] = { x, width };
      return updated;
    });
  }, []);

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    containerWidth.current = e.nativeEvent.layout.width;
  }, []);

  // Render tab icon with optional badge
  const renderTab = (route: typeof state.routes[0], index: number) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;
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
        onLayout={(e) => onTabLayout(index, e)}
      >
        <View style={styles.iconContainer}>
          {icon}
          {badge != null && (
            <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
              <Text style={styles.badgeText}>
                {typeof badge === 'number' && badge > 99 ? '99+' : badge}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

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
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === index;
              const icon = options.tabBarIcon?.({
                focused: isFocused,
                color: isFocused ? colors.primary : colors.mutedForeground,
                size: 24,
              });
              return (
                <View
                  key={route.key}
                  style={[styles.tab, isFocused && styles.tabFocused]}
                  onTouchEnd={() => navigateToTab(index)}
                >
                  {icon}
                </View>
              );
            })}
          </View>
        </BlurView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // LIQUID GLASS: iOS 26+ with true glass effect
  // ─────────────────────────────────────────────────────────────
  return (
    <View style={[
      styles.wrapper,
      { bottom: insets.bottom + bottomOffset, left: horizontalMargin, right: horizontalMargin }
    ]}>
      {/* Glass container for proper blending between pill and selector */}
      <LiquidGlassContainerView spacing={8} style={StyleSheet.absoluteFillObject}>
        {/* 1. Pill background - liquid glass */}
        <LiquidGlassView
          style={styles.pill}
          effect="regular"
          colorScheme={isDark ? 'dark' : 'light'}
        />

        {/* 2. Selector circle - liquid glass with interactive highlight */}
        {showSelector && isLayoutReady && (
          <Animated.View style={[styles.selectorWrapper, selectorStyle]}>
            <LiquidGlassView
              style={styles.selector}
              effect="clear"
              interactive
              colorScheme={isDark ? 'dark' : 'light'}
            />
          </Animated.View>
        )}
      </LiquidGlassContainerView>

      {/* 3. Icons layer - on top for gesture handling */}
      <GestureDetector gesture={composedGesture}>
        <View style={styles.iconsLayer} onLayout={onContainerLayout}>
          {state.routes.map(renderTab)}
        </View>
      </GestureDetector>
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
