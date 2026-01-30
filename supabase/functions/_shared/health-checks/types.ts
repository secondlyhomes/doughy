/**
 * Health Check Types
 *
 * Common types for all health check modules.
 *
 * @module _shared/health-checks/types
 */

export interface HealthCheckResult {
  status: 'operational' | 'configured' | 'error' | 'not-configured';
  message: string;
  service: string;
  latency?: string;
  http_status?: number;
}

export interface Logger {
  info: (message: string, details?: Record<string, unknown>) => void;
  error: (message: string, details?: Record<string, unknown>) => void;
}
