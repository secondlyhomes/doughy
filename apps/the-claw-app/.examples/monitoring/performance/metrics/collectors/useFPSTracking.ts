/**
 * FPS Tracking Hook
 *
 * Tracks frames per second using requestAnimationFrame.
 */

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { MetricType, PerformanceMetric } from '../types';

interface UseFPSTrackingOptions {
  enabled: boolean;
  onMetric: (metric: PerformanceMetric) => void;
}

/**
 * Hook for tracking FPS
 */
export function useFPSTracking({ enabled, onMetric }: UseFPSTrackingOptions): void {
  const frameCountRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let animationFrameId: number;
    let lastCheckTime = Date.now();

    const measureFPS = () => {
      const now = Date.now();
      frameCountRef.current++;

      // Report FPS every second
      if (now - lastCheckTime >= 1000) {
        const fps = frameCountRef.current;

        onMetric({
          type: MetricType.FPS,
          name: 'fps',
          value: fps,
          unit: 'fps',
          timestamp: now,
          tags: {
            platform: Platform.OS,
          },
        });

        frameCountRef.current = 0;
        lastCheckTime = now;
      }

      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [enabled, onMetric]);
}
