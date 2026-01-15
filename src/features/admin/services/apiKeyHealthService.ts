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
 * Cache health check result
 */
function cacheHealth(service: string, health: IntegrationHealth): void {
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

  try {
    console.log(`[Health Check] Checking ${normalizedService} via Supabase Edge Function...`);

    // Call the integration-health edge function
    const { data, error } = await supabase.functions.invoke<HealthCheckResponse>(
      'integration-health',
      {
        body: { service: normalizedService },
      }
    );

    console.log(`[Health Check] Response for ${normalizedService}:`, data || error);

    if (error) {
      console.error('Health check error:', error);
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
    console.error('Exception during health check:', error);
    const result: IntegrationHealth = {
      name: service,
      service: normalizedService,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date(),
    };
    cacheHealth(normalizedService, result);
    return result;
  }
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
      .from('api_keys')
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
