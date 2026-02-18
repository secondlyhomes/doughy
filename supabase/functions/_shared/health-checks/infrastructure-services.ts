/**
 * Infrastructure Services Health Checks
 *
 * Health check implementations for infrastructure services:
 * - Supabase (Database)
 * - Netlify (Hosting)
 *
 * @module _shared/health-checks/infrastructure-services
 */

import type { HealthCheckResult, Logger } from "./types.ts";

/**
 * Check Supabase health by validating the anon key or URL
 */
export async function checkSupabase(
  apiKey: string,
  service: string,
  log: Logger
): Promise<HealthCheckResult> {
  try {
    log.info(`Checking Supabase health for ${service}...`, {});

    const startTime = Date.now();
    const isUrl = service.includes('-url');
    const isProd = service.includes('-prod');
    const env = isProd ? 'Production' : 'Staging';

    if (isUrl) {
      // For URL, check that it's a valid Supabase URL and reachable
      if (!apiKey.includes('supabase.co') && !apiKey.includes('supabase.in')) {
        return {
          status: 'error',
          message: `Invalid Supabase URL format for ${env}`,
          service,
        };
      }

      // Try to reach the health endpoint
      const healthUrl = `${apiKey.replace(/\/$/, '')}/rest/v1/`;
      const response = await fetch(healthUrl, {
        method: 'HEAD',
        headers: { 'Content-Type': 'application/json' },
      });

      const latency = Date.now() - startTime;

      // 401 is expected without auth header - it means the endpoint is reachable
      if (response.ok || response.status === 401) {
        return {
          status: 'operational',
          message: `Supabase ${env} URL is reachable`,
          service,
          latency: `${latency}ms`,
        };
      }

      return {
        status: 'error',
        message: `Supabase ${env} URL returned ${response.status}`,
        service,
        latency: `${latency}ms`,
      };
    } else {
      // For anon key, validate format
      // Supabase anon keys are JWTs starting with 'eyJ'
      if (!apiKey.startsWith('eyJ')) {
        return {
          status: 'error',
          message: `Invalid Supabase anon key format for ${env}`,
          service,
        };
      }

      // Check key length (typical Supabase keys are 200+ chars)
      if (apiKey.length < 100) {
        return {
          status: 'error',
          message: `Supabase ${env} key appears too short`,
          service,
        };
      }

      return {
        status: 'operational',
        message: `Supabase ${env} anon key format is valid`,
        service,
      };
    }
  } catch (error) {
    log.error('Supabase health check error:', { error });
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Error checking Supabase',
      service,
    };
  }
}

/**
 * Check Netlify API health
 */
export async function checkNetlify(
  apiKey: string,
  service: string,
  log: Logger
): Promise<HealthCheckResult> {
  try {
    log.info(`Checking Netlify health for ${service}...`, {});

    const startTime = Date.now();
    const isProd = service.includes('-prod');
    const env = isProd ? 'Production' : 'Staging';

    // Call Netlify API to verify the token
    const response = await fetch('https://api.netlify.com/api/v1/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const latency = Date.now() - startTime;

    log.info(`Netlify API response status: ${response.status}`, {});

    if (response.ok) {
      return {
        status: 'operational',
        message: `Netlify ${env} API is operational`,
        service,
        latency: `${latency}ms`,
      };
    }

    if (response.status === 401) {
      return {
        status: 'error',
        message: `Invalid Netlify API token for ${env}`,
        service,
        latency: `${latency}ms`,
      };
    }

    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Ignore JSON parsing errors
    }

    log.error(`Netlify API error: ${errorMessage}`, {});

    return {
      status: 'error',
      message: `Netlify ${env} API error: ${errorMessage}`,
      service,
      latency: `${latency}ms`,
    };
  } catch (error) {
    log.error('Netlify health check error:', { error });
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Error checking Netlify API',
      service,
    };
  }
}
