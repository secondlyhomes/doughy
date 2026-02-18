# Runtime Performance Optimization

## Overview

Runtime performance is critical for user experience. This guide covers proven techniques to optimize React Native app performance at runtime, ensuring smooth 60fps animations, fast screen transitions, and efficient memory usage.

## Performance Targets

| Metric | Target | Maximum | Impact |
|--------|--------|---------|--------|
| Screen load | <300ms | 500ms | User perception |
| List scroll | 60fps | 55fps | Smooth scrolling |
| Animation | 60fps | 50fps | Visual quality |
| Memory usage | <100MB | 150MB | Device stability |
| JS thread usage | <50% | 70% | Responsiveness |

## Quick Wins

### 1. Use FlashList Instead of FlatList

```tsx
// ❌ FlatList - slow with large lists
import { FlatList } from 'react-native'

<FlatList
  data={items}
  renderItem={({ item }) => <Item data={item} />}
/>

// ✅ FlashList - 10x faster
import { FlashList } from '@shopify/flash-list'

<FlashList
  data={items}
  renderItem={({ item }) => <Item data={item} />}
  estimatedItemSize={60}
  getItemType={item => item.type}
/>
```

**Impact:** 10x faster scrolling, 50% less memory

### 2. Memoize Components

```tsx
// ❌ Re-renders on every parent render
function ListItem({ item }) {
  return <Text>{item.name}</Text>
}

// ✅ Only re-renders when item changes
const ListItem = memo(function ListItem({ item }) {
  return <Text>{item.name}</Text>
})
```

**Impact:** 70-90% reduction in re-renders

### 3. Use useCallback for Event Handlers

```tsx
// ❌ Creates new function on every render
function Component() {
  return (
    <Button
      onPress={() => handlePress()}
      title="Press Me"
    />
  )
}

// ✅ Stable function reference
function Component() {
  const handlePress = useCallback(() => {
    // Handle press
  }, [])

  return <Button onPress={handlePress} title="Press Me" />
}
```

**Impact:** Prevents unnecessary child re-renders

## List Virtualization

### Why Virtualization Matters

Rendering 10,000 list items without virtualization:
- Memory: 500MB
- Scroll FPS: 15fps
- Initial render: 5s

With FlashList virtualization:
- Memory: 80MB (84% less)
- Scroll FPS: 60fps (4x faster)
- Initial render: 0.3s (16x faster)

### FlashList Configuration

```tsx
import { FlashList } from '@shopify/flash-list'

function OptimizedList({ data }) {
  return (
    <FlashList
      data={data}
      renderItem={renderItem}
      estimatedItemSize={60} // Critical for performance
      getItemType={getItemType} // Critical for heterogeneous lists
      keyExtractor={keyExtractor}
      // Performance optimizations
      drawDistance={500}
      estimatedListSize={{ height: 800, width: 400 }}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  )
}
```

### Key Configuration Options

| Option | Purpose | Recommended |
|--------|---------|-------------|
| `estimatedItemSize` | Initial render optimization | Actual item height ±10px |
| `getItemType` | View recycling | Return item.type for heterogeneous |
| `drawDistance` | Render ahead distance | 500px (2-3 screens) |
| `windowSize` | Screens to render | 5 (default, good balance) |
| `maxToRenderPerBatch` | Batch size | 10 (prevents frame drops) |

### Heterogeneous Lists

```tsx
// Different item types in same list
function getItemType(item) {
  switch (item.type) {
    case 'header':
      return 'header'
    case 'detailed':
      return 'detailed'
    default:
      return 'simple'
  }
}

// FlashList recycles views by type
<FlashList
  data={items}
  getItemType={getItemType}
  // Render different components by type
  renderItem={({ item }) => {
    switch (item.type) {
      case 'header':
        return <Header item={item} />
      case 'detailed':
        return <DetailedItem item={item} />
      default:
        return <SimpleItem item={item} />
    }
  }}
/>
```

## Memoization Guide

### When to Use React.memo

```tsx
// ✅ Good use cases
// - List items
// - Complex components
// - Components with expensive renders
const ListItem = memo(function ListItem({ item }) {
  return <View>...</View>
})

// ❌ Don't memoize
// - Simple components (<10 lines)
// - Components that always re-render
// - Top-level screen components
```

### When to Use useMemo

```tsx
function Component({ data }) {
  // ✅ Expensive computation
  const sortedData = useMemo(() => {
    return data.sort((a, b) => a.value - b.value)
  }, [data])

  // ✅ Derived data
  const stats = useMemo(() => {
    return {
      total: data.length,
      avg: data.reduce((sum, d) => sum + d.value, 0) / data.length,
    }
  }, [data])

  // ❌ Simple computation (faster without memoization)
  // const doubled = useMemo(() => value * 2, [value])
  const doubled = value * 2
}
```

