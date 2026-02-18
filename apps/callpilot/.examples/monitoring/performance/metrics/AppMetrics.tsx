/**
 * App Metrics Component
 *
 * Comprehensive performance metrics tracking for React Native apps.
 * Tracks FPS, memory, network, screen timing, and thread usage.
 *
 * @example
 * ```tsx
 * import { AppMetrics } from './metrics';
 *
 * function App() {
 *   return (
 *     <>
 *       <AppMetrics
 *         enabled={!__DEV__}
 *         onMetric={(metric) => {
 *           // Send to analytics or monitoring service
 *           console.log('Metric:', metric);
 *         }}
 *       />
 *       <YourApp />
 *     </>
 *   );
 * }
 * ```
 */

import { useCallback, useState } from 'react';
import {
  AppMetricsProps,
  DEFAULT_THRESHOLDS,
  PerformanceMetric,
} from './types';
import {
  useFPSTracking,
  useMemoryTracking,
  useInteractionTracking,
} from './collectors';
import { checkThresholds } from './utils';

/**
 * App Metrics Component
 *
 * Renders nothing but collects performance metrics in the background.
 */
export function AppMetrics({
  enabled = true,
  onMetric,
  interval = 5000,
  trackFPS = true,
  trackMemory = true,
  trackNetwork = true,
  trackScreenTiming = true,
  thresholds = DEFAULT_THRESHOLDS,
}: AppMetricsProps): null {
  const [isMonitoring] = useState(enabled);

  /**
   * Report metric and check thresholds
   */
  const reportMetric = useCallback(
    (metric: PerformanceMetric) => {
      if (onMetric) {
        onMetric(metric);
      }

      // Check thresholds and report alerts
      const result = checkThresholds(metric, thresholds);
      if (result.exceeded && result.alertMetric && onMetric) {
        onMetric(result.alertMetric);
      }
    },
    [onMetric, thresholds]
  );

  // Use individual tracking hooks
  useFPSTracking({
    enabled: isMonitoring && trackFPS,
    onMetric: reportMetric,
  });

  useMemoryTracking({
    enabled: isMonitoring && trackMemory,
    interval,
    onMetric: reportMetric,
  });

  useInteractionTracking({
    enabled: isMonitoring,
    onMetric: reportMetric,
  });

  return null;
}
