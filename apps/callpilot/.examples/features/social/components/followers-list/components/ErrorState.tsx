/**
 * Error State Component
 *
 * Displays when there's an error loading followers.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { styles } from '../styles';
import type { ErrorStateProps } from '../types';

/**
 * Error state with retry button
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