### When to Use useCallback

```tsx
function Component({ onUpdate }) {
  // ✅ Passed to memoized child
  const handlePress = useCallback(() => {
    onUpdate()
  }, [onUpdate])

  return <MemoizedChild onPress={handlePress} />

  // ❌ Not passed to memoized component
  // const handlePress = useCallback(() => {...}, [])
  // return <NonMemoizedChild onPress={handlePress} />
}
```

### Memoization Decision Tree

```
Should I memoize?
├─ Is it a list item? → YES, use memo
├─ Is computation expensive (>5ms)? → YES, use useMemo
├─ Is it passed to memoized child? → YES, use useCallback
├─ Does it re-render often? → YES, use memo
└─ Otherwise → NO, keep it simple
```

## Image Optimization

### Use expo-image

```tsx
// ❌ react-native Image (slower, no WebP)
import { Image } from 'react-native'

<Image
  source={{ uri: 'https://example.com/image.jpg' }}
  style={{ width: 300, height: 200 }}
/>

// ✅ expo-image (faster, WebP, better caching)
import { Image } from 'expo-image'

<Image
  source={{ uri: 'https://example.com/image.jpg' }}
  style={{ width: 300, height: 200 }}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
/>
```

**Impact:** 40% faster loading, 30% less memory

### Lazy Loading Images

```tsx
import { LazyImage } from '@/components/LazyImage'

<LazyImage
  source={{ uri: imageUrl }}
  blurhash="LGF5]+Yk^6#M@-5c,1J5@[or[Q6."
  width={300}
  height={200}
  borderRadius={12}
/>
```

**Impact:** 60% faster initial page load

### Progressive Image Loading

```tsx
import { ProgressiveImage } from '@/components/ProgressiveImage'

<ProgressiveImage
  thumbnailSource={{ uri: thumbUrl }} // Small, loads instantly
  source={{ uri: fullUrl }} // Full resolution
  blurhash="LGF5]+Yk^6#M@-5c,1J5@[or[Q6."
  width={300}
  height={200}
/>
```

**Flow:**
1. Show blurhash instantly (0ms)
2. Load thumbnail (100ms)
3. Load full image in background (500ms)

## Lazy Loading Patterns

### Lazy Load Screens

```tsx
import { lazy, Suspense } from 'react'

// ❌ Static import (always loaded)
import SettingsScreen from './SettingsScreen'

// ✅ Dynamic import (loaded when needed)
const SettingsScreen = lazy(() => import('./SettingsScreen'))

function Navigation() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SettingsScreen />
    </Suspense>
  )
}
```

**Impact:** 20-30% smaller initial bundle

### Lazy Load Heavy Libraries

```tsx
// ❌ Import at top (always loaded)
import { Chart } from 'heavy-chart-library'

// ✅ Import when needed
function ChartScreen() {
  const [Chart, setChart] = useState(null)

  useEffect(() => {
    import('heavy-chart-library').then(module => {
      setChart(() => module.Chart)
    })
  }, [])

  if (!Chart) return <LoadingSpinner />
  return <Chart data={data} />
}
```

**Impact:** Reduces initial bundle by library size

## Navigation Optimization

### Screen Preloading

```tsx
import { useNavigation } from '@react-navigation/native'

function HomeScreen() {
  const navigation = useNavigation()

  useEffect(() => {
    // Preload next screen in background
    navigation.preload('Profile')
  }, [])
}
```

### Optimize Stack Navigator

```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack'

const Stack = createNativeStackNavigator()

<Stack.Navigator
  screenOptions={{
    // Enable native animations (faster)
    animation: 'default',
    // Freeze inactive screens (saves memory)
    freezeOnBlur: true,
    // Lazy load screens
    lazy: true,
    // Remove header shadow (faster)
    headerShadowVisible: false,
  }}
>
  <Stack.Screen name="Home" component={HomeScreen} />
</Stack.Navigator>
```

## State Management Optimization

### Avoid Prop Drilling

```tsx
// ❌ Prop drilling (causes re-renders)
function App() {
  const [user, setUser] = useState()
  return (
    <Parent user={user}>
      <Child user={user}>
        <GrandChild user={user} />
      </Child>
    </Parent>
  )
}

// ✅ Context (selective re-renders)
const UserContext = createContext()

function App() {
  const [user, setUser] = useState()
  return (
    <UserContext.Provider value={user}>
      <Parent>
        <Child>
          <GrandChild />
        </Child>
      </Parent>
    </UserContext.Provider>
  )
}

function GrandChild() {
  const user = useContext(UserContext)
  return <Text>{user.name}</Text>
}
```

