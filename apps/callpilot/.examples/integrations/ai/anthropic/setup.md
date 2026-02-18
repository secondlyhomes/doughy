# Anthropic Claude Integration Setup

Complete guide for integrating Claude AI into your React Native app.

## Overview

Anthropic Claude provides:
- Advanced language understanding
- Long context windows (200K+ tokens)
- Safe and helpful responses
- Function calling
- Vision capabilities

## Prerequisites

- Anthropic API key (https://console.anthropic.com)
- Supabase project with Edge Functions

## Installation

No client installation. Use Edge Functions for API calls.

## Environment Variables

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx
```

## Edge Function

```typescript
// supabase/functions/claude-chat/index.ts
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

Deno.serve(async (req) => {
  const { messages, systemPrompt } = await req.json();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  });

  const data = await response.json();
  return new Response(JSON.stringify(data));
});
```

## Client Usage

```typescript
// Chat with Claude
const { data } = await supabase.functions.invoke('claude-chat', {
  body: {
    systemPrompt: 'You are a helpful assistant.',
    messages: [
      { role: 'user', content: 'Hello!' }
    ],
  },
});

console.log(data.content[0].text);
```

## Streaming Responses

```typescript
// Edge Function with streaming
Deno.serve(async (req) => {
  const { messages } = await req.json();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages,
      stream: true,
    }),
  });

  return new Response(response.body, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
});
```

## Resources

- [Anthropic Documentation](https://docs.anthropic.com)
- [Claude API Reference](https://docs.anthropic.com/claude/reference)
- [Prompt Engineering](https://docs.anthropic.com/claude/docs/prompt-engineering)
