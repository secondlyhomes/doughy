// src/components/ui/useTabBarSelector.ts
// Hook encapsulating selector animation, drag gesture, and tab layout tracking

import { useCallback, useState, useEffect } from 'react';
import { LayoutChangeEvent } from 'react-native';
import { useSharedValue, useAnimatedStyle, withSpring, runOnJS, cancelAnimation, withTiming, interpolate } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import { NavigationHelpers, ParamListBase, TabNavigationState } from '@react-navigation/native';
import { BottomTabNavigationEventMap } from '@react-navigation/bottom-tabs';
import { SELECTOR_SIZE, SPRING_CONFIG } from './tab-bar-constants';
import { triggerHaptic } from './tab-bar-helpers';

interface TabLayout {
  x: number;
  width: number;
  contentWidth?: number;
}

interface UseTabBarSelectorParams {
  state: TabNavigationState<ParamListBase>;
  navigation: NavigationHelpers<ParamListBase, BottomTabNavigationEventMap>;
  visibleRoutes: TabNavigationState<ParamListBase>['routes'];
  visibleToActualIndex: number[];
  activeVisibleIndex: number;
}

export function useTabBarSelector({
  state,
  navigation,
  visibleRoutes,
  visibleToActualIndex,
  activeVisibleIndex,
}: UseTabBarSelectorParams) {
  // Track tab positions for selector animation
  const [tabLayouts, setTabLayouts] = useState<TabLayout[]>([]);
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

  const isLayoutReady = tabLayouts.length === visibleRoutes.length && tabLayouts.every(t => t && t.contentWidth);

  return {
    tabLayouts,
    selectorStyle,
    selectorDragGesture,
    containerWidth,
    isLayoutReady,
    onTabLayout,
    onTabContentLayout,
    navigateToTab,
  };
}
