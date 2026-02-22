# Social Sharing (Open Graph & Twitter Cards)

When someone shares your link on social media, these meta tags control how it appears. Without them, platforms show a generic preview or nothing at all.

## Open Graph Tags

Used by Facebook, LinkedIn, Discord, Slack, and most platforms.

### Required Tags

```html
<meta property="og:title" content="Page Title">
<meta property="og:description" content="Page description (keep under 200 chars)">
<meta property="og:image" content="https://[YOUR-DOMAIN].com/og-image.jpg">
<meta property="og:url" content="https://[YOUR-DOMAIN].com/page">
<meta property="og:type" content="website">
```

### Additional Tags

```html
<meta property="og:site_name" content="[YOUR-BUSINESS]">
<meta property="og:locale" content="en_US">
```

## Twitter Cards

X (Twitter) uses its own card tags, falling back to Open Graph if not present.

### Summary Card (Default)

```html
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="Page Title">
<meta name="twitter:description" content="Page description">
<meta name="twitter:image" content="https://[YOUR-DOMAIN].com/twitter-image.jpg">
```

### Large Image Card (Recommended)

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Page Title">
<meta name="twitter:description" content="Page description">
<meta name="twitter:image" content="https://[YOUR-DOMAIN].com/twitter-image.jpg">
<meta name="twitter:site" content="@[YOUR-HANDLE]">
```

## Image Requirements

| Platform | Recommended Size | Min Size | Max Size |
|----------|------------------|----------|----------|
| Open Graph | 1200 x 630 px | 600 x 315 px | - |
| Twitter | 1200 x 628 px | 300 x 157 px | 5 MB |
| LinkedIn | 1200 x 627 px | 200 x 200 px | - |

### Best Practices

- **Format**: JPG or PNG (no animated GIFs)
- **Aspect ratio**: 1.91:1 (landscape)
- **Safe zone**: Keep important content in center 60%
- **File size**: Under 1 MB for fast loading, max 5 MB

### Create a Default Image

Design one "default" social image for pages without specific images:
- Include your logo
- Brand colors
- Tagline or value proposition

## React Implementation

```tsx
// src/components/SocialMeta.tsx
import { Helmet } from 'react-helmet-async';

interface SocialMetaProps {
  title: string;
  description: string;
  image?: string;
  url: string;
  type?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
}

export function SocialMeta({
  title,
  description,
  image = '/default-og-image.jpg',
  url,
  type = 'website',
  twitterCard = 'summary_large_image',
}: SocialMetaProps) {
  const siteUrl = 'https://[YOUR-DOMAIN].com';
  const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;
  const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;

  return (
    <Helmet>
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="[YOUR-BUSINESS]" />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:site" content="@[YOUR-HANDLE]" />
    </Helmet>
  );
}
```

### Usage

```tsx
function ProductPage({ product }) {
  return (
    <>
      <SocialMeta
        title={product.name}
        description={product.description}
        image={product.image}
        url={`/products/${product.slug}`}
        type="website"
      />
      {/* Page content */}
    </>
  );
}
```

## Content Guidelines

### Titles

- Keep under 60 characters
- Front-load important words
- Don't duplicate site name (it's in og:site_name)

**Good**: "Premium Running Shoes for Marathon Training"

**Bad**: "[Brand] | Buy Running Shoes | Best Deals | Free Shipping"

### Descriptions

- Keep under 200 characters (Twitter truncates at ~200)
- Include a call to action or value proposition
- Don't repeat the title

**Good**: "Train like a pro with our lightweight, cushioned running shoes. Free returns and 30-day trial."

**Bad**: "Welcome to our website where we sell running shoes..."

## Testing Tools

| Tool | URL | Notes |
|------|-----|-------|
| Facebook Sharing Debugger | https://developers.facebook.com/tools/debug/ | Full preview and cache clearing |
| Twitter Card Validator | https://cards-dev.twitter.com/validator | **Preview removed** - only domain submission/cache debug. Use Tweet Composer in X for previews |
| LinkedIn Post Inspector | https://www.linkedin.com/post-inspector/ | Full preview, OG image 1200x627px |
| OpenGraph.xyz | https://www.opengraph.xyz/ | Best universal preview tool |

**Important**: These tools cache results. If you update your tags, use the tool's "Scrape Again" or "Fetch new scrape information" button.

## Platform-Specific Notes

### Facebook

- Will fetch og:image asynchronously
- Caches aggressively (use debugger to refresh)
- Requires images to be publicly accessible

### X (Twitter)

- Falls back to Open Graph if Twitter tags missing (`twitter:` prefix still works)
- Large image card gets more engagement
- Caches for ~7 days
- **Critical**: Posts with external links receive a **30-50% algorithmic reach reduction**. Non-Premium accounts posting links see essentially zero median engagement (as of March 2025). Consider this when planning social strategy.

### LinkedIn

- Uses Open Graph tags
- Very slow to update cached previews
- Post Inspector can force refresh
- **Note**: Organic posts with external links now display as small **128x72px thumbnails** on desktop (not full-width) - LinkedIn's effort to keep users on-platform

### Discord/Slack

- Uses Open Graph tags
- Updates quickly
- Displays image prominently

## Dynamic OG Images

For pages with dynamic content (products, profiles), generate custom OG images:

### Options

1. **Pre-generate at build**: Create images for each page during build
2. **On-demand generation**: Use Vercel OG or similar to generate at request time
3. **Template-based**: Overlay dynamic text on a base template

### Vercel OG (If Using Vercel)

```tsx
// For Next.js App Router - use bundled import:
// import { ImageResponse } from 'next/og';

// For standalone/Pages Router projects:
// api/og.tsx
import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'Default Title';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          color: '#fff',
          fontSize: 60,
        }}
      >
        {title}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

Use as:
```html
<meta property="og:image" content="https://[YOUR-DOMAIN].com/api/og?title=Page%20Title">
```

## Checklist

- [ ] Default OG image created (1200x630)
- [ ] og:title, og:description, og:image on all pages
- [ ] twitter:card set to summary_large_image
- [ ] Tested with Facebook Debugger
- [ ] Tested with Twitter Card Validator
- [ ] Dynamic pages have dynamic images/descriptions

## Resources

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
