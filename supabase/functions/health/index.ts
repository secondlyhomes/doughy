// Simple health check endpoint for testing CORS and Edge Function availability
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Use the shared CORS headers directly - they've been updated to include all necessary headers
// Adding explicit debug information about the origin to help with debugging
const updatedCorsHeaders = {
  ...corsHeaders,
  // Ensure Access-Control-Allow-Origin is set explicitly
  'Access-Control-Allow-Origin': '*'
};

serve(async (req) => {
  // Handle CORS preflight requests with more debugging
  if (req.method === 'OPTIONS') {
    // Log origin for debugging
    const origin = req.headers.get('Origin') || '*';
    console.log(`[CORS] Preflight request from origin: ${origin}`);
    
    // Create a custom headers object with this specific origin
    const preflightHeaders = {
      ...updatedCorsHeaders,
      // Explicitly set the Access-Control-Allow-Origin header to the requesting origin
      'Access-Control-Allow-Origin': origin
    };
    
    console.log(`[CORS] Responding with headers:`, JSON.stringify(preflightHeaders));
    
    return new Response(null, { 
      headers: preflightHeaders,
      status: 204
    });
  }

  try {
    // Get request origin for proper CORS response
    const origin = req.headers.get('Origin') || '*';
    console.log(`[CORS] Request from origin: ${origin}`);
    
    // Create response headers with specific origin
    const responseHeaders = {
      ...updatedCorsHeaders,
      'Access-Control-Allow-Origin': origin,
      'Content-Type': 'application/json'
    };
    
    // Log the headers we're sending back
    console.log(`[CORS] Responding with headers:`, JSON.stringify(responseHeaders));
    
    // Return a health check response with debugging info
    return new Response(
      JSON.stringify({ 
        status: 'ok',
        service: 'edge-functions',
        timestamp: new Date().toISOString(),
        cors: true,
        origin: origin,
        headers_received: Object.fromEntries([...req.headers.entries()])
      }),
      { 
        status: 200, 
        headers: responseHeaders
      }
    );
  } catch (error) {
    // Get request origin for proper CORS response even in error case
    const origin = req.headers.get('Origin') || '*';
    
    // Create error response headers with specific origin
    const errorHeaders = {
      ...updatedCorsHeaders,
      'Access-Control-Allow-Origin': origin,
      'Content-Type': 'application/json'
    };
    
    console.log(`[CORS] Error response with headers:`, JSON.stringify(errorHeaders));
    
    // Log the actual error internally
    console.error('[Health] Error:', error);

    // Sanitize error response - don't leak internal details
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        status: 'error',
        timestamp: new Date().toISOString(),
        origin: origin
      }),
      {
        status: 500,
        headers: errorHeaders
      }
    );
  }
});