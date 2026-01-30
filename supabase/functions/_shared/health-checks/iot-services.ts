/**
 * IoT Services Health Checks
 *
 * Health check functions for IoT and smart home services:
 * - Seam (smart lock integration)
 *
 * @module _shared/health-checks/iot-services
 */

import type { HealthCheckResult, Logger } from "./types.ts";

// =============================================================================
// Seam
// =============================================================================

/**
 * Check Seam API health by listing workspaces.
 * Seam is a smart lock integration platform.
 *
 * @param apiKey - Seam API key
 * @param log - Logger instance
 * @returns Health check result
 */
export async function checkSeam(
  apiKey: string,
  log: Logger
): Promise<HealthCheckResult> {
  try {
    log.info("Checking Seam API health...", {});

    const startTime = Date.now();

    // Use Seam's workspaces endpoint to verify API key
    // This is a lightweight call that confirms authentication
    const response = await fetch('https://connect.getseam.com/workspaces/list', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'seam-sdk-name': 'doughy-ai',
        'seam-sdk-version': '1.0.0',
      },
      body: JSON.stringify({}),
    });

    const latency = Date.now() - startTime;

    log.info(`Seam API response status: ${response.status}`, {});

    if (response.ok) {
      return {
        status: 'operational',
        message: 'Seam API is operational',
        service: 'seam',
        latency: `${latency}ms`,
      };
    }

    // Handle specific error codes
    if (response.status === 401) {
      return {
        status: 'error',
        message: 'Invalid Seam API key',
        service: 'seam',
        latency: `${latency}ms`,
      };
    }

    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      if (errorData.error && errorData.error.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      // Ignore JSON parsing errors
    }

    log.error(`Seam API error: ${errorMessage}`, {});

    return {
      status: 'error',
      message: `Seam API error: ${errorMessage}`,
      service: 'seam',
      latency: `${latency}ms`,
    };
  } catch (error) {
    log.error('Seam API health check error:', error);
    return {
      status: 'error',
      message: error.message || 'Error checking Seam API health',
      service: 'seam',
    };
  }
}
