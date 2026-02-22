# Web & PWA Development Guide

**Last Updated:** 2026-02-05
**Expo SDK:** 55+ (React Native 0.83+)
**Status:** Fully Implemented

---

## Overview

Deploy your React Native app as a web app or Progressive Web App (PWA) using Expo Web. Run the same codebase on web, iOS, and Android!

**2026 Best Practices:**
- ✅ EAS Hosting recommended (best for Expo Router apps)
- ✅ Vercel viable alternative (good deployment protection)
- ✅ PWA manifest.json for installable web apps
- ✅ Disable PWA in development (Cache API complicates debugging)
- ✅ `Platform.OS === 'web'` for conditional rendering
- ✅ React Native Web handles styling automatically

---

## Quick Start (5 Minutes)

### Run Web Development Server

```bash
# Option 1: npm script (recommended)
npm run web

# Option 2: Expo CLI
npx expo start --web

# Option 3: Specific port
npx expo start --web --port 3000
```

Your app opens at `http://localhost:19006` (or custom port).

**Hot Reload:** Changes automatically refresh in browser (Fast Refresh).

---

## PWA Configuration

### Step 1: Update app.json

Add web configuration to your `app.json`:

```json
{
  "expo": {
    "name": "Your App",
    "slug": "your-app",
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-router",
        {
          "web": true
        }
      ]
    ]
  }
}
```

### Step 2: Create Manifest (PWA)

For installable PWA, create `public/manifest.json`:

```json
{
  "name": "Your App Name",
  "short_name": "YourApp",
  "description": "Your app description",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Step 3: Add Icons

Required PWA icons:
- `public/icon-192.png` (192x192)
- `public/icon-512.png` (512x512)
- `public/favicon.png` (48x48)

Generate from your app icon:
```bash
# Using ImageMagick
convert assets/icon.png -resize 192x192 public/icon-192.png
convert assets/icon.png -resize 512x512 public/icon-512.png
convert assets/icon.png -resize 48x48 public/favicon.png
```

---

## Platform-Specific Code

### Detect Platform

```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // Web-specific code
} else if (Platform.OS === 'ios') {
  // iOS-specific code
} else {
  // Android-specific code
}
```

### Conditional Rendering

```typescript
import { Platform, View, Text } from 'react-native';

export function MyComponent() {
  return (
    <View>
      {Platform.OS === 'web' ? (
        <Text>This is the web version</Text>
      ) : (
        <Text>This is the mobile version</Text>
      )}
    </View>
  );
}
```

### Platform-Specific Files

Use `.web.tsx` extension for web-specific files:

```
src/components/
├── Button.tsx          # Shared (all platforms)
├── Button.web.tsx      # Web-only override
└── Button.native.tsx   # iOS + Android override
```

Expo automatically picks the right file:
- **Web:** `Button.web.tsx` or `Button.tsx`
- **Mobile:** `Button.native.tsx` or `Button.tsx`

### Platform-Specific Imports

```typescript
// src/utils/storage.ts (default)
export const storage = {
  save: async (key: string, value: string) => {
    // Mobile: AsyncStorage
  },
};

// src/utils/storage.web.ts (web override)
export const storage = {
  save: async (key: string, value: string) => {
    // Web: localStorage
    localStorage.setItem(key, value);
  },
};

// Import works on all platforms
import { storage } from '@/utils/storage';
```

---

## Web-Specific Optimizations

### Code Splitting

```typescript
import React, { lazy, Suspense } from 'react';

// Lazy load heavy components (web only)
const HeavyChart = lazy(() => import('./HeavyChart'));

export function Dashboard() {
  return (
    <Suspense fallback={<Text>Loading chart...</Text>}>
      <HeavyChart />
    </Suspense>
  );
}
```

### Image Optimization

```typescript
import { Image, Platform } from 'react-native';

// Use WebP on web for smaller sizes
const imageSource = Platform.OS === 'web'
  ? require('./image.webp')
  : require('./image.png');

<Image source={imageSource} />
```

### Bundle Size

Check bundle size:
```bash
npx expo export --platform web
# Check dist/ folder size
```

Optimize:
- Remove unused dependencies
- Use code splitting for large components
- Lazy load routes (with Expo Router)
- Optimize images (WebP, compression)

### Performance Tips

1. **Use `react-native-web` optimizations:**
   - Styles are converted to CSS automatically
   - Native animations use CSS transitions

2. **Avoid heavy computations on render:**
   ```typescript
   // Bad
   const expensiveValue = heavyCalculation(data);

   // Good
   const expensiveValue = useMemo(() => heavyCalculation(data), [data]);
   ```

3. **Optimize list rendering:**
   ```typescript
   import { FlatList } from 'react-native';

   // FlatList automatically optimizes rendering
   <FlatList
     data={items}
     renderItem={({ item }) => <Item data={item} />}
     keyExtractor={(item) => item.id}
     removeClippedSubviews={Platform.OS !== 'web'} // Disable on web
   />
   ```

---

## Responsive Design

### Window Dimensions

```typescript
import { useWindowDimensions } from 'react-native';

