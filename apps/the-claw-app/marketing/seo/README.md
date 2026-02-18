# SEO Documentation

Make your website discoverable online with this comprehensive SEO toolkit.

## Overview

Everything you need to optimize your website for search engines, AI assistants, and social sharing.

## Quick Start

1. Review the [OVERVIEW.md](OVERVIEW.md) for priority order
2. Follow the [8-Week Action Plan](ACTION-PLAN.md)
3. Copy templates from `../templates/` to your project
4. Reference `../examples/` for your specific vertical

## Documentation

| Doc | Purpose |
|-----|---------|
| [OVERVIEW.md](OVERVIEW.md) | Strategy summary, priority order |
| [TECHNICAL-SEO.md](TECHNICAL-SEO.md) | Pre-rendering, sitemaps, React SPA setup |
| [STRUCTURED-DATA.md](STRUCTURED-DATA.md) | Schema.org markup by vertical |
| [LOCAL-SEO.md](LOCAL-SEO.md) | Google Business, directories, NAP |
| [CONTENT-STRATEGY.md](CONTENT-STRATEGY.md) | Automation, AI-assisted content |
| [PERFORMANCE.md](PERFORMANCE.md) | Core Web Vitals, images, mobile-first |
| [AI-SEARCH.md](AI-SEARCH.md) | ChatGPT/Perplexity optimization |
| [FREE-TOOLS.md](FREE-TOOLS.md) | Analytics, monitoring, automation |
| [SITE-ARCHITECTURE.md](SITE-ARCHITECTURE.md) | Subdomain consolidation, URL structure |
| [ACTION-PLAN.md](ACTION-PLAN.md) | 8-week implementation timeline |

**Social Sharing:** See [../social/SOCIAL-SHARING.md](../social/SOCIAL-SHARING.md) for Open Graph and Twitter Cards.

## Templates

Minimal starter components in `../templates/`:

- `seo-component.tsx` - Meta tags, title, canonical (React 19+)
- `json-ld-component.tsx` - Structured data injection
- `social-meta.tsx` - Open Graph and Twitter Cards
- `sitemap-config.ts` - Vite sitemap plugin configuration

## Examples by Vertical

Full implementations with detailed guidance in `../examples/`:

- [E-Commerce](../examples/ecommerce/) - Online stores, product catalogs
- [Local Business](../examples/local-business/) - Restaurants, fitness, retail
- [Professional Services](../examples/professional-services/) - Legal, accounting, consulting
- [Real Estate](../examples/real-estate/) - Listings, agents, neighborhoods
- [SaaS](../examples/saas/) - Software products, pricing pages

## Key Principles

1. **Pre-render for bots** - SPAs need static HTML for Google and AI crawlers
2. **Schema for understanding** - Structured data tells search engines exactly what your pages are
3. **Local for competition** - Small businesses win on hyper-local searches
4. **Fresh content wins** - Regular updates signal expertise and relevance
5. **Mobile-first always** - 100% of sites are now mobile-first indexed

## Cost

**$0** - Every tool and service in this guide has a free tier sufficient for small-to-medium businesses.
