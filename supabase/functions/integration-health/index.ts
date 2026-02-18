/**
 * Integration Health Check Edge Function
 *
 * Checks the health of various integrations including:
 * - API services (OpenAI, Anthropic, Perplexity)
 * - Payment providers (Stripe, Plaid)
 * - Communication services (Twilio, Bland.ai, Gmail, Outlook)
 * - Maps services (Google Maps, Street View)
 * - IoT services (Seam)
 * - Data services (Tracerfy)
 *
 * @module integration-health
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  handleCors,
  addCorsHeaders,
} from "../_shared/cors.ts";
import { decryptServer } from "../_shared/crypto-server.ts";
import { createLogger } from "../_shared/db-logging.ts";
import { normalizeServiceName } from "../_shared/api-helpers.ts";
import {
  checkOpenAI,
  checkAnthropic,
  checkPerplexity,
  checkBlandAI,
  checkStripeSecret,
  checkStripePublic,
  checkPlaid,
  checkGoogleMaps,
  checkGmail,
  checkGoogleCalendar,
  checkOutlookMail,
  checkOutlookCalendar,
  checkTwilio,
  checkMoltBot,
  checkSeam,
  checkTracerfy,
  checkNetlify,
  type HealthCheckResult,
} from "../_shared/health-checks/index.ts";

// Create logger instance
const log = createLogger({ source: 'integration-health' });

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) {
    log.info("Handling CORS preflight request");
    return corsResponse;
  }

  // Verify authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    log.error('Authentication required but no Authorization header provided');
    return addCorsHeaders(
      new Response(
        JSON.stringify({ status: 'error', message: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SECRET_KEY');

  // Verify the token with Supabase Auth
  if (supabaseUrl && supabaseKey) {
    const authSupabase = createClient(supabaseUrl, supabaseKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await authSupabase.auth.getUser(token);

    if (authError || !user) {
      log.error('Invalid authentication token', { error: authError?.message });
      return addCorsHeaders(
        new Response(
          JSON.stringify({ status: 'error', message: 'Invalid authentication' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    log.info(`Authenticated user: ${user.id}`);
  }

  try {
    // Parse request body
    const requestData = await req.json();
    const service = requestData.service;

    if (!service) {
      log.error("No service specified in request");
      return addCorsHeaders(
        new Response(
          JSON.stringify({ status: 'error', message: 'No service specified' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    log.info(`Checking health for service: ${service}`);

    // Validate environment
    if (!supabaseUrl || !supabaseKey) {
      log.error("Missing required environment variables", {
        SUPABASE_URL: supabaseUrl ? "set" : "MISSING",
        SUPABASE_SECRET_KEY: supabaseKey ? "set" : "MISSING",
      });
      return addCorsHeaders(
        new Response(
          JSON.stringify({ status: 'error', message: 'Server configuration error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Normalize service name
    const serviceToCheck = normalizeServiceName(service);

    // Get the API key from the database
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('security_api_keys')
      .select('key_ciphertext, service, group_name, is_encrypted')
      .eq('service', serviceToCheck)
      .maybeSingle();

    // Handle query errors - distinguish between real errors and "not found"
    if (apiKeyError) {
      // PGRST116 is "no rows returned" which means not configured, not an error
      if (apiKeyError.code === 'PGRST116') {
        log.info(`Integration not configured: ${service}`);
        return addCorsHeaders(
          new Response(
            JSON.stringify({
              status: 'not-configured',
              service,
              message: 'Integration not configured',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          ),
          req
        );
      }

      // Actual database error
      log.error('API key query error:', apiKeyError);
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            status: 'error',
            service,
            message: 'Database error when checking integration configuration',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // No record found (maybeSingle returns null)
    if (!apiKeyData || !apiKeyData.key_ciphertext) {
      log.info(`Integration not configured: ${service}`);
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            status: 'not-configured',
            service,
            message: 'Integration not configured',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Perform health check
    const startTime = Date.now();
    let healthResult: HealthCheckResult;

    try {
      // Decrypt the API key
      const apiKey = await decryptApiKey(supabase, apiKeyData, serviceToCheck, service);

      // Run the appropriate health check
      healthResult = await runHealthCheck(serviceToCheck, apiKey, apiKeyData.service);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      log.error('Health check failed:', { error: errorMsg, service: serviceToCheck });
      healthResult = {
        status: 'error',
        message: `Error: ${errorMsg}`,
        service: serviceToCheck,
      };
    }

    // Record latency
    healthResult.latency = `${Date.now() - startTime}ms`;

    // Update last_used timestamp
    await updateLastUsed(supabase, serviceToCheck);

    log.info(`Health check result for ${service}: ${healthResult.status}`);

    return addCorsHeaders(
      new Response(JSON.stringify(healthResult), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
      req
    );
  } catch (error) {
    log.error('Error in integration health check:', error);

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          status: 'error',
          message: error.message || 'An error occurred during the health check',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Decrypt the API key and update encryption flag if needed
 */
