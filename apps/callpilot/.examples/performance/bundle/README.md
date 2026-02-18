# Bundle Optimization Guide

## Overview

Bundle optimization is critical for mobile app performance. A smaller bundle means faster downloads, quicker app launches, and better user experience. This guide covers proven strategies to minimize your React Native + Expo app bundle size.

## Performance Targets

| Platform | Target Size | Maximum Size | Notes |
|----------|-------------|--------------|-------|
| iOS | <4MB | 5MB | Apple prefers smaller bundles for cellular downloads |
| Android | <2.5MB | 3MB | Google Play enforces size limits for instant apps |
| Web | <1MB | 2MB | Critical for SEO and user retention |

**Bundle size is measured after compression (gzip/brotli)**

## Quick Wins

### 1. Enable Hermes Engine

Hermes reduces bundle size by 30-50% and improves startup time.

```json
// app.json
{
  "expo": {
    "jsEngine": "hermes",
    "android": {
      "enableProguard": true,
      "enableShrinkResources": true
    }
  }
}
```

**Impact:** ~40% bundle size reduction, 2x faster startup

### 2. Remove console.log in Production

```javascript
// metro.config.js
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    compress: {
      drop_console: true,
    },
  },
}
```

**Impact:** ~5-10% bundle size reduction

### 3. Use Production Builds

```bash
# Development builds include debugging tools
expo start

# Production builds are optimized
eas build --profile production
```

**Impact:** ~50% bundle size reduction vs development

## Code Splitting Strategies

### Dynamic Imports

Split large features into separate chunks that load on demand.

```typescript
// ❌ Static import - always loaded
import { ComplexChart } from '@/components/ComplexChart'

// ✅ Dynamic import - loaded when needed
const ComplexChart = lazy(() => import('@/components/ComplexChart'))

function AnalyticsScreen() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ComplexChart data={data} />
    </Suspense>
  )
}
```

**When to use:**
- Large visualization libraries (charts, maps)
- Admin/settings screens (rarely accessed)
- Heavy image processing libraries
- PDF viewers or document renderers

**Impact:** 10-30% reduction in initial bundle size

### Route-Based Code Splitting

Automatically split code by screen/route.

```typescript
// src/navigation/AppNavigator.tsx
import { lazy } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

// Lazy load screens
const HomeScreen = lazy(() => import('@/screens/home-screen'))
const ProfileScreen = lazy(() => import('@/screens/profile-screen'))
const SettingsScreen = lazy(() => import('@/screens/settings-screen'))

const Stack = createNativeStackNavigator()

export function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ lazy: true }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ lazy: true }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ lazy: true }}
      />
    </Stack.Navigator>
  )
}
```

**Impact:** Each screen becomes a separate chunk, reducing initial load by 20-40%

### Conditional Loading

Load platform-specific or feature-flagged code only when needed.

```typescript
// src/utils/platformLoader.ts
import { Platform } from 'react-native'

export async function loadPlatformSpecific() {
  if (Platform.OS === 'ios') {
    return await import('./ios/iosSpecific')
  } else if (Platform.OS === 'android') {
    return await import('./android/androidSpecific')
  } else {
    return await import('./web/webSpecific')
  }
}

// Usage
const platformModule = await loadPlatformSpecific()
platformModule.doSomething()
```

**Impact:** Eliminates dead code for other platforms (10-20% reduction)

## Tree Shaking Configuration

Tree shaking removes unused code from your bundle. Configure Metro bundler for optimal tree shaking.

### Metro Configuration

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config')

module.exports = (() => {
  const config = getDefaultConfig(__dirname)

  config.transformer = {
    ...config.transformer,
    // Enable minification
    minifierPath: 'metro-minify-terser',
    minifierConfig: {
      // Remove unused code
      ecma: 8,
      keep_classnames: false,
      keep_fnames: false,

      // Aggressive mangling
      mangle: {
        toplevel: true,
        keep_fnames: false,
      },

      // Aggressive compression
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        reduce_funcs: true,
        collapse_vars: true,
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_proto: true,
      },

      // Optimize output
      output: {
        comments: false,
        ascii_only: true,
      },
    },
  }

  return config
})()
```

**Impact:** 15-25% bundle size reduction

### Import Best Practices

```typescript
// ❌ Imports entire library (500KB)
import _ from 'lodash'
const result = _.map(array, fn)

// ✅ Import only what you need (5KB)
import map from 'lodash/map'
const result = map(array, fn)