export function ResponsiveComponent() {
  const { width, height } = useWindowDimensions();

  const isDesktop = width > 1024;
  const isTablet = width > 768 && width <= 1024;
  const isMobile = width <= 768;

  return (
    <View style={{ padding: isDesktop ? 40 : 20 }}>
      {isDesktop && <Sidebar />}
      <Content />
    </View>
  );
}
```

### Media Queries (Web Only)

```typescript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    padding: 20,
    ...(Platform.OS === 'web' && {
      '@media (min-width: 768px)': {
        padding: 40,
      },
    }),
  },
});
```

### Breakpoint Hook

```typescript
import { useWindowDimensions } from 'react-native';

export function useBreakpoint() {
  const { width } = useWindowDimensions();

  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isLargeDesktop: width >= 1440,
  };
}

// Usage
const { isDesktop, isMobile } = useBreakpoint();
```

---

## SEO Basics

### Meta Tags

Create `public/index.html` (for web build):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Your app description">
  <meta name="keywords" content="your, keywords, here">

  <!-- Open Graph (Facebook, LinkedIn) -->
  <meta property="og:title" content="Your App Name">
  <meta property="og:description" content="Your app description">
  <meta property="og:image" content="/og-image.png">
  <meta property="og:url" content="https://yourapp.com">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Your App Name">
  <meta name="twitter:description" content="Your app description">
  <meta name="twitter:image" content="/twitter-image.png">

  <title>Your App Name</title>
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" href="/favicon.png">
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

### Dynamic Titles

```typescript
import { Platform } from 'react-native';
import { useEffect } from 'react';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = title;
    }
  }, [title]);
}

// Usage in screens
export function ProfileScreen() {
  useDocumentTitle('Profile - Your App');
  // ...
}
```

---

## Deployment

### Option 1: EAS Hosting (Recommended for Expo Router)

**Why EAS Hosting:**
- Best integration with Expo Router
- Automatic deployment from EAS Build
- Static assets + API routes + server functions
- Custom domains + SSL included
- On-Demand plan (pay as you grow)

**Setup:**

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build for web
eas build --platform web

# Deploy (automatic after build)
# Or manually:
eas deploy
```

**Custom Domain:**
```bash
eas domain:add yourdomain.com
# Follow DNS instructions
```

### Option 2: Vercel

**Why Vercel:**
- Deployment Protection (secure previews)
- Automatic HTTPS
- Fast global CDN
- Free tier available

**Setup:**

1. **Create `vercel.json`:**
   ```json
   {
     "buildCommand": "npx expo export -p web",
     "outputDirectory": "dist",
     "devCommand": "npx expo start --web",
     "cleanUrls": true,
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/"
       }
     ]
   }
   ```

2. **Deploy:**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

3. **Auto-deploy from GitHub:**
   - Connect repository to Vercel
   - Auto-deploy on push to main

### Option 3: Netlify

**Setup:**

1. **Create `netlify.toml`:**
   ```toml
   [build]
     command = "npx expo export -p web"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy:**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod
   ```

### Option 4: Static Hosting (GitHub Pages, S3, etc.)

```bash
# Build static files
npx expo export --platform web

# Output in dist/ folder
# Upload dist/ to any static host
```

---

## Service Workers (Offline Support)

### Enable Service Worker

Update `app.json`:

```json
{
  "expo": {
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/favicon.png",
      "serviceWorker": {
        "enabled": true
      }
    }
  }
}
```

### Custom Service Worker

Create `public/service-worker.js`:

```javascript
// Cache name
const CACHE_NAME = 'your-app-v1';

// Files to cache
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/manifest.json',
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch from cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

**Disable in development:**
```typescript
if (process.env.NODE_ENV === 'production' && Platform.OS === 'web') {
  // Service worker only in production
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js');
  }
}
```

---

## Testing Web App

### Manual Testing

```bash
# Start dev server
npm run web