### Split Contexts

```tsx
// ❌ Single context (everything re-renders)
const AppContext = createContext({
  user: null,
  theme: null,
  settings: null,
})

// ✅ Separate contexts (selective re-renders)
const UserContext = createContext(null)
const ThemeContext = createContext(null)
const SettingsContext = createContext(null)
```

## Re-render Debugging

### React DevTools Profiler

```bash
# Install React Native Debugger
# Enable profiler in DevTools
# Record interaction
# Analyze flame graph
```

### Why Did You Render

```tsx
import whyDidYouRender from '@welldone-software/why-did-you-render'

if (__DEV__) {
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    logOnDifferentValues: true,
  })
}
```

### Manual Re-render Tracking

```tsx
function Component(props) {
  const renderCount = useRef(0)
  renderCount.current++

  useEffect(() => {
    console.log(`Component rendered ${renderCount.current} times`)
    console.log('Props:', props)
  })

  return <View>...</View>
}
```

## Performance Profiling

### React Native Performance Monitor

```tsx
// Enable performance monitor
import { DevSettings } from 'react-native'

if (__DEV__) {
  DevSettings.addMenuItem('Show Performance Monitor', () => {
    require('react-native/Libraries/Performance/RCTRenderingPerf').toggle()
  })
}
```

### Custom Performance Marks

```tsx
function Component() {
  useEffect(() => {
    performance.mark('component-mount-start')

    return () => {
      performance.mark('component-mount-end')
      performance.measure(
        'component-mount',
        'component-mount-start',
        'component-mount-end'
      )

      const measure = performance.getEntriesByName('component-mount')[0]
      console.log(`Component mount time: ${measure.duration}ms`)
    }
  }, [])
}
```

### Measure Render Time

```tsx
function useRenderTime(componentName: string) {
  const renderTimeRef = useRef(performance.now())

  useEffect(() => {
    const duration = performance.now() - renderTimeRef.current
    console.log(`${componentName} render time: ${duration}ms`)
    renderTimeRef.current = performance.now()
  })
}

function Component() {
  useRenderTime('Component')
  return <View>...</View>
}
```

## Common Performance Pitfalls

### 1. Inline Styles

```tsx
// ❌ Creates new object on every render
<View style={{ padding: 16, backgroundColor: '#fff' }} />

// ✅ StyleSheet (pre-processed, faster)
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
})

<View style={styles.container} />
```

### 2. Inline Functions

```tsx
// ❌ Creates new function on every render
<Button onPress={() => handlePress()} />

// ✅ Stable function reference
const handlePress = useCallback(() => {...}, [])
<Button onPress={handlePress} />
```

### 3. Large Component Trees

```tsx
// ❌ 200+ line component
function MassiveComponent() {
  // Too much logic and JSX
}

// ✅ Split into smaller components
function HeaderSection() {...}
function ContentSection() {...}
function FooterSection() {...}

function Component() {
  return (
    <>
      <HeaderSection />
      <ContentSection />
      <FooterSection />
    </>
  )
}
```

### 4. Expensive Computations in Render

```tsx
// ❌ Runs on every render
function Component({ data }) {
  const sorted = data.sort(...)
  const filtered = sorted.filter(...)
  return <List data={filtered} />
}

// ✅ Memoized
function Component({ data }) {
  const processed = useMemo(() => {
    return data.sort(...).filter(...)
  }, [data])
  return <List data={processed} />
}
```

## Performance Checklist

### Before Shipping

- [ ] FlashList for all lists >20 items
- [ ] Memoized all list item components
- [ ] expo-image for all images
- [ ] Lazy loaded non-critical screens
- [ ] StyleSheet for all styles (no inline)
- [ ] useCallback for event handlers
- [ ] useMemo for expensive computations
- [ ] Tested on low-end device
- [ ] Profiled with React DevTools
- [ ] Memory usage <150MB
- [ ] List scroll at 60fps
- [ ] Screen transitions <300ms
- [ ] No unnecessary re-renders

## Resources

- [FlashList Documentation](https://shopify.github.io/flash-list/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/)

## Next Steps

1. Audit your app with React DevTools Profiler
2. Replace FlatList with FlashList
3. Optimize images with expo-image
4. Add memoization to list items
5. Test on physical low-end device
6. Monitor performance metrics

**Remember:** Measure before and after optimizing. Profile-guided optimization is more effective than guessing.
