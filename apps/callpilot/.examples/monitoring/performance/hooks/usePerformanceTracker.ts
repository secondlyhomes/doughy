/**
 * Performance Tracking Hooks
 *
 * Custom hooks for tracking performance metrics in React components.
 *
 * @example
 * ```typescript
 * import { usePerformanceTracker } from './hooks/usePerformanceTracker';
 *
 * function MyComponent() {
 *   const { trackOperation, trackRender } = usePerformanceTracker();
 *
 *   useEffect(() => {
 *     trackOperation('fetch_data', async () => {
 *       await fetchData();
 *     });
 *   }, []);
 * }
 * ```
 */

import { useCallback, useEffect, useRef } from 'react';
import { InteractionManager, Platform } from 'react-native';

/**
 * Performance metric interface
 */
export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  tags?: Record<string, any>;
}

/**
 * Hook for performance tracking
 */
export function usePerformanceTracker(options?: {
  onMetric?: (metric: PerformanceMetric) => void;
  enableLogging?: boolean;
}): {
  trackOperation: <T>(
    name: string,
    operation: () => Promise<T>,
    tags?: Record<string, any>
  ) => Promise<T>;
  startTimer: (name: string) => () => void;
  trackRender: (componentName: string) => void;
} {
  const { onMetric, enableLogging = __DEV__ } = options || {};

  /**
   * Track async operation performance
   */
  const trackOperation = useCallback(
    async <T,>(
      name: string,
      operation: () => Promise<T>,
      tags?: Record<string, any>
    ): Promise<T> => {
      const startTime = Date.now();

      try {
        const result = await operation();
        const duration = Date.now() - startTime;

        const metric: PerformanceMetric = {
          name,
          duration,
          timestamp: Date.now(),
          tags: {
            ...tags,
            platform: Platform.OS,
            success: true,
          },
        };

        if (onMetric) {
          onMetric(metric);
        }

        if (enableLogging) {
          console.log(`[Performance] ${name}: ${duration}ms`, tags);
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        const metric: PerformanceMetric = {
          name,
          duration,
          timestamp: Date.now(),
          tags: {
            ...tags,
            platform: Platform.OS,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        };

        if (onMetric) {
          onMetric(metric);
        }

        if (enableLogging) {
          console.log(`[Performance] ${name} (failed): ${duration}ms`, tags);
        }

        throw error;
      }
    },
    [onMetric, enableLogging]
  );

  /**
   * Start a timer, returns function to end timer
   */
  const startTimer = useCallback(
    (name: string): (() => void) => {
      const startTime = Date.now();

      return () => {
        const duration = Date.now() - startTime;

        const metric: PerformanceMetric = {
          name,
          duration,
          timestamp: Date.now(),
          tags: {
            platform: Platform.OS,
          },
        };

        if (onMetric) {
          onMetric(metric);
        }

        if (enableLogging) {
          console.log(`[Performance] ${name}: ${duration}ms`);
        }
      };
    },
    [onMetric, enableLogging]
  );

  /**
   * Track component render performance
   */
  const trackRender = useCallback(
    (componentName: string) => {
      const renderCount = useRef(0);
      const mountTime = useRef(Date.now());

      useEffect(() => {
        renderCount.current++;

        if (renderCount.current === 1) {
          // First render (mount)
          InteractionManager.runAfterInteractions(() => {
            const duration = Date.now() - mountTime.current;

            const metric: PerformanceMetric = {
              name: 'component_mount',
              duration,
              timestamp: Date.now(),
              tags: {
                component: componentName,
                platform: Platform.OS,
              },
            };

            if (onMetric) {
              onMetric(metric);
            }

            if (enableLogging) {
              console.log(`[Performance] ${componentName} mounted: ${duration}ms`);
            }
          });
        }
      });
    },
    [onMetric, enableLogging]
  );

  return {
    trackOperation,
    startTimer,
    trackRender,
  };
}

/**
 * Hook for tracking screen transitions
 *
 * @example
 * ```typescript
 * function MyScreen() {
 *   useScreenTransition('MyScreen');
 *   return <View>...</View>;
 * }
 * ```
 */
export function useScreenTransition(
  screenName: string,
  onComplete?: (duration: number) => void
): void {
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      const duration = Date.now() - mountTimeRef.current;

      if (onComplete) {
        onComplete(duration);
      }

      if (__DEV__) {
        console.log(`[Performance] Screen transition (${screenName}): ${duration}ms`);
      }
    });
  }, [screenName, onComplete]);
}

