/**
 * HEALTH CHECK & MONITORING
 *
 * Comprehensive health checking system for infrastructure monitoring
 * Checks database, external APIs, storage, and more
 *
 * @example
 * ```ts
 * const checker = new HealthChecker()
 * const health = await checker.getSystemHealth()
 * console.log(health.overall) // 'healthy' | 'degraded' | 'unhealthy'
 * ```
 */

import { supabase } from '@/services/supabaseClient'

// ============================================================================
// TYPES
// ============================================================================

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export interface ServiceHealth {
  service: string
  status: HealthStatus
  latency?: number
  error?: string
  metadata?: Record<string, any>
  checkedAt: string
}

export interface SystemHealth {
  overall: HealthStatus
  services: ServiceHealth[]
  timestamp: string
  version?: string
}

export interface HealthCheckConfig {
  timeout?: number
  includeMetadata?: boolean
}

// ============================================================================
// HEALTH CHECKER
// ============================================================================

export class HealthChecker {
  constructor(private config: HealthCheckConfig = {}) {}

  /**
   * Get overall system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const [db, storage, external] = await Promise.all([
      this.checkSupabaseHealth(),
      this.checkStorageHealth(),
      this.checkExternalAPIs(),
    ])

    const services = [db, storage, ...external]
    const overall = this.calculateOverallHealth(services)

    return {
      overall,
      services,
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION,
    }
  }

  /**
   * Check Supabase database health
   */
  async checkSupabaseHealth(): Promise<ServiceHealth> {
    const start = Date.now()

    try {
      // Simple query to test connection
      const { error } = await supabase
        .from('health_check')
        .select('id')
        .limit(1)
        .timeout(this.config.timeout || 5000)

      const latency = Date.now() - start

      if (error) {
        return {
          service: 'supabase',
          status: 'unhealthy',
          latency,
          error: error.message,
          checkedAt: new Date().toISOString(),
        }
      }

      // Check latency thresholds
      const status = latency > 1000 ? 'degraded' : 'healthy'

      return {
        service: 'supabase',
        status,
        latency,
        metadata: this.config.includeMetadata
          ? {
              region: process.env.SUPABASE_REGION,
              version: 'postgres-14',
            }
          : undefined,
        checkedAt: new Date().toISOString(),
      }
    } catch (error: any) {
      return {
        service: 'supabase',
        status: 'unhealthy',
        latency: Date.now() - start,
        error: error.message,
        checkedAt: new Date().toISOString(),
      }
    }
  }

  /**
   * Check storage health
   */
  async checkStorageHealth(): Promise<ServiceHealth> {
    const start = Date.now()

    try {
      // Try to list buckets
      const { data, error } = await supabase.storage.listBuckets()

      const latency = Date.now() - start

      if (error) {
        return {
          service: 'storage',
          status: 'unhealthy',
          latency,
          error: error.message,
          checkedAt: new Date().toISOString(),
        }
      }

      const status = latency > 2000 ? 'degraded' : 'healthy'

      return {
        service: 'storage',
        status,
        latency,
        metadata: this.config.includeMetadata
          ? { buckets: data.length }
          : undefined,
        checkedAt: new Date().toISOString(),
      }
    } catch (error: any) {
      return {
        service: 'storage',
        status: 'unhealthy',
        latency: Date.now() - start,
        error: error.message,
        checkedAt: new Date().toISOString(),
      }
    }
  }

  /**
   * Check external APIs
   */
  async checkExternalAPIs(): Promise<ServiceHealth[]> {
    return Promise.all([
      this.checkOpenAI(),
      this.checkStripe(),
      this.checkSentry(),
    ])
  }

  /**
   * Check OpenAI API
   */
  async checkOpenAI(): Promise<ServiceHealth> {
    const start = Date.now()

    if (!process.env.OPENAI_API_KEY) {
      return {
        service: 'openai',
        status: 'degraded',
        error: 'API key not configured',
        checkedAt: new Date().toISOString(),
      }
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        signal: AbortSignal.timeout(this.config.timeout || 5000),
      })

      const latency = Date.now() - start

      if (!response.ok) {
        return {
          service: 'openai',
          status: 'unhealthy',
          latency,
          error: `HTTP ${response.status}`,
          checkedAt: new Date().toISOString(),
        }
      }

      const status = latency > 2000 ? 'degraded' : 'healthy'

