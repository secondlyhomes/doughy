# SendGrid Integration Setup

Complete guide for sending emails via SendGrid and Supabase Edge Functions.

## Overview

SendGrid provides:
- Reliable email delivery
- Email templates
- Analytics and tracking
- Webhooks for events
- High deliverability rates

## Prerequisites

- SendGrid account (https://sendgrid.com)
- Verified sender email/domain
- Supabase project with Edge Functions

## Installation

```bash
# For Edge Functions (Deno)
# No installation needed, use fetch API
```

## Environment Variables

Add to Supabase secrets:

```bash
supabase secrets set SENDGRID_API_KEY=SG.xxx
```

## Edge Function

```typescript
// supabase/functions/send-email/index.ts
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');

Deno.serve(async (req) => {
  const { to, subject, text, html } = await req.json();

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'noreply@yourapp.com' },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    }),
  });

  return new Response(JSON.stringify({ success: response.ok }));
});
```

## Client Usage

```typescript
// Send email
await supabase.functions.invoke('send-email', {
  body: {
    to: 'user@example.com',
    subject: 'Welcome!',
    text: 'Welcome to our app!',
    html: '<h1>Welcome to our app!</h1>',
  },
});
```

## Resources

- [SendGrid Documentation](https://docs.sendgrid.com)
- [SendGrid API Reference](https://docs.sendgrid.com/api-reference)
