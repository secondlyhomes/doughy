/**
 * GroupedMetricsList Component
 *
 * Displays metrics grouped by a specified dimension (e.g., screen).
 */

import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useGroupedMetrics } from '../hooks/useMetrics';
import { styles } from './metrics-dashboard.styles';
import { GroupedMetricsListProps } from './types';

export function GroupedMetricsList({
  metricName,
  groupBy,
  fromDate,
  toDate,
}: GroupedMetricsListProps): JSX.Element {
  const { grouped, isLoading } = useGroupedMetrics(metricName, groupBy, {
    fromDate,
    toDate,
  });

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (grouped.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.groupedList}>
      {grouped
        .sort((a, b) => b.stats.avg_value - a.stats.avg_value)
        .map(({ key, stats }) => (
          <View key={key} style={styles.groupedItem}>
            <Text style={styles.groupedKey}>{key}</Text>
            <View style={styles.groupedStats}>
              <View style={styles.groupedStat}>
                <Text style={styles.groupedStatLabel}>Avg</Text>
                <Text style={styles.groupedStatValue}>
                  {stats.avg_value.toFixed(0)}
                </Text>
              </View>
              <View style={styles.groupedStat}>
                <Text style={styles.groupedStatLabel}>P95</Text>
                <Text style={styles.groupedStatValue}>
                  {stats.p95.toFixed(0)}
                </Text>
              </View>
              <View style={styles.groupedStat}>
                <Text style={styles.groupedStatLabel}>Count</Text>
                <Text style={styles.groupedStatValue}>{stats.sample_count}</Text>
              </View>
            </View>
          </View>
        ))}
    </View>
  );
}
