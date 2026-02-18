/**
 * MetricCard Component
 *
 * Displays a single metric with its stats in a card format.
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useMetricStats } from '../hooks/useMetrics';
import { styles } from './metrics-dashboard.styles';
import { MetricCardProps, getMetricLabel, getMetricUnit } from './types';

export function MetricCard({
  metricName,
  fromDate,
  toDate,
  isSelected,
  onPress,
}: MetricCardProps): JSX.Element {
  const { stats, isLoading } = useMetricStats(metricName, { fromDate, toDate });

  return (
    <TouchableOpacity
      style={[styles.metricCard, isSelected && styles.metricCardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#2196F3" />
      ) : (
        <>
          <Text style={styles.metricLabel}>{getMetricLabel(metricName)}</Text>
          <Text style={styles.metricValue}>
            {stats?.avg_value.toFixed(1) || '-'}
            <Text style={styles.metricUnit}> {getMetricUnit(metricName)}</Text>
          </Text>
          <View style={styles.metricStats}>
            <View style={styles.metricStat}>
              <Text style={styles.metricStatLabel}>P50</Text>
              <Text style={styles.metricStatValue}>
                {stats?.p50.toFixed(0) || '-'}
              </Text>
            </View>
            <View style={styles.metricStat}>
              <Text style={styles.metricStatLabel}>P95</Text>
              <Text style={styles.metricStatValue}>
                {stats?.p95.toFixed(0) || '-'}
              </Text>
            </View>
            <View style={styles.metricStat}>
              <Text style={styles.metricStatLabel}>P99</Text>
              <Text style={styles.metricStatValue}>
                {stats?.p99.toFixed(0) || '-'}
              </Text>
            </View>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}
