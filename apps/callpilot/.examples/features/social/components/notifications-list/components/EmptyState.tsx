/**
 * EmptyState Component
 *
 * Displays loading indicator or empty message when there are no notifications.
 */

import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { styles, colors } from '../styles';
import type { EmptyStateProps } from '../types';

/**
 * Empty state for the notifications list
 *
 * Shows a loading spinner when initially loading,
 * or an empty message when there are no notifications.
 */
export function EmptyState({ loading, hasNotifications }: EmptyStateProps) {
  if (loading && !hasNotifications) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.centerContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyText}>No notifications</Text>
      <Text style={styles.emptySubtext}>You're all caught up!</Text>
    </View>
  );
}
