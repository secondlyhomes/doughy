# Performance & Core Web Vitals

Page speed is a ranking factor. Google measures three Core Web Vitals metrics, and 75% of your page visits must meet the "Good" threshold.

## Core Web Vitals Thresholds (2026)

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | <2.5s | 2.5-4s | >4s |
| **INP** (Interaction to Next Paint) | <200ms | 200-500ms | >500ms |
| **CLS** (Cumulative Layout Shift) | <0.1 | 0.1-0.25 | >0.25 |

### What They Measure

- **LCP**: How fast the main content loads (largest image or text block)
- **INP**: How quickly the page responds to user interactions
- **CLS**: How much the page shifts around while loading

## Measuring Performance

### Google Lighthouse

Built into Chrome DevTools:
1. Right-click > Inspect
2. Lighthouse tab
3. Click "Analyze page load"

Target: 90+ scores across all categories.

### Google PageSpeed Insights

https://pagespeed.web.dev/

Shows both lab data and real-world data from Chrome users.

### Google Search Console

Core Web Vitals report shows which pages pass/fail based on real user data.

## Image Optimization

Images are typically the largest files on a page and the biggest LCP opportunity.

### Format Selection

| Format | Use For | Compression |
|--------|---------|-------------|
| **AVIF** | All images (best) | ~50% smaller than JPEG |
| **WebP** | Fallback for AVIF | 25-34% smaller than JPEG |
| **JPEG** | Final fallback | Baseline |
| **PNG** | Transparency required | Larger files |
| **SVG** | Icons, logos | Vector, scalable |

### Picture Element (Multiple Formats)

```html
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="Description" width="800" height="600">
</picture>
```

### Lazy Loading

```html
<!-- Below-fold images -->
<img src="image.jpg" alt="..." loading="lazy">

<!-- Above-fold images (never lazy load) -->
<img src="hero.jpg" alt="..." fetchpriority="high">
```

**Never lazy-load above-fold images** - it hurts LCP.

### Sizing

Always specify width and height to prevent layout shift:

```html
<img src="image.jpg" alt="..." width="800" height="600">
```

Or use CSS aspect-ratio:

```css
.image-container {
  aspect-ratio: 16 / 9;
}
```

### Responsive Images

```html
<img
  src="image-800.jpg"
  srcset="
    image-400.jpg 400w,
    image-800.jpg 800w,
    image-1200.jpg 1200w
  "
  sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
  alt="Description"
>
```

### Build-Time Optimization

Use a build tool or CDN to automatically:
- Convert to WebP/AVIF
- Generate responsive sizes
- Compress without quality loss

**Vite plugins**: `vite-imagetools`, `vite-plugin-image-optimizer`

**CDNs with auto-optimization**: Cloudflare, bunny.net (formerly BunnyCDN, Bunny Optimizer $9.50/mo), imgix

## Mobile-First Optimization

Google uses mobile-first indexing for 100% of sites.

### Requirements

- [ ] Same content on mobile and desktop
- [ ] Responsive design (not separate mobile site)
- [ ] Touch-friendly buttons (min 48x48px)
- [ ] Readable text without zooming (16px+ base font)
- [ ] No horizontal scrolling
- [ ] Fast load on 3G/4G

### Don't Lazy-Load Primary Content

Google won't load content that requires user interaction (swipe, click, tap to reveal).

### Viewport Meta Tag

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

## JavaScript Optimization

### Code Splitting

Split your bundle so users only download what they need:

```tsx
// Lazy load routes
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Suspense>
  );
}
```

### Reduce Bundle Size

```bash
# Analyze bundle
npx vite-bundle-visualizer
```

Common culprits:
- Moment.js → use date-fns or dayjs
- Lodash → import specific functions
- Large icon libraries → use individual imports

### Defer Non-Critical JS

```html
<script src="analytics.js" defer></script>
```

## Font Optimization

### Use System Fonts (Fastest)

```css
/* Modern simplification - excellent browser support */
font-family: system-ui, sans-serif;

/* Or the longer fallback chain if needed */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### If Using Custom Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
```

- Use `display=swap` to prevent invisible text
- Limit to 2-3 weights
- Consider variable fonts for multiple weights

## Server Response Time

Target: <200ms server response

### Static Hosting (Fastest)

- Vercel
- Netlify
- Cloudflare Pages

All free for static sites with global CDN.

### API Response Times

- Use edge functions for latency-sensitive endpoints
- Cache API responses where possible
- Consider SWR or React Query for client-side caching

## Performance Checklist

### Critical

- [ ] LCP <2.5s
- [ ] INP <200ms
- [ ] CLS <0.1
- [ ] Lighthouse score 90+

### Images

- [ ] Use AVIF/WebP with JPEG fallback
- [ ] Lazy load below-fold images
- [ ] Set width/height on all images
- [ ] Use responsive srcset

### Code

- [ ] Code splitting for routes
- [ ] Bundle size analyzed
- [ ] No render-blocking JS

### Fonts

- [ ] Font display swap
- [ ] Preconnect to font origins
- [ ] Limit font weights

### Mobile

- [ ] Responsive design
- [ ] Touch targets 48px+
- [ ] No content behind interactions

## Resources

- [web.dev Core Web Vitals](https://web.dev/articles/vitals)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)
- [web.dev Performance](https://web.dev/learn/performance/)
