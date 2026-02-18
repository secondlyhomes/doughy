# Performance Optimization Implementation Guide

## Overview

This guide provides a step-by-step approach to implementing performance optimizations in your React Native + Expo app. Follow this guide to achieve 3-10x performance improvements systematically.

## Before You Start

### Prerequisites

- [ ] Node.js 18+ installed
- [ ] React Native + Expo project set up
- [ ] Git for version control
- [ ] Physical test devices (iOS + Android)

### Measure Baseline

Before optimizing, establish your baseline metrics:

```bash
# Run performance tests
npm test -- performance.test.ts

# Measure bundle size
npx expo export --platform ios
npx expo export --platform android

# Profile app
npx react-native profile-hermes

# Analyze bundle
npx metro-visualizer dist/bundles/*.js
```

**Record these metrics:**
- Bundle size (iOS/Android)
- App startup time
- Screen load time
- List scroll FPS
- Memory usage
- Network request count
- Cache hit rate

## Phase 1: Quick Wins (Day 1-2)

### 1.1 Enable Hermes Engine (5 minutes)

**File:** `app.json`

```json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

**Expected result:**
- 40% smaller bundle
- 2x faster startup

**Test:**
```bash
npx expo start --clear
# Verify "Hermes" appears in dev menu
```

### 1.2 Optimize Metro Configuration (10 minutes)

**File:** `metro.config.js`

```bash
# Copy optimized config
cp .examples/performance/bundle/metro.config.js metro.config.js

# Install dependencies
npm install --save-dev metro-minify-terser
```

**Expected result:**
- 15-25% smaller bundle
- Better tree shaking

**Test:**
```bash
npx expo export --platform ios
# Compare bundle size before/after
```

### 1.3 Optimize App Configuration (10 minutes)

**File:** `app.config.js`

```bash
# Copy optimized config
cp .examples/performance/bundle/app.config.js app.config.js

# Install plugins
npx expo install expo-build-properties expo-image expo-font
```

**Expected result:**
- 20-30% smaller final app
- ProGuard optimization (Android)
- Bitcode optimization (iOS)

**Test:**
```bash
eas build --profile production --platform all
# Compare APK/IPA sizes
```

### 1.4 Replace FlatList with FlashList (30 minutes per list)

**Step 1:** Install FlashList

```bash
npm install @shopify/flash-list
```

**Step 2:** Update imports

```tsx
// Before
import { FlatList } from 'react-native'

// After
import { FlashList } from '@shopify/flash-list'
```

**Step 3:** Add required props

```tsx
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={60} // Add this
  getItemType={getItemType} // Add for heterogeneous lists
/>
```

**Expected result:**
- 10x faster scrolling
- 50% less memory

**Test:**
```bash
# Scroll through list with 1000+ items
# Check FPS in dev menu (should be 60fps)
```

### 1.5 Use expo-image for Images (15 minutes)

**Step 1:** Install expo-image

```bash
npx expo install expo-image
```

**Step 2:** Replace Image imports

```tsx
// Before
import { Image } from 'react-native'

// After
import { Image } from 'expo-image'
```

**Step 3:** Add optimization props

```tsx
<Image
  source={{ uri: imageUrl }}
  style={{ width: 300, height: 200 }}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
  placeholder={blurhash} // Optional
/>
```

**Expected result:**
- 40% faster image loading
- 30% less memory
- WebP support

**Test:**
```bash
# Load screen with 10+ images
# Should load faster and smoother
```

### Phase 1 Summary

**Time investment:** 1-2 hours

**Expected improvements:**
- 50-70% smaller bundle
- 2-3x faster startup
- 10x faster list scrolling
- 40% faster image loading

**Verification:**

```bash
npm test -- performance.test.ts
```

All Phase 1 metrics should pass.

## Phase 2: Runtime Optimization (Day 3-5)

### 2.1 Implement Component Memoization (2 hours)

**Identify candidates:** Components that:
- Render frequently (list items, buttons)
- Have expensive renders
- Receive props that rarely change

**Step 1:** Wrap with memo

```tsx
// Before
export function ListItem({ item }) {
  return <View>...</View>
}

// After
export const ListItem = memo(function ListItem({ item }) {
  return <View>...</View>
})
```

**Step 2:** Optimize props

```tsx
// ❌ Bad - inline function
<ListItem onPress={() => handlePress(item.id)} />

