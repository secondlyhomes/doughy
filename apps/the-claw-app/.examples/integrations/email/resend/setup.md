# Resend Integration Setup

Complete guide for sending emails via Resend.

## Overview

Resend provides:
- Modern email API
- React email templates
- Email analytics
- High deliverability
- Developer-friendly API

## Prerequisites

- Resend account (https://resend.com)
- Verified domain
- Supabase Edge Functions

## Environment Variables

```bash
supabase secrets set RESEND_API_KEY=re_xxx
```

## Edge Function

```typescript
// supabase/functions/send-email/index.ts
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

Deno.serve(async (req) => {
  const { to, subject, html } = await req.json();

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'noreply@yourapp.com',
      to,
      subject,
      html,
    }),
  });

  const data = await response.json();
  return new Response(JSON.stringify(data));
});
```

## Client Usage

```typescript
// Send email
await supabase.functions.invoke('send-email', {
  body: {
    to: 'user@example.com',
    subject: 'Welcome!',
    html: '<h1>Welcome to our app!</h1>',
  },
});
```

## React Email Templates

```typescript
// Use React Email for templates
import { render } from '@react-email/render';
import { WelcomeEmail } from './templates/WelcomeEmail';

const html = render(<WelcomeEmail name="John" />);

await supabase.functions.invoke('send-email', {
  body: { to, subject, html },
});
```

## Resources

- [Resend Documentation](https://resend.com/docs)
- [React Email](https://react.email)
