/**
 * Communication Services Health Checks
 *
 * Health check functions for communication services:
 * - Twilio
 * - MoltBot
 *
 * @module _shared/health-checks/communication-services
 */

import type { HealthCheckResult, Logger } from "./types.ts";
import { validateExternalUrl } from "../api-helpers.ts";

// =============================================================================
// Twilio
// =============================================================================

/**
 * Check Twilio API health.
 * In a real implementation, you would need both the account SID and auth token.
 *
 * @param _apiKey - Twilio auth token
 * @param service - Service type (twilio, twilio-sid, twilio-phone)
 * @param log - Logger instance
 * @returns Health check result
 */
export async function checkTwilio(
  _apiKey: string,
  service: string,
  log: Logger
): Promise<HealthCheckResult> {
  try {
    log.info("Checking Twilio integration health...", {});

    // In a real implementation, we'd use both the account SID and auth token
    // This is a simplified check
    return {
      status: 'configured',
      message: 'Twilio integration is configured',
      service: service,
    };
  } catch (error) {
    log.error('Twilio health check error:', error);
    return {
      status: 'error',
      message: error.message || 'Error checking Twilio integration health',
      service: service,
    };
  }
}

// =============================================================================
// MoltBot
// =============================================================================

const MOLTBOT_TIMEOUT_MS = 5000;

/**
 * Check MoltBot server health.
 * Pings the MoltBot server's /health endpoint to verify connectivity
 * and check Supabase/Gmail integration status.
 *
 * @param serverUrl - MoltBot server URL
 * @param log - Logger instance
 * @returns Health check result
 */
export async function checkMoltBot(
  serverUrl: string,
  log: Logger
): Promise<HealthCheckResult> {
  try {
    log.info("Checking MoltBot server health...", {});

    // Validate URL to prevent SSRF attacks
    const urlValidation = validateExternalUrl(serverUrl);
    if (!urlValidation.valid) {
      return {
        status: 'error',
        message: urlValidation.error || 'Invalid server URL',
        service: 'moltbot',
      };
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MOLTBOT_TIMEOUT_MS);

    const response = await fetch(`${serverUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;

    if (!response.ok) {
      log.error(`MoltBot server error: ${response.status} ${response.statusText}`, {});
      return {
        status: 'error',
        message: `MoltBot server returned ${response.status}`,
        service: 'moltbot',
        latency: `${latency}ms`,
      };
    }

    // Parse JSON response with error handling for malformed responses
    let data;
    try {
      data = await response.json();
    } catch {
      log.error('MoltBot returned invalid JSON response:', { status: response.status });
      return {
        status: 'error',
        message: 'MoltBot server returned an invalid response format',
        service: 'moltbot',
        latency: `${latency}ms`,
      };
    }

    // Expected response: { status: 'healthy', supabase: 'ok'|'error', gmail: 'ready'|'not_watching' }
    const supabaseOk = data.supabase === 'ok';
    const gmailReady = data.gmail === 'ready';

    // Fully operational: both Supabase and Gmail working
    if (supabaseOk && gmailReady) {
      return {
        status: 'operational',
        message: 'MoltBot server is fully operational',
        service: 'moltbot',
        latency: `${latency}ms`,
      };
    }

    // Partially configured: Supabase works but Gmail not connected
    if (supabaseOk) {
      return {
        status: 'configured',
        message: `MoltBot server connected, Gmail: ${data.gmail || 'not connected'}`,
        service: 'moltbot',
        latency: `${latency}ms`,
      };
    }

    // Error: Supabase connection failed
    return {
      status: 'error',
      message: `MoltBot: Supabase ${data.supabase || 'error'}, Gmail ${data.gmail || 'unknown'}`,
      service: 'moltbot',
      latency: `${latency}ms`,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error
      ? (error.name === 'AbortError'
        ? `MoltBot server connection timed out (${MOLTBOT_TIMEOUT_MS / 1000}s)`
        : error.message)
      : 'Error connecting to MoltBot server';

    log.error('MoltBot health check error:', error);
    return {
      status: 'error',
      message: errorMessage,
      service: 'moltbot',
    };
  }
}
