/**
 * PredictiveBackModal Component
 *
 * Modal with predictive back gesture support
 */

import React from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { usePredictiveBack } from '../hooks/usePredictiveBack';

interface PredictiveBackModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal content */
  children: React.ReactNode;
}

/**
 * Bottom sheet modal with predictive back gesture support
 *
 * @example
 * ```tsx
 * <PredictiveBackModal visible={isOpen} onClose={() => setIsOpen(false)}>
 *   <ModalContent />
 * </PredictiveBackModal>
 * ```
 */
export function PredictiveBackModal({
  visible,
  onClose,
  children,
}: PredictiveBackModalProps) {
  const { animationValue } = usePredictiveBack({
    onBackInvoked: onClose,
  });

  const backdropOpacity = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  const modalTranslateY = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 500],
  });

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />

      {/* Modal content */}
      <Animated.View
        style={[styles.modal, { transform: [{ translateY: modalTranslateY }] }]}
      >
        {children}
      </Animated.View>
    </View>
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
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  modal: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
  },
});
