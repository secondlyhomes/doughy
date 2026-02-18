/**
 * Performance Monitoring Module
 *
 * Provides comprehensive performance monitoring for React Native apps.
 *
 * @example
 * ```tsx
 * import {
 *   PerformanceMonitor,
 *   measurePerformance,
 *   trackScreenLoad,
 *   measureAsync,
 * } from './performance';
 *
 * // Add monitor to app root
 * function App() {
 *   return (
 *     <>
 *       <PerformanceMonitor onMetric={logMetric} />
 *       <YourApp />
 *     </>
 *   );
 * }
 *
 * // Measure operations
 * const measure = measurePerformance('data_fetch');
 * await fetchData();
 * measure.end();
 * ```
 */

// Types
export type {
  PerformanceConfig,
  PerformanceMetric,
  PerformanceThresholds,
  CurrentMetrics,
  MeasureResult,
  ScreenLoadTracker,
} from './types';

export { DEFAULT_CONFIG } from './types';

// Component
export { PerformanceMonitor } from './PerformanceMonitor';

// Utilities
export {
  measurePerformance,
  trackScreenLoad,
  measureAsync,
  getCurrentMetrics,
} from './utilities';

// Hooks (for advanced usage)
export {
  useStartupTracking,
  useTimeToInteractive,
  useFPSMonitoring,
  useMemoryMonitoring,
  useAppStateMonitoring,
} from './hooks/usePerformance';
