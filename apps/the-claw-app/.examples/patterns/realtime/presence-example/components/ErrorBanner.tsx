/**
 * ErrorBanner Component
 *
 * Displays connection error messages.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles';

interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}
