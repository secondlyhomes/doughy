/**
 * PredictiveBackScreen Component
 *
 * Wrapper component that adds predictive back animation to children
 */

import React from 'react';
import { Animated } from 'react-native';
import { usePredictiveBack } from '../hooks/usePredictiveBack';
import { BackAnimations, type BackAnimationType } from '../utils/animations';

interface PredictiveBackScreenProps {
  /** Child components to render */
  children: React.ReactNode;
  /** Callback when back gesture completes */
  onBack: () => void | Promise<void>;
  /** Animation preset to use */
  animationType?: BackAnimationType;
}

/**
 * Screen wrapper with predictive back gesture support
 *
 * @example
 * ```tsx
 * <PredictiveBackScreen onBack={() => navigation.goBack()}>
 *   <YourScreenContent />
 * </PredictiveBackScreen>
 * ```
 */
export function PredictiveBackScreen({
  children,
  onBack,
  animationType = 'scaleDown',
}: PredictiveBackScreenProps) {
  const { animationValue } = usePredictiveBack({
    onBackInvoked: onBack,
  });

  const animationStyle = BackAnimations[animationType](animationValue);

  return (
    <Animated.View style={[{ flex: 1 }, animationStyle]}>
      {children}
    </Animated.View>
  );
}