// ✅ Good - stable function
const handlePress = useCallback((id) => {...}, [])
<ListItem onPress={handlePress} />
```

**Step 3:** Use useMemo for derived data

```tsx
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.value - b.value)
}, [data])
```

**Expected result:**
- 70-90% reduction in re-renders
- Smoother UI

**Test:**

Enable "Highlight Updates" in React DevTools and verify fewer flashes.

### 2.2 Implement Lazy Loading (3 hours)

**Step 1:** Lazy load screens

```tsx
// Before
import SettingsScreen from './screens/settings-screen'

// After
import { lazyScreen } from '@/components/LazyScreen'
const SettingsScreen = lazyScreen(() => import('./screens/settings-screen'))
```

**Step 2:** Lazy load images

```tsx
import { LazyImage } from '@/components/LazyImage'

<LazyImage
  source={{ uri: imageUrl }}
  blurhash="LGF5]+Yk^6#M@-5c,1J5@[or[Q6."
  width={300}
  height={200}
/>
```

**Step 3:** Preload strategically

```tsx
function HomeScreen() {
  // Preload next likely screen
  usePreloadScreen(() => import('./screens/profile-screen'))
}
```

**Expected result:**
- 30% faster initial load
- Better perceived performance

### 2.3 Add Performance Hooks (2 hours)

**Step 1:** Debounce search inputs

```tsx
import { useDebounce } from '@/hooks/useDebounce'

function SearchScreen() {
  const [searchText, setSearchText] = useState('')
  const debouncedSearch = useDebounce(searchText, 500)

  useEffect(() => {
    if (debouncedSearch) {
      searchAPI(debouncedSearch)
    }
  }, [debouncedSearch])
}
```

**Step 2:** Throttle scroll handlers

```tsx
import { useThrottledCallback } from '@/hooks/useThrottle'

const handleScroll = useThrottledCallback(
  (offset) => {
    updateScrollPosition(offset)
  },
  { interval: 100 }
)
```

**Step 3:** Memoize complex values

```tsx
import { useMemoizedObject } from '@/hooks/useMemoizedValue'

const config = useMemoizedObject({
  theme: theme,
  locale: locale,
  features: features,
})
```

**Expected result:**
- 90% reduction in unnecessary calls
- Smoother interactions

### Phase 2 Summary

**Time investment:** 1-2 days

**Expected improvements:**
- 70-90% fewer re-renders
- 30% faster initial load
- Smoother scrolling and interactions

## Phase 3: Network Optimization (Day 6-8)

### 3.1 Implement Caching (3 hours)

**Step 1:** Set up cache service

```tsx
import { CacheService } from '@/services/cacheService'

const cache = new CacheService({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxMemorySize: 10 * 1024 * 1024, // 10MB
})
```

**Step 2:** Use cache-first strategy

```tsx
import { cacheFirst } from '@/services/cacheService'

const user = await cacheFirst(
  'user:123',
  async () => fetchUser('123'),
  { ttl: 5 * 60 * 1000 }
)
```

**Step 3:** Invalidate on mutations

```tsx
async function updateUser(data) {
  await api.updateUser(data)
  await cache.invalidate('user:123')
}
```

**Expected result:**
- 80-95% reduction in network requests
- 90% faster data access
- Offline support

**Test:**

Monitor cache hit rate (should be >80%):

```tsx
const stats = cache.getStats()
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`)
```

### 3.2 Implement Request Batching (3 hours)

**Step 1:** Set up batcher

```tsx
import { RequestBatcher } from '@/services/requestBatcher'

const batcher = new RequestBatcher('https://api.example.com/graphql', {
  batchWindow: 10,
  maxBatchSize: 50,
})
```

**Step 2:** Batch screen load requests

```tsx
function ScreenWithBatching() {
  useEffect(() => {
    const loadData = async () => {
      const [user, posts, comments] = await Promise.all([
        batcher.add('query { user { id name } }'),
        batcher.add('query { posts { id title } }'),
        batcher.add('query { comments { id text } }'),
      ])
    }
    loadData()
  }, [])
}
```

**Expected result:**
- 80-90% reduction in HTTP overhead
- 70% faster screen load

**Test:**

Monitor network requests (should batch multiple into one).

### 3.3 Implement Retry Logic (2 hours)

**Step 1:** Wrap API calls with retry

```tsx
import { retryWithBackoff } from '@/services/retryService'

const data = await retryWithBackoff(
  async () => fetch('/api/data').then(r => r.json()),
  {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
  }
)
```

**Step 2:** Add offline queue

```tsx
import { offlineQueue } from '@/services/offlineQueue'

await offlineQueue.add(async () => {
  await api.updatePost(postId, data)
})
```

**Expected result:**
- 95% success rate on flaky networks
- Better reliability

