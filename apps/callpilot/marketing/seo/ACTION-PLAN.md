# 8-Week SEO Action Plan

Step-by-step implementation timeline. Total cost: $0.

## Weeks 1-2: Foundation

- [ ] Set up Google Search Console and verify domain (DNS TXT record)
- [ ] Claim Google Business Profile with optimized categories and description
- [ ] Add unique page titles/descriptions to every page (React 19+ has built-in `<title>`/`<meta>` hoisting; for React 18, use `react-helmet-async`)
- [ ] Install `vite-plugin-sitemap` and submit sitemap to Search Console
- [ ] Set up Bing Webmaster Tools
- [ ] Create master NAP document with exact formatting

**Docs:** [TECHNICAL-SEO](TECHNICAL-SEO.md), [LOCAL-SEO](LOCAL-SEO.md)

## Weeks 3-4: Technical SEO

- [ ] Set up pre-rendering (framework SSR/SSG preferred, or SEO4Ajax free tier for existing SPAs)
- [ ] Add JSON-LD structured data:
  - [ ] `Organization` on homepage
  - [ ] Product/service schemas on key pages (see [examples/](../examples/) for your vertical)
  - [ ] `FAQPage` on relevant pages
  - [ ] `BreadcrumbList` sitewide
- [ ] Run Lighthouse audits and fix any red/orange scores
- [ ] Validate structured data with Google Rich Results Test

**Docs:** [TECHNICAL-SEO](TECHNICAL-SEO.md), [STRUCTURED-DATA](STRUCTURED-DATA.md)

## Weeks 5-6: Local SEO

- [ ] Claim free directory listings (use exact NAP from master document):
  - [ ] Yelp
  - [ ] Bing Places
  - [ ] Apple Business Connect
  - [ ] Nextdoor Business
  - [ ] Facebook Business
  - [ ] Industry-specific directories (see [examples/](../examples/) for your vertical)
- [ ] Create location/category landing pages for Tier 1 areas
- [ ] Add FAQ sections to key pages

**Docs:** [LOCAL-SEO](LOCAL-SEO.md)

## Weeks 7-8: Automation and Content

- [ ] Plan and execute subdomain-to-subdirectory migration with 301 redirects (if applicable)
- [ ] Set up GitHub Actions for weekly content updates
- [ ] Connect free AI API (Groq) for content variation drafts
- [ ] Set up Buffer or IFTTT for social media automation
- [ ] Create content templates for blog posts and updates

**Docs:** [SITE-ARCHITECTURE](SITE-ARCHITECTURE.md), [CONTENT-STRATEGY](CONTENT-STRATEGY.md)

## Ongoing (Monthly)

| Task | Frequency |
|------|-----------|
| Add 1-2 location/category pages | Monthly |
| Update statistics and data | Quarterly |
| Solicit Google reviews | Monthly (target 2-4) |
| Monitor Search Console | Weekly |
| Run Lighthouse and Screaming Frog audits | Monthly |
| Post to Google Business Profile | Weekly |
| Refresh seasonal content | Quarterly |
| Review and respond to all Google reviews | As they come in |

## Success Metrics

Track these in Google Search Console:

| Metric | Baseline | 3-Month Target | 6-Month Target |
|--------|----------|-----------------|-----------------|
| Organic impressions | Record current | 2x | 5x |
| Organic clicks | Record current | 2x | 4x |
| Indexed pages | Record current | All pages indexed | All pages indexed |
| Average position | Record current | Improve by 10+ | Top 20 for target keywords |
| Google Business Profile views | Record current | 3x | 5x |

## Notes

- The subdomain migration (Weeks 7-8) may cause a brief 2-4 week ranking fluctuation — this is normal
- Full recovery plus improvement expected within 60-90 days of migration
- If framework-level SSR/SSG isn't feasible, use SEO4Ajax's free tier for pre-rendering
- All tools have been verified to have free tiers as of early 2026
