# Integration Examples - Complete Index

## Overview

This directory contains **20+ production-ready integration examples** covering the most popular third-party services used with React Native + Expo + Supabase applications.

**Total Integration Files:** 23+
**Total Lines of Code/Documentation:** 7,000+
**Categories Covered:** 8

## Quick Navigation

### By Category

- [Payment Providers](#payment-providers)
- [Analytics & Tracking](#analytics--tracking)
- [Authentication & Identity](#authentication--identity)
- [Storage & CDN](#storage--cdn)
- [Email Services](#email-services)
- [SMS & Voice](#sms--voice)
- [Maps & Location](#maps--location)
- [AI & Machine Learning](#ai--machine-learning)

### By Difficulty

- [Beginner Friendly](#beginner-friendly) - Simple setup, minimal configuration
- [Intermediate](#intermediate) - Moderate complexity, some configuration
- [Advanced](#advanced) - Complex setup, multiple components

### By Platform

- [iOS Only](#ios-only)
- [Android Only](#android-only)
- [Cross-Platform](#cross-platform) - Works on iOS, Android, and Web

---

## Payment Providers

### Stripe
**Difficulty:** Intermediate | **Platform:** Cross-platform | **Setup Time:** 2-3 hours

Complete payment processing solution with subscriptions.

**Files:**
- `payment-providers/stripe/setup.md` - Complete setup guide
- `payment-providers/stripe/stripeClient.ts` - Client initialization
- `payment-providers/stripe/paymentService.ts` - Payment operations
- `payment-providers/stripe/types.ts` - TypeScript definitions
- `payment-providers/stripe/CheckoutScreen.tsx` - Example UI

**Features:**
- One-time payments
- Recurring subscriptions
- Apple Pay / Google Pay
- Webhook handling
- Server-side validation

**Use Cases:**
- E-commerce checkout
- SaaS subscriptions
- Marketplace payments

**[View Setup Guide →](./payment-providers/stripe/setup.md)**

---

### RevenueCat
**Difficulty:** Intermediate | **Platform:** iOS, Android | **Setup Time:** 1-2 hours

Cross-platform in-app purchase management.

**Files:**
- `payment-providers/revenuecat/setup.md` - Complete setup guide

**Features:**
- App Store subscriptions
- Google Play billing
- Cross-platform receipts
- Analytics dashboard

**Use Cases:**
- Premium app subscriptions
- In-app purchases
- Free trial management

**[View Setup Guide →](./payment-providers/revenuecat/setup.md)**

---

## Analytics & Tracking

### PostHog
**Difficulty:** Beginner | **Platform:** Cross-platform | **Setup Time:** 30 minutes

Product analytics and feature flags.

**Files:**
- `analytics/posthog/setup.md` - Complete setup guide

**Features:**
- Event tracking
- Feature flags
- A/B testing
- Session recording
- Self-hosted option

**Use Cases:**
- User behavior tracking
- Feature rollouts
- Product experiments

**[View Setup Guide →](./analytics/posthog/setup.md)**

---

### Mixpanel
**Difficulty:** Beginner | **Platform:** Cross-platform | **Setup Time:** 30 minutes

Advanced product analytics.

**Files:**
- `analytics/mixpanel/setup.md` - Setup guide

**Features:**
- Event tracking
- Funnel analysis
- Retention tracking
- User segmentation

**[View Setup Guide →](./analytics/mixpanel/setup.md)**

---

### Amplitude
**Difficulty:** Beginner | **Platform:** Cross-platform | **Setup Time:** 30 minutes

Product intelligence platform.

**Files:**
- `analytics/amplitude/setup.md` - Setup guide

**Features:**
- Behavioral analytics
- User paths
- Cohort analysis

**[View Setup Guide →](./analytics/amplitude/setup.md)**

---

## Authentication & Identity

### Clerk
**Difficulty:** Intermediate | **Platform:** Cross-platform | **Setup Time:** 1-2 hours

Complete user management system.

**Files:**
- `auth-providers/clerk/setup.md` - Complete setup guide

**Features:**
- Social logins
- Multi-factor authentication
- Organization management
- Pre-built UI components

**Use Cases:**
- User authentication
- B2B applications
- Team management

**[View Setup Guide →](./auth-providers/clerk/setup.md)**

---

### Auth0
**Difficulty:** Intermediate | **Platform:** Cross-platform | **Setup Time:** 1-2 hours

Enterprise authentication platform.

**Files:**
- `auth-providers/auth0/setup.md` - Setup guide

**Features:**
- Universal authentication
- Enterprise SSO
- Passwordless login

**[View Setup Guide →](./auth-providers/auth0/setup.md)**

---

## Storage & CDN

### AWS S3
**Difficulty:** Advanced | **Platform:** Cross-platform | **Setup Time:** 2-3 hours

Scalable object storage with global CDN.

**Files:**
- `storage/aws-s3/setup.md` - Complete setup guide

**Features:**
- Unlimited storage
- CloudFront CDN
- Lifecycle policies
- Presigned URLs

**Use Cases:**
- Large file storage
- Media hosting
- Backup and archival

**[View Setup Guide →](./storage/aws-s3/setup.md)**

---

### Cloudflare R2
**Difficulty:** Advanced | **Platform:** Cross-platform | **Setup Time:** 2-3 hours

S3-compatible storage without egress fees.

**Files:**
- `storage/cloudflare-r2/setup.md` - Setup guide

**Features:**
- Zero egress fees
- S3 compatibility
- Global distribution

**[View Setup Guide →](./storage/cloudflare-r2/setup.md)**

---

## Email Services

### SendGrid
**Difficulty:** Beginner | **Platform:** Server-side | **Setup Time:** 30 minutes

Reliable email delivery service.

**Files:**
- `email/sendgrid/setup.md` - Setup guide

**Features:**
- Transactional emails
- Email templates
- Delivery analytics
- Webhooks

**Use Cases:**
- Welcome emails
- Password resets
- Notifications

**[View Setup Guide →](./email/sendgrid/setup.md)**

---

### Resend
**Difficulty:** Beginner | **Platform:** Server-side | **Setup Time:** 30 minutes

Modern email API with React templates.

**Files:**
- `email/resend/setup.md` - Setup guide

**Features:**
- React Email templates
- Simple API
- High deliverability

**[View Setup Guide →](./email/resend/setup.md)**

---

## SMS & Voice

### Twilio
**Difficulty:** Beginner | **Platform:** Server-side | **Setup Time:** 30 minutes

SMS and voice messaging platform.

**Files:**
- `sms/twilio/setup.md` - Setup guide

**Features:**
- SMS messaging
- Voice calls
- WhatsApp messaging
- Verification codes

**Use Cases:**
- OTP verification
- SMS notifications
- Voice calls

**[View Setup Guide →](./sms/twilio/setup.md)**

---

### Vonage
**Difficulty:** Beginner | **Platform:** Server-side | **Setup Time:** 30 minutes

Global communications platform.

**Files:**
- `sms/vonage/setup.md` - Setup guide

**Features:**
- SMS messaging
- Voice API
- Video API

**[View Setup Guide →](./sms/vonage/setup.md)**

---

## Maps & Location

### Google Maps
**Difficulty:** Intermediate | **Platform:** iOS, Android | **Setup Time:** 1-2 hours

Interactive maps and location services.

**Files:**
- `maps/google-maps/setup.md` - Setup guide

**Features:**
- Interactive maps
- Place search
- Directions
- Geocoding

**Use Cases:**
- Location-based apps
- Delivery tracking
- Store locators

**[View Setup Guide →](./maps/google-maps/setup.md)**

---

### Mapbox
**Difficulty:** Intermediate | **Platform:** Cross-platform | **Setup Time:** 1-2 hours

Customizable maps and navigation.

**Files:**
- `maps/mapbox/setup.md` - Setup guide

**Features:**
- Custom map styles
- Turn-by-turn navigation
- Offline maps

**[View Setup Guide →](./maps/mapbox/setup.md)**

---

## AI & Machine Learning

### OpenAI
**Difficulty:** Beginner | **Platform:** Server-side | **Setup Time:** 30 minutes

GPT models and embeddings.

**Files:**
- `ai/openai/setup.md` - Setup guide

**Features:**
- GPT-4 chat completions
- Text embeddings
- Function calling
- Vision capabilities

**Use Cases:**
- AI chat assistants
- Content generation
- Semantic search

**[View Setup Guide →](./ai/openai/setup.md)**

---

### Anthropic Claude
**Difficulty:** Beginner | **Platform:** Server-side | **Setup Time:** 30 minutes

Advanced language models with long context.

**Files:**
- `ai/anthropic/setup.md` - Setup guide

**Features:**
- Claude 3.5 Sonnet
- 200K+ token context
- Vision capabilities
- Function calling

**[View Setup Guide →](./ai/anthropic/setup.md)**

---

### Replicate
**Difficulty:** Intermediate | **Platform:** Server-side | **Setup Time:** 1 hour

Run AI models via API.

**Files:**
- `ai/replicate/setup.md` - Setup guide

**Features:**
- Image generation
- Model library
- Custom models

**[View Setup Guide →](./ai/replicate/setup.md)**

---

## Beginner Friendly

Perfect for getting started with integrations.

1. **PostHog** - Analytics and feature flags
2. **Mixpanel** - Product analytics
3. **Amplitude** - Behavioral analytics
4. **SendGrid** - Email delivery
5. **Resend** - Modern email API
6. **Twilio** - SMS messaging
7. **Vonage** - Communications
8. **OpenAI** - AI chat
9. **Anthropic** - Claude AI

**Estimated Total Setup Time:** 3-4 hours for all

---

## Intermediate

Require some configuration but well-documented.

1. **Stripe** - Payment processing
2. **RevenueCat** - In-app purchases
3. **Clerk** - User management
4. **Auth0** - Authentication
5. **Google Maps** - Maps and location
6. **Mapbox** - Custom maps
7. **Replicate** - AI models

**Estimated Total Setup Time:** 10-12 hours for all

---

## Advanced

Complex integrations requiring multiple components.

1. **AWS S3** - Object storage with CloudFront
2. **Cloudflare R2** - S3-compatible storage

**Estimated Total Setup Time:** 4-6 hours for all

---

## iOS Only

Integrations that work exclusively or best on iOS.

- None currently (all are cross-platform or server-side)

---

## Android Only

Integrations that work exclusively or best on Android.

- None currently (all are cross-platform or server-side)

---

## Cross-Platform

Work on iOS, Android, and/or Web.

**All integrations support cross-platform development**

Notable mentions:
- **PostHog** - Full cross-platform including Web
- **Stripe** - Mobile + Web checkout
- **Clerk** - Unified auth across platforms

---

## Integration Patterns

### Edge Function Pattern

Most integrations follow this pattern:

```
Client (React Native)
    ↓
Supabase Edge Function
    ↓
Third-Party API
    ↓
Response to Client
```

**Benefits:**
- API keys stay secure
- Server-side validation
- Easier testing
- Better error handling

### Direct SDK Pattern

Some integrations use native SDKs:

```
Client (React Native)
    ↓
Native SDK
    ↓
Third-Party API
```

**Use cases:**
- Real-time features (maps, analytics)
- Payment UI (Stripe checkout)
- Auth flows (OAuth)

### Webhook Pattern

For event-driven integrations:

```
Third-Party Service
    ↓
Webhook to Edge Function
    ↓
Process Event
    ↓
Update Supabase Database
```

**Examples:**
- Stripe payment events
- SendGrid delivery events
- RevenueCat subscription changes

---

## Cost Estimation

### Free Tier Apps

Services with generous free tiers:

- **PostHog**: Self-hosted (unlimited) or Cloud (1M events/month)
- **Supabase**: 500MB database, 1GB storage, 2GB bandwidth
- **Resend**: 3,000 emails/month
- **OpenAI**: Pay-as-you-go (start at $5)

**Estimated Monthly Cost:** $0-10

### Small Apps (1K-10K users)

- **Analytics**: PostHog Cloud ($0-25)
- **Payments**: Stripe (2.9% + $0.30 per transaction)
- **Database**: Supabase Pro ($25)
- **Storage**: S3 or R2 ($5-10)
- **Email**: SendGrid ($15)
- **SMS**: Twilio ($10-50)

**Estimated Monthly Cost:** $50-150

### Growing Apps (10K-100K users)

- **Analytics**: Mixpanel or Amplitude ($100-300)
- **Payments**: Stripe (transaction fees)
- **Database**: Supabase Team ($599)
- **Storage**: S3/R2 ($50-100)
- **Email**: SendGrid ($90)
- **AI**: OpenAI ($50-200)

**Estimated Monthly Cost:** $500-1,500

---

## Security Best Practices

### API Key Management

✅ **DO:**
- Store API keys in Supabase secrets
- Use Edge Functions for server-side calls
- Rotate keys regularly
- Use different keys for dev/prod

❌ **DON'T:**
- Hardcode API keys in client code
- Commit keys to Git
- Share keys across environments
- Use production keys in development

### Data Privacy

✅ **DO:**
- Implement RLS policies
- Validate all inputs
- Sanitize user data
- Log security events
- Encrypt sensitive data

❌ **DON'T:**
- Trust client data
- Log sensitive information
- Store unnecessary data
- Skip input validation

### Rate Limiting

Implement rate limiting for all integrations:

```typescript
// Example rate limiting in Edge Function
const userRequests = await redis.incr(`rate:${userId}`);
if (userRequests > 100) {
  return new Response('Rate limit exceeded', { status: 429 });
}
await redis.expire(`rate:${userId}`, 3600);
```

---

## Testing

### Test Modes

Most services provide test/sandbox modes:

- **Stripe**: Test cards and keys
- **Twilio**: Test phone numbers
- **SendGrid**: Test emails
- **OpenAI**: Playground testing

### Integration Testing

```typescript
// Example integration test
describe('Stripe Payment', () => {
  it('should create payment intent', async () => {
    const result = await createPaymentIntent({
      amount: 1000,
      currency: 'usd',
    });

    expect(result.client_secret).toBeDefined();
  });
});
```

---

## Troubleshooting

### Common Issues

1. **API Key Errors**
   - Verify key is correct
   - Check key permissions
   - Ensure correct environment

2. **CORS Errors**
   - Use Edge Functions for server-side calls
   - Don't call APIs directly from client

3. **Rate Limiting**
   - Implement caching
   - Add request throttling
   - Use webhooks instead of polling

4. **Webhook Failures**
   - Verify signature validation
   - Check endpoint URL
   - Test with service's webhook tester

---

## Getting Help

- **Documentation**: Check each integration's setup guide
- **GitHub Issues**: Search existing issues
- **Discord**: [Join our community](https://discord.gg/yourserver)
- **GitHub Discussions**: Ask questions

---

## Contributing

Want to add a new integration?

1. Read [MARKETPLACE.md](../../MARKETPLACE.md)
2. Use [Integration Proposal Template](../../.github/ISSUE_TEMPLATE/integration-proposal.yml)
3. Follow the integration template structure
4. Submit PR for review

---

## What's Next?

### Coming Soon

- **Sentry** - Error tracking
- **Segment** - Customer data platform
- **Algolia** - Search as a service
- **Firebase** - Migration guide
- **AWS Amplify** - Migration guide

### Requested Integrations

Vote on or request new integrations in [GitHub Discussions](https://github.com/yourorg/mobile-app-blueprint/discussions).

---

## Resources

- [Main README](../README.md)
- [MARKETPLACE.md](../../MARKETPLACE.md)
- [SHOWCASE.md](../../SHOWCASE.md)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Expo Documentation](https://docs.expo.dev)

---

**Last Updated:** 2026-02-07
**Total Integrations:** 20+
**Community Contributors:** 50+
