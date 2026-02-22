// src/features/admin/services/api-key-health/health-checks.ts
// Core health check functions

import { supabase } from '@/lib/supabase';

import type { IntegrationHealth, IntegrationStatus, HealthCheckResponse } from '../../types/integrations';
import { normalizeServiceName } from '../../utils/serviceHelpers';
import type { HealthStatusFromDBResult, CredentialExistsResult } from './types';
import { getCachedHealth, cacheHealth } from './cache';
import {
  withTimeout,
  isTransientError,
  sleepWithJitter,
  HEALTH_CHECK_TIMEOUT,
  MAX_RETRIES,
  INITIAL_RETRY_DELAY,
} from './retry';

/**
 * Extract detailed error message from Supabase FunctionsHttpError
 */
function extractErrorMessage(error: { message?: string; context?: unknown }): string {
  let errorMessage = error.message || 'Unknown error';

  // Try to get more details from the error context
  if (error.context && typeof error.context === 'object') {
    const ctx = error.context as Record<string, unknown>;
    if (ctx.body && typeof ctx.body === 'string') {
      try {
        const bodyJson = JSON.parse(ctx.body);
        if (bodyJson.error) {
          errorMessage = typeof bodyJson.error === 'string' ? bodyJson.error : JSON.stringify(bodyJson.error);
        } else if (bodyJson.message) {
          errorMessage = bodyJson.message;
        }
      } catch {
        if (ctx.body.length > 0 && ctx.body.length < 500) {
          errorMessage = ctx.body;
        }
      }
    }
  }

  // If still generic, provide more actionable message
  if (errorMessage.includes('non-2xx status code')) {
    errorMessage = 'Health check failed - the server returned an error. Check Supabase logs for details.';
  }

  return errorMessage;
}

/**
 * Test an API key without saving it to the database
 * This allows validation before committing changes
 */
export async function testApiKeyWithoutSaving(
  service: string,
  apiKey: string
): Promise<IntegrationHealth> {
  const normalizedService = normalizeServiceName(service);

  try {
    if (__DEV__) console.log(`[Health Check] Testing unsaved key for ${normalizedService}...`);

    const { data, error } = await withTimeout(
      supabase.functions.invoke<HealthCheckResponse>(
        'integration-health',
        {
          body: {
            service: normalizedService,
            testKey: apiKey,
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
        message: extractErrorMessage(error),
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
        await sleepWithJitter(INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1));
      } else {
        if (__DEV__) console.log(`[Health Check] Checking ${normalizedService} via Supabase Edge Function...`);
      }

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
        if (attempt < MAX_RETRIES && isTransientError(error)) {
          lastError = new Error(error.message || 'Unknown error');
          continue;
        }

        if (__DEV__) console.error('Health check error:', error);

        const result: IntegrationHealth = {
          name: service,
          service: normalizedService,
          status: 'error',
          message: extractErrorMessage(error),
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

      if (attempt < MAX_RETRIES && isTransientError(error)) {
        continue;
      }

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

  // Safety fallback
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
 */
export async function checkAllIntegrations(services: string[]): Promise<IntegrationHealth[]> {
  const promises = services.map((service) => checkIntegrationHealth(service));
  return Promise.all(promises);
}

/**
 * Check if credentials exist for given services (no decryption needed)
 * Used for initial UI status before health checks complete
 */
export async function checkCredentialsExist(
  services: string[]
): Promise<Map<string, CredentialExistsResult>> {
  const results = new Map<string, CredentialExistsResult>();

  if (services.length === 0) {
    return results;
  }

  try {
    const normalizedServices = services.map(normalizeServiceName);

    const { data, error } = await supabase
      .from('security_api_keys')
      .select('service, created_at, updated_at')
      .in('service', normalizedServices);

    if (error) {
      console.error('[admin] Error checking credential existence:', error);
      return results;
    }

    const existingServices = new Map(
      (data || []).map((row) => [row.service, row])
    );

    for (const service of services) {
      const normalizedService = normalizeServiceName(service);
      const record = existingServices.get(normalizedService);

      results.set(service, {
        exists: !!record,
        service: normalizedService,
        createdAt: record?.created_at ?? undefined,
        updatedAt: record?.updated_at ?? undefined,
      });
    }

    return results;
  } catch (error) {
    console.error('[admin] Exception checking credential existence:', error);
    return results;
  }
}

/**
 * Get health status for a service from the database
 * (Uses cached status from last health check)
 */
export async function getHealthStatusFromDB(service: string): Promise<HealthStatusFromDBResult> {
  try {
    const normalizedService = normalizeServiceName(service);

    const { data, error } = await supabase
      .from('security_api_keys')
      .select('status, last_checked')
      .eq('service', normalizedService)
      .maybeSingle();

    if (error) {
      console.error('[admin] Error getting health status from DB:', error);
      return { status: 'error', error: error.message };
    }

    if (!data) {
      return { status: 'not-configured' };
    }

    if (!data.last_checked) {
      return { status: 'configured' };
    }

    return { status: (data.status as IntegrationStatus) || 'configured' };
  } catch (error) {
    console.error('[admin] Error getting health status from DB:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Database error',
    };
  }
}

/**
 * Batch health check with parallel execution and controlled concurrency
 */
export async function batchHealthCheck(
  services: string[],
  onProgress?: (completed: number, total: number) => void,
  onResult?: (service: string, health: IntegrationHealth) => void,
  concurrency = 6
): Promise<IntegrationHealth[]> {
  const results: IntegrationHealth[] = new Array(services.length);
  let completed = 0;

  if (services.length === 0) {
    onProgress?.(0, 0);
    return [];
  }

  for (let i = 0; i < services.length; i += concurrency) {
    const batch = services.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (service, batchIndex) => {
        const health = await checkIntegrationHealth(service);
        completed++;

        try {
          onProgress?.(completed, services.length);
        } catch (callbackError) {
          if (__DEV__) console.warn('[Health Check] onProgress callback error:', callbackError);
        }

        try {
          onResult?.(service, health);
        } catch (callbackError) {
          if (__DEV__) console.warn('[Health Check] onResult callback error:', callbackError);
        }

        return { index: i + batchIndex, health };
      })
    );

    batchResults.forEach(({ index, health }) => {
      results[index] = health;
    });
  }

  return results;
}
