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
  console.info(`[perplexity-api] INFO: ${message}`, details || '');
  
  // Try to log to the database if possible
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      supabase.from('system_logs').insert({
        level: 'info',
        source: 'perplexity-api',
        message: message,
        details: details || {}
      }).then((result) => {
        if (result.error) {
          console.error(`[perplexity-api] Failed to log to database:`, result.error);
        }
      });
    }
  } catch (error) {
    console.error(`[perplexity-api] Error logging to database:`, error);
  }
};

const logError = (message: string, details?: any) => {
  console.error(`[perplexity-api] ERROR: ${message}`, details || '');
  
  // Try to log to the database if possible
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      supabase.from('system_logs').insert({
        level: 'error',
        source: 'perplexity-api',
        message: message,
        details: details || {}
      }).then((result) => {
        if (result.error) {
          console.error(`[perplexity-api] Failed to log error to database:`, result.error);
        }
      });
    }
  } catch (error) {
    console.error(`[perplexity-api] Error logging to database:`, error);
  }
};

// NOTE: Using imported decryptServer from _shared/crypto-server.ts instead of local implementation

const PERPLEXITY_API_URL = "https://api.perplexity.ai";

/**
 * Main handler for Perplexity edge function
 */
serve(async (req) => {
  // IMPORTANT: CORS preflight handling must come first
  // Handle OPTIONS requests with the standardized CORS handler
  const corsResponse = handleCors(req);
  if (corsResponse) {
    logInfo("Handling CORS preflight request for Perplexity API");
    return corsResponse;
  }
  
  // Set CORS headers for all response types based on request
  const headers = getCorsHeaders(req.headers.get('origin'), !!req.headers.get('authorization'));

  try {
    // Parse request body
    const requestData = await req.json();
    const action = requestData.action || "query";
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SECRET_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get API key from database
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from("security_api_keys")
      .select("key_ciphertext")
      .or('service.eq.perplexity,service.eq.perplexity-key')
      .maybeSingle();

    if (apiKeyError) {
      logError("Error fetching Perplexity API key:", apiKeyError);
      
      const errorResponse = new Response(
        JSON.stringify({
          status: "error",
          message: "Failed to fetch Perplexity API key",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
      
      return addCorsHeaders(errorResponse, req);
    }

    if (!apiKeyData?.key_ciphertext) {
      logError("Perplexity API key not configured");
      
      const errorResponse = new Response(
        JSON.stringify({
          status: "error",
          message: "Perplexity API key not configured",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
      
      return addCorsHeaders(errorResponse, req);
    }

    // Decrypt API key
    const apiKey = await decryptServer(apiKeyData.key_ciphertext);

    // Process based on action
    let response;
    
    switch (action) {
      case "query":
        response = await handleQuery(req, requestData, apiKey);
        break;
      case "status":
        response = await handleStatus(apiKey);
        break;
      case "ping":
        response = await handlePing(apiKey);
        break;
      default:
        response = new Response(
          JSON.stringify({
            status: "error",
            message: `Unknown action: ${action}`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
        break;
    }
    
    // Apply CORS headers to all responses
    return addCorsHeaders(response, req);
    
  } catch (error) {
    logError("Error in perplexity-api edge function:", error);
    
    const errorResponse = new Response(
      JSON.stringify({
        status: "error",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
    
    return addCorsHeaders(errorResponse, req);
  }
});

/**
 * Handle Perplexity API query requests
 */
async function handleQuery(req: Request, requestData: any, apiKey: string) {
  try {
    const { query, model, messages, options } = requestData;
    
    // Create the request payload based on input format
    let payload: any;
    
    if (messages) {
      // Use chat completion format
      payload = {
        model: model || "sonar",
        messages: messages,
        max_tokens: options?.max_tokens || 1024,
        temperature: options?.temperature || 0.7,
        stream: options?.stream || false,
      };
    } else if (query) {
      // Use single query format
      payload = {
        model: model || "sonar",
        messages: [{ role: "user", content: query }],
        max_tokens: options?.max_tokens || 1024,
        temperature: options?.temperature || 0.7,
        stream: options?.stream || false,
      };
    } else {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Either query or messages must be provided",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log the API request (without the key)
    logInfo(`Perplexity API request: ${JSON.stringify({
      model: payload.model,
      messageCount: payload.messages.length,
      maxTokens: payload.max_tokens,
    })}`);

    // Make the API request to Perplexity
    const response = await fetch(`${PERPLEXITY_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Handle streaming response if requested
    if (payload.stream && response.ok) {
      return new Response(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Handle regular JSON response
    const responseData = await response.json();
    
    if (!response.ok) {
      logError("Perplexity API error:", responseData);
      return new Response(
        JSON.stringify({
          status: "error",
          message: responseData.error?.message || "Perplexity API request failed",
          details: responseData,
        }),
        {
          status: 200, // Return 200 to client even on API errors to allow proper handling
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: "success",
        data: responseData,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logError("Error in handleQuery:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to process Perplexity query",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Check Perplexity API status
 */
async function handleStatus(apiKey: string) {
  try {
    logInfo("Checking Perplexity API status...");
    
    // Make a minimal API request to check if the API is operational
    const response = await fetch(`${PERPLEXITY_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5,
        temperature: 0.7,
        stream: false
      }),
    });

    logInfo(`Perplexity API status check response status: ${response.status}`);

    if (response.ok) {
      // Try to parse response to verify it's real
      const data = await response.json();
      logInfo("Perplexity API status check successful");
      
      return new Response(
        JSON.stringify({
          status: "success",
          data: {
            perplexity: {
              status: "operational",
              message: "Perplexity API is operational",
              model: data.model
            }
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle error response
    let errorMessage = response.statusText;
    let errorDetails = {};
    
    try {
      const errorData = await response.json();
      logError("Perplexity API error data:", errorData);
      
      if (errorData.error) {
        errorMessage = errorData.error.message || errorData.error.type || response.statusText;
        errorDetails = errorData;
      }
    } catch (jsonError) {
      logError("Failed to parse Perplexity error response:", jsonError);
      errorMessage = `Status ${response.status}: ${response.statusText}`;
    }
    
    return new Response(
      JSON.stringify({
        status: "error",
        data: {
          perplexity: {
            status: "error",
            message: `Perplexity API error: ${errorMessage}`,
            details: errorDetails,
            statusCode: response.status
          }
        },
      }),
      {
        status: 200, // Return 200 to client to allow proper handling
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logError("Error checking Perplexity API status:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        data: {
          perplexity: {
            status: "error",
            message: error instanceof Error ? error.message : "Failed to check Perplexity API status"
          }
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Ping Perplexity API without spending tokens
 * Uses a minimal valid request that should trigger a validation error but confirm API is reachable
 */
async function handlePing(apiKey: string) {
  try {
    logInfo("Pinging Perplexity API...");
    
    // Make a POST request with an intentionally invalid body
    // This should trigger a validation error from the API, but will confirm:
    // 1. The API is reachable
    // 2. The auth token is valid
    // 3. Without causing a completion that would consume tokens
    const response = await fetch(`${PERPLEXITY_API_URL}/chat/completions`, {
      method: "POST",  
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "sonar",
        // Empty messages array will cause validation error
        messages: [],
        max_tokens: 1
      })
    });
    
    // Get response body if available
    let responseData = null;
    try {
      responseData = await response.json();
    } catch (e) {
      // Ignore JSON parsing errors
    }
    
    // A 400 Bad Request is expected here and means the API is working but rejected our invalid input
    // 401/403 would mean auth issues, 5xx would mean server issues
    const isOperational = response.ok || response.status === 400;
    
    logInfo(`Perplexity API ping response status: ${response.status}, isOperational: ${isOperational}`);
    
    // Use exactly the same response format as the working handleStatus method
    return new Response(
      JSON.stringify({
        status: "success",
        data: {
          perplexity: {
            status: isOperational ? "operational" : "error",
            message: isOperational 
              ? "Perplexity API is operational" 
              : `Perplexity API error: ${response.statusText || response.status}`,
            statusCode: response.status,
            details: responseData
          }
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logError("Error pinging Perplexity API:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        data: {
          perplexity: {
            status: "error",
            message: error instanceof Error ? error.message : "Failed to connect to Perplexity API"
          }
        },
      }),
      {
        status: 200, // Return 200 to client to allow proper handling
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}