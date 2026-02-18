/**
 * BottomSheetWithInsets Component
 *
 * Bottom sheet component that respects system navigation insets.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useEdgeToEdge } from '../hooks/useEdgeToEdge';
import { BottomSheetWithInsetsProps } from '../types';

/**
 * Bottom sheet with automatic navigation bar padding
 *
 * Adds padding at the bottom to ensure content is not
 * obscured by the navigation bar or gesture area.
 *
 * @example
 * ```tsx
 * <BottomSheetWithInsets>
 *   <Text>Sheet Content</Text>
 *   <Button title="Action" onPress={handleAction} />
 * </BottomSheetWithInsets>
 * ```
 */
export function BottomSheetWithInsets({
  children,
  style,
}: BottomSheetWithInsetsProps) {
  const { insets } = useEdgeToEdge();

  return (
    <View
      style={[
        styles.bottomSheet,
        { paddingBottom: insets.bottom },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
});
