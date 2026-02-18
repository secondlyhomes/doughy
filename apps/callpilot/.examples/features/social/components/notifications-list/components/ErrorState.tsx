/**
 * ErrorState Component
 *
 * Displays error message with retry button.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { styles } from '../styles';
import type { ErrorStateProps } from '../types';

/**
 * Error state for the notifications list
 *
 * Shows an error message and provides a retry button.
 */
export function ErrorState({ errorMessage, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.centerContainer}>
      <Text style={styles.errorText}>{errorMessage}</Text>
      <Pressable onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  );
}
