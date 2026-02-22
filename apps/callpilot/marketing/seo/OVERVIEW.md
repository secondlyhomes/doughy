# SEO Strategy Overview

The complete SEO playbook for a React/Vite site — every tool free, prioritized by impact.

## The Problem

A React single-page application (SPA) built with Vite has a known SEO weakness: Google sees a mostly-blank page before JavaScript loads your content. Google does have a system to render JavaScript later, but pages sit in a queue that can take seconds to days. Worse, AI search tools (ChatGPT, Perplexity) cannot run JavaScript at all — they see a blank page. Bing can render JavaScript via its Chromium engine but does so less reliably at scale, and still recommends pre-rendering for JS-heavy sites.

With the right free tools, this is completely fixable.

## Priority Order

| Priority | Action | Impact | Doc |
|----------|--------|--------|-----|
| 1 | Merge subdomains into subdirectories | Highest | [Site Architecture](SITE-ARCHITECTURE.md) |
| 2 | Install pre-rendering so Google sees real HTML | High | [TECHNICAL-SEO](TECHNICAL-SEO.md) |
| 3 | Add proper page titles and descriptions | High | [TECHNICAL-SEO](TECHNICAL-SEO.md) |
| 4 | Set up Google Search Console and Business Profile | High | [LOCAL-SEO](LOCAL-SEO.md) |
| 5 | Add structured data markup | Medium | [STRUCTURED-DATA](STRUCTURED-DATA.md) |
| 6 | Build location/category landing pages | Medium | [LOCAL-SEO](LOCAL-SEO.md) |
| 7 | Automate content freshness | Medium | [CONTENT-STRATEGY](CONTENT-STRATEGY.md) |

## Total Cost

**$0.** Every tool, service, and automation in this playbook has a free tier sufficient for small-to-medium businesses.

## Time Investment

- **Initial setup:** ~5-10 hours across the first 8 weeks
- **Ongoing maintenance:** ~2-3 hours per month
- **ROI:** For any business where organic search drives leads, the return on this time investment is significant

## Implementation Timeline

See the [8-Week Action Plan](ACTION-PLAN.md) for the full implementation schedule.
