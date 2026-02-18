# AI Chat Edge Function

Production-ready Edge Function for AI chat completions with OpenAI or Anthropic APIs.

## Features

- **Streaming responses** - Real-time token streaming for better UX
- **Cost optimization** - Automatic model selection based on query complexity
- **Rate limiting** - Per-user limits (10/min, 300/day)
- **Secure API keys** - Uses Supabase Vault, never exposed to client
- **Usage tracking** - Monitor token consumption and costs
- **Error handling** - Comprehensive error handling and logging

## Setup

### 1. Create Database Tables

```sql
-- Usage tracking table
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  latency_ms INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own usage"
  ON ai_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert usage
CREATE POLICY "Service role can insert usage"
  ON ai_usage FOR INSERT
  WITH CHECK (true);

-- Index for rate limiting queries
CREATE INDEX idx_ai_usage_user_created ON ai_usage(user_id, created_at DESC);
```

### 2. Store API Key in Vault

**IMPORTANT:** Store your OpenAI API key securely in Supabase Vault.

```sql
-- Disable logging to prevent key exposure
ALTER DATABASE postgres SET log_statement = 'none';

-- Insert API key
INSERT INTO vault.secrets (name, secret, description)
VALUES (
  'openai_api_key',
  'sk-proj-your-actual-key-here',
  'OpenAI API key for AI chat completions'
);

-- Re-enable logging
ALTER DATABASE postgres SET log_statement = 'all';
```

**Verify it's stored:**

```sql
-- List secrets (encrypted, won't show actual key)
SELECT id, name, description, created_at FROM vault.secrets;
```

### 3. Deploy Edge Function

```bash
# Deploy to Supabase
supabase functions deploy ai-chat

# Test locally
supabase functions serve ai-chat
```

### 4. Set Environment Variables

Edge Functions automatically have access to:
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

No additional environment variables needed since API keys come from Vault.

## Usage

### Non-Streaming Request

```typescript
// src/services/aiService.ts
import { supabase } from './supabase';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function sendChatMessage(messages: ChatMessage[]) {
  const { data, error } = await supabase.functions.invoke('ai-chat', {
    body: {
      messages,
      stream: false,
      maxTokens: 1000,
      temperature: 0.7,
    },
  });

  if (error) throw error;
  return data;
}

// Usage
const response = await sendChatMessage([
  { role: 'user', content: 'Explain React hooks' },
]);

console.log(response.message); // AI response
console.log(response.usage); // Token usage
console.log(response._meta.remaining); // Remaining requests today
```

### Streaming Request

```typescript
// src/services/aiService.ts
export async function streamChatMessage(
  messages: ChatMessage[],
  onChunk: (chunk: string) => void
) {
  const session = await supabase.auth.getSession();
  if (!session.data.session) throw new Error('Not authenticated');

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/ai-chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.data.session.access_token}`,
      },
      body: JSON.stringify({
        messages,
        stream: true,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Stream failed');
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) return;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split('\n').filter((line) => line.startsWith('data: '));

    for (const line of lines) {
      const data = line.replace('data: ', '');
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices[0]?.delta?.content;
        if (content) {
          onChunk(content);
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }
}

// Usage in React component
import { useState } from 'react';

function ChatComponent() {
  const [response, setResponse] = useState('');

  async function handleSend(message: string) {
    setResponse('');
    await streamChatMessage(
      [{ role: 'user', content: message }],
      (chunk) => setResponse((prev) => prev + chunk)
    );
  }

  return <div>{response}</div>;
}
```

## Cost Optimization

The function automatically selects models based on query complexity:

| Input | Model | Cost per 1K tokens |
|-------|-------|-------------------|
| < 50 words, simple | `gpt-4o-mini` | $0.00015 (input) |
| Complex or long | `gpt-4o` | $0.0025 (input) |

**Keywords triggering full model:**
- code
- explain
- analyze
- complex
- detailed

**Example:**

```typescript
// Uses gpt-4o-mini (cheap)
await sendChatMessage([
  { role: 'user', content: 'What is React?' }
]);

// Uses gpt-4o (full model)
await sendChatMessage([
  { role: 'user', content: 'Explain the React reconciliation algorithm in detail' }
]);
```

## Rate Limiting

**Default limits:**
- 10 requests per minute
- 300 requests per day

**Custom limits per user:**

```sql
-- Create rate limit overrides table
CREATE TABLE ai_rate_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  requests_per_minute INT DEFAULT 10,
  requests_per_day INT DEFAULT 300,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Give premium users higher limits
INSERT INTO ai_rate_limits (user_id, requests_per_minute, requests_per_day)
VALUES ('user-uuid-here', 50, 1000);
```

Update `checkRateLimit()` in `index.ts` to check this table first.

## Usage Tracking

**View your usage:**

```sql
SELECT
  DATE(created_at) as date,
  model,
  COUNT(*) as requests,
  SUM(total_tokens) as total_tokens,
  AVG(latency_ms) as avg_latency_ms
FROM ai_usage
WHERE user_id = 'your-user-id'
GROUP BY DATE(created_at), model
ORDER BY date DESC;
```

**Calculate costs:**

```sql
-- OpenAI pricing (as of 2024)
SELECT
  model,
  COUNT(*) as requests,
  SUM(prompt_tokens) as prompt_tokens,
  SUM(completion_tokens) as completion_tokens,
  CASE
    WHEN model = 'gpt-4o-mini' THEN
      (SUM(prompt_tokens) * 0.00015 / 1000) +
      (SUM(completion_tokens) * 0.0006 / 1000)
    WHEN model = 'gpt-4o' THEN
      (SUM(prompt_tokens) * 0.0025 / 1000) +
      (SUM(completion_tokens) * 0.01 / 1000)
  END as estimated_cost
FROM ai_usage
WHERE user_id = 'your-user-id'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY model;
```

## Switching to Anthropic

To use Anthropic's Claude instead of OpenAI:

1. **Store Anthropic API key in Vault:**

```sql
INSERT INTO vault.secrets (name, secret, description)
VALUES (
  'anthropic_api_key',
  'sk-ant-your-key-here',
  'Anthropic API key for Claude'
);
```

2. **Update `index.ts`:**

```typescript
// Replace completeChatCompletion with:
async function completeChatCompletion(
  apiKey: string,
  model: string,
  request: ChatRequest
) {
  // Map to Claude models
  const claudeModel = model === 'gpt-4o-mini'
    ? 'claude-3-haiku-20240307'
    : 'claude-3-5-sonnet-20241022';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: claudeModel,
      max_tokens: request.maxTokens || 1000,
      messages: request.messages.filter(m => m.role !== 'system'),
      system: request.messages.find(m => m.role === 'system')?.content,
    }),
  });

  const data = await response.json();

  return {
    message: data.content[0]?.text || '',
    usage: data.usage,
  };
}

