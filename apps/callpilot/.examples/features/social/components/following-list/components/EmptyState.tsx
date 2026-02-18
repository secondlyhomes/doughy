/**
 * EmptyState Component
 *
 * Displays a message when the following list is empty.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles';
import type { EmptyStateProps } from '../types';

const DEFAULT_MESSAGE = 'Not following anyone yet';

/**
 * Empty state display for the following list
 *
 * @example
 * ```tsx
 * <EmptyState message="No users found" />
 * ```
 */
export function EmptyState({ message = DEFAULT_MESSAGE }: EmptyStateProps) {
  return (
    <View style={styles.centerContainer}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}
