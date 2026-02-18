# AI API Call Pattern

## Overview

This pattern guides making AI API calls with proper cost controls, error handling, and security.

## Architecture

```
Mobile App
    ↓
Supabase Edge Function  ← Rate limiting, validation
    ↓
OpenAI API
    ↓
Response transformation
    ↓
Mobile App
```

## Edge Function Implementation

```typescript
// supabase/functions/process-task/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';
import OpenAI from 'https://deno.land/x/openai@v4.24.0/mod.ts';

// Rate limiter
import { checkRateLimit } from '../_shared/rateLimiter.ts';
// Input validation
import { validateInput, sanitizeInput } from '../_shared/validation.ts';
// Model routing
import { selectModel } from '../_shared/modelRouter.ts';
// Usage tracking
import { trackUsage } from '../_shared/usageTracker.ts';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    // 1. Authenticate
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    // 2. Rate limit
    const { allowed, remaining } = await checkRateLimit(user.id);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', retryAfter: 60 }),
        { status: 429 }
      );
    }

    // 3. Parse and validate input
    const body = await req.json();
    const validation = validateInput(body.text);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400 }
      );
    }

    const sanitizedInput = sanitizeInput(body.text);

    // 4. Check for jailbreak attempts
    if (detectJailbreak(sanitizedInput)) {
      return new Response(
        JSON.stringify({ error: 'Invalid input' }),
        { status: 400 }
      );
    }

    // 5. Select model based on complexity
    const { model, tier } = selectModel(sanitizedInput);

    // 6. Make API call
    const startTime = Date.now();
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: sanitizedInput,
        },
      ],
      max_tokens: 400,
      temperature: 0.3,
    });

    const latency = Date.now() - startTime;

    // 7. Parse response
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from AI');
    }

    const result = parseAIResponse(content);

    // 8. Track usage (fire and forget)
    trackUsage({
      userId: user.id,
      model,
      tier,
      tokens: completion.usage,
      latency,
    }).catch(console.error);

    // 9. Return response
    return new Response(
      JSON.stringify({
        ...result,
        _meta: {
          model: tier,
          remaining,
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(remaining),
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);

    return new Response(
      JSON.stringify({ error: 'Processing failed' }),
      { status: 500 }
    );
  }
});

// System prompt
const SYSTEM_PROMPT = `You are a task parsing assistant. Given natural language input, extract:
- title: The main task (string, max 100 chars)
- dueDate: When it should be done (ISO date or null)
- priority: high, medium, or low

Respond in JSON format only. Example:
{"title": "Buy groceries", "dueDate": "2024-01-16", "priority": "medium"}`;

// Parse AI response
function parseAIResponse(content: string) {
  try {
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { error: 'Failed to parse response', raw: content };
  }
}

// Jailbreak detection
const JAILBREAK_PATTERNS = [
  /ignore.*previous.*instructions/i,
  /you are now/i,
  /pretend you/i,
  /\|im_start\|/i,
  /system.*prompt/i,
];

function detectJailbreak(input: string): boolean {
  return JAILBREAK_PATTERNS.some((pattern) => pattern.test(input));
}
```

## Shared Utilities

### Rate Limiter

```typescript
// supabase/functions/_shared/rateLimiter.ts
import { Redis } from 'https://deno.land/x/upstash_redis@v1.19.3/mod.ts';

const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_URL')!,
  token: Deno.env.get('UPSTASH_REDIS_TOKEN')!,
});

const LIMITS = {
  PER_MINUTE: 10,
  PER_DAY: 300,
};

export async function checkRateLimit(userId: string) {
  const now = new Date();
  const minuteKey = `rate:min:${userId}:${now.toISOString().slice(0, 16)}`;
  const dayKey = `rate:day:${userId}:${now.toISOString().slice(0, 10)}`;

  const [minuteCount, dayCount] = await Promise.all([
    redis.incr(minuteKey),
    redis.incr(dayKey),
  ]);

  // Set expiry
  if (minuteCount === 1) await redis.expire(minuteKey, 60);
  if (dayCount === 1) await redis.expire(dayKey, 86400);

  if (minuteCount > LIMITS.PER_MINUTE || dayCount > LIMITS.PER_DAY) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: LIMITS.PER_DAY - dayCount };
}
```

### Model Router

```typescript
// supabase/functions/_shared/modelRouter.ts
type ModelTier = 'nano' | 'mini' | 'full';

const COMPLEXITY_KEYWORDS = [
  'except', 'but not', 'unless', 'only if',
  'every day', 'weekly', 'daily', 'recurring',
  'cancel all', 'delete all', 'batch',
];

export function selectModel(input: string): { model: string; tier: ModelTier } {
  const wordCount = input.trim().split(/\s+/).length;
  const hasComplexity = COMPLEXITY_KEYWORDS.some((kw) =>
    input.toLowerCase().includes(kw)
  );

  // Simple requests → cheapest model
  if (wordCount < 20 && !hasComplexity) {
    return { model: 'gpt-4o-mini', tier: 'nano' };
  }

  // Medium complexity
  if (wordCount < 75 && !hasComplexity) {
    return { model: 'gpt-4o-mini', tier: 'mini' };
  }

  // Complex requests → full model
  return { model: 'gpt-4o', tier: 'full' };
}
```

### Input Validation

```typescript
// supabase/functions/_shared/validation.ts
const MAX_INPUT_LENGTH = 6000;
const MIN_INPUT_LENGTH = 1;

export function validateInput(input: unknown): { valid: boolean; error?: string } {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Input must be a string' };
  }

  if (input.length < MIN_INPUT_LENGTH) {
    return { valid: false, error: 'Input is too short' };
  }

  if (input.length > MAX_INPUT_LENGTH) {
    return { valid: false, error: 'Input is too long' };
  }

  return { valid: true };
}

export function sanitizeInput(input: string): string {
  return input
    .slice(0, MAX_INPUT_LENGTH)
    .replace(/<\|.*?\|>/g, '') // Remove special tokens
    .trim();
}
```

## Client-Side Service

```typescript
// src/services/aiService.ts
import { supabase } from '@/lib/supabase';

interface ProcessTaskResult {
  title: string;
  dueDate: string | null;
  priority: 'high' | 'medium' | 'low';
  _meta: {
    model: string;
    remaining: number;
  };
}

export async function processTaskInput(text: string): Promise<ProcessTaskResult> {
  const { data, error } = await supabase.functions.invoke<ProcessTaskResult>(
    'process-task',
    { body: { text } }
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('No response from AI');
  }

  return data;
}
```

## React Hook

```typescript
// src/hooks/useAITaskParser.ts
import { useState, useCallback } from 'react';
import { processTaskInput } from '@/services/aiService';

export function useAITaskParser() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);

  const parseTask = useCallback(async (text: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await processTaskInput(text);
      setRemainingRequests(result._meta.remaining);
      return {
        title: result.title,
        dueDate: result.dueDate ? new Date(result.dueDate) : null,
        priority: result.priority,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to parse task');
      setError(error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    parseTask,
    isProcessing,
    error,
    remainingRequests,
  };
}
```

## Checklist

- [ ] Edge Function with authentication
- [ ] Rate limiting per user
- [ ] Input validation and sanitization
- [ ] Jailbreak detection
- [ ] Model routing for cost optimization
- [ ] Usage tracking
- [ ] Error handling
- [ ] Client-side service wrapper
- [ ] React hook with loading state
- [ ] Tests for validation and parsing
