# Technical SEO for React SPAs

React single-page applications have a known SEO weakness: Google sees a mostly-blank page before JavaScript loads your content. This guide fixes that completely.

## The Problem

When someone visits your site:
1. Browser downloads React app
2. JavaScript executes
3. Content appears

When Google visits:
1. Sees nearly empty HTML
2. Queues page for JavaScript rendering (seconds to days)
3. May miss or misunderstand content

**ChatGPT and Perplexity cannot render JavaScript** - they see a blank page. Bing can render JavaScript via its Chromium engine (since October 2019) but does so less reliably at scale.

## Solution: Pre-Rendering

Generate static HTML for each page at build time. Google (and everyone else) sees real content immediately.

## Implementation Stack

### Modern Approach: Framework-Level SSR (Recommended)

For new projects, use a framework with built-in SSR/SSG:

| Framework | Best For | Notes |
|-----------|----------|-------|
| **Next.js** | Most React apps | SSR/SSG/ISR built-in, industry standard |
| **Astro** | Content sites | Zero-JS default, excellent for SEO |
| **Remix/React Router v7** | Data-heavy apps | Modern approach with server rendering |

React 19's stable Server Components make framework-level SSR even more compelling.

### For Existing SPAs: Managed Services

If migrating to a framework isn't practical:

| Service | Free Tier | Notes |
|---------|-----------|-------|
| **SEO4Ajax** | 1,000 pages, 2,500 snapshots/mo | No credit card required |
| **Prerender.io** | Limited | Intercepts bot requests, serves pre-rendered pages |

### Legacy: react-helmet-async

> **Note**: React 19 (December 2024) has built-in `<title>`, `<meta>`, and `<link>` hoisting - no library needed for basic cases. react-helmet-async still works for advanced use cases.

```bash
npm install react-helmet-async
```

**Setup:**

```tsx
// src/main.tsx
import { HelmetProvider } from 'react-helmet-async';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
```

**Usage:**

```tsx
// src/components/SEO.tsx
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
}

export function SEO({ title, description, canonical }: SEOProps) {
  const siteTitle = '[YOUR-BUSINESS]';
  const fullTitle = `${title} | ${siteTitle}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
    </Helmet>
  );
}
```

### Deprecated: Static Pre-rendering Libraries

> **Warning**: The following libraries are no longer recommended:
> - **react-snap**: Abandoned (last update 7 years ago), incompatible with React 18/19
> - **react-spa-prerender**: Essentially dead (last update 4 years ago)
>
> Use the framework-level or managed service approaches above instead.

### vite-plugin-sitemap (Required)

Automatically generates sitemap.xml at build time.

```bash
npm install --save-dev vite-plugin-sitemap
```

**vite.config.ts:**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import sitemap from 'vite-plugin-sitemap';

export default defineConfig({
  plugins: [
    react(),
    sitemap({
      hostname: 'https://[YOUR-DOMAIN].com',
      dynamicRoutes: [
        '/',
        '/about',
        '/pricing',
        '/contact',
        '/blog',
        // Add all your routes
      ],
    }),
  ],
});
```

### robots.txt

Create `public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://[YOUR-DOMAIN].com/sitemap.xml
```

## Page Title Best Practices

| Page Type | Title Format |
|-----------|-------------|
| Homepage | `[Your Brand] — [Your Service] in [Region]` |
| Product/Service | `[Product Name] in [City] — [Price] \| [Your Brand]` |
| Category | `[Category] in [City] — [Count] Available \| [Your Brand]` |
| Location | `[Service] in [Area], [State] \| [Your Brand]` |
| About | `About [Your Brand] — [Your Service] in [Region]` |

**Rules:**
- Keep titles under 60 characters (Google truncates beyond this)
- Put the most important keywords first
- Every page must have a unique title
- Include location and price where applicable

## Dynamic Routes

For pages with dynamic content (e.g., `/products/:id`):

**Option A: Build-time generation**

Fetch all IDs at build time and generate static pages:

```ts
// vite.config.ts
sitemap({
  hostname: 'https://[YOUR-DOMAIN].com',
  dynamicRoutes: async () => {
    const products = await fetchAllProductIds();
    return products.map(id => `/products/${id}`);
  },
})
```

**Option B: Runtime pre-rendering service**

Use SEO4Ajax (free tier: 1,000 pages, 2,500 snapshots/month) to intercept bot requests and serve pre-rendered pages.

## Verification

### Google Search Console

1. Go to URL Inspection
2. Enter a page URL
3. Click "Test Live URL"
4. Check "View Tested Page" > "Screenshot"
5. Verify your content is visible

### Manual Check

```bash
curl -A "Googlebot" https://[YOUR-DOMAIN].com/
```

Should return full HTML content, not just a shell.

## Common Issues

| Issue | Solution |
|-------|----------|
| Blank screenshot in Search Console | Pre-rendering not working; verify react-snap runs |
| "Discovered - currently not indexed" | Content too thin or duplicate; add unique content |
| Sitemap not found | Check robots.txt path; verify sitemap.xml exists in dist/ |
| Dynamic routes missing | Add them to vite-plugin-sitemap config |

## Hosting Considerations

### Vercel / Netlify (Recommended)

Both auto-detect SPAs and serve pre-rendered HTML to bots if configured correctly.

### Custom Server

Ensure your server returns the pre-rendered HTML files (not index.html) for matching routes.

## Resources

- [Google's JavaScript SEO Basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Next.js Documentation](https://nextjs.org/docs)
- [Astro Documentation](https://docs.astro.build)
- [react-helmet-async](https://github.com/staylor/react-helmet-async)
- [vite-plugin-sitemap](https://github.com/jbaubree/vite-plugin-sitemap)
- [SEO4Ajax](https://www.seo4ajax.com/)