// Update getSecretFromVault call to use 'anthropic_api_key'
```

## Error Handling

**Common errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Missing/invalid auth token | Ensure user is logged in |
| 429 Rate limit exceeded | Too many requests | Show error, retry after 60s |
| 500 Service error | API key not found | Check Vault setup |
| 400 Invalid request | Missing/invalid messages | Validate input |

**Client-side error handling:**

```typescript
try {
  const response = await sendChatMessage(messages);
  console.log(response.message);
} catch (error) {
  if (error.message.includes('Rate limit')) {
    alert('Too many requests. Please wait a minute.');
  } else if (error.message.includes('Unauthorized')) {
    // Redirect to login
    router.push('/login');
  } else {
    alert('Failed to send message. Please try again.');
  }
}
```

## Testing

### Local Testing

```bash
# Start local Edge Function
supabase functions serve ai-chat

# Test with curl
curl -X POST http://localhost:54321/functions/v1/ai-chat \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "stream": false
  }'
```

### Unit Tests

```typescript
// tests/ai-chat.test.ts
import { assertEquals } from 'jsr:@std/assert';

Deno.test('selectModel returns gpt-4o-mini for simple queries', () => {
  const messages = [{ role: 'user', content: 'Hello' }];
  const model = selectModel(messages);
  assertEquals(model, 'gpt-4o-mini');
});

Deno.test('selectModel returns gpt-4o for complex queries', () => {
  const messages = [{ role: 'user', content: 'Explain in detail how to code' }];
  const model = selectModel(messages);
  assertEquals(model, 'gpt-4o');
});
```

## Security Best Practices

- ✅ API keys stored in Vault, never in code or env files
- ✅ User authentication required for all requests
- ✅ Rate limiting prevents abuse
- ✅ Input validation (length limits)
- ✅ RLS policies on usage table
- ✅ Service role key only used server-side

## Monitoring

**Set up alerts for high usage:**

```sql
-- Create function to check daily usage
CREATE OR REPLACE FUNCTION check_high_usage()
RETURNS TABLE(user_id UUID, daily_requests BIGINT, daily_tokens BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ai_usage.user_id,
    COUNT(*) as daily_requests,
    SUM(total_tokens) as daily_tokens
  FROM ai_usage
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY ai_usage.user_id
  HAVING COUNT(*) > 500 OR SUM(total_tokens) > 100000;
END;
$$ LANGUAGE plpgsql;

-- Run daily via cron job or Edge Function
```

## Related Documentation

- [AI API Call Pattern](../../../docs/patterns/AI-API-CALL.md)
- [API Key Management](../../../docs/09-security/API-KEY-MANAGEMENT.md)
- [Cost Optimization](../../../docs/07-ai-integration/COST-OPTIMIZATION.md)

## Troubleshooting

### "Failed to retrieve API key from Vault"

**Check Vault setup:**

```sql
-- Verify secret exists
SELECT name, description FROM vault.secrets WHERE name = 'openai_api_key';

-- Test decryption with service role
SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'openai_api_key';
```

### "Rate limit exceeded"

Clear rate limit for testing:

```sql
DELETE FROM ai_usage WHERE user_id = 'your-user-id';
```

### High latency

- Use streaming for better perceived performance
- Optimize prompt length
- Consider caching common responses
- Monitor OpenAI API status
