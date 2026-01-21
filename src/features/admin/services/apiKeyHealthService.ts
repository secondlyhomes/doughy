// src/features/admin/services/apiKeyHealthService.ts
// Service for coordinating API key health checks

import { supabase } from '@/lib/supabase';
import type { IntegrationHealth, IntegrationStatus, HealthCheckResponse } from '../types/integrations';
import { normalizeServiceName } from '../utils/serviceHelpers';

/**
 * Health check cache to prevent excessive API calls
 */
const healthCache = new Map<string, { health: IntegrationHealth; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Prevent unbounded cache growth
const HEALTH_CHECK_TIMEOUT = 15000; // 15 seconds timeout for health checks
const MAX_RETRIES = 2; // Number of retries for transient failures
const INITIAL_RETRY_DELAY = 1000; // 1 second initial retry delay

/**
 * Check if health check result is cached and still valid
 */
function getCachedHealth(service: string): IntegrationHealth | null {
  const cached = healthCache.get(service);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.health;
  }
  return null;
}

/**
 * Cache health check result with LRU-style eviction when cache is full
 */
function cacheHealth(service: string, health: IntegrationHealth): void {
  // Evict oldest entries if cache is at max size
  if (healthCache.size >= MAX_CACHE_SIZE && !healthCache.has(service)) {
    // Find and remove the oldest entry
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, value] of healthCache.entries()) {
      if (value.timestamp < oldestTimestamp) {
        oldestTimestamp = value.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      healthCache.delete(oldestKey);
    }
  }

  healthCache.set(service, { health, timestamp: Date.now() });
}

/**
 * Clear health cache for a specific service
 */
export function clearHealthCache(service?: string): void {
  if (service) {
    healthCache.delete(service);
  } else {
    healthCache.clear();
  }
}

/**
 * Wrap a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

/**
 * Check if an error is likely transient (worth retrying)
 */
function isTransientError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('socket') ||
      message.includes('fetch failed')
    );
  }
  return false;
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test an API key without saving it to the database
 * This allows validation before committing changes
 *
 * @param service - Service name to test
 * @param apiKey - The plaintext API key to test
 * @returns Integration health result
 */
export async function testApiKeyWithoutSaving(
  service: string,
  apiKey: string
): Promise<IntegrationHealth> {
  const normalizedService = normalizeServiceName(service);

  try {
    if (__DEV__) console.log(`[Health Check] Testing unsaved key for ${normalizedService}...`);

    // Call the integration-health edge function with the key to test
    const { data, error } = await withTimeout(
      supabase.functions.invoke<HealthCheckResponse>(
        'integration-health',
        {
          body: {
            service: normalizedService,
            testKey: apiKey, // Pass key directly for testing without persistence
          },
        }
      ),
      HEALTH_CHECK_TIMEOUT,
      `Health check timed out after ${HEALTH_CHECK_TIMEOUT / 1000}s`
    );

    if (__DEV__) console.log(`[Health Check] Test response for ${normalizedService}:`, data || error);

    if (error) {
      if (__DEV__) console.error('Health check error:', error);
      return {
        name: service,
        service: normalizedService,
        status: 'error',
        message: error.message || 'Failed to test key',
        lastChecked: new Date(),
      };
    }

    return {
      name: service,
      service: normalizedService,
      status: data?.status || 'error',
      latency: data?.latency ? `${data.latency}ms` : undefined,
      message: data?.message,
      lastChecked: new Date(),
    };
  } catch (error) {
    if (__DEV__) console.error('Exception during key test:', error);
    return {
      name: service,
      service: normalizedService,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date(),
    };
  }
}

/**
 * Check integration health by calling the Supabase Edge Function
 *
 * @param service - Service name to check
 * @param skipCache - Force fresh check, skip cache
 * @returns Integration health result
 */
