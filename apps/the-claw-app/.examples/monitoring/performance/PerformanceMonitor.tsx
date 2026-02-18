/**
 * Performance Monitor Component
 *
 * Monitors and tracks app performance metrics including:
 * - App startup time
 * - Screen load time
 * - FPS (frames per second)
 * - Memory usage
 * - JavaScript thread usage
 *
 * @example
 * ```tsx
 * import { PerformanceMonitor } from './PerformanceMonitor';
 *
 * function App() {
 *   return (
 *     <>
 *       <PerformanceMonitor />
 *       <YourApp />
 *     </>
 *   );
 * }
 * ```
 */

import { PerformanceConfig, DEFAULT_CONFIG } from './types';
import {
  useStartupTracking,
  useTimeToInteractive,
  useFPSMonitoring,
  useMemoryMonitoring,
  useAppStateMonitoring,
} from './hooks/usePerformance';

/**
 * Performance Monitor Component
 *
 * Invisible component that monitors app performance and reports metrics.
 */
export function PerformanceMonitor(config?: PerformanceConfig): null {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { onMetric, thresholds } = finalConfig;

  // Track app startup
  useStartupTracking(onMetric);

  // Track time to interactive
  useTimeToInteractive(onMetric);

  // Monitor FPS
  useFPSMonitoring(finalConfig.enableFPSMonitoring, onMetric, thresholds);

  // Monitor memory usage
  useMemoryMonitoring(
    finalConfig.enableMemoryMonitoring,
    finalConfig.monitoringInterval,
    onMetric,
    thresholds
  );

  // Monitor app state changes
  useAppStateMonitoring(onMetric);

  return null;
}
