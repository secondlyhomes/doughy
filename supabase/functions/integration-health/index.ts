import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode as base64Decode } from "https://deno.land/std@0.177.0/encoding/base64.ts";
import { 
  handleCors, 
  getCorsHeaders, 
  addCorsHeaders 
} from "../_shared/cors.ts";
import { decryptServer } from "../_shared/crypto-server.ts";

// Simple logging functions
const logInfo = (message: string, details?: any) => {
  console.info(`[integration-health] INFO: ${message}`, details || '');
  
  // Try to log to the database if possible
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      supabase.from('system_logs').insert({
        level: 'info',
        source: 'integration-health',
        message: message,
        details: details || {}
      }).then((result) => {
        if (result.error) {
          console.error(`[integration-health] Failed to log to database:`, result.error);
        }
      });
    }
  } catch (error) {
    console.error(`[integration-health] Error logging to database:`, error);
  }
};

const logError = (message: string, details?: any) => {
  console.error(`[integration-health] ERROR: ${message}`, details || '');
  
  // Try to log to the database if possible
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      supabase.from('system_logs').insert({
        level: 'error',
        source: 'integration-health',
        message: message,
        details: details || {}
      }).then((result) => {
        if (result.error) {
          console.error(`[integration-health] Failed to log error to database:`, result.error);
        }
      });
    }
  } catch (error) {
    console.error(`[integration-health] Error logging to database:`, error);
  }
};

// NOTE: Using imported decryptServer from _shared/crypto-server.ts instead of local implementation

/**
 * Main handler for integration health check requests
 * 
 * This function checks the health of various integrations including:
 * - API services (OpenAI, Anthropic, Perplexity)
 * - Payment providers (Stripe, Plaid)
 * - Communication services (Twilio, Bland.ai, Gmail, Outlook)
 * - Maps services (Google Maps, OpenStreetMap)
 * - OAuth services
 * - Hosting services (Netlify)
 */
