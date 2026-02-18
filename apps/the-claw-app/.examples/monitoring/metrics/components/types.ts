/**
 * Types for Metrics Dashboard Components
 */

/**
 * Props for MetricsDashboard
 */
export interface MetricsDashboardProps {
  /** Metrics to display */
  metrics?: string[];
  /** Time period in days */
  days?: number;
  /** Refresh interval in ms (0 to disable) */
  refreshInterval?: number;
}

/**
 * Props for MetricCard
 */
export interface MetricCardProps {
  metricName: string;
  fromDate: Date;
  toDate: Date;
  isSelected: boolean;
  onPress: () => void;
}

/**
 * Props for MetricDetails
 */
export interface MetricDetailsProps {
  metricName: string;
  fromDate: Date;
  toDate: Date;
}

/**
 * Props for GroupedMetricsList
 */
export interface GroupedMetricsListProps {
  metricName: string;
  groupBy: string;
  fromDate: Date;
  toDate: Date;
}

/**
 * Props for DetailRow
 */
export interface DetailRowProps {
  label: string;
  value: string;
}

/**
 * Default metrics to display
 */
export const DEFAULT_METRICS = [
  'screen_load',
  'fps',
  'memory_usage',
  'api_latency',
];

/**
 * Metric label mappings
 */
export const METRIC_LABELS: Record<string, string> = {
  screen_load: 'Screen Load',
  fps: 'FPS',
  memory_usage: 'Memory',
  api_latency: 'API Latency',
};

/**
 * Metric unit mappings
 */
export const METRIC_UNITS: Record<string, string> = {
  screen_load: 'ms',
  fps: 'fps',
  memory_usage: 'MB',
  api_latency: 'ms',
};

/**
 * Get metric label by name
 */
export function getMetricLabel(name: string): string {
  return METRIC_LABELS[name] || name;
}

/**
 * Get metric unit by name
 */
export function getMetricUnit(name: string): string {
  return METRIC_UNITS[name] || '';
}
