# Third-Party Integrations

Complete integration examples for popular services and platforms.

## Overview

This directory contains production-ready integration guides and code examples for third-party services commonly used with React Native + Expo + Supabase applications.

## Available Integrations

### Payment Providers

| Provider | Description | Setup Guide |
|----------|-------------|-------------|
| **Stripe** | Complete payment processing and subscriptions | [Setup Guide](./payment-providers/stripe/setup.md) |
| **RevenueCat** | Cross-platform in-app purchases | [Setup Guide](./payment-providers/revenuecat/setup.md) |

**Features:**
- One-time payments
- Recurring subscriptions
- Apple Pay / Google Pay
- Webhook handling
- Server-side validation

### Analytics

| Provider | Description | Setup Guide |
|----------|-------------|-------------|
| **PostHog** | Product analytics and feature flags | [Setup Guide](./analytics/posthog/setup.md) |
| **Mixpanel** | Advanced analytics and user segmentation | [Setup Guide](./analytics/mixpanel/setup.md) |
| **Amplitude** | Product intelligence platform | [Setup Guide](./analytics/amplitude/setup.md) |

**Features:**
- Event tracking
- User properties
- Feature flags
- A/B testing
- Funnel analysis
- Retention cohorts

### Authentication Providers

| Provider | Description | Setup Guide |
|----------|-------------|-------------|
| **Clerk** | Complete user management system | [Setup Guide](./auth-providers/clerk/setup.md) |
| **Auth0** | Enterprise authentication platform | [Setup Guide](./auth-providers/auth0/setup.md) |

**Features:**
- Social logins (Google, Apple, GitHub, etc.)
- Multi-factor authentication
- Organization management
- Session management
- Pre-built UI components

### Storage Providers

| Provider | Description | Setup Guide |
|----------|-------------|-------------|
| **AWS S3** | Scalable object storage | [Setup Guide](./storage/aws-s3/setup.md) |
| **Cloudflare R2** | S3-compatible storage without egress fees | [Setup Guide](./storage/cloudflare-r2/setup.md) |

**Features:**
- Presigned URLs for direct uploads
- CDN integration
- Lifecycle policies
- Cost optimization

### Email Services

| Provider | Description | Setup Guide |
|----------|-------------|-------------|
| **SendGrid** | Reliable email delivery | [Setup Guide](./email/sendgrid/setup.md) |
| **Resend** | Modern email API | [Setup Guide](./email/resend/setup.md) |

**Features:**
- Transactional emails
- Email templates
- Delivery analytics
- Webhooks for events

### SMS Services

| Provider | Description | Setup Guide |
|----------|-------------|-------------|
| **Twilio** | SMS and voice messaging | [Setup Guide](./sms/twilio/setup.md) |
| **Vonage** | Global communications platform | [Setup Guide](./sms/vonage/setup.md) |

**Features:**
- SMS messaging
- Verification codes
- Global coverage
- Delivery tracking

### Maps & Location

| Provider | Description | Setup Guide |
|----------|-------------|-------------|
| **Google Maps** | Interactive maps and location services | [Setup Guide](./maps/google-maps/setup.md) |
| **Mapbox** | Customizable maps and navigation | [Setup Guide](./maps/mapbox/setup.md) |

**Features:**
- Interactive maps
- Place search
- Directions
- Geocoding
- Custom styling

### AI Services

| Provider | Description | Setup Guide |
|----------|-------------|-------------|
| **OpenAI** | GPT models and embeddings | [Setup Guide](./ai/openai/setup.md) |
| **Anthropic** | Claude AI models | [Setup Guide](./ai/anthropic/setup.md) |
| **Replicate** | Run AI models via API | [Setup Guide](./ai/replicate/setup.md) |

**Features:**
- Chat completions
- Text generation
- Embeddings
- Image generation
- Function calling

## Integration Patterns

### Edge Function Pattern

Most integrations use Supabase Edge Functions to:
1. Securely store API keys
2. Handle server-side operations
3. Process webhooks
4. Validate responses

```typescript
// Client (React Native)
const { data } = await supabase.functions.invoke('service-name', {
  body: { /* params */ }
});

// Edge Function (Deno)
Deno.serve(async (req) => {
  const API_KEY = Deno.env.get('SERVICE_API_KEY');
  // Make API call
  // Return response
});
```

