/**
 * SmallWidget.tsx
 *
 * Small (2x2) iOS Home Screen Widget
 * Shows task count and completion percentage
 */

import React from 'react';
import { View, Text } from 'react-native';
import type { SmallWidgetProps } from './types';
import { getWidgetStyles, calculatePercentage } from './utils/widget-utils';

/**
 * Small widget displays:
 * - Widget title
 * - Circular progress indicator with percentage
 * - Completion stats (X/Y completed)
 */
export function SmallWidget({
  completedCount,
  totalCount,
  colorScheme
}: SmallWidgetProps) {
  const percentage = calculatePercentage(completedCount, totalCount);
  const styles = getWidgetStyles(colorScheme);

  return (
    <View style={[styles.container, styles.smallContainer]}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
      </View>

      <View style={styles.circularProgress}>
        <Text style={styles.percentageText}>{percentage}%</Text>
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          {completedCount}/{totalCount}
        </Text>
        <Text style={styles.statsLabel}>completed</Text>
      </View>
    </View>
  );
}
