/**
 * ErrorState Component
 *
 * Displays an error message with retry button.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { styles } from '../styles';
import type { ErrorStateProps } from '../types';

/**
 * Error state display with retry functionality
 *
 * @example
 * ```tsx
 * <ErrorState
 *   message="Failed to load following"
 *   onRetry={() => refetch()}
 * />
 * ```
 */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.centerContainer}>
      <Text style={styles.errorText}>{message}</Text>
      <Pressable onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  );
}
