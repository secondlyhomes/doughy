# Marketing Documentation

Comprehensive marketing package covering SEO, social media, email, analytics, and paid advertising.

> **Industry-Agnostic**: All docs use generic placeholders. Replace `[Your Brand]`, `[your-domain.com]`, etc. with your values.

## Quick Start

1. Start with [SEO Overview](seo/OVERVIEW.md) for strategy priorities
2. Follow the [8-Week Action Plan](seo/ACTION-PLAN.md) for implementation
3. Use [Templates](templates/) for ready-to-use React components
4. Customize [Examples](examples/) for your industry

---

## SEO

Core search engine optimization documentation.

| Doc | Purpose |
|-----|---------|
| [OVERVIEW.md](seo/OVERVIEW.md) | Strategy summary, priority order |
| [TECHNICAL-SEO.md](seo/TECHNICAL-SEO.md) | Pre-rendering, meta tags, sitemaps |
| [STRUCTURED-DATA.md](seo/STRUCTURED-DATA.md) | JSON-LD schema markup |
| [LOCAL-SEO.md](seo/LOCAL-SEO.md) | Google Business Profile, directories |
| [AI-SEARCH.md](seo/AI-SEARCH.md) | AEO/GEO, AI citation optimization |
| [PERFORMANCE.md](seo/PERFORMANCE.md) | Core Web Vitals, image/font optimization |
| [CONTENT-STRATEGY.md](seo/CONTENT-STRATEGY.md) | Content freshness, AI-assisted content |
| [FREE-TOOLS.md](seo/FREE-TOOLS.md) | Free monitoring and audit tools |
| [SITE-ARCHITECTURE.md](seo/SITE-ARCHITECTURE.md) | Subdomain consolidation, URL structure |
| [ACTION-PLAN.md](seo/ACTION-PLAN.md) | 8-week implementation timeline |

---

## Social Media

| Doc | Purpose |
|-----|---------|
| [README.md](social/README.md) | Social strategy overview |
| [SOCIAL-SHARING.md](social/SOCIAL-SHARING.md) | OG tags, Twitter Cards, dynamic images |

---

## Email Marketing

| Doc | Purpose |
|-----|---------|
| [README.md](email/README.md) | Email strategy (placeholder) |

---

## Analytics

| Doc | Purpose |
|-----|---------|
| [README.md](analytics/README.md) | Analytics setup (placeholder) |

---

## Paid Advertising

| Doc | Purpose |
|-----|---------|
| [README.md](ads/README.md) | PPC, display, retargeting (placeholder) |

---

## Templates

Ready-to-use React components (React 19+ with fallback for React 18).

| Template | Purpose |
|----------|---------|
| [seo-component.tsx](templates/seo-component.tsx) | Meta tags, title, canonical |
| [json-ld-component.tsx](templates/json-ld-component.tsx) | Structured data injection |
| [social-meta.tsx](templates/social-meta.tsx) | Open Graph, Twitter Cards |
| [sitemap-config.ts](templates/sitemap-config.ts) | Sitemap generation config |

### Usage

```tsx
import { SEO } from '@/marketing/templates/seo-component';
import { SocialMeta } from '@/marketing/templates/social-meta';
import { JsonLd } from '@/marketing/templates/json-ld-component';

export function ProductPage({ product }) {
  return (
    <>
      <SEO
        title={product.name}
        description={product.description}
        canonical={`https://your-domain.com/products/${product.slug}`}
      />
      <SocialMeta
        title={product.name}
        description={product.description}
        image={product.image}
        url={`/products/${product.slug}`}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.description,
        }}
      />
      {/* Page content */}
    </>
  );
}
```

---

## Examples

Industry-specific implementations with schema markup and directory listings.

| Vertical | Description |
|----------|-------------|
| [E-Commerce](examples/ecommerce/) | Online stores, product catalogs |
| [Local Business](examples/local-business/) | Restaurants, fitness, retail, services |
| [Professional Services](examples/professional-services/) | Legal, accounting, consulting |
| [Real Estate](examples/real-estate/) | Property listings, agents, brokerages |
| [SaaS](examples/saas/) | Software products, B2B services |

See [examples/README.md](examples/README.md) for usage guide.

---

## Placeholders Reference

Replace these throughout all docs:

| Placeholder | Replace With |
|-------------|--------------|
| `[Your Brand]` | Your company/brand name |
| `[your-domain.com]` | Your website domain |
| `[Your City]` | Primary city for local SEO |
| `[Your Region]` | State/region for local SEO |
| `[Your Industry]` | Your business vertical |
| `[PRIMARY_KEYWORD]` | Main target keyword |
| `[SECONDARY_KEYWORD]` | Supporting keywords |

---

## Implementation Priority

1. **Week 1-2**: Technical SEO foundation
   - Pre-rendering setup
   - Meta tag components
   - Sitemap generation

2. **Week 3-4**: Structured data
   - Organization schema
   - Product/Service schema
   - Breadcrumbs

3. **Week 5-6**: Local SEO (if applicable)
   - Google Business Profile
   - Directory listings
   - Local schema

4. **Week 7-8**: Content & monitoring
   - Content calendar
   - Analytics setup
   - Performance monitoring

See [ACTION-PLAN.md](seo/ACTION-PLAN.md) for detailed timeline.
