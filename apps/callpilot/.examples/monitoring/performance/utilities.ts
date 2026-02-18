/**
 * Performance Utilities
 *
 * Helper functions for performance measurement and tracking.
 */

import { InteractionManager } from 'react-native';
import { CurrentMetrics, MeasureResult, ScreenLoadTracker } from './types';

// App startup tracking state
let appStartTime: number | null = null;
let appStartupTracked = false;

// Initialize app start time
if (!appStartTime) {
  appStartTime = Date.now();
}

/**
 * Get app start time
 */
export function getAppStartTime(): number | null {
  return appStartTime;
}

/**
 * Check if startup has been tracked
 */
export function isStartupTracked(): boolean {
  return appStartupTracked;
}

/**
 * Mark startup as tracked
 */
export function markStartupTracked(): void {
  appStartupTracked = true;
}

/**
 * Measure operation performance
 *
 * @example
 * ```typescript
 * const measure = measurePerformance('data_fetch');
 * await fetchData();
 * measure.end({ recordCount: 100 });
 * ```
 */
export function measurePerformance(
  operationName: string,
  onComplete?: (duration: number, tags?: Record<string, string>) => void
): MeasureResult {
  const startTime = Date.now();

  return {
    end: (tags?: Record<string, string>) => {
      const duration = Date.now() - startTime;

      if (onComplete) {
        onComplete(duration, tags);
      }

      if (__DEV__) {
        console.log(`[Performance] ${operationName}: ${duration}ms`, tags);
      }
    },
  };
}

/**
 * Track screen load performance
 *
 * @example
 * ```typescript
 * const tracker = trackScreenLoad('Dashboard');
 * // ... load screen content
 * tracker.complete();
 * ```
 */
export function trackScreenLoad(
  screenName: string,
  onComplete?: (duration: number) => void
): ScreenLoadTracker {
  const startTime = Date.now();

  return {
    complete: () => {
      InteractionManager.runAfterInteractions(() => {
        const duration = Date.now() - startTime;

        if (onComplete) {
          onComplete(duration);
        }

        if (__DEV__) {
          console.log(`[Performance] Screen load (${screenName}): ${duration}ms`);
        }
      });
    },
  };
}

/**
 * Measure async operation
 *
 * @example
 * ```typescript
 * const result = await measureAsync('fetch_data', async () => {
 *   return await fetchData();
 * });
 * ```
 */
export async function measureAsync<T>(
  operationName: string,
  operation: () => Promise<T>,
  onComplete?: (duration: number) => void
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - startTime;

    if (onComplete) {
      onComplete(duration);
    }

    if (__DEV__) {
      console.log(`[Performance] ${operationName}: ${duration}ms`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    if (__DEV__) {
      console.log(`[Performance] ${operationName} (error): ${duration}ms`);
    }

    throw error;
  }
}

/**
 * Get current performance metrics
 */
export function getCurrentMetrics(): CurrentMetrics {
  return {
    timestamp: Date.now(),
    uptime: appStartTime ? Date.now() - appStartTime : 0,
  };
}
