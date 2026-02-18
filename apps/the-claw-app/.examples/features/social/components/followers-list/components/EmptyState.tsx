/**
 * Empty State Component
 *
 * Displays when there are no followers to show.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles';
import type { EmptyStateProps } from '../types';

/**
 * Empty state for followers list
 */
export function EmptyState({ message = 'No followers yet' }: EmptyStateProps) {
  return (
    <View style={styles.centerContainer}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}