async function decryptApiKey(
  supabase: ReturnType<typeof createClient>,
  apiKeyData: { key_ciphertext: string; is_encrypted: boolean },
  serviceToCheck: string,
  service: string
): Promise<string> {
  const apiKey = await decryptServer(apiKeyData.key_ciphertext);

  // Update the encrypted flag if needed for migration
  if (apiKeyData.is_encrypted === false && apiKeyData.key_ciphertext.startsWith("DEV.")) {
    log.info(`Updating encryption flag for service: ${service}`);
    await supabase
      .from('security_api_keys')
      .update({ is_encrypted: true })
      .eq('service', serviceToCheck);
  }

  return apiKey;
}

/**
 * Run the appropriate health check based on service type
 */
async function runHealthCheck(
  serviceToCheck: string,
  apiKey: string,
  originalService: string
): Promise<HealthCheckResult> {
  switch (serviceToCheck) {
    // AI Services
    case 'openai':
      return await checkOpenAI(apiKey, log);
    case 'anthropic':
      return await checkAnthropic(apiKey, log);
    case 'perplexity':
      return await checkPerplexity(apiKey, log);
    case 'bland-ai':
      return await checkBlandAI(apiKey, log);

    // Payment Services
    case 'stripe-secret':
      return await checkStripeSecret(apiKey, log);
    case 'stripe-public':
      return await checkStripePublic(apiKey, log);
    case 'plaid-client-id':
    case 'plaid-secret':
      return await checkPlaid(apiKey, log);

    // Google Services
    case 'google-maps-js':
    case 'google-street-view':
    case 'google-maps':
      return await checkGoogleMaps({ apiKey, service: serviceToCheck }, log);
    case 'gmail':
    case 'gmail-client-id':
      return await checkGmail(apiKey, log);
    case 'google-calendar':
    case 'google-calendar-client-id':
      return await checkGoogleCalendar(apiKey, log);

    // Microsoft Services
    case 'outlook-mail':
    case 'outlook-mail-client-id':
      return await checkOutlookMail(apiKey, log);
    case 'outlook-calendar':
    case 'outlook-calendar-client-id':
      return await checkOutlookCalendar(apiKey, log);

    // Communication Services
    case 'twilio':
    case 'twilio-sid':
    case 'twilio-phone':
      return await checkTwilio(apiKey, originalService, log);
    case 'moltbot':
    case 'moltbot-server-url':
      return await checkMoltBot(apiKey, log);

    // IoT Services
    case 'seam':
    case 'seam-api-key':
      return await checkSeam(apiKey, log);

    // Data Services
    case 'tracerfy':
    case 'tracerfy-api-key':
      return await checkTracerfy(apiKey, log);

    // Hosting Services
    case 'netlify_api_token':
      return await checkNetlify(apiKey, serviceToCheck, log);

    // Default: just verify decryption worked
    default:
      return {
        status: 'configured',
        message: `${serviceToCheck} integration is configured`,
        service: serviceToCheck,
      };
  }
}

/**
 * Update last_used timestamp for the API key
 */
async function updateLastUsed(
  supabase: ReturnType<typeof createClient>,
  service: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('security_api_keys')
      .update({ last_used: new Date().toISOString() })
      .eq('service', service);

    if (error) {
      log.error('Error updating API key last_used:', error);
    }
  } catch (err) {
    log.error('Exception in updateLastUsed:', err);
  }
}
