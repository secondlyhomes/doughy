# OpenAI Integration Setup

Complete guide for integrating OpenAI's GPT models and APIs.

## Overview

OpenAI provides:
- GPT-4 and GPT-3.5 language models
- Text embeddings
- Image generation (DALL-E)
- Vision capabilities
- Function calling

## Prerequisites

- OpenAI API key (https://platform.openai.com)
- Supabase project with Edge Functions

## Installation

No client installation. Use Edge Functions for API calls.

## Environment Variables

```bash
supabase secrets set OPENAI_API_KEY=sk-xxx
```

## Edge Function

```typescript
// supabase/functions/openai-chat/index.ts
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

Deno.serve(async (req) => {
  const { messages } = await req.json();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  const data = await response.json();
  return new Response(JSON.stringify(data));
});
```

## Client Usage

```typescript
// Chat with GPT
const { data } = await supabase.functions.invoke('openai-chat', {
  body: {
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello!' }
    ],
  },
});

console.log(data.choices[0].message.content);
```

## Embeddings

```typescript
// Generate embeddings for semantic search
const { data } = await supabase.functions.invoke('openai-embeddings', {
  body: {
    text: 'Your text here',
  },
});

// Store in Supabase with pgvector
await supabase
  .from('documents')
  .insert({
    content: 'Your text here',
    embedding: data.embedding,
  });
```

## Function Calling

```typescript
// Use function calling for structured outputs
const { data } = await supabase.functions.invoke('openai-chat', {
  body: {
    messages: [...],
    functions: [
      {
        name: 'get_weather',
        description: 'Get the current weather',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'City name',
            },
          },
        },
      },
    ],
  },
});
```

## Resources

- [OpenAI Documentation](https://platform.openai.com/docs)
- [API Reference](https://platform.openai.com/docs/api-reference)
- [Best Practices](https://platform.openai.com/docs/guides/production-best-practices)