### Webhook Pattern

Handle third-party webhooks via Edge Functions:

```typescript
// Edge Function
Deno.serve(async (req) => {
  // Verify webhook signature
  const signature = req.headers.get('webhook-signature');
  if (!verifySignature(signature)) {
    return new Response('Invalid signature', { status: 401 });
  }

  // Process webhook
  const event = await req.json();
  await handleEvent(event);

  return new Response('OK');
});
```

## Security Best Practices

### API Key Management

1. **Never expose API keys in client code**
   ```typescript
   // WRONG
   const apiKey = 'sk_live_xxx'; // Never do this!

   // CORRECT
   // Use Supabase Edge Functions with secrets
   supabase secrets set SERVICE_API_KEY=sk_live_xxx
   ```

2. **Use environment-specific keys**
   ```bash
   # Development
   EXPO_PUBLIC_SERVICE_KEY=test_xxx

   # Production
   EXPO_PUBLIC_SERVICE_KEY=live_xxx
   ```

3. **Implement rate limiting**
   ```typescript
   // Edge Function with rate limiting
   const userRequests = await redis.incr(`rate:${userId}`);
   if (userRequests > 100) {
     return new Response('Rate limit exceeded', { status: 429 });
   }
   ```

### Data Security

1. **Validate all inputs**
2. **Sanitize user data**
3. **Use HTTPS for all requests**
4. **Implement request signing**
5. **Log security events**

## Testing Integrations

### Test Mode

Most services provide test/sandbox modes:

```typescript
const isTestMode = __DEV__ || process.env.NODE_ENV !== 'production';

const apiKey = isTestMode
  ? process.env.SERVICE_TEST_KEY
  : process.env.SERVICE_LIVE_KEY;
```

### Mock Services

```typescript
// __mocks__/stripe.ts
export const mockStripe = {
  createPaymentIntent: jest.fn().mockResolvedValue({
    id: 'pi_test_123',
    client_secret: 'test_secret',
  }),
};
```

## Cost Optimization

### Caching

```typescript
// Cache expensive API calls
const getCachedData = async (key: string) => {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const data = await fetchFromAPI();
  await redis.set(key, JSON.stringify(data), 'EX', 3600);
  return data;
};
```

### Batch Operations

```typescript
// Batch multiple requests
const results = await Promise.all(
  items.map(item => processItem(item))
);
```

### Request Deduplication

```typescript
// Prevent duplicate requests
const pendingRequests = new Map();

async function deduplicatedRequest(key: string) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = fetchData(key);
  pendingRequests.set(key, promise);

  try {
    return await promise;
  } finally {
    pendingRequests.delete(key);
  }
}
```

## Monitoring

### Track Integration Health

```typescript
// Monitor API calls
const trackAPICall = async (service: string, operation: string) => {
  const start = Date.now();
  try {
    const result = await performOperation();
    const duration = Date.now() - start;

    await analytics.track('api_call_success', {
      service,
      operation,
      duration,
    });

    return result;
  } catch (error) {
    await analytics.track('api_call_failed', {
      service,
      operation,
      error: error.message,
    });
    throw error;
  }
};
```

### Error Tracking

```typescript
// Report integration errors
import * as Sentry from '@sentry/react-native';

try {
  await callExternalAPI();
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      integration: 'stripe',
      operation: 'create_payment',
    },
  });
  throw error;
}
```

## Adding New Integrations

Want to add a new integration? Follow this structure:

```
integrations/
└── [category]/
    └── [provider]/
        ├── setup.md              # Setup guide
        ├── [provider]Client.ts   # Client initialization
        ├── [provider]Service.ts  # Service layer
        ├── types.ts              # TypeScript types
        └── README.md             # Quick reference
```

See [MARKETPLACE.md](../../MARKETPLACE.md) for contributing guidelines.

## Support

- [Community Discord](https://discord.gg/yourserver)
- [GitHub Discussions](https://github.com/yourorg/mobile-app-blueprint/discussions)
- [Documentation](https://docs.yourapp.com)

## Resources

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Expo Documentation](https://docs.expo.dev)
- [React Native Security](https://reactnative.dev/docs/security)
- [API Security Best Practices](https://owasp.org/www-project-api-security/)