// ❌ Imports entire icon library (2MB)
import { MaterialIcons } from '@expo/vector-icons'

// ✅ Import specific icon
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
```

**Common libraries to optimize:**

| Library | Full Size | Optimized Import | Savings |
|---------|-----------|------------------|---------|
| lodash | 500KB | `lodash/map` | 99% |
| moment | 300KB | `dayjs` (alternative) | 90% |
| @expo/vector-icons | 2MB | Specific icon sets | 95% |
| react-native-paper | 400KB | Component-level imports | 80% |

### Package.json Optimization

```json
{
  "sideEffects": false,
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./package.json": "./package.json"
  }
}
```

## Bundle Analyzer Setup

Visualize your bundle to identify optimization opportunities.

### Installation

```bash
npm install --save-dev metro-visualizer
```

### Usage

```bash
# Generate bundle analysis
npx expo export --platform ios --output-dir dist
npx metro-visualizer dist/bundles/ios-*.js

# Opens interactive visualization in browser
```

### What to Look For

1. **Large Dependencies** - Libraries >100KB
2. **Duplicate Code** - Same code in multiple chunks
3. **Unused Code** - Dead code that wasn't tree-shaken
4. **Large Assets** - Images, fonts that could be optimized

### Example Analysis

```
Bundle Size: 3.2MB (uncompressed), 1.1MB (gzipped)

Top Dependencies:
1. react-native (800KB) - Core framework (can't reduce)
2. @react-navigation (250KB) - Navigation library (necessary)
3. lodash (450KB) ⚠️ - Use individual imports
4. moment (320KB) ⚠️ - Replace with dayjs (2KB)
5. react-native-paper (380KB) ⚠️ - Use component imports

Recommendations:
- Replace lodash with individual imports: -440KB
- Replace moment with dayjs: -318KB
- Optimize react-native-paper imports: -300KB
Total potential savings: 1.06MB (33% reduction)
```

## Image Optimization

Images typically account for 40-60% of app size.

### Use WebP Format

```typescript
// src/components/OptimizedImage.tsx
import { Image } from 'expo-image'
import { Platform } from 'react-native'

interface OptimizedImageProps {
  source: string
  width: number
  height: number
  alt?: string
}

export function OptimizedImage({ source, width, height, alt }: OptimizedImageProps) {
  // Expo Image automatically uses WebP when available
  return (
    <Image
      source={{ uri: source }}
      style={{ width, height }}
      contentFit="cover"
      transition={200}
      placeholder={require('@/assets/placeholder.png')}
      alt={alt}
    />
  )
}
```

**Impact:** WebP reduces image size by 25-35% vs PNG/JPEG

### Responsive Images

Load appropriate image size for device.

```typescript
// src/utils/responsiveImage.ts
import { PixelRatio, Platform } from 'react-native'

export function getResponsiveImageUrl(baseUrl: string, width: number): string {
  const scale = PixelRatio.get()
  const scaledWidth = Math.round(width * scale)

  // Use Cloudflare Images or similar CDN
  return `${baseUrl}?width=${scaledWidth}&format=webp&quality=80`
}

// Usage
const imageUrl = getResponsiveImageUrl('https://cdn.example.com/photo.jpg', 300)
```

**Impact:** 50-70% reduction in image data transfer

### Asset Optimization Pipeline

```bash
# Install optimization tools
npm install --save-dev sharp imagemin-webp

# Create optimization script
# scripts/optimize-images.js
```

```javascript
const fs = require('fs').promises
const path = require('path')
const sharp = require('sharp')

async function optimizeImage(inputPath, outputPath) {
  const image = sharp(inputPath)
  const metadata = await image.metadata()

  // Convert to WebP with quality optimization
  await image
    .webp({ quality: 80, effort: 6 })
    .toFile(outputPath)

  const inputStats = await fs.stat(inputPath)
  const outputStats = await fs.stat(outputPath)
  const savings = ((inputStats.size - outputStats.size) / inputStats.size * 100).toFixed(1)

  console.log(`Optimized ${path.basename(inputPath)}: ${savings}% reduction`)
}

async function optimizeAllImages() {
  const assetsDir = path.join(__dirname, '../assets/images')
  const files = await fs.readdir(assetsDir)

  for (const file of files) {
    if (file.match(/\.(png|jpg|jpeg)$/i)) {
      const inputPath = path.join(assetsDir, file)
      const outputPath = inputPath.replace(/\.(png|jpg|jpeg)$/i, '.webp')
      await optimizeImage(inputPath, outputPath)
    }
  }
}

optimizeAllImages()
```

```json
// package.json
{
  "scripts": {
    "optimize:images": "node scripts/optimize-images.js"
  }
}
```

**Impact:** 40-60% reduction in asset size

### Image Best Practices

| Scenario | Format | Quality | Max Size |
|----------|--------|---------|----------|
| Photos | WebP | 80 | 200KB |
| Icons | SVG | - | 10KB |
| Logos | SVG/WebP | 90 | 50KB |
| Backgrounds | WebP | 70 | 150KB |
| Avatars | WebP | 85 | 30KB |

## Font Optimization

Fonts can add 100-500KB to your bundle.

### Subset Fonts

Only include characters you need.

```bash
# Install font subsetting tool
npm install --save-dev glyphhanger

# Subset a font to Latin characters only
glyphhanger --subset=assets/fonts/Roboto-Regular.ttf \
  --formats=woff2 \
  --whitelist=U+0020-007F
```

**Impact:** 70-90% reduction in font file size

### System Fonts First

Use system fonts when possible.

```typescript
// src/theme/typography.ts
import { Platform } from 'react-native'

export const fontFamilies = {
  // Use system fonts (0KB)
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),

  // Only load custom fonts for headings
  heading: 'Inter-Bold', // Load only bold variant
}
```

**Impact:** Eliminates 200-400KB of font files

### Preload Critical Fonts

```typescript
// App.tsx
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'

