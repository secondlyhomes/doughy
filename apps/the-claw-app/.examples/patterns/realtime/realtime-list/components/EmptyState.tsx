/**
 * EmptyState Component
 *
 * Displayed when the task list is empty.
 */

import React from 'react';
import { View, Text } from 'react-native';
import type { EmptyStateProps } from '../types';
import { styles } from '../styles';

export function EmptyState({
  message = 'No tasks yet',
  submessage = 'Create a task above to get started',
}: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{message}</Text>
      <Text style={styles.emptySubtext}>{submessage}</Text>
    </View>
  );
}
