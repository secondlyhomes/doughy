/**
 * NavigationStackItem Component
 *
 * Stack navigation item with predictive back animations
 */

import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { usePredictiveBack } from '../hooks/usePredictiveBack';

interface NavigationStackItemProps {
  /** Whether this is the currently active screen */
  isActive: boolean;
  /** Child components to render */
  children: React.ReactNode;
  /** Callback when navigating back */
  onNavigateBack: () => void;
  /** Index in the navigation stack */
  index: number;
}

/**
 * Navigation stack item with slide and reveal animations
 *
 * Active screen slides right, previous screen reveals from left
 *
 * @example
 * ```tsx
 * <NavigationStackItem
 *   isActive={currentIndex === index}
 *   onNavigateBack={() => navigation.goBack()}
 *   index={index}
 * >
 *   <ScreenContent />
 * </NavigationStackItem>
 * ```
 */
export function NavigationStackItem({
  isActive,
  children,
  onNavigateBack,
}: NavigationStackItemProps) {
  const { animationValue } = usePredictiveBack({
    onBackInvoked: onNavigateBack,
  });

  // Current screen slides right and scales down
  const currentScreenStyle = {
    transform: [
      {
        translateX: animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 300],
        }),
      },
      {
        scale: animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.9],
        }),
      },
    ],
  };

  // Previous screen reveals from left with parallax
  const previousScreenStyle = {
    transform: [
      {
        translateX: animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [-100, 0],
        }),
      },
    ],
    opacity: animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
    }),
  };

  const animationStyle = isActive ? currentScreenStyle : previousScreenStyle;

  return (
    <Animated.View style={[styles.container, animationStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
