/**
 * Metrics Dashboard Components
 *
 * @example
 * ```tsx
 * import { MetricsDashboard, MetricCard } from './components';
 * ```
 */

// Main dashboard component
export { MetricsDashboard } from './MetricsDashboard';

// Individual components
export { MetricCard } from './MetricCard';
export { MetricDetails } from './MetricDetails';
export { GroupedMetricsList } from './GroupedMetricsList';

// Types
export type {
  MetricsDashboardProps,
  MetricCardProps,
  MetricDetailsProps,
  GroupedMetricsListProps,
  DetailRowProps,
} from './types';

// Constants and utilities
export {
  DEFAULT_METRICS,
  METRIC_LABELS,
  METRIC_UNITS,
  getMetricLabel,
  getMetricUnit,
} from './types';

// Styles (for custom compositions)
export { styles as metricsDashboardStyles } from './metrics-dashboard.styles';
