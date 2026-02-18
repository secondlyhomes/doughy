/**
 * LoadingFooter Component
 *
 * Displays loading indicator at the bottom of the list during pagination.
 */

import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { styles, colors } from '../styles';
import type { LoadingFooterProps } from '../types';

/**
 * Footer loading indicator for infinite scroll
 *
 * Shows a small spinner when loading more notifications.
 */
export function LoadingFooter({ loading }: LoadingFooterProps) {
  if (!loading) {
    return null;
  }

  return (
    <View style={styles.footer}>
      <ActivityIndicator size="small" color={colors.primary[500]} />
    </View>
  );
}
