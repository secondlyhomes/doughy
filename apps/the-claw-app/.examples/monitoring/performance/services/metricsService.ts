/**
 * Metrics Service
 *
 * Service for collecting, batching, and sending performance metrics to backend.
 * Includes local buffering, retry logic, and analytics integration.
 *
 * @example
 * ```typescript
 * import { metricsService } from './services/metricsService';
 *
 * // Record a metric
 * metricsService.record('screen_load', 1250, { screen: 'Dashboard' });
 *
 * // Flush to backend
 * await metricsService.flush();
 * ```
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Metric interface
 */
export interface Metric {
  id?: string;
  name: string;
  value: number;
  unit?: string;
  timestamp: number;
  tags?: Record<string, string | number>;
  metadata?: Record<string, any>;
}

/**
 * Aggregated metric
 */
export interface AggregatedMetric {
  name: string;
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
  tags?: Record<string, string | number>;
}

/**
 * Metrics service configuration
 */
export interface MetricsServiceConfig {
  /** Supabase URL */
  supabaseUrl?: string;
  /** Supabase anon key */
  supabaseKey?: string;
  /** Maximum number of metrics to buffer before flush */
  maxBufferSize?: number;
  /** Auto-flush interval in ms (0 to disable) */
  autoFlushInterval?: number;
  /** Enable local storage persistence */
  enablePersistence?: boolean;
  /** Retry failed flushes */
  enableRetry?: boolean;
  /** Max retry attempts */
  maxRetries?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<MetricsServiceConfig> = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  maxBufferSize: 100,
  autoFlushInterval: 60000, // 1 minute
  enablePersistence: true,
  enableRetry: true,
  maxRetries: 3,
  debug: __DEV__,
};

/**
 * Storage key for persisted metrics
 */
const STORAGE_KEY = '@metrics_buffer';

/**
 * Metrics Service Class
 */
class MetricsService {
  private config: Required<MetricsServiceConfig>;
  private buffer: Metric[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isFlushing = false;
  private retryCount = 0;
  private supabase: ReturnType<typeof createClient> | null = null;

  constructor(config?: MetricsServiceConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize Supabase if credentials provided
    if (this.config.supabaseUrl && this.config.supabaseKey) {
      this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseKey);
    }

    // Load persisted metrics
    this.loadFromStorage();

    // Start auto-flush timer
    if (this.config.autoFlushInterval > 0) {
      this.startAutoFlush();
    }
  }

  /**
   * Record a metric
   */
  public record(
    name: string,
    value: number,
    tags?: Record<string, string | number>,
    unit?: string
  ): void {
    const metric: Metric = {
      name,
      value,
      unit: unit || 'ms',
      timestamp: Date.now(),
      tags: {
        ...tags,
        platform: Platform.OS,
        app_version: process.env.EXPO_PUBLIC_APP_VERSION || 'unknown',
      },
    };

    this.buffer.push(metric);

    if (this.config.debug) {
      console.log('[Metrics] Recorded:', metric);
    }

    // Auto-flush if buffer is full
    if (this.buffer.length >= this.config.maxBufferSize) {
      this.flush();
    }

    // Persist to storage
    if (this.config.enablePersistence) {
      this.saveToStorage();
    }
  }

  /**
   * Record multiple metrics at once
   */
  public recordBatch(metrics: Omit<Metric, 'timestamp'>[]): void {
    metrics.forEach(metric => {
      this.record(metric.name, metric.value, metric.tags, metric.unit);
    });
  }

