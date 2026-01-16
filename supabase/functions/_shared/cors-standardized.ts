/**
 * Standardized CORS Handler for All Edge Functions
 *
 * This module provides a consistent CORS implementation across all Supabase Edge Functions.
 *
 * Usage:
 * ```typescript
 * import { getCorsHeaders, handleCorsPrelight } from '../_shared/cors-standardized.ts';
 *
 * serve(async (req) => {
 *   const corsHeaders = getCorsHeaders(req.headers.get('origin'));
 *
 *   // Handle OPTIONS request
 *   if (req.method === 'OPTIONS') {
 *     return handleCorsPrelight(corsHeaders);
 *   }
 *
 *   // ... your function logic
 *
 *   return new Response(JSON.stringify(data), {
 *     headers: { ...corsHeaders, 'Content-Type': 'application/json' }
 *   });
 * });
 * ```
 */

/**
 * Determines if running in development environment
 */
export function isDevelopmentEnvironment(): boolean {
  const env = Deno.env.get('ENVIRONMENT');
  return env !== 'production';
}

/**
 * Get allowed origins based on environment
 */
export function getAllowedOrigins(): Array<string | RegExp> {
  const isDev = isDevelopmentEnvironment();

  if (isDev) {
    // Development allowed origins
    return [
      'http://localhost:8081',
      'http://localhost:19006',
      'http://localhost:3000',
      /^http:\/\/192\.168\.\d+\.\d+:8081$/,  // Local IP addresses
      /^http:\/\/10\.\d+\.\d+\.\d+:8081$/,   // Local IP addresses
      'https://lqmbyobweeaigrwmvizo.supabase.co',  // DEV/STAGE Supabase
    ];
  } else {
    // Production allowed origins
    return [
      'https://vpqglbaedcpeprnlnfxd.supabase.co',  // PROD Supabase
      'https://app.doughy.ai',                      // Production domain
      'https://www.doughy.ai',                      // Production domain (www)
    ];
  }
}

/**
 * Check if an origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  const allowedOrigins = getAllowedOrigins();

  return allowedOrigins.some(allowed => {
    if (allowed instanceof RegExp) {
      return allowed.test(origin);
    }
    return allowed === origin;
  });
}

/**
 * Get CORS headers for a given origin
 *
 * @param origin - The request origin header
 * @returns Headers object with CORS configuration
 */
export function getCorsHeaders(origin: string | null): Headers {
  const headers = new Headers();

  // Check if origin is allowed
  const isAllowed = isOriginAllowed(origin);

  if (isAllowed && origin) {
    // Allow specific origin with credentials
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
  } else if (isDevelopmentEnvironment()) {
    // In development, be more permissive but still validate
    headers.set('Access-Control-Allow-Origin', origin || '*');
  }
  // In production with invalid origin, don't set CORS headers (will fail CORS check)

  // Always set these headers
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  headers.set('Access-Control-Allow-Headers',
    'authorization, x-client-info, apikey, content-type, accept, ' +
    'baggage, sentry-trace, x-request-id'
  );
  headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  return headers;
}

/**
 * Handle CORS preflight OPTIONS request
 *
 * @param corsHeaders - CORS headers to include in response
 * @returns Response for OPTIONS request
 */
export function handleCorsPreflightRequest(corsHeaders: Headers): Response {
  return new Response('ok', {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * Create error response with CORS headers
 *
 * @param error - Error message or object
 * @param status - HTTP status code
 * @param corsHeaders - CORS headers
 * @returns Error response
 */
export function createCorsErrorResponse(
  error: string | { message: string; [key: string]: any },
  status: number,
  corsHeaders: Headers
): Response {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorBody = typeof error === 'string' ? { error } : error;

  const responseHeaders = new Headers(corsHeaders);
  responseHeaders.set('Content-Type', 'application/json');

  return new Response(
    JSON.stringify(errorBody),
    { status, headers: responseHeaders }
  );
}

/**
 * Create success response with CORS headers
 *
 * @param data - Response data
 * @param corsHeaders - CORS headers
 * @param status - HTTP status code (default 200)
 * @returns Success response
 */
export function createCorsResponse(
  data: any,
  corsHeaders: Headers,
  status: number = 200
): Response {
  const responseHeaders = new Headers(corsHeaders);
  responseHeaders.set('Content-Type', 'application/json');

  return new Response(
    JSON.stringify(data),
    { status, headers: responseHeaders }
  );
}

/**
 * Log CORS validation for debugging
 *
 * @param origin - Request origin
 * @param allowed - Whether origin was allowed
 */
export function logCorsValidation(origin: string | null, allowed: boolean): void {
  const env = isDevelopmentEnvironment() ? 'DEV' : 'PROD';
  console.log(`[CORS ${env}] Origin: ${origin || 'none'} - ${allowed ? '✓ ALLOWED' : '✗ BLOCKED'}`);
}
