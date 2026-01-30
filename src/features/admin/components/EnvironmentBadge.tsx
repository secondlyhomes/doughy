// src/features/admin/components/EnvironmentBadge.tsx
// Visual badge showing the current environment (PROD/STAGE/DEV)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import {
  detectEnvironment,
  getEnvironmentLabel,
  getEnvironmentColor,
} from '../utils/environmentUtils';

/**
 * EnvironmentBadge shows the current environment based on Supabase URL
 *
 * Colors:
 * - Green: Production
 * - Yellow/Orange: Staging
 * - Blue: Development
 */
export const EnvironmentBadge = React.memo(function EnvironmentBadge() {
  const colors = useThemeColors();

  const env = detectEnvironment();
  const label = getEnvironmentLabel(env);
  const color = getEnvironmentColor(env, colors);

  return (
    <View style={[styles.badge, { backgroundColor: withOpacity(color, 'muted') }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
