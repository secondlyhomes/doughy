/**
 * SafeAreaView Component
 *
 * View component that applies safe area insets as padding.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useEdgeToEdge } from '../hooks/useEdgeToEdge';
import { SafeAreaViewProps } from '../types';

/**
 * Safe area view with configurable edge padding
 *
 * Automatically applies padding based on system insets
 * for the specified edges.
 *
 * @example
 * ```tsx
 * <SafeAreaView edges={['top', 'bottom']}>
 *   <MyContent />
 * </SafeAreaView>
 * ```
 */
export function SafeAreaView({
  children,
  edges = ['top', 'bottom', 'left', 'right'],
  style,
}: SafeAreaViewProps) {
  const { insets } = useEdgeToEdge();

  const paddingStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View style={[styles.safeArea, paddingStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
