/**
 * Threshold Checking Utility
 *
 * Checks performance metrics against configured thresholds and logs warnings.
 */

import { MetricType, PerformanceMetric, PerformanceThresholds } from '../types';

interface ThresholdCheckResult {
  exceeded: boolean;
  alertMetric?: PerformanceMetric;
}

/**
 * Check if a metric exceeds configured thresholds
 */
export function checkThresholds(
  metric: PerformanceMetric,
  thresholds: PerformanceThresholds
): ThresholdCheckResult {
  const { type, value } = metric;

  switch (type) {
    case MetricType.FPS:
      if (thresholds.minFPS && value < thresholds.minFPS) {
        if (__DEV__) {
          console.warn(`[Metrics] Low FPS: ${value} (threshold: ${thresholds.minFPS})`);
        }
        return {
          exceeded: true,
          alertMetric: {
            ...metric,
            name: 'low_fps_alert',
            tags: { ...metric.tags, severity: 'warning' },
          },
        };
      }
      break;

    case MetricType.MEMORY:
      if (thresholds.maxMemoryMB && value > thresholds.maxMemoryMB) {
        if (__DEV__) {
          console.warn(
            `[Metrics] High memory: ${value}MB (threshold: ${thresholds.maxMemoryMB}MB)`
          );
        }
        return {
          exceeded: true,
          alertMetric: {
            ...metric,
            name: 'high_memory_alert',
            tags: { ...metric.tags, severity: 'warning' },
          },
        };
      }
      break;

    case MetricType.SCREEN_LOAD:
      if (thresholds.maxScreenLoadMS && value > thresholds.maxScreenLoadMS) {
        if (__DEV__) {
          console.warn(
            `[Metrics] Slow screen load: ${value}ms (threshold: ${thresholds.maxScreenLoadMS}ms)`
          );
        }
        return {
          exceeded: true,
          alertMetric: {
            ...metric,
            name: 'slow_screen_load_alert',
            tags: { ...metric.tags, severity: 'warning' },
          },
        };
      }
      break;

    case MetricType.NETWORK:
      if (thresholds.maxNetworkLatencyMS && value > thresholds.maxNetworkLatencyMS) {
        if (__DEV__) {
          console.warn(
            `[Metrics] High network latency: ${value}ms (threshold: ${thresholds.maxNetworkLatencyMS}ms)`
          );
        }
        return {
          exceeded: true,
          alertMetric: {
            ...metric,
            name: 'high_network_latency_alert',
            tags: { ...metric.tags, severity: 'warning' },
          },
        };
      }
      break;
  }

  return { exceeded: false };
}
