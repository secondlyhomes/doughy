/**
 * Memory Tracking Hook
 *
 * Tracks JavaScript heap memory usage at regular intervals.
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';
import { MetricType, PerformanceMetric } from '../types';

interface UseMemoryTrackingOptions {
  enabled: boolean;
  interval: number;
  onMetric: (metric: PerformanceMetric) => void;
}

/**
 * Hook for tracking memory usage
 */
export function useMemoryTracking({
  enabled,
  interval,
  onMetric,
}: UseMemoryTrackingOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      // Note: React Native doesn't expose memory APIs directly
      // This is a placeholder for native module integration

      // On web, we can use performance.memory
      // @ts-ignore - performance.memory is non-standard
      if (typeof performance !== 'undefined' && performance.memory) {
        // @ts-ignore
        const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;

        onMetric({
          type: MetricType.MEMORY,
          name: 'memory_usage',
          value: Number(memoryUsage.toFixed(2)),
          unit: 'MB',
          timestamp: Date.now(),
          tags: {
            platform: Platform.OS,
          },
        });
      }
    }, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, interval, onMetric]);
}
