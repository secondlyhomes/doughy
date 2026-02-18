/**
 * Standardized CORS handler for Supabase Edge Functions
 * 
 * This module provides a robust solution for handling CORS across all environments
 * with proper handling of credentials mode requests.
 * 
 * Key features:
 * - Environment-specific allowed origins
 * - Proper handling of credentials mode
 * - Comprehensive debugging
 * - Support for development, staging, and production environments
 */

/** 
 * Define allowed origins by environment for proper CORS control
 */
const allowedOrigins = {
  // Production domains only - strict allowlist
  production: [
    'https://www.doughy.app',
    'https://app.doughy.app',
    'https://api.doughy.app',
    'https://doughy.app',
    'https://admin.doughy.app',
    'https://dashboard.doughy.app'
  ],
  
  // Staging environment - a bit more permissive
  staging: [
    'https://stage.doughy.app',
    'https://test.doughy.app',
    'https://staging.doughy.app',
    'https://demo.doughy.app',
    'https://beta.doughy.app'
  ],
  
  // Development environments - comprehensive allowlist for local development
  development: [
    // Specific allowed development IPs - cover common configurations
    'http://192.168.1.184:8080',
    'http://192.168.1.184:8081',
    'http://192.168.1.184:8082',
    'http://192.168.1.184:3000',
    'http://192.168.1.184:5173',
    'http://192.168.1.184:5174',
    
    // Standard local development - comprehensive port coverage
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
    
    // 127.0.0.1 equivalents (localhost) - comprehensive port coverage
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

// Determine environment and set fallback
// ENVIRONMENT can be set on Supabase Function settings 
// (dashboard -> Edge Functions -> Settings -> Secrets)
// Set to "all-environments" to allow origins from all environments during testing
const ENVIRONMENT = Deno.env.get('ENVIRONMENT') || 'development';

// Set DEBUG_CORS to "true" for detailed CORS logs, "false" for production
const DEBUG_CORS = Deno.env.get('DEBUG_CORS') === "false" ? false : true;

/**
 * Detect credentials mode from request headers
 * 
 * @param request The incoming request
 * @returns Whether the request uses credentials mode
 */
function detectCredentialsMode(request: Request): boolean {
  if (request.method === 'OPTIONS') {
    // For preflight, check Access-Control-Request-Headers for Authorization
    const requestHeaders = request.headers.get('access-control-request-headers');
    return !!requestHeaders?.toLowerCase().includes('authorization');
  } else {
    // For regular requests, check for Authorization header directly
    return !!request.headers.get('authorization');
  }
}

/**
 * Helper function to handle CORS preflight requests
 * 
 * This function ensures proper handling of OPTIONS requests and credentials mode.
 * It should be called at the beginning of all edge function handlers.
 * 
 * @param request The incoming request to handle
 * @returns Response for OPTIONS requests, null for other requests
 */
export const handleCors = (request: Request): Response | null => {
  // EMERGENCY DEBUG: Log ALL requests details
  console.log(`[CORS-DEBUG] Request method: ${request.method}, URL: ${request.url}`);
  console.log(`[CORS-DEBUG] Headers: ${JSON.stringify(Object.fromEntries([...request.headers]))}`);
  
  // Only handle OPTIONS preflight requests
  if (request.method !== 'OPTIONS') {
    console.log(`[CORS-DEBUG] Not an OPTIONS request, skipping CORS handler`);
    return null;
  }
  
  // Extract required information from the request
  const origin = request.headers.get('origin');
  const requestMethod = request.headers.get('access-control-request-method');
  const requestHeaders = request.headers.get('access-control-request-headers');
  
  // Detect credentials mode properly
  const hasCredentials = detectCredentialsMode(request);
  
  // Safe development origins allowlist (maintains security while enabling local development)
  const developmentOrigins = [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ];
  
  // Determine if this is a development origin
  const isDevelopmentOrigin = origin && developmentOrigins.includes(origin);
  
  // Conditionally log details (only when debugging is enabled)
  if (DEBUG_CORS) {
    console.log(`=== CORS Preflight Request ===`);
    console.log(`Origin: ${origin}`);
    console.log(`Request Method: ${requestMethod}`);
    console.log(`Request Headers: ${requestHeaders}`);
    console.log(`Credentials Mode: ${hasCredentials ? 'yes' : 'no'}`);
    console.log(`Environment: ${ENVIRONMENT}`);
    console.log(`Development Origin: ${isDevelopmentOrigin ? 'yes' : 'no'}`);
  }
  
  // Get CORS headers with secure development support
  let corsHeaders;
  if (ENVIRONMENT === 'development' && isDevelopmentOrigin) {
    // Secure local development with appropriate CORS headers
    corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, baggage, sentry-trace, x-request-id, x-debug-client, x-debug-time, x-debug-browser, origin, x-requested-with',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
    };
    
    if (DEBUG_CORS) {
      console.log(`[CORS-DEBUG] Using development headers for origin: ${origin}`);
    }
  } else {
    // Standard secure processing for all other environments
    corsHeaders = getCorsHeaders(origin, hasCredentials);
  }
  
  // For debugging - log the headers we're returning (only when debugging is enabled)
  if (DEBUG_CORS) {
    console.log('=== CORS Response Headers ===');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
  }
  
  // Always return 204 No Content for OPTIONS requests with appropriate headers
  return new Response(null, { 
    status: 204,
    headers: corsHeaders
  });
};

/**
 * Determine if an origin is allowed based on environment settings
 * 
 * @param origin The requesting origin
 * @returns true if origin is allowed, false otherwise
 */
function isOriginAllowed(origin?: string): boolean {
  if (!origin) return false;
  
  // Reusable pattern matchers for development URLs
  const isLocalhost = (url: string) => 
    url.startsWith('http://localhost:') || 
    url.startsWith('http://127.0.0.1:');
    
  const isDevIp = (url: string) => 
    url.match(/^http:\/\/192\.168\.\d+\.\d+:\d+$/);
  
  // Safe development origins allowlist (keep in sync with the one in handleCors)
  const developmentOrigins = [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ];
  
  // Emergency override for development
  if (origin && ENVIRONMENT === 'development' && developmentOrigins.includes(origin)) {
    if (DEBUG_CORS) {
      console.log(`Origin ${origin} explicitly allowed as safe development origin`);
    }
    return true;
  }
  
  // If "all-environments" is set, check against all environment lists
  if (ENVIRONMENT === 'all-environments') {
    const isInAllowlist = [
      ...allowedOrigins.development,
      ...allowedOrigins.staging,
      ...allowedOrigins.production
    ].includes(origin);
    
    // Also check development patterns
    const isDevPattern = isLocalhost(origin) || isDevIp(origin);
    
    if (DEBUG_CORS && (isInAllowlist || isDevPattern)) {
      console.log(`Origin ${origin} allowed in all-environments mode`);
    }
    
    return isInAllowlist || isDevPattern;
  }
  
  // Check if origin is in the current environment's allowed list
  const isInCurrentEnv = allowedOrigins[ENVIRONMENT]?.includes(origin) || false;
  
  if (isInCurrentEnv && DEBUG_CORS) {
    console.log(`Origin ${origin} explicitly allowed in ${ENVIRONMENT} environment`);
  }
  
  // For staging, also allow development origins
  const isInDevelopmentList = 
    ENVIRONMENT === 'staging' && allowedOrigins.development.includes(origin);
  
  if (isInDevelopmentList && DEBUG_CORS) {
    console.log(`Origin ${origin} allowed in staging as a development origin`);
  }
  
  // For development environment, also check patterns beyond the explicit list
  if (ENVIRONMENT === 'development') {
    const isDevPattern = isLocalhost(origin) || isDevIp(origin);
    
    if (isDevPattern && DEBUG_CORS) {
      console.log(`Origin ${origin} allowed in development by pattern matching`);
    }
    
    return isInCurrentEnv || isDevPattern;
  }
  
  return isInCurrentEnv || isInDevelopmentList;
}

/**
 * Get appropriate CORS headers based on the request origin and credentials mode
 *
 * @param requestOrigin The Origin header from the request
 * @param hasCredentials Whether the request includes credentials
 * @returns Object with appropriate CORS headers
 */
export const getCorsHeaders = (requestOrigin?: string, hasCredentials?: boolean): Record<string, string> => {
  // Default headers for all responses
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, baggage, sentry-trace, x-request-id, x-debug-client, x-debug-time, x-debug-browser, origin, x-requested-with, Access-Control-Request-Method, Access-Control-Request-Headers, x-client-origin, x-request-time',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
  
  // Enhanced logging for debugging CORS issues
  console.log(`[CORS] Request origin: ${requestOrigin}, Has credentials: ${hasCredentials}`);
  
  // Handle origin-specific logic
  if (requestOrigin) {
    // Explicitly allow specific development environments
    const devOrigins = [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://192.168.1.184:8080',
      'http://192.168.1.184:8081',
      'http://192.168.1.184:8082'
    ];

    // Explicitly allow stage environments
    const stageOrigins = [
      'https://stage.doughy.app',
      'https://test.doughy.app',
      'https://staging.doughy.app',
      'https://demo.doughy.app',
      'https://beta.doughy.app'
    ];
    
    // If this is a recognized dev or stage origin, allow with credentials
    if (devOrigins.includes(requestOrigin) || 
        (ENVIRONMENT === 'staging' && stageOrigins.includes(requestOrigin))) {
      console.log(`[CORS] Explicitly allowed origin detected: ${requestOrigin}`);
      headers['Access-Control-Allow-Origin'] = requestOrigin;
      headers['Access-Control-Allow-Credentials'] = 'true';
      return headers;
    }
    
    // General development pattern matching (fallback)
    if (ENVIRONMENT === 'development' && 
        (requestOrigin.startsWith('http://localhost:') || 
         requestOrigin.startsWith('http://127.0.0.1:') ||
         requestOrigin.match(/^http:\/\/192\.168\.\d+\.\d+:\d+$/))) {
      
      console.log(`[CORS] Development origin pattern matched: ${requestOrigin}, allowing with credentials`);
      headers['Access-Control-Allow-Origin'] = requestOrigin;
      headers['Access-Control-Allow-Credentials'] = 'true';
      return headers;
    }
    
    // Always set specific origin for credentials requests to avoid wildcard-with-credentials error
    if (hasCredentials) {
      headers['Access-Control-Allow-Origin'] = requestOrigin;
      
      // Only allow credentials if the origin is in the allowlist
      const allowed = isOriginAllowed(requestOrigin);
      headers['Access-Control-Allow-Credentials'] = allowed ? 'true' : 'false';
      console.log(`[CORS] Credentials request from ${requestOrigin}, allowed: ${allowed}`);
      return headers;
    }
    
    // For non-credentials requests to allowed origins, set specific origin
    if (isOriginAllowed(requestOrigin)) {
      headers['Access-Control-Allow-Origin'] = requestOrigin;
      headers['Access-Control-Allow-Credentials'] = 'true'; // Allow but not required
      console.log(`[CORS] Allowed origin: ${requestOrigin}`);
      return headers;
    }
  }
  
  // For production environments, only allow specific origins from our allowlist
  // Never use a wildcard in production for better security
  if (ENVIRONMENT === 'production' || ENVIRONMENT === 'staging') {
    // For origins not in our allowlist, block them by returning the default production origin
    // This maintains security while providing a somewhat useful error to the client
    const defaultOrigin = ENVIRONMENT === 'production' 
      ? 'https://app.doughy.app' 
      : 'https://stage.doughy.app';
    
    console.log(`[CORS] Non-allowed origin rejected in ${ENVIRONMENT}: ${requestOrigin || 'no origin'}`);
    headers['Access-Control-Allow-Origin'] = defaultOrigin;
    return headers;
  } else {
    // Only in development: fall back to wildcard for ease of local development
    // This should never be used in production or staging
    console.log(`[CORS] Using wildcard origin in development (no credentials allowed)`);
    headers['Access-Control-Allow-Origin'] = '*';
  }
  
  return headers;
};

/**
 * Helper to add CORS headers to any response
 *
 * @param response The existing response
 * @param request The original request (for origin/credentials detection)
 * @returns New response with CORS headers added
 */
export const addCorsHeaders = (response: Response, request: Request): Response => {
  const origin = request.headers.get('origin');
  const hasCredentials = detectCredentialsMode(request);
  const corsHeaders = getCorsHeaders(origin || undefined, hasCredentials);
  
  // Create a new headers object with all existing and cors headers
  const newHeaders = new Headers(response.headers);
  
  // Add each CORS header
  for (const [key, value] of Object.entries(corsHeaders)) {
    newHeaders.set(key, value);
  }
  
  // Create a new response with the same body and status, but updated headers
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
};

// For backward compatibility, also export a default set of CORS headers
export const corsHeaders = getCorsHeaders();