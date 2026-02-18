/**
 * Performance Monitoring Hooks
 * Custom hooks for tracking app performance metrics.
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, InteractionManager } from 'react-native';
import { PerformanceMetric, PerformanceThresholds } from '../types';
import { getAppStartTime, markStartupTracked, isStartupTracked } from '../utilities';

/** Track app startup time */
export function useStartupTracking(onMetric: (metric: PerformanceMetric) => void): void {
  useEffect(() => {
    const appStartTime = getAppStartTime();
    if (!isStartupTracked() && appStartTime) {
      const startupTime = Date.now() - appStartTime;

      onMetric({
        name: 'app_startup',
        value: startupTime,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { type: 'cold_start' },
      });

      markStartupTracked();

      if (__DEV__) {
        console.log(`[Performance] App startup: ${startupTime}ms`);
      }
    }
  }, [onMetric]);
}

/** Track time to interactive */
export function useTimeToInteractive(onMetric: (metric: PerformanceMetric) => void): void {
  useEffect(() => {
    const appStartTime = getAppStartTime();
    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      if (appStartTime) {
        const timeToInteractive = Date.now() - appStartTime;

        onMetric({
          name: 'time_to_interactive',
          value: timeToInteractive,
          unit: 'ms',
          timestamp: Date.now(),
        });

        if (__DEV__) {
          console.log(`[Performance] Time to interactive: ${timeToInteractive}ms`);
        }
      }
    });

    return () => {
      interactionHandle.cancel();
    };
  }, [onMetric]);
}

/** Monitor FPS */
export function useFPSMonitoring(
  enabled: boolean,
  onMetric: (metric: PerformanceMetric) => void,
  thresholds: PerformanceThresholds
): void {
  const frameCountRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    let animationFrameId: number;
    let lastCheckTime = Date.now();

    const measureFPS = () => {
      const now = Date.now();
      frameCountRef.current++;

      if (now - lastCheckTime >= 1000) {
        const fps = frameCountRef.current;

        onMetric({
          name: 'fps',
          value: fps,
          unit: 'fps',
          timestamp: now,
        });

        if (fps < thresholds.minFPS!) {
          if (__DEV__) {
            console.warn(`[Performance] Low FPS detected: ${fps} FPS`);
          }
          onMetric({
            name: 'low_fps_warning',
            value: fps,
            unit: 'fps',
            timestamp: now,
            tags: { threshold: String(thresholds.minFPS) },
          });
        }

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
  }, [enabled, onMetric, thresholds.minFPS]);
}

/** Monitor memory usage */
export function useMemoryMonitoring(
  enabled: boolean,
  interval: number,
  onMetric: (metric: PerformanceMetric) => void,
  thresholds: PerformanceThresholds
): void {
  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      // @ts-ignore - performance.memory is non-standard
      if (typeof performance !== 'undefined' && performance.memory) {
        // @ts-ignore
        const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;

        onMetric({
          name: 'memory_usage',
          value: memoryUsage,
          unit: 'MB',
          timestamp: Date.now(),
        });

        if (memoryUsage > thresholds.maxMemoryMB!) {
          if (__DEV__) {
            console.warn(`[Performance] High memory usage: ${memoryUsage.toFixed(2)} MB`);
          }
          onMetric({
            name: 'high_memory_warning',
            value: memoryUsage,
            unit: 'MB',
            timestamp: Date.now(),
            tags: { threshold: String(thresholds.maxMemoryMB) },
          });
        }
      }
    }, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, interval, onMetric, thresholds.maxMemoryMB]);
}

/** Monitor app state changes */
export function useAppStateMonitoring(onMetric: (metric: PerformanceMetric) => void): void {
  useEffect(() => {
    let backgroundTime: number | null = null;

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        backgroundTime = Date.now();
      } else if (nextAppState === 'active' && backgroundTime) {
        const timeInBackground = Date.now() - backgroundTime;

        onMetric({
          name: 'app_background_duration',
          value: timeInBackground,
          unit: 'ms',
          timestamp: Date.now(),
        });

        backgroundTime = null;
      }
    });

    return () => {
      subscription.remove();
    };
  }, [onMetric]);
}
