// src/components/ui/FloatingGlassTabBar.tsx
// Floating liquid glass tab bar for iOS 26+ with animated selector
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlassView, LiquidGlassContainerView, isLiquidGlassSupported } from '@/lib/liquid-glass';
import { BlurView } from 'expo-blur';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { useTheme, useThemeColors } from '@/contexts/ThemeContext';
import { GLASS_INTENSITY } from '@/constants/design-tokens';
import { TAB_BAR_BOTTOM_OFFSET } from './tab-bar-constants';
import { TabBarButton } from './TabBarButton';
import { useTabBarSelector } from './useTabBarSelector';
import { styles } from './tab-bar-styles';

// Re-export constants so existing imports continue to work
export {
  TAB_BAR_HEIGHT,
  TAB_BAR_BOTTOM_OFFSET,
  TAB_BAR_SAFE_PADDING,
  FAB_BOTTOM_OFFSET,
  FAB_RIGHT_MARGIN,
  FAB_LEFT_MARGIN,
  FAB_Z_INDEX,
  FAB_SIZE,
} from './tab-bar-constants';

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
      } catch (err) {
        if (__DEV__) {
          console.warn(`[FloatingGlassTabBar] tabBarButton() threw for route "${route.name}":`, (err as Error)?.message);
        }
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

  const {
    selectorStyle,
    selectorDragGesture,
    containerWidth,
    isLayoutReady,
    onTabLayout,
    onTabContentLayout,
    navigateToTab,
  } = useTabBarSelector({
    state,
    navigation,
    visibleRoutes,
    visibleToActualIndex,
    activeVisibleIndex,
  });

  // ─────────────────────────────────────────────────────────────
  // FALLBACK: Non-iOS 26 devices get blurred pill tab bar
  // ─────────────────────────────────────────────────────────────
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
              return (
                <TabBarButton
                  key={route.key}
                  routeKey={route.key}
                  routeName={route.name}
                  title={options.title}
                  isFocused={isFocused}
                  badge={options.tabBarBadge}
                  tabBarIcon={options.tabBarIcon}
                  colors={colors}
                  showFocusedBackground
                  onTabLayout={(e) => onTabLayout(visibleIndex, e)}
                  onTabContentLayout={(e) => onTabContentLayout(visibleIndex, e)}
                  onPress={() => navigateToTab(visibleIndex)}
                />
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
          return (
            <TabBarButton
              key={route.key}
              routeKey={route.key}
              routeName={route.name}
              title={options.title}
              isFocused={isFocused}
              badge={options.tabBarBadge}
              tabBarIcon={options.tabBarIcon}
              colors={colors}
              onTabLayout={(e) => onTabLayout(visibleIndex, e)}
              onTabContentLayout={(e) => onTabContentLayout(visibleIndex, e)}
              onPress={() => navigateToTab(visibleIndex)}
            />
          );
        })}
      </View>
    </View>
  );
}