SplashScreen.preventAutoHideAsync()

export function App() {
  const [fontsLoaded] = useFonts({
    'Inter-Bold': require('./assets/fonts/Inter-Bold.woff2'),
  })

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return <AppContent />
}
```

### Font Loading Strategy

1. **Critical fonts** - Load immediately (Inter-Bold for headings)
2. **System fonts** - Use native fonts (0KB)
3. **Optional fonts** - Lazy load or skip (decorative fonts)

**Impact:** 300-400KB reduction in initial bundle

## Remove Unused Dependencies

Audit and remove dependencies you're not using.

### Dependency Audit

```bash
# Find unused dependencies
npm install -g depcheck
depcheck

# Output example:
# Unused dependencies
# * moment (should be replaced with dayjs)
# * lodash (use individual imports)
# * react-native-vector-icons (use @expo/vector-icons)

# Remove unused dependencies
npm uninstall moment lodash react-native-vector-icons
```

### Replace Heavy Dependencies

| Heavy Library | Lightweight Alternative | Size Savings |
|---------------|------------------------|--------------|
| moment | dayjs | 318KB → 2KB (99%) |
| lodash | native JS / lodash-es | 500KB → 50KB (90%) |
| axios | fetch API | 100KB → 0KB (100%) |
| react-native-vector-icons | @expo/vector-icons (subset) | 2MB → 200KB (90%) |
| uuid | expo-crypto | 50KB → 0KB (100%) |

### Example Migration: Moment to DayJS

```typescript
// ❌ Before (moment - 320KB)
import moment from 'moment'

const formattedDate = moment(date).format('YYYY-MM-DD')
const isToday = moment(date).isSame(moment(), 'day')
const daysAgo = moment().diff(date, 'days')

// ✅ After (dayjs - 2KB)
import dayjs from 'dayjs'

const formattedDate = dayjs(date).format('YYYY-MM-DD')
const isToday = dayjs(date).isSame(dayjs(), 'day')
const daysAgo = dayjs().diff(date, 'day')
```

**Impact:** 318KB reduction (99% smaller)

### Example Migration: Lodash to Native JS

```typescript
// ❌ Before (lodash - 500KB)
import _ from 'lodash'

const mapped = _.map(array, item => item.name)
const filtered = _.filter(array, item => item.active)
const grouped = _.groupBy(array, 'category')

