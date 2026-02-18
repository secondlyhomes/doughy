/**
 * Network Request Performance Tracker
 *
 * Utility for tracking network request duration and status.
 *
 * @example
 * ```typescript
 * const tracker = trackNetworkRequest('GET', '/api/users');
 * const response = await fetch('/api/users');
 * tracker.complete(response.status);
 * ```
 */

import { Platform } from 'react-native';
import { MetricType, PerformanceMetric } from '../types';

interface NetworkRequestTracker {
  complete: (status: number, size?: number) => void;
}

/**
 * Track network request performance
 */
export function trackNetworkRequest(
  method: string,
  url: string,
  onComplete?: (metric: PerformanceMetric) => void
): NetworkRequestTracker {
  const startTime = Date.now();

  return {
    complete: (status: number, size?: number) => {
      const duration = Date.now() - startTime;

      const metric: PerformanceMetric = {
        type: MetricType.NETWORK,
        name: 'network_request',
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags: {
          method,
          status,
          platform: Platform.OS,
        },
        metadata: {
          url,
          size,
        },
      };

      if (onComplete) {
        onComplete(metric);
      }

      if (__DEV__) {
        console.log(`[Metrics] Network ${method} ${url}: ${duration}ms (${status})`);
      }
    },
  };
}
