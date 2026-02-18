/**
 * LoadingState Component
 *
 * Full-screen loading indicator for initial data fetch.
 */

import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { styles } from '../styles';

export function LoadingState() {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#4ECDC4" />
      <Text style={styles.loadingText}>Loading tasks...</Text>
    </View>
  );
}
