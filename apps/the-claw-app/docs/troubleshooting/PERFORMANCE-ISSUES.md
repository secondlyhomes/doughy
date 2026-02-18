# Performance Issues

Comprehensive guide to diagnosing and fixing performance problems in React Native apps.

## Table of Contents

1. [Slow Rendering](#slow-rendering)
2. [Memory Issues](#memory-issues)
3. [Bundle Size](#bundle-size)
4. [Network Performance](#network-performance)
5. [Animation Performance](#animation-performance)
6. [Profiling Tools](#profiling-tools)

---

## Slow Rendering

### Slow List Scrolling

**Symptoms:**
- List scrolling is janky
- Frame drops during scroll
- Slow to render new items

**Solutions:**

1. **Use FlatList, not ScrollView:**
```typescript
// Bad: Renders all items upfront
<ScrollView>
  {items.map(item => <Item key={item.id} {...item} />)}
</ScrollView>

// Good: Virtualizes list
<FlatList
  data={items}
  keyExtractor={item => item.id}
  renderItem={({ item }) => <Item {...item} />}
/>
```

2. **Optimize FlatList:**
```typescript
<FlatList
  data={items}
  keyExtractor={item => item.id}
  renderItem={renderItem}
  // Performance optimizations
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={5}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

3. **Memoize render function:**
```typescript
const renderItem = useCallback(({ item }) => (
  <MemoizedItem item={item} />
), [])

const MemoizedItem = React.memo(Item)
```

---

### Slow Screen Transitions

**Symptoms:**
- Navigation feels slow
- Screen takes time to appear
- White flash between screens

**Solutions:**

1. **Use InteractionManager:**
```typescript
import { InteractionManager } from 'react-native'

useEffect(() => {
  const task = InteractionManager.runAfterInteractions(() => {
    // Heavy operations after animation completes
    loadData()
  })

  return () => task.cancel()
}, [])
```

2. **Lazy load screens:**
```typescript
const TasksScreen = React.lazy(() => import('./screens/tasks-screen'))

<Stack.Screen name="Tasks">
  {() => (
    <Suspense fallback={<Loading />}>
      <TasksScreen />
    </Suspense>
  )}
</Stack.Screen>
```

3. **Optimize initial render:**
```typescript
// Don't do heavy work in render
function Screen() {
  const [data, setData] = useState(null)

  useEffect(() => {
    loadData().then(setData)
  }, [])

  if (!data) return <Loading />

  return <Content data={data} />
}
```

---

### Excessive Re-renders

**Symptoms:**
- Console shows many re-renders
- Components re-render unnecessarily
- Performance degrades over time

**Diagnosis:**

1. **Use React DevTools Profiler:**
```bash
# In Flipper or browser DevTools
# Record while using app
# Look for components re-rendering frequently
```

2. **Add console logs:**
```typescript
function MyComponent({ user }) {
  console.log('MyComponent render')
  return <View />
}
```

**Solutions:**

1. **Memoize components:**
```typescript
const MemoizedComponent = React.memo(MyComponent)

// Or with custom comparison
const MemoizedComponent = React.memo(MyComponent, (prev, next) => {
  return prev.id === next.id // Only re-render if id changes
})
```

2. **Memoize values:**
```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])
```

3. **Memoize callbacks:**
```typescript
const handlePress = useCallback(() => {
  doSomething(id)
}, [id])
```

4. **Split large components:**
```typescript
// Before: One large component
function ProfileScreen() {
  return (
    <>
      <Header />
      <Stats />
      <Posts />
      <Comments />
    </>
  )
}

// After: Smaller components that can re-render independently
function ProfileScreen() {
  return (
    <>
      <MemoizedHeader />
      <MemoizedStats />
      <MemoizedPosts />
      <MemoizedComments />
    </>
  )
}
```

---

## Memory Issues

### Memory Leaks

**Symptoms:**
- App slows down over time
- Memory usage keeps increasing
- Eventually crashes

**Common Causes:**

1. **Subscriptions not cleaned up:**
```typescript
// Bad
useEffect(() => {
  const subscription = subscribe()
  // Missing cleanup!
}, [])

// Good
useEffect(() => {
  const subscription = subscribe()
  return () => subscription.unsubscribe()
}, [])
```

2. **Event listeners not removed:**
```typescript
// Bad
useEffect(() => {
  BackHandler.addEventListener('hardwareBackPress', handler)
}, [])

// Good
useEffect(() => {
  const subscription = BackHandler.addEventListener('hardwareBackPress', handler)
  return () => subscription.remove()
}, [])
```

3. **Timers not cleared:**
```typescript
// Bad
useEffect(() => {
  setTimeout(() => doSomething(), 1000)
}, [])

// Good
useEffect(() => {
  const timer = setTimeout(() => doSomething(), 1000)
  return () => clearTimeout(timer)
}, [])
```

4. **Large images not released:**
```typescript
// Use expo-image for better memory management
import { Image } from 'expo-image'

<Image
  source={{ uri: imageUrl }}
  cachePolicy="memory-disk"
  contentFit="cover"
/>
```

---

### High Memory Usage

**Diagnosis:**

1. **Xcode Instruments (iOS):**
   - Xcode → Open Developer Tool → Instruments
   - Choose "Leaks" template
   - Profile your app

2. **Android Profiler:**
   - Android Studio → View → Tool Windows → Profiler
   - Select Memory
   - Look for growing memory over time

**Solutions:**

1. **Optimize images:**
```typescript
// Bad: Loading full-size images
<Image source={{ uri: highResUrl }} />

// Good: Load appropriate size
<Image
  source={{ uri: thumbnailUrl }}
  style={{ width: 100, height: 100 }}
/>
```

2. **Implement pagination:**
```typescript
// Don't load all data at once
const [page, setPage] = useState(1)
const [data, setData] = useState([])

const loadMore = async () => {
  const newData = await fetchPage(page)
  setData(prev => [...prev, ...newData])
  setPage(prev => prev + 1)
}
```

3. **Clear cache periodically:**
```typescript
import * as FileSystem from 'expo-file-system'

async function clearCache() {
  await FileSystem.deleteAsync(FileSystem.cacheDirectory, {
    idempotent: true
  })
}
```

---

## Bundle Size

### Large Bundle Size

**Diagnosis:**

```bash
# Analyze bundle
npx react-native-bundle-visualizer
```

**Solutions:**

1. **Remove unused dependencies:**
```bash
npm install -g depcheck
depcheck
npm uninstall <unused-package>
```

2. **Use dynamic imports:**
```typescript
// Instead of
import HeavyLibrary from 'heavy-library'

// Use
const HeavyLibrary = React.lazy(() => import('heavy-library'))
```

3. **Tree-shake lodash:**
```typescript
// Bad: Imports entire library
import _ from 'lodash'

// Good: Import only what you need
import get from 'lodash/get'
import map from 'lodash/map'
```

4. **Enable Hermes (should be default):**
```json
// app.json
{
  "expo": {
    "ios": {
      "jsEngine": "hermes"
    },
    "android": {
      "jsEngine": "hermes"
    }
  }
}
```

5. **Optimize images:**
```bash
# Use WebP instead of PNG/JPG
# Smaller file size, same quality
```

---

### Slow App Startup

**Symptoms:**
- App takes long to show first screen
- Splash screen shows for too long

**Solutions:**

1. **Defer non-critical initialization:**
```typescript
function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Load critical resources
    Promise.all([
      loadFonts(),
      loadAuthSession(),
    ]).then(() => setReady(true))

    // Defer non-critical
    setTimeout(() => {
      loadAnalytics()
      checkForUpdates()
    }, 1000)
  }, [])

  if (!ready) return <SplashScreen />

  return <Navigation />
}
```

2. **Optimize font loading:**
```typescript
import * as Font from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'

// Keep splash screen visible
SplashScreen.preventAutoHideAsync()

// Load fonts async
Font.loadAsync({
  'custom-font': require('./assets/fonts/custom-font.ttf'),
}).then(() => {
  SplashScreen.hideAsync()
})
```

3. **Use code splitting:**
```typescript
// Load heavy screens lazily
const HeavyScreen = React.lazy(() => import('./screens/heavy-screen'))
```

---

## Network Performance

### Slow API Calls

**Solutions:**

1. **Implement caching:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'

async function fetchWithCache(key, fetcher, ttl = 3600) {
  const cached = await AsyncStorage.getItem(key)

  if (cached) {
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp < ttl * 1000) {
      return data
    }
  }

  const data = await fetcher()
  await AsyncStorage.setItem(key, JSON.stringify({
    data,
    timestamp: Date.now()
  }))

  return data
}
```

2. **Batch API requests:**
```typescript
// Bad: Multiple requests
const user = await fetchUser(id)
const posts = await fetchPosts(id)
const comments = await fetchComments(id)

// Good: Single request with joins
const { user, posts, comments } = await fetchUserData(id)
```

3. **Use pagination:**
```typescript
const { data } = await supabase
  .from('posts')
  .select('*')
  .range(0, 19) // Load 20 items at a time
```

4. **Implement request deduplication:**
```typescript
const requests = new Map()

async function fetchWithDedup(key, fetcher) {
  if (requests.has(key)) {
    return requests.get(key)
  }

  const promise = fetcher()
  requests.set(key, promise)

  try {
    const result = await promise
    return result
  } finally {
    requests.delete(key)
  }
}
```

---

### Large Image Loading

**Solutions:**

1. **Use progressive/placeholder images:**
```typescript
import { Image } from 'expo-image'

<Image
  source={{ uri: highResUrl }}
  placeholder={{ uri: thumbnailUrl }}
  transition={200}
/>
```

2. **Lazy load images:**
```typescript
import { Image } from 'expo-image'

<Image
  source={{ uri: imageUrl }}
  cachePolicy="memory-disk"
  priority="low" // Load after high-priority images
/>
```

3. **Use CDN with image optimization:**
```typescript
// Cloudinary example
const optimizedUrl = `https://res.cloudinary.com/demo/image/upload/w_300,h_300,c_fill/${imageId}.jpg`
```

---

## Animation Performance

### Janky Animations

**Symptoms:**
- Animations stutter
- Not smooth 60 FPS
- Lag when animating

**Solutions:**

1. **Always use native driver:**
```typescript
import { Animated } from 'react-native'

Animated.timing(animatedValue, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // Required!
}).start()
```

2. **Use react-native-reanimated for complex animations:**
```typescript
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'

