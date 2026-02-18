/**
 * EdgeToEdgeContainer Component
 *
 * Container component that enables edge-to-edge display mode.
 */

import React from 'react';
import { View, StatusBar, StyleSheet } from 'react-native';
import { useEdgeToEdge } from '../hooks/useEdgeToEdge';
import { EdgeToEdgeContainerProps } from '../types';

/**
 * Container that enables edge-to-edge display
 *
 * Wraps children in a full-screen container with transparent
 * status bar and edge-to-edge enabled.
 *
 * @example
 * ```tsx
 * <EdgeToEdgeContainer backgroundColor="#f5f5f5">
 *   <MyContent />
 * </EdgeToEdgeContainer>
 * ```
 */
export function EdgeToEdgeContainer({
  children,
  style,
  backgroundColor = '#FFFFFF',
}: EdgeToEdgeContainerProps) {
  useEdgeToEdge();

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
