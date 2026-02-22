# SaaS / Software SEO Example

Complete SEO implementation for SaaS products and software applications.

## Schema Types

### WebApplication (For Browser-Based SaaS)

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "TaskFlow Pro",
  "description": "Project management software for remote teams. Track tasks, collaborate in real-time, and ship faster.",
  "url": "https://taskflowpro.com",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web browser",
  "browserRequirements": "Requires JavaScript. Works in Chrome, Firefox, Safari, Edge.",
  "offers": [
    {
      "@type": "Offer",
      "name": "Free",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Up to 5 users, 3 projects"
    },
    {
      "@type": "Offer",
      "name": "Pro",
      "price": "12",
      "priceCurrency": "USD",
      "description": "Unlimited users and projects, priority support"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "2847",
    "bestRating": "5"
  },
  "author": {
    "@type": "Organization",
    "name": "TaskFlow Inc.",
    "url": "https://taskflowpro.com"
  }
}
```

### SoftwareApplication (For Downloadable Software)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "TaskFlow Desktop",
  "description": "Native desktop app for TaskFlow Pro with offline support.",
  "url": "https://taskflowpro.com/download",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Windows 10+, macOS 12+",
  "downloadUrl": "https://taskflowpro.com/download",
  "softwareVersion": "2.4.1",
  "fileSize": "85MB",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

### Organization (Company Pages)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "TaskFlow Inc.",
  "description": "We build tools that help remote teams collaborate better.",
  "url": "https://taskflowpro.com",
  "logo": "https://taskflowpro.com/logo.png",
  "foundingDate": "2020",
  "founders": [
    {
      "@type": "Person",
      "name": "Jane Smith",
      "jobTitle": "CEO"
    }
  ],
  "sameAs": [
    "https://twitter.com/taskflowpro",
    "https://linkedin.com/company/taskflowpro",
    "https://github.com/taskflowpro"
  ]
}
```

## Directory Listings

### Priority 1 (Week 1)

| Directory | URL | Notes |
|-----------|-----|-------|
| G2 | g2.com | Most trusted B2B reviews |
| Capterra | capterra.com | Gartner-owned, high authority |
| Product Hunt | producthunt.com | Launch platform, backlinks |
| Google Business | business.google.com | Even for online-only businesses |

### Priority 2 (Week 2-3)

| Directory | URL | Notes |
|-----------|-----|-------|
| TrustRadius | trustradius.com | In-depth B2B reviews |
| GetApp | getapp.com | Gartner-owned |
| Software Advice | softwareadvice.com | Gartner-owned |
| Crozdesk | crozdesk.com | Software discovery |
| SaaSHub | saashub.com | SaaS directory |

### Priority 3 (Ongoing)

| Directory | URL | Notes |
|-----------|-----|-------|
| AlternativeTo | alternativeto.net | "Alternatives to X" searches |
| StackShare | stackshare.io | Developer tools |
| Slant | slant.co | Comparison site |
| GitHub Marketplace | github.com/marketplace | If applicable |

## Landing Page Structure

### Feature Pages

```
/features/
/features/task-management/
/features/real-time-collaboration/
/features/reporting/
```

### Use Case Pages

```
/use-cases/
/use-cases/remote-teams/
/use-cases/agencies/
/use-cases/startups/
```

### Comparison Pages

```
/compare/
/compare/taskflow-vs-asana/
/compare/taskflow-vs-monday/
```

### Integration Pages

```
/integrations/
/integrations/slack/
/integrations/google-workspace/
```

## Keyword Strategy

### Product Keywords

```
[product-type] software
best [product-type] tools
[product-type] for [audience]
free [product-type]
[product-type] pricing
```

### Comparison Keywords

```
[your-product] vs [competitor]
[competitor] alternative
[competitor] pricing
switch from [competitor]
```

### Problem Keywords

```
how to [solve problem]
[problem] for remote teams
improve [metric] with [product-type]
```

## SEO Component Example

```tsx
// pages/pricing.tsx
import { SEO } from '@/components/SEO';
import { SocialMeta } from '@/components/SocialMeta';
import { JsonLd } from '@/components/JsonLd';

export function PricingPage() {
  const plans = [
    { name: 'Free', price: 0, description: 'For individuals' },
    { name: 'Pro', price: 12, description: 'For small teams' },
    { name: 'Enterprise', price: null, description: 'Custom pricing' },
  ];

  return (
    <>
      <SEO
        title="Pricing"
        description="TaskFlow Pro pricing starts at $0/month. Free tier for up to 5 users. Pro plan at $12/user/month with unlimited features."
      />

      <SocialMeta
        title="TaskFlow Pro Pricing - Start Free"
        description="Simple, transparent pricing. Free tier available. Pro plan at $12/user/month."
        url="/pricing"
      />

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'TaskFlow Pro',
          url: 'https://taskflowpro.com',
          offers: plans
            .filter((p) => p.price !== null)
            .map((plan) => ({
              '@type': 'Offer',
              name: plan.name,
              price: plan.price,
              priceCurrency: 'USD',
              description: plan.description,
            })),
        }}
      />

      {/* Page content */}
    </>
  );
}
```

## Content Strategy

### Blog Topics

- How-to guides for your product category
- Industry trends and benchmarks
- Customer success stories
- Product updates and changelogs
- Comparison posts (honest, not just "we're better")

### Documentation as SEO

Your docs are SEO assets:
- Make them publicly accessible (not gated)
- Use descriptive page titles
- Include schema for HowTo content

### Changelog SEO

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "TaskFlow Pro 2.4 Release Notes",
  "datePublished": "2026-02-01",
  "author": {
    "@type": "Organization",
    "name": "TaskFlow Inc."
  }
}
```

## AI Search Optimization

SaaS products are frequently queried in AI assistants:
- "What's the best project management tool?"
- "Compare Asana vs Monday vs TaskFlow"
- "How much does TaskFlow cost?"

### Optimize For

1. Clear pricing information on pricing page
2. Feature comparison tables
3. FAQ schema on key pages
4. Customer review aggregation

## Review Strategy

### Where to Focus

1. G2 (most citations in AI responses)
2. Capterra
3. Product Hunt (for launches)

### How to Ask

- In-app prompts after positive interactions
- Email after 30/60/90 days of usage
- Support ticket follow-ups
- NPS survey follow-ups (promoters only)