serve(async (req) => {
  // IMPORTANT: CORS preflight handling must come first
  // Handle OPTIONS requests with the standardized CORS handler
  const corsResponse = handleCors(req);
  if (corsResponse) {
    logInfo("Handling CORS preflight request for integration-health");
    return corsResponse;
  }
  
  // Set CORS headers for all response types based on request
  const headers = getCorsHeaders(req.headers.get('origin'), !!req.headers.get('authorization'));
  
  try {
    // Parse request body
    const requestData = await req.json();
    const service = requestData.service;
    
    if (!service) {
      logError("No service specified in request", {});
      const errorResponse = new Response(JSON.stringify({
        status: 'error',
        message: 'No service specified'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
      
      return addCorsHeaders(errorResponse, req);
    }

    logInfo(`Checking health for service: ${service}`, {});

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if API key is configured - normalize service names
    let serviceToCheck = normalizeServiceName(service);

    // Get the API key from the database if this is an API key-based service
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('security_api_keys')
      .select('key_ciphertext, service, group_name, description')
      .eq('service', serviceToCheck)
      .maybeSingle();

    if (apiKeyError) {
      logError('API key query error:', apiKeyError);
      const errorResponse = new Response(JSON.stringify({
        status: 'error',
        service,
        message: 'Database error when checking integration configuration',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
      return addCorsHeaders(errorResponse, req);
    }

    if (!apiKeyData?.key_ciphertext) {
      logInfo(`Integration not configured: ${service}`, {});
      const notConfiguredResponse = new Response(JSON.stringify({
        status: 'not-configured',
        service,
        message: 'Integration not configured',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
      return addCorsHeaders(notConfiguredResponse, req);
    }

    // Perform health check based on service type
    const startTime = Date.now();
    let healthResult;
    
    try {
      // Decrypt the API key for testing
      let apiKey: string;
      try {
        apiKey = await decryptServer(apiKeyData.key_ciphertext);
        
        // Update the encrypted flag if this is an unencrypted key that we successfully decrypted
        // This helps with the migration process
        if (apiKeyData.encrypted === false && apiKeyData.key_ciphertext.startsWith("DEV.")) {
          // Log that we're updating the flag
          logInfo(`Updating encryption flag for service: ${service}`, {});
          
          // Update the flag silently in the background
          await supabase
            .from('security_api_keys')
            .update({ encrypted: true })
            .eq('service', serviceToCheck);
        }
      } catch (decryptError) {
        logError('Error decrypting key:', decryptError);
        throw new Error(`Failed to decrypt API key: ${decryptError.message}`);
      }
      
      // Validate based on service type
      switch(serviceToCheck) {
        case 'openai':
          healthResult = await checkOpenAI(apiKey);
          break;
        case 'anthropic':
          healthResult = await checkAnthropic(apiKey);
          break;
        case 'perplexity':
          healthResult = await checkPerplexity(apiKey);
          break;
        case 'twilio':
        case 'twilio-sid':
        case 'twilio-phone':
          healthResult = await checkTwilio(apiKey, apiKeyData.service);
          break;
        case 'stripe-secret':
          healthResult = await checkStripeSecret(apiKey);
          break;
        case 'stripe-public':
          healthResult = await checkStripePublic(apiKey);
          break;
        case 'google-maps-js':
        case 'google-street-view':
        case 'google-maps':
          // Pass the service name for proper handling
          healthResult = await checkGoogleMaps({ apiKey, service: serviceToCheck });
          break;
        case 'gmail':
        case 'gmail-client-id':
          healthResult = await checkGmail(apiKey);
          break;
        case 'google-calendar':
        case 'google-calendar-client-id':
          healthResult = await checkGoogleCalendar(apiKey);
          break;
        case 'outlook-mail':
        case 'outlook-mail-client-id':
          healthResult = await checkOutlookMail(apiKey);
          break;
        case 'outlook-calendar':
        case 'outlook-calendar-client-id':
          healthResult = await checkOutlookCalendar(apiKey);
          break;
        case 'bland-ai':
          healthResult = await checkBlandAI(apiKey);
          break;
        case 'moltbot':
        case 'moltbot-server-url':
          healthResult = await checkMoltBot(apiKey);
          break;
        case 'plaid-client-id':
        case 'plaid-secret':
          // For Plaid, we need both client ID and secret, but for now we'll just check that it's configured
          healthResult = {
            status: 'configured',
            message: 'Plaid API credentials are configured',
            service: 'plaid'
          };
          break;
        default:
          // For other services, just check that we were able to decrypt the key
          healthResult = {
            status: 'configured',
            message: `${serviceToCheck} integration is configured`,
            service: serviceToCheck,
          };
      }
    } catch (decryptError) {
      logError('Error decrypting key:', decryptError);
      healthResult = {
        status: 'error',
        message: 'Error decrypting integration key',
        service: serviceToCheck,
      };
    }
    
    // Record health check metrics
    const latency = Date.now() - startTime;
    healthResult.latency = latency;
    
    // Update health check record in database
    await updateHealthCheck(supabase, serviceToCheck, healthResult, apiKeyData.group_name || 'Other');
    
    logInfo(`Health check result for ${service}: ${healthResult.status}`, {});
    
    const successResponse = new Response(JSON.stringify(healthResult), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
    return addCorsHeaders(successResponse, req);
  } catch (error) {
    logError('Error in integration health check:', error);
    
    const errorResponse = new Response(JSON.stringify({
      status: 'error',
      message: error.message || 'An error occurred during the health check'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
    
    return addCorsHeaders(errorResponse, req);
  }
});

/**
 * Normalize service names to handle variations
 */
function normalizeServiceName(service: string): string {
  // OpenAI-related
  if (service === 'openai-key' || service === 'openai_key' || service === 'openai_api_key') {
    return 'openai';
  }
  // Stripe-related
  if (service === 'stripe-key' || service === 'stripe_key' || service === 'stripe_api_key') {
    return 'stripe';
  }
  if (service === 'stripe-secret-key' || service === 'stripe_secret_key') {
    return 'stripe-secret';
  }
  if (service === 'stripe-public-key' || service === 'stripe_public_key') {
    return 'stripe-public';
  }
  if (service === 'stripe_webhook' || service === 'stripe-webhook') {
    return 'stripe-webhook';
  }
  // Other services can be added here as needed
  return service;
}

/**
 * Update health check status (no longer persists to database)
 * The api_health_checks table has been removed to simplify the database
 */
async function updateHealthCheck(supabase, service: string, result: any, groupName: string) {
  try {
    // Only update the api_keys table with last_used timestamp
    const { error } = await supabase
      .from('security_api_keys')
      .update({ 
        last_used: new Date().toISOString(),
        status: result.status || 'error'
      })
      .eq('service', service);
      
    if (error) {
      logError('Error updating API key status:', error);
    }
  } catch (err) {
    logError('Exception in updateHealthCheck:', err);
  }
}

/**
 * Check OpenAI API health by making a HEAD request to the models endpoint
 * This method does not consume tokens as it only checks API connectivity
 */
async function checkOpenAI(apiKey: string) {
  try {
    logInfo("Checking OpenAI API health using HEAD request...", {});
    
    const startTime = Date.now();
    
    // Use GET request to check API connectivity without spending tokens
    // Some APIs don't support HEAD requests properly
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    logInfo(`OpenAI API response status: ${response.status}`, {});

    if (response.ok) {
      return {
        status: 'operational',
        message: 'OpenAI API is reachable',
        service: 'openai',
        latency: `${latency}ms`
      };
    }

    // Read response body to get detailed error message
    let errorDetails = '';
    try {
      const responseBody = await response.json();
      errorDetails = responseBody?.error?.message || '';
      logError(`OpenAI API error details:`, { httpStatus: response.status, body: responseBody });
    } catch (e) {
      // If response body can't be parsed, just log status
      logError(`OpenAI API error (no body):`, { httpStatus: response.status });
    }

    // Provide specific error messages based on HTTP status
    let errorMessage = '';
    if (response.status === 401) {
      errorMessage = errorDetails || 'Invalid or expired API key';
    } else if (response.status === 429) {
      errorMessage = 'Rate limit exceeded';
    } else if (response.status >= 500) {
      errorMessage = 'OpenAI service temporarily unavailable';
    } else {
      errorMessage = errorDetails || `OpenAI API error: ${response.status} ${response.statusText}`;
    }

    logError(errorMessage, { httpStatus: response.status });

    return {
      status: 'error',
      message: errorMessage,
      service: 'openai',
      latency: `${latency}ms`,
      http_status: response.status  // Include HTTP status for debugging
    };
  } catch (error) {
    logError('OpenAI health check error:', error);
    return {
      status: 'error',
      message: error.message || 'Error checking OpenAI API health',
      service: 'openai'
    };
  }
}

/**
 * Check Anthropic API health using HEAD request
 * This method does not consume tokens as it only checks API connectivity
 */
async function checkAnthropic(apiKey: string) {
  try {
    logInfo("Checking Anthropic API health using HEAD request...", {});
    
    const startTime = Date.now();
    
    // Use GET request to check API connectivity without spending tokens
    // Some APIs don't support HEAD requests properly
    const response = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    });
    
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    logInfo(`Anthropic API response status: ${response.status}`, {});
    
    if (response.ok) {
      return {
        status: 'operational',
        message: 'Anthropic API is reachable',
        service: 'anthropic',
        latency: `${latency}ms`
      };
    }
    
    // If HEAD request fails, provide error information
    logError(`Anthropic API error: ${response.status} ${response.statusText}`, {});
    
    return {
      status: 'error',
      message: `Anthropic API error: ${response.status} ${response.statusText}`,
      service: 'anthropic',
      latency: `${latency}ms`
    };
  } catch (error) {
    logError('Anthropic health check error:', error);
    return {
      status: 'error',
      message: error.message || 'Error checking Anthropic API health',
      service: 'anthropic'
    };
  }
}

/**
 * Check Perplexity API health using intentionally invalid request that triggers validation error
 * This method does not consume tokens but confirms API connectivity and authentication
 * 
 * See https://docs.perplexity.ai/reference/post_chat_completions for API reference
 */
async function checkPerplexity(apiKey: string) {
  try {
    logInfo('Checking Perplexity API health...', {});
    
    const startTime = Date.now();
    
    // Make a POST request with intentionally invalid body that will trigger validation error
    // This confirms API connectivity without generating completions
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        // Empty messages array will cause validation error before token usage
        messages: [],
        max_tokens: 1
      })
    });
    
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    logInfo(`Perplexity API response status: ${response.status}`, {});
    
    // A 400 Bad Request is normal and indicates the API is operational
    // It means the API received our request, validated auth, and rejected the invalid format
    // This confirms connectivity without consuming tokens
    const isOperational = response.ok || response.status === 400;
    
    if (isOperational) {
      logInfo('Perplexity API health check successful (400 indicates validation error, which confirms API is operational)', {});
      return {
        status: 'operational',
        message: 'Perplexity API is operational',
        service: 'perplexity',
        latency: `${latency}ms`
      };
    }
    
    // If neither OK nor 400, there's an actual issue
    return {
      status: 'error',
      message: `Perplexity API error: ${response.status} ${response.statusText}`,
      service: 'perplexity',
      latency: `${latency}ms`
    };
  } catch (error) {
    logError('Perplexity health check error:', error);
    return {
      status: 'error',
      message: error.message || 'Error checking Perplexity API health',
      service: 'perplexity'
    };
  }
}

/**
 * Check Twilio API health
 */
async function checkTwilio(apiKey: string, service: string) {
  // In a real implementation, you would need both the account SID and auth token
  // This is a simplified check
  try {
    logInfo("Checking Twilio integration health...", {});
    
    return {
      status: 'configured',
      message: 'Twilio integration is configured',
      service: service
    };
  } catch (error) {
    logError('Twilio health check error:', error);
    return {
      status: 'error',
      message: error.message || 'Error checking Twilio integration health',
      service: service
    };
  }
}

/**
 * Check Stripe Secret API key health
 */
async function checkStripeSecret(apiKey: string) {
  try {
    logInfo("Checking Stripe Secret API health...", {});
    
    // Validate key format first
    if (!apiKey.startsWith('sk_')) {
      return {
        status: 'error',
        message: 'Invalid Stripe Secret key format. Must start with "sk_"',
        service: 'stripe-secret'
      };
    }
    
    // Check the balance endpoint which requires the secret key
    const response = await fetch('https://api.stripe.com/v1/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return {
        status: 'operational',
        message: 'Stripe Secret API is operational',
        service: 'stripe-secret'
      };
    }
    
    let errorMsg = response.statusText;
    try {
      const errorData = await response.json();
      if (errorData.error && errorData.error.message) {
        errorMsg = errorData.error.message;
      }
    } catch (e) {
      // Ignore JSON parsing errors
    }
    
    logError("Stripe Secret API error: " + errorMsg, {});
    
    return {
      status: 'error',
      message: `Stripe Secret API error: ${errorMsg}`,
      service: 'stripe-secret'
    };
  } catch (error) {
    logError('Stripe Secret key health check error:', error);
    return {
      status: 'error',
      message: error.message || 'Error checking Stripe Secret API health',
      service: 'stripe-secret'
    };
  }
}

/**
 * Check Stripe Public API key health
 */
async function checkStripePublic(apiKey: string) {
  try {
    logInfo("Checking Stripe Public API key...", {});
    
    // For public keys, we mainly check the format and simple validation
    // since most endpoints require a secret key
    
    // 1. Check if it starts with pk_
    if (!apiKey.startsWith('pk_')) {
      return {
        status: 'error',
        message: 'Invalid Stripe Public key format. Must start with "pk_"',
        service: 'stripe-public'
      };
    }
    
    // 2. Verify key type matches environment (test/live)
    const isTestKey = apiKey.startsWith('pk_test_');
    const isLiveKey = apiKey.startsWith('pk_live_');
    
    if (!isTestKey && !isLiveKey) {
      return {
        status: 'error',
        message: 'Invalid Stripe Public key format. Must be "pk_test_" or "pk_live_"',
        service: 'stripe-public'
      };
    }
    
    // 3. Check key length (most Stripe keys are fairly long)
    if (apiKey.length < 20) {
      return {
        status: 'error',
        message: 'Stripe Public key appears to be too short',
        service: 'stripe-public'
      };
    }
    
    // Since we can't validate a public key with a direct API call without exposing it in frontend code,
    // we'll consider it valid if it passes the format checks above
    return {
      status: 'operational',
      message: `Stripe Public API key (${isTestKey ? 'test' : 'live'} mode) is correctly formatted`,
      service: 'stripe-public'
    };
  } catch (error) {
    logError('Stripe Public key validation error:', error);
    return {
      status: 'error',
      message: error.message || 'Error validating Stripe Public key',
      service: 'stripe-public'
    };
  }
}

/**
 * Check Google Maps JavaScript API and Street View Static API health
 * 
 * This function checks the health of both Google Maps JavaScript API and Street View Static API
 */
async function checkGoogleMaps({ apiKey, service }: { apiKey: string, service: string }) {
  // Make serviceType available in the catch block scope
  const serviceType = service || 'google-maps-js';
  
  try {
    // Determine which Google Maps API service we're checking
    const isStreetView = service === 'google-street-view';
    const isMapsJs = service === 'google-maps-js';
    
    logInfo(`Checking ${serviceType} health...`, {});
    
    // Use the provided API key
    const actualApiKey = apiKey;
    
    // Different endpoints based on the service
    let endpoint;
    let isJsonResponse = true;
    
    if (isStreetView) {
      // Street View API uses the metadata endpoint for validation
      endpoint = `https://maps.googleapis.com/maps/api/streetview/metadata?location=40.7128,-74.0060&key=${actualApiKey}`;
    } else if (isMapsJs) {
      // Maps JavaScript API uses a different endpoint format
      endpoint = `https://maps.googleapis.com/maps/api/js?key=${actualApiKey}&callback=initMap`;
      isJsonResponse = false; // This endpoint returns JavaScript, not JSON
    } else {
      // Default to geocoding API for other services
      endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=New York&key=${actualApiKey}`;
    }
    
    const response = await fetch(endpoint);
    
    // For Maps JavaScript API, we just check if the response was successful (it returns JavaScript, not JSON)
    if (isMapsJs) {
      if (response.ok) {
        const text = await response.text();
        
        // Check if the response contains an error message
        if (text.includes('InvalidKeyMapError') || text.includes('RefererNotAllowedMapError')) {
          logError(`${serviceType} error: Invalid API key or unauthorized domain`, {});
          return {
            status: 'error',
            message: 'Google Maps JavaScript API error: Invalid API key or unauthorized domain',
            service: serviceType
          };
        }
        
        return {
          status: 'operational',
          message: 'Google Maps JavaScript API is operational',
          service: serviceType
        };
      } else {
        logError(`${serviceType} error: ${response.statusText}`, {});
        return {
          status: 'error',
          message: `Google Maps JavaScript API error: ${response.statusText}`,
          service: serviceType
        };
      }
    }
    
    // For JSON APIs like Street View and Geocoding
    try {
      const data = await response.json();
      
      if (response.ok && data.status === 'OK') {
        return {
          status: 'operational',
          message: `${isStreetView ? 'Google Street View API' : 'Google Maps API'} is operational`,
          service: serviceType
        };
      }
      
      // Check for specific error codes from Google APIs
      if (data.status === 'REQUEST_DENIED' && data.error_message?.includes('API key')) {
        logError(`${serviceType} error: Invalid API key or unauthorized domain`, {});
        return {
          status: 'error',
          message: `${isStreetView ? 'Google Street View API' : 'Google Maps API'} error: Invalid API key or unauthorized domain`,
          service: serviceType
        };
      }
      
      logError(`${serviceType} error: ${data.status || data.error_message || response.statusText}`, {});
      return {
        status: 'error',
        message: `${isStreetView ? 'Google Street View API' : 'Google Maps API'} error: ${data.status || data.error_message || response.statusText}`,
        service: serviceType
      };
    } catch (jsonError) {
      // If we can't parse JSON but the response was successful, it might still be valid
      if (response.ok) {
        return {
          status: 'configured',
          message: `${serviceType} appears to be configured, but returned non-JSON response`,
          service: serviceType
        };
      } else {
        logError(`${serviceType} error: ${response.statusText}`, {});
        return {
          status: 'error',
          message: `${serviceType} error: ${response.statusText}`,
          service: serviceType
        };
      }
    }
  } catch (error) {
    logError(`${serviceType || 'Google Maps'} health check error:`, error);
    return {
      status: 'error',
      message: error.message || `Error checking ${serviceType || 'Google Maps'} integration health`,
      service: serviceType || 'google-maps-js'
    };
  }
}

/**
 * Check Gmail API health
 */
async function checkGmail(apiKey: string) {
  try {
    logInfo("Checking Gmail API health...", {});
    
    // In a real implementation, we'd use the OAuth flow with the client ID and secret
    // For now, we just return configured status
    return {
      status: 'configured',
      message: 'Gmail API credentials are configured',
      service: 'gmail'
    };
  } catch (error) {
    logError('Gmail API health check error:', error);
    return {
      status: 'error',
      message: error.message || 'Error checking Gmail API health',
      service: 'gmail'
    };
  }
}

/**
 * Check Google Calendar API health
 */
async function checkGoogleCalendar(apiKey: string) {
  try {
    logInfo("Checking Google Calendar API health...", {});
    
    // In a real implementation, we'd use the OAuth flow with the client ID and secret
    // For now, we just return configured status
    return {
      status: 'configured',
      message: 'Google Calendar API credentials are configured',
      service: 'google-calendar'
    };
  } catch (error) {
    logError('Google Calendar API health check error:', error);
    return {
      status: 'error',
      message: error.message || 'Error checking Google Calendar API health',
      service: 'google-calendar'
    };
  }
}

/**
 * Check Outlook Mail API health
 */
async function checkOutlookMail(apiKey: string) {
  try {
    logInfo("Checking Outlook Mail API health...", {});
    
    // In a real implementation, we'd use the OAuth flow with Microsoft Graph API
    // For now, we just return configured status
    return {
      status: 'configured',
      message: 'Outlook Mail API credentials are configured',
      service: 'outlook-mail'
    };
  } catch (error) {
    logError('Outlook Mail API health check error:', error);
    return {
      status: 'error',
      message: error.message || 'Error checking Outlook Mail API health',
      service: 'outlook-mail'
    };
  }
}

/**
 * Check Outlook Calendar API health
 */
async function checkOutlookCalendar(apiKey: string) {
  try {
    logInfo("Checking Outlook Calendar API health...", {});
    
    // In a real implementation, we'd use the OAuth flow with Microsoft Graph API
    // For now, we just return configured status
    return {
      status: 'configured',
      message: 'Outlook Calendar API credentials are configured',
      service: 'outlook-calendar'
    };
  } catch (error) {
    logError('Outlook Calendar API health check error:', error);
    return {
      status: 'error',
      message: error.message || 'Error checking Outlook Calendar API health',
      service: 'outlook-calendar'
    };
  }
}

/**
 * Check Bland.ai API health
 */
async function checkBlandAI(apiKey: string) {
  try {
    logInfo("Checking Bland.ai API health...", {});

    const response = await fetch('https://api.bland.ai/v1/calls', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return {
        status: 'operational',
        message: 'Bland.ai API is operational',
        service: 'bland-ai'
      };
    }

    logError("Bland.ai API error: " + response.statusText, {});

    return {
      status: 'error',
      message: `Bland.ai API error: ${response.statusText}`,
      service: 'bland-ai'
    };
  } catch (error) {
    logError('Bland.ai API health check error:', error);
    return {
      status: 'error',
      message: error.message || 'Error checking Bland.ai API health',
      service: 'bland-ai'
    };
  }
}

/**
 * Validate URL to prevent SSRF attacks
 * Blocks internal/private IPs and non-HTTP(S) protocols
 */
function validateExternalUrl(url: string): { valid: boolean; error?: string } {
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

/**
 * Check MoltBot server health
 * Pings the MoltBot server's /health endpoint to verify connectivity
 * and check Supabase/Gmail integration status
 */
async function checkMoltBot(serverUrl: string) {
  const TIMEOUT_MS = 5000;

  try {
    logInfo("Checking MoltBot server health...", {});

    // Validate URL to prevent SSRF attacks
    const urlValidation = validateExternalUrl(serverUrl);
    if (!urlValidation.valid) {
      return { status: 'error', message: urlValidation.error || 'Invalid server URL', service: 'moltbot' };
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${serverUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;

    if (!response.ok) {
      logError(`MoltBot server error: ${response.status} ${response.statusText}`, {});
      return { status: 'error', message: `MoltBot server returned ${response.status}`, service: 'moltbot', latency };
    }

    // Parse JSON response with error handling for malformed responses
    let data;
    try {
      data = await response.json();
    } catch {
      logError('MoltBot returned invalid JSON response:', { status: response.status });
      return { status: 'error', message: 'MoltBot server returned an invalid response format', service: 'moltbot', latency };
    }

    // Expected response: { status: 'healthy', supabase: 'ok'|'error', gmail: 'ready'|'not_watching' }
    const supabaseOk = data.supabase === 'ok';
    const gmailReady = data.gmail === 'ready';

    // Fully operational: both Supabase and Gmail working
    if (supabaseOk && gmailReady) {
      return { status: 'operational', message: 'MoltBot server is fully operational', service: 'moltbot', latency };
    }

    // Partially configured: Supabase works but Gmail not connected
    if (supabaseOk) {
      return { status: 'configured', message: `MoltBot server connected, Gmail: ${data.gmail || 'not connected'}`, service: 'moltbot', latency };
    }

    // Error: Supabase connection failed
    return { status: 'error', message: `MoltBot: Supabase ${data.supabase || 'error'}, Gmail ${data.gmail || 'unknown'}`, service: 'moltbot', latency };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error
      ? (error.name === 'AbortError' ? `MoltBot server connection timed out (${TIMEOUT_MS / 1000}s)` : error.message)
      : 'Error connecting to MoltBot server';

    logError('MoltBot health check error:', error);
    return { status: 'error', message: errorMessage, service: 'moltbot' };
  }
}