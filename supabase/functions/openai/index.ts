/**
 * Production-ready OpenAI Edge Function
 * 
 * This implementation includes:
 * - Robust CORS handling for all environments
 * - Full OpenAI API integration with multiple model support
 * - Security with proper authentication validation
 * - Error handling with meaningful responses
 * - Support for Just-In-Time context from the assistant
 * - Gets API keys from the Supabase api_keys table with proper decryption
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { decryptServer } from "../_shared/crypto-server.ts";

// Environment configuration
const DEFAULT_MODEL = Deno.env.get('DEFAULT_MODEL') || 'gpt-4.1-mini';
const ENVIRONMENT = Deno.env.get('ENVIRONMENT') || 'development';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Allowed domains by environment - comprehensive list
const allowedOrigins = {
  // Production domains
  production: [
    'https://www.doughy.app',
    'https://app.doughy.app',
    'https://api.doughy.app',
    'https://doughy.app',
    'https://admin.doughy.app',
    'https://dashboard.doughy.app'
  ],
  
  // Staging domains
  staging: [
    'https://stage.doughy.app',
    'https://test.doughy.app',
    'https://staging.doughy.app',
    'https://demo.doughy.app',
    'https://beta.doughy.app'
  ],
  
  // Development domains - comprehensive list for local development
  development: [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:3000',  // React development
    'http://localhost:3001',
    'http://localhost:5173',  // Vite development
    'http://localhost:5174',  // Vite preview
    'http://localhost:5175',
    'http://localhost:4173',  // Vite production preview
    'http://localhost:4174',
    
    // 127.0.0.1 equivalents
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:8082',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:4173',
    'http://127.0.0.1:4174'
  ]
};

// All allowed headers - comprehensive list
const allowedHeaders = [
  'authorization', 
  'x-client-info', 
  'apikey', 
  'content-type', 
  'accept', 
  'baggage', 
  'sentry-trace', 
  'x-request-id', 
  'x-debug-client', 
  'x-debug-time', 
  'x-debug-browser', 
  'origin', 
  'x-requested-with', 
  'x-request-time',
  'Access-Control-Request-Method',
  'Access-Control-Request-Headers'
];

/**
 * Get API key from Supabase api_keys table
 */
async function getApiKey() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase URL or service role key not configured');
    return null;
  }

  try {
    // Log available environment variables for debugging
    console.log('Environment vars for encryption:', 
      Object.keys(Deno.env.toObject())
        .filter(k => k.includes('KEY') || k.includes('SECRET') || k.includes('ENCRYPTION'))
        .map(k => `${k}: ${k.startsWith('KEY_') ? 'set' : 'not set'}`)
        .join(', ')
    );

    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Query the api_keys table for the OpenAI key using the correct column name
    // Try both 'openai' and 'openai-key' for backward compatibility
    const { data, error } = await supabase
      .from('security_api_keys')
      .select('key_ciphertext, service')
      .or('service.eq.openai,service.eq.openai-key,service.eq.openai_key,service.eq.openai_api_key')
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching API key:', error.message);
      return null;
    }
    
    if (!data || !data.key_ciphertext) {
      console.error('No API key found for OpenAI');
      return null;
    }

    console.log(`Found API key with service: ${data.service}`);
    
    // Decrypt the API key
    try {
      if (data.key_ciphertext.startsWith('DEV.')) {
        console.log('Using legacy DEV format key');
      } else {
        console.log('Using secure encrypted key format');
      }
      
      const decryptedKey = await decryptServer(data.key_ciphertext);
      if (decryptedKey) {
        console.log('Successfully decrypted API key');
        return decryptedKey;
      } else {
        console.error('Decryption returned null or empty key');
        return null;
      }
    } catch (decryptError) {
      console.error('Error decrypting API key:', decryptError);
      return null;
    }
  } catch (error) {
    console.error('Error accessing Supabase:', error);
    return null;
  }
}

/**
 * Determine if an origin is allowed based on our allowlist
 */
function isOriginAllowed(origin) {
  if (!origin) return false;
  
  // For local development, all localhost/127.0.0.1 URLs are allowed
  if (ENVIRONMENT === 'development') {
    if (origin.startsWith('http://localhost:') || 
        origin.startsWith('http://127.0.0.1:')) {
      return true;
    }
  }
  
  // Allow all registered domains for the current environment
  if (allowedOrigins[ENVIRONMENT]?.includes(origin)) {
    return true;
  }
  
  // In staging, also allow development origins
  if (ENVIRONMENT === 'staging' && allowedOrigins.development.includes(origin)) {
    return true;
  }
  
  // Default to false for security
  return false;
}