  /**
   * Flush metrics to backend
   */
  public async flush(): Promise<void> {
    if (this.isFlushing || this.buffer.length === 0) {
      return;
    }

    this.isFlushing = true;

    try {
      const metricsToSend = [...this.buffer];
      this.buffer = [];

      if (this.supabase) {
        const { error } = await this.supabase.from('app_metrics').insert(
          metricsToSend.map(metric => ({
            metric_name: metric.name,
            metric_value: metric.value,
            metric_unit: metric.unit,
            tags: metric.tags,
            metadata: metric.metadata,
            created_at: new Date(metric.timestamp).toISOString(),
          }))
        );

        if (error) {
          throw error;
        }

        if (this.config.debug) {
          console.log(`[Metrics] Flushed ${metricsToSend.length} metrics`);
        }

        // Reset retry count on success
        this.retryCount = 0;

        // Clear storage
        if (this.config.enablePersistence) {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      } else {
        // No Supabase configured, just log
        if (this.config.debug) {
          console.log('[Metrics] No backend configured, metrics:', metricsToSend);
        }
      }
    } catch (error) {
      console.error('[Metrics] Failed to flush:', error);

      // Restore metrics to buffer
      this.buffer.unshift(...this.buffer);

      // Retry if enabled
      if (this.config.enableRetry && this.retryCount < this.config.maxRetries) {
        this.retryCount++;
        console.log(`[Metrics] Retrying (${this.retryCount}/${this.config.maxRetries})...`);
        setTimeout(() => this.flush(), 5000 * this.retryCount);
      }
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Get current buffer size
   */
  public getBufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Get all buffered metrics
   */
  public getBuffer(): Metric[] {
    return [...this.buffer];
  }

  /**
   * Clear buffer
   */
  public clearBuffer(): void {
    this.buffer = [];

    if (this.config.enablePersistence) {
      AsyncStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Calculate statistics for a metric
   */
  public async getMetricStats(
    metricName: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<AggregatedMetric | null> {
    if (!this.supabase) {
      console.warn('[Metrics] No Supabase configured');
      return null;
    }

    try {
      let query = this.supabase
        .from('app_metrics')
        .select('metric_value')
        .eq('metric_name', metricName);

      if (fromDate) {
        query = query.gte('created_at', fromDate.toISOString());
      }

      if (toDate) {
        query = query.lte('created_at', toDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const values = data.map(d => d.metric_value).sort((a, b) => a - b);
      const sum = values.reduce((acc, v) => acc + v, 0);
      const avg = sum / values.length;

      return {
        name: metricName,
        count: values.length,
        sum,
        avg,
        min: values[0],
        max: values[values.length - 1],
        p50: this.percentile(values, 0.5),
        p95: this.percentile(values, 0.95),
        p99: this.percentile(values, 0.99),
      };
    } catch (error) {
      console.error('[Metrics] Failed to get stats:', error);
      return null;
    }
  }

  /**
   * Get top slowest operations
   */
  public async getTopSlowest(
    metricName: string,
    limit = 10
  ): Promise<Metric[] | null> {
    if (!this.supabase) {
      console.warn('[Metrics] No Supabase configured');
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('app_metrics')
        .select('*')
        .eq('metric_name', metricName)
        .order('metric_value', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('[Metrics] Failed to get top slowest:', error);
      return null;
    }
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    const index = Math.ceil(values.length * p) - 1;
    return values[index];
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.autoFlushInterval);
  }

  /**
   * Stop auto-flush timer
   */
  private stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Save buffer to storage
   */
  private async saveToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.buffer));
    } catch (error) {
      console.error('[Metrics] Failed to save to storage:', error);
    }
  }

  /**
   * Load buffer from storage
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        this.buffer = JSON.parse(data);
        if (this.config.debug) {
          console.log(`[Metrics] Loaded ${this.buffer.length} metrics from storage`);
        }
      }
    } catch (error) {
      console.error('[Metrics] Failed to load from storage:', error);
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopAutoFlush();
    this.flush();
  }
}

/**
 * Singleton instance
 */
export const metricsService = new MetricsService();

/**
 * Create custom metrics service with config
 */
export function createMetricsService(config?: MetricsServiceConfig): MetricsService {
  return new MetricsService(config);
}

/**
 * Helper: Track operation with metrics service
 */
export async function trackOperation<T>(
  name: string,
  operation: () => Promise<T>,
  tags?: Record<string, string | number>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - startTime;

    metricsService.record(name, duration, { ...tags, success: 'true' });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    metricsService.record(name, duration, {
      ...tags,
      success: 'false',
      error: error instanceof Error ? error.message : 'unknown',
    });

    throw error;
  }
}

/**
 * Helper: Track metric value
 */
export function trackMetric(
  name: string,
  value: number,
  tags?: Record<string, string | number>,
  unit?: string
): void {
  metricsService.record(name, value, tags, unit);
}