# Test in browsers:
# - Chrome
# - Firefox
# - Safari
# - Edge
```

### Responsive Testing

```
Chrome DevTools:
- Press F12
- Toggle device toolbar (Ctrl+Shift+M)
- Test different screen sizes
```

### PWA Testing

1. **Build production version:**
   ```bash
   npx expo export --platform web
   npx serve dist/
   ```

2. **Open in Chrome → DevTools → Application**
   - Check "Manifest" tab
   - Check "Service Workers" tab
   - Test "Add to Home Screen"

3. **Lighthouse Audit:**
   - DevTools → Lighthouse → Generate report
   - Check PWA score
   - Fix issues

---

## Troubleshooting

### "Module not found" on web

**Problem:** Package works on mobile but not web
- **Solution:** Check if package supports web (most don't)
- Use platform-specific imports or alternatives

### Styles look different on web

**Problem:** Styling doesn't match mobile
- **Solution:** React Native Web converts styles automatically
- Some properties don't translate (e.g., `elevation`)
- Use `Platform.OS === 'web'` for web-specific styles

### Images not loading

**Problem:** Images work on mobile but not web
- **Solution:** Use `require()` for local images, not string paths
- Web needs images in `public/` folder or imported

### Build fails with metro error

**Problem:** `npx expo export --platform web` fails
- **Solution:** Clear cache: `npx expo start --clear`
- Check all imports are valid for web
- Remove mobile-only dependencies from web code

### PWA not installable

**Problem:** "Add to Home Screen" not showing
- **Solution:** Need HTTPS (localhost ok for testing)
- Check manifest.json is valid
- Need 192px and 512px icons
- Need service worker registered

---

## Best Practices

### Development Workflow

1. **Develop on web first** (faster iteration)
2. **Test on mobile frequently** (catch platform differences)
3. **Use platform-specific files** for major differences
4. **Keep shared code simple** (works everywhere)

### Code Organization

```
src/
├── components/
│   ├── Button.tsx           # Shared component
│   ├── Button.web.tsx       # Web override
│   └── Button.native.tsx    # Mobile override
├── utils/
│   ├── storage.ts           # Default (mobile)
│   └── storage.web.ts       # Web override
└── styles/
    ├── tokens.ts            # Shared design tokens
    └── responsive.ts        # Breakpoint helpers
```

### Performance Checklist

- [ ] Code splitting for large components
- [ ] Lazy load routes (Expo Router)
- [ ] Optimize images (WebP, compression)
- [ ] Remove unused dependencies
- [ ] Use production build for testing
- [ ] Check bundle size (< 500KB initial)
- [ ] Test on slow 3G network
- [ ] Run Lighthouse audit (score > 90)

### Accessibility Checklist

- [ ] Semantic HTML (web) / accessibilityLabel (mobile)
- [ ] Keyboard navigation works
- [ ] Screen reader tested (VoiceOver, NVDA)
- [ ] Color contrast sufficient (WCAG AA)
- [ ] Touch targets 48x48pt minimum
- [ ] Forms have proper labels

---

## Resources

### Official Documentation
- [Expo Web Development](https://docs.expo.dev/workflow/web/)
- [Expo PWA Guide](https://docs.expo.dev/guides/progressive-web-apps/)
- [React Native Web](https://necolas.github.io/react-native-web/)
- [EAS Hosting](https://docs.expo.dev/eas/hosting/)

### Deployment Guides
- [Deploy to Vercel](https://vercel.com/guides/deploying-expo-with-vercel)
- [Deploy to Netlify](https://www.netlify.com/blog/2020/11/30/how-to-deploy-react-native-web-app-with-expo/)
- [Deploy to GitHub Pages](https://docs.expo.dev/distribution/publishing-websites/)

### Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [PWA Builder](https://www.pwabuilder.com/)
- [Responsive Design Checker](https://responsivedesignchecker.com/)

---

## Summary

**Quick Start:**
1. Run `npm run web` to start dev server
2. Add `web` config to app.json
3. Create PWA manifest.json
4. Deploy to EAS Hosting or Vercel

**Platform-Specific Code:**
- Use `Platform.OS === 'web'` conditionals
- Create `.web.tsx` files for web-specific components
- Use `useBreakpoint()` for responsive design

**Deployment Options:**
- **EAS Hosting:** Best for Expo Router apps
- **Vercel:** Great deployment protection, auto HTTPS
- **Netlify:** Simple static hosting
- **Others:** GitHub Pages, S3, any static host

**PWA Features:**
- Installable to home screen
- Offline support with service workers
- Native-like experience
- Push notifications (web)

Remember: Same codebase, three platforms! 🚀
