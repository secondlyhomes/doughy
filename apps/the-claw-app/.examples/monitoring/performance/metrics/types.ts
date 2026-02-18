/**
 * Type definitions for App Metrics
 */

/**
 * Metric types
 */
export enum MetricType {
  FPS = 'fps',
  MEMORY = 'memory',
  NETWORK = 'network',
  SCREEN_LOAD = 'screen_load',
  INTERACTION = 'interaction',
  JS_THREAD = 'js_thread',
  UI_THREAD = 'ui_thread',
}

/**
 * Performance metric interface
 */
export interface PerformanceMetric {
  type: MetricType;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string | number>;
  metadata?: Record<string, unknown>;
}

/**
 * Performance thresholds configuration
 */
export interface PerformanceThresholds {
  minFPS?: number;
  maxMemoryMB?: number;
  maxScreenLoadMS?: number;
  maxNetworkLatencyMS?: number;
}

/**
 * Props for AppMetrics component
 */
export interface AppMetricsProps {
  /** Enable metrics collection */
  enabled?: boolean;
  /** Callback when metric is collected */
  onMetric?: (metric: PerformanceMetric) => void;
  /** Metrics collection interval (ms) */
  interval?: number;
  /** Enable FPS tracking */
  trackFPS?: boolean;
  /** Enable memory tracking */
  trackMemory?: boolean;
  /** Enable network tracking */
  trackNetwork?: boolean;
  /** Enable screen timing */
  trackScreenTiming?: boolean;
  /** Performance thresholds for alerts */
  thresholds?: PerformanceThresholds;
}

/**
 * Default thresholds
 */
export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  minFPS: 55,
  maxMemoryMB: 200,
  maxScreenLoadMS: 2000,
  maxNetworkLatencyMS: 3000,
};
