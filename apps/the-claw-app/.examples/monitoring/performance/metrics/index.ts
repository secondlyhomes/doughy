/**
 * App Metrics Module
 *
 * Comprehensive performance metrics tracking for React Native apps.
 *
 * @example
 * ```tsx
 * import { AppMetrics, useRenderTracking, trackNetworkRequest } from './metrics';
 *
 * function App() {
 *   return (
 *     <>
 *       <AppMetrics
 *         enabled={!__DEV__}
 *         onMetric={(metric) => console.log('Metric:', metric)}
 *       />
 *       <YourApp />
 *     </>
 *   );
 * }
 * ```
 */

// Main component
export { AppMetrics } from './AppMetrics';

// Types
export {
  MetricType,
  PerformanceMetric,
  PerformanceThresholds,
  AppMetricsProps,
  DEFAULT_THRESHOLDS,
} from './types';

// Hooks
export { useRenderTracking, useScreenLoadTracking } from './hooks';

// Utilities
export { trackNetworkRequest, checkThresholds } from './utils';

// Collectors (for advanced usage)
export {
  useFPSTracking,
  useMemoryTracking,
  useInteractionTracking,
} from './collectors';
