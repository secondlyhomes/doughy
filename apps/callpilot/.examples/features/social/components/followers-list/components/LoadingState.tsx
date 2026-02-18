/**
 * Loading State Component
 *
 * Displays while followers are being loaded.
 */

import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/tokens';
import { styles } from '../styles';
import type { LoadingStateProps } from '../types';

/**
 * Loading state with activity indicator
 */
export function LoadingState({ size = 'large' }: LoadingStateProps) {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size={size} color={colors.primary[500]} />
    </View>
  );
}
