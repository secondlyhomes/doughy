/**
 * Payment Services Health Checks
 *
 * Health check functions for payment providers:
 * - Stripe (Secret and Public keys)
 * - Plaid
 *
 * @module _shared/health-checks/payment-services
 */

import type { HealthCheckResult, Logger } from "./types.ts";

// =============================================================================
// Stripe Secret Key
// =============================================================================

/**
 * Check Stripe Secret API key health by checking the balance endpoint
 *
 * @param apiKey - Stripe secret API key
 * @param log - Logger instance
 * @returns Health check result
 */
export async function checkStripeSecret(
  apiKey: string,
  log: Logger
): Promise<HealthCheckResult> {
  try {
    log.info("Checking Stripe Secret API health...", {});

    // Validate key format first
    if (!apiKey.startsWith('sk_')) {
      return {
        status: 'error',
        message: 'Invalid Stripe Secret key format. Must start with "sk_"',
        service: 'stripe-secret',
      };
    }

    const startTime = Date.now();

    // Check the balance endpoint which requires the secret key
    const response = await fetch('https://api.stripe.com/v1/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      return {
        status: 'operational',
        message: 'Stripe Secret API is operational',
        service: 'stripe-secret',
        latency: `${latency}ms`,
      };
    }

    let errorMsg = response.statusText;
    try {
      const errorData = await response.json();
      if (errorData.error && errorData.error.message) {
        errorMsg = errorData.error.message;
      }
    } catch {
      // Ignore JSON parsing errors
    }

    log.error("Stripe Secret API error: " + errorMsg, {});

    return {
      status: 'error',
      message: `Stripe Secret API error: ${errorMsg}`,
      service: 'stripe-secret',
      latency: `${latency}ms`,
    };
  } catch (error) {
    log.error('Stripe Secret key health check error:', error);
    return {
      status: 'error',
      message: error.message || 'Error checking Stripe Secret API health',
      service: 'stripe-secret',
    };
  }
}

// =============================================================================
// Stripe Public Key
// =============================================================================

/**
 * Check Stripe Public API key health.
 * For public keys, we mainly check the format since most endpoints require a secret key.
 *
 * @param apiKey - Stripe public API key
 * @param log - Logger instance
 * @returns Health check result
 */
export async function checkStripePublic(
  apiKey: string,
  log: Logger
): Promise<HealthCheckResult> {
  try {
    log.info("Checking Stripe Public API key...", {});

    // 1. Check if it starts with pk_
    if (!apiKey.startsWith('pk_')) {
      return {
        status: 'error',
        message: 'Invalid Stripe Public key format. Must start with "pk_"',
        service: 'stripe-public',
      };
    }

    // 2. Verify key type matches environment (test/live)
    const isTestKey = apiKey.startsWith('pk_test_');
    const isLiveKey = apiKey.startsWith('pk_live_');

    if (!isTestKey && !isLiveKey) {
      return {
        status: 'error',
        message: 'Invalid Stripe Public key format. Must be "pk_test_" or "pk_live_"',
        service: 'stripe-public',
      };
    }

    // 3. Check key length (most Stripe keys are fairly long)
    if (apiKey.length < 20) {
      return {
        status: 'error',
        message: 'Stripe Public key appears to be too short',
        service: 'stripe-public',
      };
    }

    // Since we can't validate a public key with a direct API call,
    // we'll consider it valid if it passes the format checks above
    return {
      status: 'operational',
      message: `Stripe Public API key (${isTestKey ? 'test' : 'live'} mode) is correctly formatted`,
      service: 'stripe-public',
    };
  } catch (error) {
    log.error('Stripe Public key validation error:', error);
    return {
      status: 'error',
      message: error.message || 'Error validating Stripe Public key',
      service: 'stripe-public',
    };
  }
}

// =============================================================================
// Plaid
// =============================================================================

/**
 * Check Plaid API health.
 * For Plaid, we need both client ID and secret, but for now just check configuration.
 *
 * @param _apiKey - Plaid API key (client ID or secret)
 * @param log - Logger instance
 * @returns Health check result
 */
export async function checkPlaid(
  _apiKey: string,
  log: Logger
): Promise<HealthCheckResult> {
  try {
    log.info("Checking Plaid configuration...", {});

    // In a real implementation, we'd need both client ID and secret
    // For now, we just return configured status
    return {
      status: 'configured',
      message: 'Plaid API credentials are configured',
      service: 'plaid',
    };
  } catch (error) {
    log.error('Plaid health check error:', error);
    return {
      status: 'error',
      message: error.message || 'Error checking Plaid configuration',
      service: 'plaid',
    };
  }
}
