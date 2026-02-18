# Vonage Integration Setup

Complete guide for sending SMS via Vonage (formerly Nexmo).

## Overview

Vonage provides:
- SMS messaging
- Voice calls
- Video API
- Verification API
- Global coverage

## Prerequisites

- Vonage account (https://vonage.com)
- Supabase Edge Functions

## Environment Variables

```bash
supabase secrets set VONAGE_API_KEY=xxx
supabase secrets set VONAGE_API_SECRET=xxx
```

## Edge Function

```typescript
// supabase/functions/vonage-sms/index.ts
const API_KEY = Deno.env.get('VONAGE_API_KEY');
const API_SECRET = Deno.env.get('VONAGE_API_SECRET');

Deno.serve(async (req) => {
  const { to, message } = await req.json();

  const response = await fetch('https://rest.nexmo.com/sms/json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: API_KEY,
      api_secret: API_SECRET,
      to,
      from: 'YourApp',
      text: message,
    }),
  });

  const data = await response.json();
  return new Response(JSON.stringify(data));
});
```

## Client Usage

```typescript
// Send SMS
await supabase.functions.invoke('vonage-sms', {
  body: {
    to: '+1234567890',
    message: 'Your verification code is 123456',
  },
});
```

## Resources

- [Vonage Documentation](https://developer.vonage.com)
- [SMS API](https://developer.vonage.com/messaging/sms/overview)
