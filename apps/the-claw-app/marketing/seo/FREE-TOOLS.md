# Free SEO Tools

Every tool in this guide has a free tier sufficient for small-to-medium businesses.

## Core Monitoring Stack

### Google Search Console (Required)

**Cost**: Free, unlimited

Your SEO command center. Shows how Google sees your site.

**Setup**:
1. Go to https://search.google.com/search-console
2. Add property
3. Verify via DNS TXT record (covers all URLs under domain)

**Weekly checks**:
- Performance report: clicks, impressions, average position
- Pages report: indexing problems
- Core Web Vitals: pass/fail status

**Key features**:
- URL Inspection: test individual pages
- Sitemap submission
- Mobile usability issues
- Manual actions (penalties)

### Google Analytics / Alternatives

**Google Analytics 4** (Free, unlimited)
- Most powerful, but privacy concerns
- Complex setup

**Privacy-focused alternatives**:

| Tool | Type | Free Tier |
|------|------|-----------|
| [Matomo](https://matomo.org) | Self-hosted | Unlimited |
| [Umami](https://umami.is) | Self-hosted | Unlimited |
| [Plausible](https://plausible.io) | Cloud | $9/mo (no free) |
| [Fathom](https://usefathom.com) | Cloud | $15/mo (no free) |
| [Clicky](https://clicky.com) | Cloud | Limited free |

**Recommendation**: Umami (self-hosted) if you have technical ability, otherwise Google Analytics 4.

### Google Lighthouse

**Cost**: Free, built into Chrome

Performance, accessibility, and SEO auditing.

**How to use**:
1. Open Chrome DevTools (Right-click > Inspect)
2. Go to Lighthouse tab
3. Click "Analyze page load"

**Target scores**: 90+ across all categories

### Bing Webmaster Tools

**Cost**: Free

Secondary search engine, but powers DuckDuckGo, Yahoo, and AI assistants.

**Setup**: https://www.bing.com/webmasters

Can import settings from Google Search Console.

## Crawler & Audit Tools

### Screaming Frog SEO Spider

**Cost**: Free for up to 500 URLs

Desktop app that crawls your site like a search engine.

**Finds**:
- Broken links (404s)
- Missing meta tags
- Duplicate content
- Redirect chains
- Missing alt text

**Usage**: Run monthly on your entire site

**Download**: https://www.screamingfrog.co.uk/seo-spider/

### Ahrefs Webmaster Tools

**Cost**: Free for site owners

Limited version of Ahrefs focused on your own site.

**Features**:
- Backlink analysis
- Site audit
- Keyword rankings (limited)

**Setup**: https://ahrefs.com/webmaster-tools

## Keyword Research

### Google Keyword Planner

**Cost**: Free (requires Google Ads account, no spend required)

**Access**: ads.google.com > Tools > Keyword Planner

Best for:
- Search volume estimates
- Keyword suggestions
- Competition level

### Google Trends

**Cost**: Free, unlimited

**URL**: https://trends.google.com

Best for:
- Seasonal trends
- Comparing keywords
- Geographic interest
- Rising topics

### Answer Socrates

**Cost**: 3 free searches/day

**URL**: https://answersocrates.com

Best for:
- Question-based keywords
- "People also ask" data
- Content ideas

### Ubersuggest

**Cost**: 3 free searches/day

**URL**: https://neilpatel.com/ubersuggest/

Best for:
- Keyword suggestions
- Content ideas
- Competitor analysis

## Schema & Structured Data

### Google Rich Results Test

**Cost**: Free

**URL**: https://search.google.com/test/rich-results

Tests your structured data and shows preview of rich results.

### Schema.org Validator

**Cost**: Free

**URL**: https://validator.schema.org/

General schema validation (not Google-specific).

### Free Schema Generators

| Tool | URL |
|------|-----|
| TechnicalSEO.com | https://technicalseo.com/tools/schema-markup-generator/ |
| Schemantra | https://schemantra.com/ |
| Iloveschema | https://iloveschema.com/ |

## Social & Sharing

### OpenGraph.xyz

**Cost**: Free

**URL**: https://www.opengraph.xyz/

Preview and generate social meta tags.

### Facebook Sharing Debugger

**Cost**: Free

**URL**: https://developers.facebook.com/tools/debug/

See how Facebook reads your page, clear cache.

### Twitter Card Validator

**Cost**: Free

**URL**: https://cards-dev.twitter.com/validator

> **Note**: X removed preview functionality from this tool. It now only supports domain submission and cache debugging. To preview Twitter cards, use the Tweet Composer within X directly, or use OpenGraph.xyz as an alternative.

## Automation & Social

### Buffer

**Cost**: Free tier - 3 channels, 10 scheduled posts

Social media scheduling for sharing content.

**URL**: https://buffer.com

### IFTTT

**Cost**: Free tier - 5 applets, unlimited runs

Automation for social sharing (e.g., auto-share new blog posts).

**URL**: https://ifttt.com

**Alternative**: [n8n](https://n8n.io) - Open-source automation tool, self-hosted option available

### Make (Integromat)

**Cost**: Free tier - 1,000 operations/month

More complex automations for content workflows.

**URL**: https://www.make.com

## Speed & Performance

### Google PageSpeed Insights

**Cost**: Free

**URL**: https://pagespeed.web.dev/

Core Web Vitals, lab data, and improvement suggestions.

### WebPageTest

**Cost**: Free

**URL**: https://www.webpagetest.org/

Detailed performance analysis, filmstrip view, waterfall charts.

### GTmetrix

**Cost**: Free tier - 5 tests/month (reduced from daily)

**URL**: https://gtmetrix.com/

Performance analysis with historical tracking.

> **Note**: Free tier significantly reduced. Accounts inactive for 6+ months are deleted. Consider Google PageSpeed Insights (unlimited) as primary tool.

## AI Search Monitoring

### Am I Cited

**Cost**: Free tier available

Monitors AI citations across ChatGPT, Perplexity, Google AI Overviews, and Gemini.

**URL**: https://www.amicited.com

### Otterly.ai

**Cost**: From $29/month (Lite plan, 15 search prompts)

Tracks visibility in ChatGPT, Perplexity, Google AI Overviews. Free trial only, no permanent free tier.

### Answer Socrates LLM Brand Tracker

**Cost**: Included with Answer Socrates

New AI visibility tracking feature added to the keyword research tool.

### SEO Review Tools AI Brand Visibility

**Cost**: Free Chrome extension

Browser extension for checking AI brand visibility.

## Content & Readability

### Hemingway Editor

**Cost**: Free (web version) | Plus: $8.33-$12.50/mo

**URL**: https://hemingwayapp.com/

Checks readability, highlights complex sentences. Free tier still functions for basic analysis; Plus adds AI-powered rewriting.

### Grammarly

**Cost**: Free tier

Basic grammar and spelling checks.

## Tool Stack by Stage

### Getting Started (Week 1-2)

1. Google Search Console
2. Google Analytics 4 (or Umami)
3. Bing Webmaster Tools
4. Lighthouse (in Chrome)

### Building (Week 3-6)

5. Screaming Frog
6. Google Rich Results Test
7. Schema generator
8. OpenGraph.xyz

### Growing (Ongoing)

9. Keyword Planner / Trends
10. Answer Socrates
11. Buffer / IFTTT
12. Ahrefs Webmaster Tools

## Monthly Audit Checklist

- [ ] Google Search Console: Check for new issues
- [ ] Core Web Vitals: All pages passing
- [ ] Screaming Frog: Crawl for broken links
- [ ] Lighthouse: Spot-check 3-5 key pages
- [ ] Rich Results Test: Verify structured data
- [ ] Analytics: Traffic trends, top pages

## Resources

- [Google Search Central](https://developers.google.com/search)
- [Moz Beginner's Guide to SEO](https://moz.com/beginners-guide-to-seo)
- [Ahrefs Blog](https://ahrefs.com/blog/)
