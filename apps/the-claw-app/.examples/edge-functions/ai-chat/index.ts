/**
 * AI Chat Edge Function
 *
 * Handles chat completions using OpenAI or Anthropic APIs with:
 * - Streaming responses
 * - Cost optimization via model routing
 * - Rate limiting
 * - Secure API key management via Supabase Vault
 * - Usage tracking
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

// Types
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}

interface RateLimitCheck {
  allowed: boolean;
  remaining: number;
  resetAt?: Date;
}

// Environment validation
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SECRET_KEY = Deno.env.get('SUPABASE_SECRET_KEY');

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error('Missing required environment variables');
}

// Constants
const RATE_LIMIT_PER_MINUTE = 10;
const RATE_LIMIT_PER_DAY = 300;
const MAX_INPUT_LENGTH = 10000;

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    // 1. Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // 2. Rate limiting
    const rateLimitCheck = await checkRateLimit(supabase, user.id);
    if (!rateLimitCheck.allowed) {
      return jsonResponse(
        {
          error: 'Rate limit exceeded',
          retryAfter: 60,
          remaining: rateLimitCheck.remaining,
        },
        429
      );
    }

    // 3. Parse and validate request
    const body = (await req.json()) as ChatRequest;

    if (!body.messages || !Array.isArray(body.messages)) {
      return jsonResponse({ error: 'Invalid request: messages required' }, 400);
    }

    if (body.messages.length === 0) {
      return jsonResponse({ error: 'Invalid request: messages cannot be empty' }, 400);
    }

    // Validate message length
    const totalLength = body.messages.reduce((sum, msg) => sum + msg.content.length, 0);
    if (totalLength > MAX_INPUT_LENGTH) {
      return jsonResponse({ error: 'Input too long' }, 400);
    }

    // 4. Get API key from Vault
    const apiKey = await getSecretFromVault(supabase, 'openai_api_key');
    if (!apiKey) {
      console.error('Failed to retrieve API key from Vault');
      return jsonResponse({ error: 'Service configuration error' }, 500);
    }

    // 5. Determine model based on complexity
    const model = selectModel(body.messages);

    // 6. Make API call
    const startTime = Date.now();

    if (body.stream) {
      // Streaming response
      return streamChatCompletion(apiKey, model, body, user.id);
    } else {
      // Non-streaming response
      const result = await completeChatCompletion(apiKey, model, body);
      const latency = Date.now() - startTime;

      // Track usage asynchronously
      trackUsage(supabase, user.id, model, result.usage, latency).catch(console.error);

      return jsonResponse({
        message: result.message,
        usage: result.usage,
        model: model,
        _meta: {
          remaining: rateLimitCheck.remaining - 1,
          latency,
        },
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      500
    );
  }
});

// Helper: Get secret from Supabase Vault
async function getSecretFromVault(
  supabase: ReturnType<typeof createClient>,
  secretName: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('vault.decrypted_secrets')
    .select('decrypted_secret')
    .eq('name', secretName)
    .single();

  if (error) {
    console.error('Vault error:', error);
    return null;
  }

  return data?.decrypted_secret || null;
}

// Helper: Check rate limit
async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<RateLimitCheck> {
  const now = new Date();
  const minuteAgo = new Date(now.getTime() - 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Count requests in last minute and last day
  const [minuteResult, dayResult] = await Promise.all([
    supabase
      .from('ai_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', minuteAgo.toISOString()),
    supabase
      .from('ai_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', dayAgo.toISOString()),
  ]);

  const minuteCount = minuteResult.count || 0;
  const dayCount = dayResult.count || 0;

  if (minuteCount >= RATE_LIMIT_PER_MINUTE || dayCount >= RATE_LIMIT_PER_DAY) {
    return {
      allowed: false,
      remaining: Math.max(0, RATE_LIMIT_PER_DAY - dayCount),
    };
  }

  return {
    allowed: true,
    remaining: RATE_LIMIT_PER_DAY - dayCount,
  };
}

// Helper: Select model based on complexity
function selectModel(messages: ChatMessage[]): string {
  const totalWords = messages.reduce(
    (sum, msg) => sum + msg.content.split(/\s+/).length,
    0
  );

  const hasComplexity = messages.some((msg) =>
    /code|explain|analyze|complex|detailed/i.test(msg.content)
  );

  // Use cheaper model for simple queries
  if (totalWords < 50 && !hasComplexity) {
    return 'gpt-4o-mini';
  }

  // Use full model for complex queries
  return 'gpt-4o';
}

// Helper: Complete chat (non-streaming)
async function completeChatCompletion(
  apiKey: string,
  model: string,
  request: ChatRequest
) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: request.messages,
      max_tokens: request.maxTokens || 1000,
      temperature: request.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();

  return {
    message: data.choices[0]?.message?.content || '',
    usage: data.usage,
  };
}

// Helper: Stream chat completion
async function streamChatCompletion(
  apiKey: string,
  model: string,
  request: ChatRequest,
  userId: string
): Promise<Response> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: request.messages,
      max_tokens: request.maxTokens || 1000,
      temperature: request.temperature || 0.7,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  // Create a readable stream to forward SSE events
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              controller.enqueue(new TextEncoder().encode(line + '\n\n'));
            }
          }
        }
      } catch (error) {
        console.error('Stream error:', error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// Helper: Track usage
async function trackUsage(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  model: string,
  usage: any,
  latency: number
) {
  await supabase.from('ai_usage').insert({
    user_id: userId,
    model,
    prompt_tokens: usage?.prompt_tokens || 0,
    completion_tokens: usage?.completion_tokens || 0,
    total_tokens: usage?.total_tokens || 0,
    latency_ms: latency,
    created_at: new Date().toISOString(),
  });
}

// Helper: JSON response
function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