function MyComponent() {
  const opacity = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(opacity.value, { duration: 300 })
    }
  })

  return <Animated.View style={animatedStyle} />
}
```

3. **Avoid animating layout properties without native driver:**
```typescript
// Bad: Can't use native driver
Animated.timing(animatedValue, {
  toValue: 100,
  useNativeDriver: false, // Required for width/height
}).start()

// Good: Use transform instead
Animated.timing(animatedValue, {
  toValue: 1,
  useNativeDriver: true,
}).start()

<Animated.View
  style={{
    transform: [{ scaleX: animatedValue }]
  }}
/>
```

---

## Profiling Tools

### React DevTools Profiler

**Usage:**

1. **In browser (Expo web):**
   - Open DevTools
   - Go to Profiler tab
   - Click record
   - Interact with app
   - Stop recording
   - Analyze flame graph

2. **Look for:**
   - Components that re-render frequently
   - Long render times
   - Unnecessary re-renders

---

### Flipper

**Setup:**

```bash
# Install Flipper
brew install --cask flipper

# Or download from https://fbflipper.com

# Connect device
# Flipper auto-detects running apps
```

**Features:**
- React DevTools
- Network inspector
- Database inspector
- Performance monitoring
- Crash reports
- Logs

---

### Xcode Instruments (iOS)

**Templates:**

1. **Time Profiler:**
   - See which functions take longest
   - Identify bottlenecks

2. **Allocations:**
   - Track memory usage
   - Find memory leaks

3. **Leaks:**
   - Detect memory leaks
   - See leak call stacks

---

### Android Profiler

**Features:**
- CPU profiler
- Memory profiler
- Network profiler
- Energy profiler

**Usage:**
1. Open Android Studio
2. View → Tool Windows → Profiler
3. Select your running app
4. Choose profiler type

---

## Performance Checklist

### Before Release

- [ ] Profile on low-end devices
- [ ] Test with slow network (3G)
- [ ] Check bundle size
- [ ] Optimize images
- [ ] Remove console.log statements
- [ ] Enable Hermes
- [ ] Test animations at 60 FPS
- [ ] Check for memory leaks
- [ ] Optimize FlatList rendering
- [ ] Cache API responses
- [ ] Minimize re-renders

### Monitoring

- [ ] Set up crash reporting (Sentry)
- [ ] Monitor app vitals
- [ ] Track slow queries
- [ ] Monitor bundle size over time
- [ ] A/B test performance improvements

---

**Related Docs:**
- [Common Errors](./COMMON-ERRORS.md)
- [Platform Issues](./PLATFORM-ISSUES.md)
- [Integration Issues](./INTEGRATION-ISSUES.md)