// ✅ After (native JS - 0KB)
const mapped = array.map(item => item.name)
const filtered = array.filter(item => item.active)
const grouped = array.reduce((acc, item) => {
  const key = item.category
  if (!acc[key]) acc[key] = []
  acc[key].push(item)
  return acc
}, {})
```

**Impact:** 500KB reduction (100% smaller)

## Metro Bundler Advanced Configuration

### Full Optimized Configuration

See `metro.config.js` in this directory for the complete configuration.

### Key Optimization Features

1. **Minification** - Remove whitespace, shorten variable names
2. **Dead Code Elimination** - Remove unused functions
3. **Constant Folding** - Evaluate constant expressions at build time
4. **Inline Functions** - Inline small functions to reduce call overhead
5. **Scope Hoisting** - Reduce bundle size by merging modules

### Source Maps

```javascript
// metro.config.js
config.serializer = {
  ...config.serializer,
  createModuleIdFactory: () => (path) => {
    // Use relative paths for smaller source maps
    return path.replace(__dirname, '.')
  },
}
```

**Production builds:** Disable source maps or upload to error tracking service

```json
// app.json
{
  "expo": {
    "android": {
      "enableProguardInReleaseBuilds": true
    },
    "ios": {
      "buildNumber": "1.0.0"
    }
  }
}
```

## Hermes Optimization

Hermes is a JavaScript engine optimized for React Native.

### Enable Hermes

```json
// app.json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

### Hermes Benefits

1. **Smaller Bundle Size** - 30-50% reduction
2. **Faster Startup** - 2x faster app launch
3. **Lower Memory Usage** - 50% less memory
4. **Better Performance** - Optimized for mobile

### Hermes Bytecode

```bash
# Build with Hermes bytecode
eas build --profile production --platform android

# Bundle size comparison:
# Without Hermes: 4.2MB
# With Hermes: 2.1MB (50% reduction)
```

### Hermes Profiling

```bash
# Profile Hermes performance
npx react-native profile-hermes

# Analyze bottlenecks
# - Function call times
# - Memory allocations
# - Garbage collection
```

## App Configuration Optimization

### Expo Config

```javascript
// app.config.js
export default {
  expo: {
    jsEngine: 'hermes',

    // Asset compression
    assetBundlePatterns: [
      'assets/images/**/*',
      'assets/fonts/**/*',
    ],

    // iOS optimizations
    ios: {
      bundleIdentifier: 'com.example.app',
      buildNumber: '1.0.0',
      // Enable bitcode for smaller binary
      bitcode: 'Release',
    },

    // Android optimizations
    android: {
      package: 'com.example.app',
      versionCode: 1,
      // Enable ProGuard
      enableProguard: true,
      // Enable resource shrinking
      enableShrinkResources: true,
      // Enable multidex if needed
      enableMultiDex: true,
    },

    // Web optimizations
    web: {
      bundler: 'metro',
      output: 'static',
    },

    // Plugin optimizations
    plugins: [
      [
        'expo-image',
        {
          // Enable WebP support
          enableWebP: true,
        },
      ],
    ],
  },
}
```

### Code Obfuscation

```json
// app.json
{
  "expo": {
    "android": {
      "enableProguard": true
    }
  }
}
```

Create `android/app/proguard-rules.pro`:

```
# Keep React Native classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Keep Expo classes
-keep class expo.modules.** { *; }

# Optimize aggressively
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification
```

**Impact:** Reduces Android APK by 20-30%

## Expected Bundle Size Results

### Before Optimization

```
iOS: 6.8MB (uncompressed), 2.4MB (compressed)
Android: 8.2MB (uncompressed), 3.1MB (compressed)
Web: 3.5MB (uncompressed), 1.2MB (compressed)
```

### After Optimization

```
iOS: 3.2MB (uncompressed), 1.1MB (compressed) ✅ 54% reduction
Android: 2.8MB (uncompressed), 0.9MB (compressed) ✅ 71% reduction
Web: 1.4MB (uncompressed), 0.5MB (compressed) ✅ 58% reduction
```

### Per-Platform Breakdown

#### iOS Bundle Analysis

```
Core Framework: 800KB (25%)
App Code: 600KB (19%)
Dependencies: 1,200KB (38%)
Assets (images): 400KB (13%)
Assets (fonts): 200KB (5%)
Total: 3.2MB
```

#### Android Bundle Analysis

```
Core Framework: 700KB (25%)
App Code: 550KB (20%)
Dependencies: 1,000KB (36%)
Assets (images): 350KB (13%)
Assets (fonts): 200KB (7%)
Total: 2.8MB
```

## Optimization Checklist

Use this checklist to ensure you've applied all optimizations:

### Build Configuration

- [ ] Hermes engine enabled
- [ ] Production build mode
- [ ] ProGuard enabled (Android)
- [ ] Bitcode enabled (iOS)
- [ ] Source maps disabled or externalized
- [ ] console.log statements removed

