/**
 * Metrics Hooks
 *
 * Custom hooks for fetching and displaying metrics from Supabase.
 *
 * @example
 * ```typescript
 * import { useMetrics } from './hooks/useMetrics';
 *
 * function MetricsDashboard() {
 *   const { metrics, isLoading } = useMetrics('screen_load', {
 *     fromDate: subDays(new Date(), 7),
 *   });
 *
 *   return <MetricsChart data={metrics} />;
 * }
 * ```
 */

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

/**
 * Metric data interface
 */
export interface MetricData {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  tags: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * Aggregated metric stats
 */
export interface MetricStats {
  metric_name: string;
  sample_count: number;
  avg_value: number;
  min_value: number;
  max_value: number;
  p50: number;
  p95: number;
  p99: number;
}

/**
 * Options for fetching metrics
 */
export interface MetricsOptions {
  fromDate?: Date;
  toDate?: Date;
  tags?: Record<string, string>;
  limit?: number;
}

/**
 * Initialize Supabase client
 */
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * Hook for fetching metrics
 *
 * @example
 * ```typescript
 * const { metrics, isLoading, error } = useMetrics('screen_load', {
 *   fromDate: subDays(new Date(), 7),
 *   tags: { screen: 'Dashboard' },
 * });
 * ```
 */
export function useMetrics(
  metricName: string,
  options?: MetricsOptions
): {
  metrics: MetricData[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('app_metrics')
        .select('*')
        .eq('metric_name', metricName)
        .order('created_at', { ascending: false });

      // Apply date filters
      if (options?.fromDate) {
        query = query.gte('created_at', options.fromDate.toISOString());
      }

      if (options?.toDate) {
        query = query.lte('created_at', options.toDate.toISOString());
      }

      // Apply tag filters
      if (options?.tags) {
        Object.entries(options.tags).forEach(([key, value]) => {
          query = query.eq(`tags->>${key}`, value);
        });
      }

      // Apply limit
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setMetrics(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('[useMetrics] Error fetching metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [metricName, options?.fromDate, options?.toDate, options?.tags, options?.limit]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics,
  };
}

/**
 * Hook for fetching metric statistics
 *
 * @example
 * ```typescript
 * const { stats, isLoading } = useMetricStats('screen_load', {
 *   fromDate: subDays(new Date(), 7),
 * });
 *
 * console.log('Average:', stats?.avg_value);
 * console.log('P95:', stats?.p95);
 * ```
 */
export function useMetricStats(
  metricName: string,
  options?: MetricsOptions
): {
  stats: MetricStats | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [stats, setStats] = useState<MetricStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: metrics } = await supabase
        .from('app_metrics')
        .select('metric_value')
        .eq('metric_name', metricName)
        .gte('created_at', options?.fromDate?.toISOString() || new Date(0).toISOString())
        .lte('created_at', options?.toDate?.toISOString() || new Date().toISOString());

      if (!metrics || metrics.length === 0) {
        setStats(null);
        return;
      }

      const values = metrics
        .map(m => m.metric_value)
        .sort((a, b) => a - b);

      const sum = values.reduce((acc, v) => acc + v, 0);
      const avg = sum / values.length;

      setStats({
        metric_name: metricName,
        sample_count: values.length,
        avg_value: Number(avg.toFixed(2)),
        min_value: values[0],
        max_value: values[values.length - 1],
        p50: percentile(values, 0.5),
        p95: percentile(values, 0.95),
        p99: percentile(values, 0.99),
      });
    } catch (err) {
      setError(err as Error);
      console.error('[useMetricStats] Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [metricName, options?.fromDate, options?.toDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}

/**
 * Hook for real-time metrics
 *
 * @example
 * ```typescript
 * const { metrics } = useRealtimeMetrics('fps');
 *
 * // Metrics automatically update as new ones are inserted
 * ```
 */
export function useRealtimeMetrics(
  metricName: string,
  options?: MetricsOptions
): {
  metrics: MetricData[];
  isLoading: boolean;
} {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    let query = supabase
      .from('app_metrics')
      .select('*')
      .eq('metric_name', metricName)
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    query.then(({ data }) => {
      setMetrics(data || []);
      setIsLoading(false);
    });

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('app_metrics_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'app_metrics',
          filter: `metric_name=eq.${metricName}`,
        },
        (payload) => {
          setMetrics(prev => {
            const newMetrics = [payload.new as MetricData, ...prev];
            return options?.limit
              ? newMetrics.slice(0, options.limit)
              : newMetrics;
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [metricName, options?.limit]);

  return { metrics, isLoading };
}

/**
 * Hook for metric trends (compare periods)
 *
 * @example
 * ```typescript
 * const { current, previous, change } = useMetricTrend('screen_load', 7);
 *
 * console.log(`Screen load changed by ${change.percentage}%`);
 * ```
 */
export function useMetricTrend(
  metricName: string,
  days: number
): {
  current: MetricStats | null;
  previous: MetricStats | null;
  change: {
    value: number;
    percentage: number;
  } | null;
  isLoading: boolean;
} {
  const now = new Date();
  const currentPeriodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousPeriodStart = new Date(currentPeriodStart.getTime() - days * 24 * 60 * 60 * 1000);

  const { stats: current, isLoading: currentLoading } = useMetricStats(metricName, {
    fromDate: currentPeriodStart,
    toDate: now,
  });

  const { stats: previous, isLoading: previousLoading } = useMetricStats(metricName, {
    fromDate: previousPeriodStart,
    toDate: currentPeriodStart,
  });

  const change =
    current && previous
      ? {
          value: current.avg_value - previous.avg_value,
          percentage: ((current.avg_value - previous.avg_value) / previous.avg_value) * 100,
        }
      : null;

  return {
    current,
    previous,
    change,
    isLoading: currentLoading || previousLoading,
  };
}

/**
 * Calculate percentile
 */
function percentile(values: number[], p: number): number {
  const index = Math.ceil(values.length * p) - 1;
  return values[Math.max(0, index)];
}

/**
 * Hook for aggregated metrics by tag
 *
 * @example
 * ```typescript
 * const { grouped, isLoading } = useGroupedMetrics('screen_load', 'screen');
 *
 * // Returns metrics grouped by screen name
 * ```
 */
export function useGroupedMetrics(
  metricName: string,
  groupBy: string,
  options?: MetricsOptions
): {
  grouped: Array<{
    key: string;
    stats: MetricStats;
  }>;
  isLoading: boolean;
  error: Error | null;
} {
  const [grouped, setGrouped] = useState<Array<{ key: string; stats: MetricStats }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchGrouped = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('app_metrics')
          .select('metric_value, tags')
          .eq('metric_name', metricName);

        if (options?.fromDate) {
          query = query.gte('created_at', options.fromDate.toISOString());
        }

        if (options?.toDate) {
          query = query.lte('created_at', options.toDate.toISOString());
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          setGrouped([]);
          return;
        }

        // Group by tag value
        const groups = new Map<string, number[]>();

        data.forEach(metric => {
          const key = metric.tags?.[groupBy] || 'unknown';
          if (!groups.has(key)) {
            groups.set(key, []);
          }
          groups.get(key)!.push(metric.metric_value);
        });

        // Calculate stats for each group
        const result = Array.from(groups.entries()).map(([key, values]) => {
          const sorted = values.sort((a, b) => a - b);
          const sum = sorted.reduce((acc, v) => acc + v, 0);
          const avg = sum / sorted.length;

          return {
            key,
            stats: {
              metric_name: metricName,
              sample_count: sorted.length,
              avg_value: Number(avg.toFixed(2)),
              min_value: sorted[0],
              max_value: sorted[sorted.length - 1],
              p50: percentile(sorted, 0.5),
              p95: percentile(sorted, 0.95),
              p99: percentile(sorted, 0.99),
            },
          };
        });

        setGrouped(result);
      } catch (err) {
        setError(err as Error);
        console.error('[useGroupedMetrics] Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrouped();
  }, [metricName, groupBy, options?.fromDate, options?.toDate]);

  return { grouped, isLoading, error };
}
