/**
 * API Helpers Module
 *
 * Provides common utilities for API operations in edge functions:
 * - URL validation to prevent SSRF attacks
 * - HTTP error handling patterns
 * - Response building helpers
 *
 * @module _shared/api-helpers
 */

// =============================================================================
// Types
// =============================================================================

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
}

export interface HealthCheckResult {
  status: 'operational' | 'configured' | 'error' | 'not-configured';
  message: string;
  service: string;
  latency?: number | string;
  http_status?: number;
}

// =============================================================================
// URL Validation
// =============================================================================

/**
 * Validate URL to prevent SSRF attacks.
 * Blocks internal/private IPs and non-HTTP(S) protocols.
 *
 * @param url - URL to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * const result = validateExternalUrl('https://api.example.com');
 * if (!result.valid) {
 *   return { error: result.error };
 * }
 */
export function validateExternalUrl(url: string): UrlValidationResult {
  try {
    const parsed = new URL(url);

    // Only allow HTTP(S) protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Invalid protocol. Only HTTP(S) allowed.' };
    }

    // Block internal/private IPs and localhost
    const hostname = parsed.hostname.toLowerCase();

    // Check for localhost and special addresses
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return { valid: false, error: 'Internal/private URLs are not allowed.' };
    }

    // Check for 10.0.0.0/8 (10.x.x.x)
    if (hostname.startsWith('10.')) {
      return { valid: false, error: 'Internal/private URLs are not allowed.' };
    }

    // Check for 192.168.0.0/16 (192.168.x.x)
    if (hostname.startsWith('192.168.')) {
      return { valid: false, error: 'Internal/private URLs are not allowed.' };
    }

    // Check for 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
    const match172 = hostname.match(/^172\.(\d+)\./);
    if (match172) {
      const secondOctet = parseInt(match172[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) {
        return { valid: false, error: 'Internal/private URLs are not allowed.' };
      }
    }

    // Check for link-local addresses (169.254.x.x)
    if (hostname.startsWith('169.254.')) {
      return { valid: false, error: 'Internal/private URLs are not allowed.' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format.' };
  }
}

// =============================================================================
// HTTP Error Handling
// =============================================================================

/**
 * Parse HTTP error response and return user-friendly message
 *
 * @param response - Fetch response object
 * @param serviceName - Name of the service for error message context
 * @returns Error message string
 */
export async function parseHttpError(
  response: Response,
  serviceName: string
): Promise<string> {
  let errorDetails = '';

  try {
    const responseBody = await response.json();
    errorDetails = responseBody?.error?.message || '';
  } catch {
    // If response body can't be parsed, use status text
  }

  // Provide specific error messages based on HTTP status
  switch (response.status) {
    case 401:
      return errorDetails || 'Invalid or expired API key';
    case 403:
      return errorDetails || 'API key lacks required permissions';
    case 429:
      return 'Rate limit exceeded';
    case 500:
    case 502:
    case 503:
    case 504:
      return `${serviceName} service temporarily unavailable`;
    default:
      return errorDetails || `${serviceName} API error: ${response.status} ${response.statusText}`;
  }
}

// =============================================================================
// Health Check Helpers
// =============================================================================

/**
 * Create a health check result with consistent structure
 *
 * @param params - Health check result parameters
 * @returns Formatted health check result
 */
export function createHealthResult(params: {
  status: HealthCheckResult['status'];
  message: string;
  service: string;
  latency?: number;
  httpStatus?: number;
}): HealthCheckResult {
  const result: HealthCheckResult = {
    status: params.status,
    message: params.message,
    service: params.service,
  };

  if (params.latency !== undefined) {
    result.latency = `${params.latency}ms`;
  }

  if (params.httpStatus !== undefined) {
    result.http_status = params.httpStatus;
  }

  return result;
}

/**
 * Measure latency of an async operation
 *
 * @param operation - Async function to measure
 * @returns Result with latency in milliseconds
 */
export async function measureLatency<T>(
  operation: () => Promise<T>
): Promise<{ result: T; latency: number }> {
  const startTime = Date.now();
  const result = await operation();
  const latency = Date.now() - startTime;
  return { result, latency };
}

// =============================================================================
// Service Name Normalization
// =============================================================================

/**
 * Normalize service names to handle variations
 *
 * @param service - Service name from request
 * @returns Normalized service name
 */
export function normalizeServiceName(service: string): string {
  const normalizations: Record<string, string> = {
    // OpenAI
    'openai-key': 'openai',
    'openai_key': 'openai',
    'openai_api_key': 'openai',

    // Stripe
    'stripe-key': 'stripe',
    'stripe_key': 'stripe',
    'stripe_api_key': 'stripe',
    'stripe-secret-key': 'stripe-secret',
    'stripe_secret_key': 'stripe-secret',
    'stripe-public-key': 'stripe-public',
    'stripe_public_key': 'stripe-public',
    'stripe_webhook': 'stripe-webhook',
    'stripe-webhook': 'stripe-webhook',
  };

  return normalizations[service] || service;
}
