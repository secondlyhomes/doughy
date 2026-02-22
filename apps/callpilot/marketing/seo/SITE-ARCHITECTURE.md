# Site Architecture: Subdomain Consolidation

This is the single highest-impact structural SEO change you can make.

## The Problem

Having separate subdomains (e.g., `app.[your-domain.com]` and `blog.[your-domain.com]`) splits your website's authority into separate sites in Google's eyes:

- Every backlink to a subdomain does **nothing** to help your main domain rank
- Content on one subdomain is invisible to the others' SEO strength
- You're competing against yourself instead of building compound authority

## Industry Precedent

Major platforms consolidate related content under subdirectories:

| Platform | Structure |
|----------|-----------|
| Shopify | `shopify.com/blog`, `shopify.com/partners` |
| HubSpot | `hubspot.com/blog`, `hubspot.com/products` |
| Zillow | `zillow.com/research`, `zillow.com/agents` |
| Stripe | `stripe.com/docs`, `stripe.com/blog` |

Google's John Mueller: *"I would personally try to keep things together as much as possible. Use subdomains where things are really kind of slightly different."* Related services for the same audience belong together.

## Case Studies

| Company | Change | Result |
|---------|--------|--------|
| Salesforce | Blog subdomain → subdirectory | 2x traffic overnight |
| Monster.com | Subdomain consolidation | 116% visibility increase |
| Chubo Knives | Subdomain → subdirectory | 421% organic traffic growth |

The pattern is clear and consistent.

## Target URL Structure

| Current (subdomains) | Target (subdirectories) |
|----------------------|------------------------|
| `[your-domain.com]` | `[your-domain.com]/` |
| `blog.[your-domain.com]` | `[your-domain.com]/blog/` |
| `app.[your-domain.com]` | `[your-domain.com]/app/` |

## When to Migrate

Now is ideal if the site is newer and still building authority:

- Less existing SEO to disrupt
- Every future backlink and piece of content compounds on one domain
- The longer you wait, the more painful the migration

## Migration Steps

1. **Update React Router** to handle new routes in the main app
2. **Set up 301 redirects** from every old subdomain URL to its new subdirectory equivalent
3. **Update internal links** across all content and navigation
4. **Update Google Search Console** with the new URL structure
5. **Update all external listings** (Google Business Profile, directories, etc.)

## Expected Timeline

- **Weeks 1-2:** Brief ranking fluctuation (normal)
- **Days 60-90:** Full recovery plus improvement
- **Ongoing:** Compound authority gains from unified domain
