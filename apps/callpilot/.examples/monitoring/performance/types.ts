/**
 * Performance Monitor Types
 *
 * Type definitions for performance monitoring functionality.
 */

/**
 * Performance metric type
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

/**
 * Performance thresholds for warnings
 */
export interface PerformanceThresholds {
  /** Minimum acceptable FPS (default: 55) */
  minFPS?: number;
  /** Maximum memory usage in MB (default: 200) */
  maxMemoryMB?: number;
  /** Maximum screen load time in ms (default: 2000) */
  maxScreenLoadTime?: number;
  /** Maximum interaction delay in ms (default: 100) */
  maxInteractionDelay?: number;
}

/**
 * Performance metrics configuration
 */
export interface PerformanceConfig {
  /** Enable FPS monitoring */
  enableFPSMonitoring?: boolean;
  /** Enable memory monitoring */
  enableMemoryMonitoring?: boolean;
  /** Enable navigation timing */
  enableNavigationTiming?: boolean;
  /** Interval for performance checks (ms) */
  monitoringInterval?: number;
  /** Callback for performance metrics */
  onMetric?: (metric: PerformanceMetric) => void;
  /** Performance threshold warnings */
  thresholds?: PerformanceThresholds;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: Required<PerformanceConfig> = {
  enableFPSMonitoring: true,
  enableMemoryMonitoring: true,
  enableNavigationTiming: true,
  monitoringInterval: 5000,
  onMetric: () => {},
  thresholds: {
    minFPS: 55,
    maxMemoryMB: 200,
    maxScreenLoadTime: 2000,
    maxInteractionDelay: 100,
  },
};

/**
 * Current metrics snapshot
 */
export interface CurrentMetrics {
  timestamp: number;
  uptime: number;
}

/**
 * Measure result interface
 */
export interface MeasureResult {
  end: (tags?: Record<string, string>) => void;
}

/**
 * Screen load tracker interface
 */
export interface ScreenLoadTracker {
  complete: () => void;
}