### Code Splitting

- [ ] Dynamic imports for large features
- [ ] Route-based code splitting
- [ ] Platform-specific code split
- [ ] Feature flags for conditional loading

### Dependencies

- [ ] Removed unused dependencies
- [ ] Replaced heavy libraries with alternatives
- [ ] Using individual imports (lodash, icons)
- [ ] Audited with depcheck

### Assets

- [ ] Images converted to WebP
- [ ] Images optimized and compressed
- [ ] Responsive image loading
- [ ] Fonts subsetted to required characters
- [ ] Using system fonts where possible

### Metro Configuration

- [ ] Minification enabled
- [ ] Dead code elimination enabled
- [ ] Tree shaking configured
- [ ] Aggressive compression settings

### Testing

- [ ] Bundle size measured with analyzer
- [ ] Performance tested on low-end devices
- [ ] App startup time <2s
- [ ] Network transfer <5MB

## Performance Monitoring

### Track Bundle Size Over Time

```javascript
// scripts/track-bundle-size.js
const fs = require('fs')
const { execSync } = require('child_process')

function trackBundleSize() {
  // Build production bundle
  execSync('expo export --platform ios --output-dir dist')

  // Get bundle size
  const bundlePath = 'dist/bundles/ios-main.js'
  const stats = fs.statSync(bundlePath)
  const sizeKB = (stats.size / 1024).toFixed(2)

  // Log to file
  const log = {
    date: new Date().toISOString(),
    size: sizeKB,
    platform: 'ios',
  }

  fs.appendFileSync(
    'bundle-size-history.json',
    JSON.stringify(log) + '\n'
  )

  console.log(`Bundle size: ${sizeKB}KB`)

  // Alert if size increased significantly
  if (sizeKB > 3500) {
    console.error('❌ Bundle size exceeded target (3.5MB)')
    process.exit(1)
  }
}

trackBundleSize()
```

Add to CI/CD:

```yaml
# .github/workflows/bundle-size.yml
name: Bundle Size Check

on: [pull_request]

jobs:
  check-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: node scripts/track-bundle-size.js
      - name: Comment PR
        uses: actions/github-script@v5
        with:
          script: |
            // Post bundle size to PR comments
```

## Advanced Techniques

### Code Elimination

```typescript
// Use environment variables for dead code elimination
if (__DEV__) {
  // This code is completely removed in production
  console.log('Development mode')
}

// Use feature flags
if (process.env.EXPO_PUBLIC_FEATURE_ANALYTICS === 'true') {
  // Analytics code only included if feature is enabled
  import('./analytics').then(m => m.initialize())
}
```

### Module Federation

Share code between multiple micro-frontends.

```javascript
// Only applicable for large-scale apps with multiple teams
// Consider if app size >10MB
```

### Custom Transformers

```javascript
// metro.config.js
const svgTransformer = require('react-native-svg-transformer')

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
}

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter(ext => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
}
```

## Troubleshooting

### Bundle Size Still Large

1. Run bundle analyzer to identify culprits
2. Check for duplicate dependencies (`npm ls [package]`)
3. Verify tree shaking is working (check minified output)
4. Look for unused imports (use ESLint plugin)

### Hermes Issues

```bash
# Clean build
npx expo start --clear

# Rebuild native modules
npx expo prebuild --clean
```

### Source Map Errors

```javascript
// metro.config.js - Disable source maps in production
config.serializer = {
  ...config.serializer,
  createModuleIdFactory: createModuleIdFactory,
  processModuleFilter: (module) => {
    // Exclude source maps in production
    if (module.path.includes('node_modules')) {
      return !module.path.includes('.map')
    }
    return true
  },
}
```

## Resources

- [Expo Bundle Size Optimization](https://docs.expo.dev/guides/optimizing-updates/)
- [Metro Bundler Configuration](https://facebook.github.io/metro/docs/configuration)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Hermes Documentation](https://hermesengine.dev/)
- [WebP Image Format](https://developers.google.com/speed/webp)

## Next Steps

1. Implement bundle analyzer in your project
2. Set up automated bundle size tracking in CI/CD
3. Configure Metro bundler with optimizations
4. Optimize images and fonts
5. Review and optimize dependencies
6. Enable Hermes engine
7. Test on physical devices

**Remember:** Every KB counts in mobile apps. Small optimizations add up to significant improvements in user experience.