/**
 * Hook for tracking API call performance
 *
 * @example
 * ```typescript
 * function useUserData() {
 *   const trackAPI = useAPITracker();
 *
 *   const fetchUser = async (id: string) => {
 *     return trackAPI('GET /api/users/:id', async () => {
 *       return await api.getUser(id);
 *     }, { userId: id });
 *   };
 * }
 * ```
 */
export function useAPITracker(): <T>(
  endpoint: string,
  request: () => Promise<T>,
  tags?: Record<string, any>
) => Promise<T> {
  const { trackOperation } = usePerformanceTracker();

  return useCallback(
    async <T,>(
      endpoint: string,
      request: () => Promise<T>,
      tags?: Record<string, any>
    ): Promise<T> => {
      return trackOperation(`api_${endpoint}`, request, {
        ...tags,
        endpoint,
        type: 'api',
      });
    },
    [trackOperation]
  );
}

/**
 * Hook for tracking database query performance
 *
 * @example
 * ```typescript
 * function useTasksData() {
 *   const trackQuery = useQueryTracker();
 *
 *   const fetchTasks = async () => {
 *     return trackQuery('tasks', async () => {
 *       const { data } = await supabase.from('tasks').select('*');
 *       return data;
 *     });
 *   };
 * }
 * ```
 */
export function useQueryTracker(): <T>(
  tableName: string,
  query: () => Promise<T>,
  tags?: Record<string, any>
) => Promise<T> {
  const { trackOperation } = usePerformanceTracker();

  return useCallback(
    async <T,>(
      tableName: string,
      query: () => Promise<T>,
      tags?: Record<string, any>
    ): Promise<T> => {
      return trackOperation(`query_${tableName}`, query, {
        ...tags,
        table: tableName,
        type: 'database',
      });
    },
    [trackOperation]
  );
}

/**
 * Hook for measuring component re-render frequency
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   useRenderCounter('MyComponent', (count) => {
 *     if (count > 10) {
 *       console.warn('Component re-rendering too frequently');
 *     }
 *   });
 * }
 * ```
 */
export function useRenderCounter(
  componentName: string,
  onRender?: (count: number) => void
): number {
  const renderCountRef = useRef(0);

  useEffect(() => {
    renderCountRef.current++;

    if (onRender) {
      onRender(renderCountRef.current);
    }

    if (__DEV__ && renderCountRef.current > 20) {
      console.warn(
        `[Performance] ${componentName} has rendered ${renderCountRef.current} times`
      );
    }
  });

  return renderCountRef.current;
}

/**
 * Hook for tracking long tasks (operations over threshold)
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const trackLongTask = useLongTaskTracker(100); // 100ms threshold
 *
 *   const handleClick = async () => {
 *     await trackLongTask('process_data', async () => {
 *       await processData();
 *     });
 *   };
 * }
 * ```
 */
export function useLongTaskTracker(thresholdMs = 100): <T>(
  taskName: string,
  task: () => Promise<T>
) => Promise<T> {
  const { trackOperation } = usePerformanceTracker({
    onMetric: (metric) => {
      if (metric.duration > thresholdMs) {
        console.warn(
          `[Performance] Long task detected: ${metric.name} took ${metric.duration}ms (threshold: ${thresholdMs}ms)`
        );
      }
    },
  });

  return useCallback(
    async <T,>(taskName: string, task: () => Promise<T>): Promise<T> => {
      return trackOperation(taskName, task);
    },
    [trackOperation]
  );
}
