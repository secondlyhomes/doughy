/**
 * LoadingState Component
 *
 * Displays a loading indicator while data is being fetched.
 */

import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/tokens';
import { styles } from '../styles';

/**
 * Loading state display with activity indicator
 *
 * @example
 * ```tsx
 * <LoadingState />
 * ```
 */
export function LoadingState() {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={colors.primary[500]} />
    </View>
  );
}
