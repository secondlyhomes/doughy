/**
 * Predictive Back Animation Presets
 *
 * Pre-built animation styles for back gestures
 */

import { Animated } from 'react-native';
import type { AnimationStyle } from '../types';

/**
 * Animation preset functions
 */
export const BackAnimations = {
  /**
   * Scale down animation (Material Design default)
   */
  scaleDown(animationValue: Animated.Value): AnimationStyle {
    return {
      transform: [
        {
          scale: animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.9],
          }),
        },
      ],
      opacity: animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.5],
      }),
    };
  },

  /**
   * Slide to edge animation
   */
  slideToEdge(
    animationValue: Animated.Value,
    edge: 'left' | 'right' = 'right'
  ): AnimationStyle {
    const translateX = animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, edge === 'right' ? 100 : -100],
    });

    return {
      transform: [{ translateX }],
    };
  },

  /**
   * Slide and scale animation
   */
  slideAndScale(
    animationValue: Animated.Value,
    edge: 'left' | 'right' = 'right'
  ): AnimationStyle {
    const translateX = animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, edge === 'right' ? 50 : -50],
    });

    const scale = animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.95],
    });

    return {
      transform: [{ translateX }, { scale }],
    };
  },

  /**
   * Reveal previous screen animation
   */
  reveal(animationValue: Animated.Value): AnimationStyle {
    const translateX = animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 300],
    });

    return {
      transform: [{ translateX }],
    };
  },

  /**
   * Parallax effect
   */
  parallax(animationValue: Animated.Value, depth: number = 0.3): AnimationStyle {
    const translateX = animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 300 * depth],
    });

    return {
      transform: [{ translateX }],
    };
  },
};

/**
 * Type for animation preset keys
 */
export type BackAnimationType = keyof typeof BackAnimations;
