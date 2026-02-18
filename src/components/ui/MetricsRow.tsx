// src/components/ui/MetricsRow.tsx
// Reusable metrics row component for displaying 2-4 metrics in a horizontal layout

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '@/constants/design-tokens';

export interface Metric {
  label: string;
  value: string;
  /** Optional color for the value text */
  color?: string;
}

export interface MetricsRowProps {
  /** Array of 2-4 metrics to display */
  metrics: Metric[];
  /** Size variant for the metrics display */
  size?: 'sm' | 'md';
  /** Whether to show dividers between metrics */
  showDividers?: boolean;
}

/**
 * Resolves semantic color names to actual hex values.
 * Supports both semantic names (e.g., 'success') and direct hex values (e.g., '#22c55e').
 */
function resolveColor(
  color: string | undefined,
  colors: ReturnType<typeof useThemeColors>
): string {
  if (!color) return colors.foreground;

  // Map of semantic color names to theme colors
  const semanticColors: Record<string, string> = {
    success: colors.success,
    warning: colors.warning,
    info: colors.info,
    destructive: colors.destructive,
    muted: colors.mutedForeground,
    primary: colors.primary,
  };

  return semanticColors[color] || color;
}

function MetricsRowComponent({
  metrics,
  size = 'md',
  showDividers = false,
}: MetricsRowProps) {
  const colors = useThemeColors();

  const labelSize = size === 'sm' ? FONT_SIZES.xs : FONT_SIZES.sm;
  const valueSize = size === 'sm' ? FONT_SIZES.sm : FONT_SIZES.base;

  return (
    <View style={styles.container}>
      {metrics.map((metric, index) => (
        <React.Fragment key={`${metric.label}-${index}`}>
          <View style={styles.metric}>
            <Text
              style={[styles.label, { color: colors.mutedForeground, fontSize: labelSize }]}
              numberOfLines={1}
            >
              {metric.label}
            </Text>
            <Text
              style={[
                styles.value,
                {
                  color: resolveColor(metric.color, colors),
                  fontSize: valueSize,
                },
              ]}
              numberOfLines={1}
            >
              {metric.value}
            </Text>
          </View>
          {showDividers && index < metrics.length - 1 && (
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  metric: {
    flex: 1,
  },
  label: {
    marginBottom: 2,
  },
  value: {
    fontWeight: '600',
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginHorizontal: SPACING.xs,
  },
});

export const MetricsRow = memo(MetricsRowComponent);
