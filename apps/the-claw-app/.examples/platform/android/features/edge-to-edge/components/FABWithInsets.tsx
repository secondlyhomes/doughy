/**
 * FABWithInsets Component
 *
 * Floating Action Button positioned with system inset awareness.
 */

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useEdgeToEdge } from '../hooks/useEdgeToEdge';
import { FABWithInsetsProps } from '../types';

/**
 * Floating Action Button with automatic inset positioning
 *
 * Positions the FAB above the navigation bar and away from
 * screen edges, accounting for system insets.
 *
 * @example
 * ```tsx
 * <FABWithInsets
 *   onPress={handleAdd}
 *   icon={<PlusIcon />}
 * />
 * ```
 */
export function FABWithInsets({
  onPress,
  icon,
  style,
}: FABWithInsetsProps) {
  const { insets } = useEdgeToEdge();

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          bottom: 16 + insets.bottom,
          right: 16 + insets.right,
        },
        style,
      ]}
      onPress={onPress}
    >
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6750A4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
});
