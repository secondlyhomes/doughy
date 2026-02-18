/**
 * Render Tracking Hook
 *
 * Tracks component render performance including mount time and re-render durations.
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   useRenderTracking('MyComponent');
 *   return <View>...</View>;
 * }
 * ```
 */

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { MetricType, PerformanceMetric } from '../types';

/**
 * Custom hook for tracking component render performance
 */
export function useRenderTracking(
  componentName: string,
  onMetric?: (metric: PerformanceMetric) => void
): void {
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef(Date.now());
  const lastRenderTimeRef = useRef(Date.now());

  useEffect(() => {
    renderCountRef.current++;
    const now = Date.now();
    const renderDuration = now - lastRenderTimeRef.current;

    // First render (mount)
    if (renderCountRef.current === 1) {
      const mountDuration = now - mountTimeRef.current;

      const metric: PerformanceMetric = {
        type: MetricType.SCREEN_LOAD,
        name: 'component_mount',
        value: mountDuration,
        unit: 'ms',
        timestamp: now,
        tags: {
          component: componentName,
          platform: Platform.OS,
        },
      };

      if (onMetric) {
        onMetric(metric);
      }

      if (__DEV__) {
        console.log(`[Metrics] ${componentName} mounted in ${mountDuration}ms`);
      }
    } else {
      // Subsequent renders
      const metric: PerformanceMetric = {
        type: MetricType.INTERACTION,
        name: 'component_render',
        value: renderDuration,
        unit: 'ms',
        timestamp: now,
        tags: {
          component: componentName,
          render_count: renderCountRef.current,
          platform: Platform.OS,
        },
      };

      if (onMetric) {
        onMetric(metric);
      }

      if (renderDuration > 100 && __DEV__) {
        console.warn(`[Metrics] Slow render in ${componentName}: ${renderDuration}ms`);
      }
    }

    lastRenderTimeRef.current = now;
  });
}
