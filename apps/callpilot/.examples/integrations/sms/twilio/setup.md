# Twilio Integration Setup

Complete guide for sending SMS via Twilio and Supabase Edge Functions.

## Overview

Twilio provides:
- SMS messaging
- Voice calls
- WhatsApp messaging
- Verification codes
- Global coverage

## Prerequisites

- Twilio account (https://twilio.com)
- Twilio phone number
- Supabase project

## Installation

No client installation needed. Use Edge Functions.

## Environment Variables

```bash
supabase secrets set TWILIO_ACCOUNT_SID=ACxxx
supabase secrets set TWILIO_AUTH_TOKEN=xxx
supabase secrets set TWILIO_PHONE_NUMBER=+1234567890
```

## Edge Function

```typescript
// supabase/functions/send-sms/index.ts
const ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const FROM_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

Deno.serve(async (req) => {
  const { to, message } = await req.json();

  const credentials = btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`);

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: FROM_NUMBER!,
        Body: message,
      }),
    }
  );

  const data = await response.json();
  return new Response(JSON.stringify(data));
});
```

## Client Usage

```typescript
// Send SMS
await supabase.functions.invoke('send-sms', {
  body: {
    to: '+1234567890',
    message: 'Your verification code is 123456',
  },
});
```

## Resources

- [Twilio Documentation](https://www.twilio.com/docs)
- [Twilio SMS API](https://www.twilio.com/docs/sms)
