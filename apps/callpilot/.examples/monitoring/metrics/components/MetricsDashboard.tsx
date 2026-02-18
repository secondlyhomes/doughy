/**
 * Metrics Dashboard Component
 *
 * Real-time dashboard for viewing performance metrics, charts, and statistics.
 *
 * @example
 * ```tsx
 * import { MetricsDashboard } from './components';
 *
 * function AdminScreen() {
 *   return <MetricsDashboard />;
 * }
 * ```
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { subDays, format } from 'date-fns';
import { styles } from './metrics-dashboard.styles';
import { MetricsDashboardProps, DEFAULT_METRICS } from './types';
import { MetricCard } from './MetricCard';
import { MetricDetails } from './MetricDetails';
import { GroupedMetricsList } from './GroupedMetricsList';

/**
 * Metrics Dashboard Component
 */
export function MetricsDashboard({
  metrics = DEFAULT_METRICS,
  days = 7,
  refreshInterval = 30000,
}: MetricsDashboardProps): JSX.Element {
  const [selectedMetric, setSelectedMetric] = useState(metrics[0]);
  const [selectedPeriod, setSelectedPeriod] = useState(days);

  const fromDate = subDays(new Date(), selectedPeriod);
  const toDate = new Date();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Performance Metrics</Text>
          <Text style={styles.subtitle}>
            {format(fromDate, 'MMM d')} - {format(toDate, 'MMM d, yyyy')}
          </Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {[1, 7, 30].map(period => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive,
                ]}
              >
                {period === 1 ? '24h' : `${period}d`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Metric Cards */}
        <View style={styles.metricsGrid}>
          {metrics.map(metric => (
            <MetricCard
              key={metric}
              metricName={metric}
              fromDate={fromDate}
              toDate={toDate}
              isSelected={selectedMetric === metric}
              onPress={() => setSelectedMetric(metric)}
            />
          ))}
        </View>

        {/* Detailed Stats */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Detailed Statistics</Text>
          <MetricDetails
            metricName={selectedMetric}
            fromDate={fromDate}
            toDate={toDate}
          />
        </View>

        {/* Grouped Metrics */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>By Screen</Text>
          <GroupedMetricsList
            metricName={selectedMetric}
            groupBy="screen"
            fromDate={fromDate}
            toDate={toDate}
          />
        </View>
      </ScrollView>
    </View>
  );
}