### 3.4 Add Optimistic Updates (2 hours)

**Step 1:** Implement for common actions

```tsx
import { useOptimisticUpdate } from '@/hooks/useOptimisticUpdate'

function LikeButton({ postId, initialLiked }) {
  const [state, setLiked] = useOptimisticUpdate(initialLiked, {
    updateFn: async (liked) => {
      await api.likePost(postId, liked)
    },
  })

  return (
    <Button onPress={() => setLiked(!state.value)}>
      {state.value ? '❤️' : '🤍'}
    </Button>
  )
}
```

**Expected result:**
- Instant UI feedback
- Better perceived performance

### Phase 3 Summary

**Time investment:** 2-3 days

**Expected improvements:**
- 80-95% fewer network requests
- 90% faster cached data access
- 95% request success rate
- Instant UI feedback

## Phase 4: Testing & Monitoring (Day 9-10)

### 4.1 Set Up Performance Tests (3 hours)

**Step 1:** Copy test suite

```bash
cp .examples/performance/testing/performance.test.ts __tests__/
```

**Step 2:** Configure CI/CD

```yaml
# .github/workflows/performance.yml
name: Performance Tests
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test -- performance.test.ts
```

**Step 3:** Run tests

```bash
npm test -- performance.test.ts
```

### 4.2 Add Performance Monitoring (3 hours)

**Step 1:** Track key metrics

```tsx
import { PerformanceMonitor } from '@/utils/performanceMonitor'

const monitor = new PerformanceMonitor()

// Track screen loads
monitor.trackScreenLoad('HomeScreen')

// Track API calls
monitor.trackAPICall('/api/users', duration)

// Track FPS
monitor.trackFPS(fps)
```

**Step 2:** Set up reporting

```tsx
// Report weekly
const report = monitor.getReport()
sendToAnalytics(report)
```

### 4.3 Test on Real Devices (4 hours)

**Test matrix:**

| Device | Network | Tests |
|--------|---------|-------|
| iPhone 14 Pro | WiFi | All features |
| iPhone SE | 4G | Critical flows |
| iPhone 8 | 3G | Core functionality |
| Pixel 7 Pro | WiFi | All features |
| Budget Android | 3G | Core functionality |

**Test scenarios:**
- Cold app start
- Warm app start
- Screen navigation
- List scrolling
- Image loading
- Form submission
- Offline mode

### Phase 4 Summary

**Time investment:** 1 day

**Deliverables:**
- Automated performance tests
- Performance monitoring
- Device test results
- Performance baseline

## Verification Checklist

### Bundle Size

- [ ] iOS bundle <5MB
- [ ] Android bundle <3MB
- [ ] Hermes enabled
- [ ] ProGuard enabled (Android)
- [ ] Source maps externalized

### Runtime Performance

- [ ] App starts in <2s
- [ ] Screen loads in <300ms
- [ ] List scrolls at 60fps
- [ ] Memory usage <150MB
- [ ] No memory leaks

### Network Performance

- [ ] API response <200ms (P50)
- [ ] Cache hit rate >80%
- [ ] Failed requests <1%
- [ ] Retry success rate >95%

### Code Quality

- [ ] FlashList for all lists >20 items
- [ ] expo-image for all images
- [ ] Memoized list items
- [ ] No inline styles
- [ ] No console.log in production

### Testing

- [ ] All performance tests pass
- [ ] Tested on low-end devices
- [ ] Tested on slow networks
- [ ] Tested offline mode

## Troubleshooting

### Issue: Tests Failing

1. Check baseline metrics
2. Compare before/after
3. Identify regression
4. Fix and re-test

### Issue: No Performance Improvement

1. Profile with React DevTools
2. Check Metro bundler output
3. Verify optimizations applied
4. Test on physical device

### Issue: App Crashes on Low-End Device

1. Check memory usage
2. Reduce cache size
3. Optimize images
4. Test incrementally

## Next Steps

After completing all phases:

1. **Document results** - Record improvements
2. **Share learnings** - Update team
3. **Monitor continuously** - Track metrics
4. **Iterate** - Keep optimizing

## Resources

- [Bundle Optimization Guide](./bundle/README.md)
- [Runtime Optimization Guide](./runtime/README.md)
- [Network Optimization Guide](./network/README.md)
- [Performance Testing](./testing/performance.test.ts)

## Support

Need help?

1. Check specific optimization guides
2. Review examples in each directory
3. Search for error messages
4. Ask in project discussions

**Remember:** Performance optimization is iterative. Start with quick wins, measure results, and continue improving based on data.
