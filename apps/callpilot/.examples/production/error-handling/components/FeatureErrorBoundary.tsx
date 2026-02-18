/**
 * Feature Error Boundary
 *
 * Lightweight boundary for individual features.
 * Provides minimal fallback without crashing entire app.
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ErrorBoundary } from './ErrorBoundary';

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName: string;
}

export function FeatureErrorBoundary({
  children,
  featureName,
}: FeatureErrorBoundaryProps): JSX.Element {
  return (
    <ErrorBoundary
      fallback={<FeatureFallback featureName={featureName} />}
      isolate
    >
      {children}
    </ErrorBoundary>
  );
}

function FeatureFallback({ featureName }: { featureName: string }) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={32} color="#ef4444" />
      <Text style={styles.text}>Unable to load {featureName}</Text>
      <Text style={styles.subtext}>Please try again later</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  subtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
});