export async function checkIntegrationHealth(
  service: string,
  skipCache = false
): Promise<IntegrationHealth> {
  const normalizedService = normalizeServiceName(service);

  // Check cache first
  if (!skipCache) {
    const cached = getCachedHealth(normalizedService);
    if (cached) {
      return cached;
    }
  }

  let lastError: Error | null = null;

  // Retry loop with exponential backoff
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        if (__DEV__) console.log(`[Health Check] Retry attempt ${attempt} for ${normalizedService}...`);
        await sleep(INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1));
      } else {
        if (__DEV__) console.log(`[Health Check] Checking ${normalizedService} via Supabase Edge Function...`);
      }

      // Call the integration-health edge function with timeout
      const { data, error } = await withTimeout(
        supabase.functions.invoke<HealthCheckResponse>(
          'integration-health',
          {
            body: { service: normalizedService },
          }
        ),
        HEALTH_CHECK_TIMEOUT,
        `Health check timed out after ${HEALTH_CHECK_TIMEOUT / 1000}s`
      );

      if (__DEV__) console.log(`[Health Check] Response for ${normalizedService}:`, data || error);

      if (error) {
        // Check if this error is worth retrying
        if (attempt < MAX_RETRIES && isTransientError(error)) {
          lastError = new Error(error.message || 'Unknown error');
          continue;
        }

        if (__DEV__) console.error('Health check error:', error);
        const result: IntegrationHealth = {
          name: service,
          service: normalizedService,
          status: 'error',
          message: error.message || 'Failed to check health',
          lastChecked: new Date(),
        };
        cacheHealth(normalizedService, result);
        return result;
      }

      const result: IntegrationHealth = {
        name: service,
        service: normalizedService,
        status: data?.status || 'error',
        latency: data?.latency ? `${data.latency}ms` : undefined,
        message: data?.message,
        lastChecked: new Date(),
      };

      cacheHealth(normalizedService, result);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Check if this error is worth retrying
      if (attempt < MAX_RETRIES && isTransientError(error)) {
        continue;
      }

      // Final attempt or non-transient error
      if (__DEV__) console.error('Exception during health check:', error);
      const result: IntegrationHealth = {
        name: service,
        service: normalizedService,
        status: 'error',
        message: lastError.message,
        lastChecked: new Date(),
      };
      cacheHealth(normalizedService, result);
      return result;
    }
  }

  // Should not reach here, but safety fallback
  const result: IntegrationHealth = {
    name: service,
    service: normalizedService,
    status: 'error',
    message: lastError?.message || 'Unknown error after retries',
    lastChecked: new Date(),
  };
  cacheHealth(normalizedService, result);
  return result;
}

/**
 * Check health for all configured integrations
 *
 * @param services - Array of service names to check
 * @returns Array of health results
 */
export async function checkAllIntegrations(services: string[]): Promise<IntegrationHealth[]> {
  const promises = services.map((service) => checkIntegrationHealth(service));
  return Promise.all(promises);
}

/**
 * Get health status for a service from the database
 * (Uses cached status from last health check)
 *
 * @param service - Service name
 * @returns Integration status from database
 */
export async function getHealthStatusFromDB(service: string): Promise<IntegrationStatus> {
  try {
    const normalizedService = normalizeServiceName(service);

    const { data, error } = await supabase
      .from('security_api_keys')
      .select('status, last_checked')
      .eq('service', normalizedService)
      .maybeSingle();

    if (error || !data) {
      return 'not-configured';
    }

    // If never checked, return 'configured'
    if (!data.last_checked) {
      return 'configured';
    }

    // Return status from database
    return (data.status as IntegrationStatus) || 'configured';
  } catch (error) {
    console.error('Error getting health status from DB:', error);
    return 'not-configured';
  }
}

/**
 * Batch health check with progress callback
 *
 * @param services - Array of service names
 * @param onProgress - Optional callback for progress updates
 * @returns Array of health results
 */
export async function batchHealthCheck(
  services: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<IntegrationHealth[]> {
  const results: IntegrationHealth[] = [];
  let completed = 0;

  for (const service of services) {
    const health = await checkIntegrationHealth(service);
    results.push(health);
    completed++;
    onProgress?.(completed, services.length);
  }

  return results;
}
