# Replicate Integration Setup

Complete guide for integrating Replicate AI models.

## Overview

Replicate provides:
- Run AI models via API
- Image generation (Stable Diffusion, DALL-E)
- Image upscaling and editing
- Audio generation
- Video generation

## Prerequisites

- Replicate account (https://replicate.com)
- Supabase Edge Functions

## Environment Variables

```bash
supabase secrets set REPLICATE_API_TOKEN=r8_xxx
```

## Edge Function

```typescript
// supabase/functions/replicate-generate/index.ts
const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN');

Deno.serve(async (req) => {
  const { prompt } = await req.json();

  // Start prediction
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: 'stability-ai/sdxl:...',
      input: { prompt },
    }),
  });

  const prediction = await response.json();

  // Poll for result
  let result = prediction;
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const pollResponse = await fetch(
      `https://api.replicate.com/v1/predictions/${prediction.id}`,
      {
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        },
      }
    );

    result = await pollResponse.json();
  }

  return new Response(JSON.stringify(result));
});
```

## Client Usage

```typescript
// Generate image
const { data } = await supabase.functions.invoke('replicate-generate', {
  body: {
    prompt: 'A beautiful sunset over mountains',
  },
});

console.log(data.output); // Array of image URLs
```

## Resources

- [Replicate Documentation](https://replicate.com/docs)
- [Model Library](https://replicate.com/explore)