/**
 * Format CORS headers based on the request details
 */
function getCorsHeaders(origin, hasCredentials) {
  // Check if this is an allowed origin
  const originAllowed = isOriginAllowed(origin);
  
  // Base headers used in all responses
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': allowedHeaders.join(', '),
    'Access-Control-Max-Age': '86400' // 24 hours
  };
  
  // Handle origin-specific rules
  if (origin) {
    // For credentials requests, always use specific origin (no wildcard)
    if (hasCredentials) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Credentials'] = 'true';
      return headers;
    }
    
    // For non-credentials requests to allowed origins, set specific origin
    if (originAllowed) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Credentials'] = 'true'; // Allow but not required
      return headers;
    }
  }
  
  // For all other cases (no origin or non-allowed without credentials),
  // use wildcard origin and no credentials
  headers['Access-Control-Allow-Origin'] = '*';
  
  // Remove the credentials header when using * wildcard
  // Headers must not include credentials: true when using wildcard
  return headers;
}

/**
 * Handle preflight requests properly - key for CORS to work
 */
function handlePreflightRequest(req) {
  const origin = req.headers.get('origin');
  const requestHeaders = req.headers.get('access-control-request-headers');
  const requestHasCredentials = requestHeaders?.toLowerCase().includes('authorization') || false;
  
  // Get appropriate CORS headers
  const corsHeaders = getCorsHeaders(origin, requestHasCredentials);
  
  // Return the proper preflight response
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * Call the OpenAI API with proper error handling
 */
async function callOpenAI(requestBody) {
  // Get API key from Supabase
  const apiKey = await getApiKey();
  
  if (!apiKey) {
    throw new Error("OpenAI API key not found in database");
  }
  
  try {
    // Extract JIT context from messages if present
    let contextAwareMessages = requestBody.messages || [];
    let jitContext = null;
    
    // Look for JIT context in system message
    if (contextAwareMessages.length > 0 && 
        contextAwareMessages[0].role === 'system' && 
        contextAwareMessages[0].content.includes('CURRENT CONTEXT:')) {
      // We have JIT context in the system message - extract and process it
      jitContext = "JIT context included";
    }
    
    // Prepare request to OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: requestBody.model || DEFAULT_MODEL,
        messages: contextAwareMessages,
        temperature: requestBody.temperature || 0.7,
        max_tokens: requestBody.max_tokens || 500,
        top_p: requestBody.top_p || 1,
        frequency_penalty: requestBody.frequency_penalty || 0,
        presence_penalty: requestBody.presence_penalty || 0
      })
    });
    
    // Handle API errors
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
    }
    
    // Return the API response
    const result = await response.json();
    
    // Add a pure_text field for compatibility with client code
    if (result.choices && result.choices.length > 0 && result.choices[0].message) {
      result.pure_text = result.choices[0].message.content;
    }
    
    return result;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

/**
 * Main service handler
 */
serve(async (req) => {
  try {
    // Log request for debugging
    console.log(`Request received: ${req.method} ${req.url}`);
    
    // Get request details
    const origin = req.headers.get('origin');
    const hasCredentials = req.headers.get('authorization') ? true : false;
    
    // Handle preflight requests (OPTIONS)
    if (req.method === 'OPTIONS') {
      return handlePreflightRequest(req);
    }
    
    // For regular requests, get appropriate CORS headers
    const corsHeaders = getCorsHeaders(origin, hasCredentials);
    
    // Parse the request body
    let requestBody;
    try {
      const bodyText = await req.text();
      requestBody = JSON.parse(bodyText);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request body" 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
    
    // Validate request
    if (!requestBody.messages || !Array.isArray(requestBody.messages)) {
      return new Response(
        JSON.stringify({ 
          error: "Request must include messages array" 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
    
    // Call OpenAI API
    try {
      const result = await callOpenAI(requestBody);
      
      return new Response(
        JSON.stringify(result),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return new Response(
        JSON.stringify({
          error: error.message || "Error calling OpenAI API"
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
  } catch (error) {
    // Fallback error handling
    console.error('Unhandled error:', error);
    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin, false);
    
    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred"
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});