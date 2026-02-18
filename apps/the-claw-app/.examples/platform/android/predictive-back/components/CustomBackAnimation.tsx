/**
 * CustomBackAnimation Component
 *
 * Provides animation value for custom back gesture animations
 */

import React from 'react';
import { Animated } from 'react-native';
import { usePredictiveBack } from '../hooks/usePredictiveBack';
import type { BackGestureEvent } from '../types';

interface CustomBackAnimationProps {
  /** Render function that receives animation value */
  children: (animationValue: Animated.Value) => React.ReactNode;
  /** Callback when back gesture completes */
  onBack: () => void | Promise<void>;
  /** Callback when back gesture starts */
  onBackStarted?: (event: BackGestureEvent) => void;
  /** Callback as back gesture progresses */
  onBackProgressed?: (event: BackGestureEvent) => void;
  /** Callback when back gesture is cancelled */
  onBackCancelled?: () => void;
}

/**
 * Component for custom back gesture animations
 *
 * @example
 * ```tsx
 * <CustomBackAnimation onBack={handleBack}>
 *   {(animValue) => (
 *     <Animated.View style={{ opacity: animValue }}>
 *       <Content />
 *     </Animated.View>
 *   )}
 * </CustomBackAnimation>
 * ```
 */
export function CustomBackAnimation({
  children,
  onBack,
  onBackStarted,
  onBackProgressed,
  onBackCancelled,
}: CustomBackAnimationProps) {
  const { animationValue } = usePredictiveBack({
    onBackStarted,
    onBackProgressed,
    onBackCancelled,
    onBackInvoked: onBack,
  });

  return <>{children(animationValue)}</>;
}
