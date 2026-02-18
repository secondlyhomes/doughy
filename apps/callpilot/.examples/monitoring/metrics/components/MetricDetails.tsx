/**
 * MetricDetails Component
 *
 * Displays detailed statistics for a selected metric.
 */

import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useMetricStats } from '../hooks/useMetrics';
import { styles } from './metrics-dashboard.styles';
import { MetricDetailsProps, DetailRowProps } from './types';

/**
 * Detail Row Component
 */
function DetailRow({ label, value }: DetailRowProps): JSX.Element {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export function MetricDetails({
  metricName,
  fromDate,
  toDate,
}: MetricDetailsProps): JSX.Element {
  const { stats, isLoading } = useMetricStats(metricName, { fromDate, toDate });

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.detailsCard}>
      <DetailRow label="Average" value={stats.avg_value.toFixed(2)} />
      <DetailRow label="Minimum" value={stats.min_value.toFixed(2)} />
      <DetailRow label="Maximum" value={stats.max_value.toFixed(2)} />
      <DetailRow label="50th Percentile" value={stats.p50.toFixed(2)} />
      <DetailRow label="95th Percentile" value={stats.p95.toFixed(2)} />
      <DetailRow label="99th Percentile" value={stats.p99.toFixed(2)} />
      <DetailRow label="Sample Count" value={stats.sample_count.toString()} />
    </View>
  );
}
