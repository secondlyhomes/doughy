/**
 * CORS Headers Configuration
 *
 * Shared CORS configuration for Edge Functions
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Configure based on your domain in production
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Max-Age': '86400',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}