      return {
        service: 'openai',
        status,
        latency,
        checkedAt: new Date().toISOString(),
      }
    } catch (error: any) {
      return {
        service: 'openai',
        status: 'unhealthy',
        latency: Date.now() - start,
        error: error.message,
        checkedAt: new Date().toISOString(),
      }
    }
  }

  /**
   * Check Stripe API
   */
  async checkStripe(): Promise<ServiceHealth> {
    const start = Date.now()

    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        service: 'stripe',
        status: 'degraded',
        error: 'API key not configured',
        checkedAt: new Date().toISOString(),
      }
    }

    try {
      const response = await fetch('https://api.stripe.com/v1/balance', {
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        },
        signal: AbortSignal.timeout(this.config.timeout || 5000),
      })

      const latency = Date.now() - start

      if (!response.ok) {
        return {
          service: 'stripe',
          status: 'unhealthy',
          latency,
          error: `HTTP ${response.status}`,
          checkedAt: new Date().toISOString(),
        }
      }

      const status = latency > 1500 ? 'degraded' : 'healthy'

      return {
        service: 'stripe',
        status,
        latency,
        checkedAt: new Date().toISOString(),
      }
    } catch (error: any) {
      return {
        service: 'stripe',
        status: 'unhealthy',
        latency: Date.now() - start,
        error: error.message,
        checkedAt: new Date().toISOString(),
      }
    }
  }

  /**
   * Check Sentry
   */
  async checkSentry(): Promise<ServiceHealth> {
    const start = Date.now()

    try {
      // Sentry doesn't have a direct health check endpoint
      // We'll just check if the DSN is configured
      if (!process.env.SENTRY_DSN) {
        return {
          service: 'sentry',
          status: 'degraded',
          error: 'DSN not configured',
          checkedAt: new Date().toISOString(),
        }
      }

      return {
        service: 'sentry',
        status: 'healthy',
        latency: Date.now() - start,
        checkedAt: new Date().toISOString(),
      }
    } catch (error: any) {
      return {
        service: 'sentry',
        status: 'unhealthy',
        error: error.message,
        checkedAt: new Date().toISOString(),
      }
    }
  }

  /**
   * Calculate overall health from individual services
   */
  private calculateOverallHealth(services: ServiceHealth[]): HealthStatus {
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length
    const degradedCount = services.filter(s => s.status === 'degraded').length

    // Any critical service unhealthy = system unhealthy
    const criticalServices = ['supabase', 'storage']
    const criticalUnhealthy = services.some(
      s => criticalServices.includes(s.service) && s.status === 'unhealthy'
    )

    if (criticalUnhealthy || unhealthyCount > 2) {
      return 'unhealthy'
    }

    if (unhealthyCount > 0 || degradedCount > 1) {
      return 'degraded'
    }

    return 'healthy'
  }
}

// ============================================================================
// MONITORING
// ============================================================================

export class HealthMonitor {
  private checker: HealthChecker
  private interval: NodeJS.Timeout | null = null

  constructor(config: HealthCheckConfig = {}) {
    this.checker = new HealthChecker(config)
  }

  /**
   * Start monitoring at regular intervals
   */
  start(intervalMs = 60000) {
    this.interval = setInterval(async () => {
      const health = await this.checker.getSystemHealth()
      await this.recordHealth(health)

      if (health.overall !== 'healthy') {
        await this.sendAlert(health)
      }
    }, intervalMs)
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  /**
   * Record health check result
   */
  private async recordHealth(health: SystemHealth) {
    try {
      await supabase.from('health_checks').insert({
        overall_status: health.overall,
        services: health.services,
        timestamp: health.timestamp,
        version: health.version,
      })
    } catch (error) {
      console.error('Failed to record health check:', error)
    }
  }

  /**
   * Send alert when system is unhealthy
   */
  private async sendAlert(health: SystemHealth) {
    const unhealthyServices = health.services.filter(
      s => s.status === 'unhealthy'
    )

    console.error('System health alert:', {
      overall: health.overall,
      unhealthyServices: unhealthyServices.map(s => ({
        service: s.service,
        error: s.error,
      })),
    })

    // In production, send to alerting system (PagerDuty, Slack, etc.)
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Create health check endpoint response
 */
export function createHealthCheckResponse(health: SystemHealth) {
  const statusCode = health.overall === 'healthy' ? 200 : health.overall === 'degraded' ? 207 : 503

  return {
    statusCode,
    body: health,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  }
}

/**
 * Get health check history
 */
export async function getHealthCheckHistory(limit = 100) {
  const { data, error } = await supabase
    .from('health_checks')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

/**
 * Get uptime statistics
 */
export async function getUptimeStats(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('health_checks')
    .select('overall_status, timestamp')
    .gte('timestamp', since)
    .order('timestamp')

  if (error) throw error

  const total = data.length
  const healthy = data.filter(h => h.overall_status === 'healthy').length

  return {
    uptime: (healthy / total) * 100,
    total,
    healthy,
    degraded: data.filter(h => h.overall_status === 'degraded').length,
    unhealthy: data.filter(h => h.overall_status === 'unhealthy').length,
    period: `${hours}h`,
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const healthChecker = new HealthChecker()
export const healthMonitor = new HealthMonitor()
