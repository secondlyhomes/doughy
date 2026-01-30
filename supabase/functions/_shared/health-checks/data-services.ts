/**
 * Data Services Health Checks
 *
 * Health check functions for data lookup services:
 * - Tracerfy (skip tracing / property owner lookup)
 *
 * @module _shared/health-checks/data-services
 */

import type { HealthCheckResult, Logger } from "./types.ts";

// =============================================================================
// Tracerfy
// =============================================================================

/**
 * Check Tracerfy API health.
 * Tracerfy is a skip tracing service for property owner lookup.
 *
 * @param apiKey - Tracerfy API key
 * @param log - Logger instance
 * @returns Health check result
 */
export async function checkTracerfy(
  apiKey: string,
  log: Logger
): Promise<HealthCheckResult> {
  try {
    log.info("Checking Tracerfy API health...", {});

    const startTime = Date.now();

    // Use Tracerfy's account/credits endpoint to verify API key
    // This confirms authentication without using credits
    const response = await fetch('https://api.tracerfy.com/v1/account/credits', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const latency = Date.now() - startTime;

    log.info(`Tracerfy API response status: ${response.status}`, {});

    if (response.ok) {
      return {
        status: 'operational',
        message: 'Tracerfy API is operational',
        service: 'tracerfy',
        latency: `${latency}ms`,
      };
    }

    // Handle specific error codes
    if (response.status === 401) {
      return {
        status: 'error',
        message: 'Invalid Tracerfy API key',
        service: 'tracerfy',
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

    log.error(`Tracerfy API error: ${errorMessage}`, {});

    return {
      status: 'error',
      message: `Tracerfy API error: ${errorMessage}`,
      service: 'tracerfy',
      latency: `${latency}ms`,
    };
  } catch (error) {
    log.error('Tracerfy API health check error:', error);
    return {
      status: 'error',
      message: error.message || 'Error checking Tracerfy API health',
      service: 'tracerfy',
    };
  }
}
