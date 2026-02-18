# Network Performance Optimization

## Overview

Network requests are often the slowest part of a mobile app. This guide covers proven strategies to optimize network performance, reduce latency, and provide a better user experience.

## Performance Targets

| Metric | Target | Maximum | Notes |
|--------|--------|---------|-------|
| API response time | <200ms | 500ms | P95 |
| Time to first byte | <100ms | 200ms | Server processing |
| Cache hit rate | >80% | >60% | For cacheable resources |
| Failed requests | <0.1% | <1% | Reliability |
| Retry success rate | >95% | >90% | After transient failures |

## Quick Wins

### 1. Enable HTTP/2

```typescript
// HTTP/2 multiplexing (multiple requests over single connection)
// Enabled by default in modern React Native

// No code changes needed - just ensure server supports HTTP/2
```

**Impact:** 50% reduction in connection overhead

### 2. Implement Caching

```typescript
import { cacheFirst } from '@/services/cacheService'

// ❌ Always fetches from network
const user = await fetch('/api/user').then(r => r.json())

// ✅ Returns cached value if available
const user = await cacheFirst('user', async () => {
  return fetch('/api/user').then(r => r.json())
})
```

**Impact:** 80-95% reduction in network requests

### 3. Batch Requests

```typescript
import { RequestBatcher } from '@/services/requestBatcher'

const batcher = new RequestBatcher('https://api.example.com/graphql')

// ❌ 3 separate network requests
const [user, posts, comments] = await Promise.all([
  fetch('/api/user'),
  fetch('/api/posts'),
  fetch('/api/comments'),
])

// ✅ 1 batched network request
const [user, posts, comments] = await Promise.all([
  batcher.add('query { user { id name } }'),
  batcher.add('query { posts { id title } }'),
  batcher.add('query { comments { id text } }'),
])
```

**Impact:** 80-90% reduction in HTTP overhead

## Request Batching

### Why Batch?

Single request overhead:
- DNS lookup: 20ms
- TCP handshake: 30ms
- TLS handshake: 50ms
- HTTP overhead: 10ms
- **Total: 110ms per request**

With batching:
- 10 requests = 1,100ms overhead (individual)
- 1 batched request = 110ms overhead (batched)
- **Savings: 990ms (90% faster)**

### Implementation

```typescript
import { RequestBatcher } from '@/services/requestBatcher'

const batcher = new RequestBatcher('https://api.example.com/graphql', {
  batchWindow: 10, // Wait 10ms for more requests
  maxBatchSize: 50, // Max 50 requests per batch
  maxWaitTime: 100, // Force send after 100ms
  enableDedup: true, // Combine identical requests
})

// Add requests
const user = await batcher.add('query GetUser { user { id name } }')
const posts = await batcher.add('query GetPosts { posts { id title } }')
```

### When to Batch

✅ Good for:
- GraphQL queries
- Multiple GET requests on screen load
- Read-only API calls
- Parallel data fetching

❌ Not good for:
- Mutations (POST/PUT/DELETE)
- Real-time updates
- File uploads
- Streaming responses

## Caching Strategies

### Cache-First

Returns cached value if available, otherwise fetches.

```typescript
import { cacheFirst } from '@/services/cacheService'

const data = await cacheFirst(
  'user:123',
  async () => fetchUser('123'),
  { ttl: 5 * 60 * 1000 } // 5 minutes
)
```

**Best for:** Static or rarely changing data (user profiles, settings)

### Network-First

Fetches from network, falls back to cache on error.

```typescript
import { networkFirst } from '@/services/cacheService'

const data = await networkFirst(
  'posts',
  async () => fetchPosts(),
  { ttl: 1 * 60 * 1000 } // 1 minute
)
```

**Best for:** Frequently changing data with offline fallback

### Stale-While-Revalidate

Returns cached value immediately, fetches in background.

```typescript
import { staleWhileRevalidate } from '@/services/cacheService'

const [data, setData] = useState(null)

const data = await staleWhileRevalidate(
  'feed',
  async () => fetchFeed(),
  {
    ttl: 2 * 60 * 1000, // 2 minutes
    onUpdate: (newData) => setData(newData),
  }
)
```

**Best for:** User feeds, timelines, content that can be slightly stale

### Cache Strategy Comparison

| Strategy | First Load | Subsequent | Offline | Freshness |
|----------|------------|------------|---------|-----------|
| Cache-First | Slow | Fast | Yes | Low |
| Network-First | Slow | Slow | Partial | High |
| Stale-While-Revalidate | Fast | Fast | Yes | Medium |

## Cache Implementation

### In-Memory Cache

```typescript
import { CacheService } from '@/services/cacheService'

const cache = new CacheService({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxMemorySize: 10 * 1024 * 1024, // 10MB
})

// Set value
await cache.set('key', value)

// Get value
const value = await cache.get('key')

// Invalidate
await cache.invalidate('key')
```

**Pros:**
- Very fast (<1ms)
- No disk I/O

**Cons:**
- Lost on app restart
- Limited size

### Persistent Cache

```typescript
import { CacheService } from '@/services/cacheService'

const cache = new CacheService({
  enablePersistence: true,
  maxPersistentSize: 50 * 1024 * 1024, // 50MB
})

// Automatically persists to AsyncStorage
await cache.set('key', value)
```

**Pros:**
- Survives app restart
- Larger capacity

**Cons:**
- Slower (~10ms)
- Disk I/O overhead

### Cache Invalidation

```typescript
// Invalidate single key
await cache.invalidate('user:123')

// Invalidate by prefix
await cache.invalidateByPrefix('user:')

// Clear all
await cache.clear()

// Prune expired entries
await cache.prune()
```

**When to invalidate:**
- After mutations (create, update, delete)
- When user logs out
- When data is known to be stale
- Periodically (prune expired)

## Retry Logic

### Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  }
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt === options.maxRetries) {
        throw lastError
      }

      // Calculate delay with exponential backoff + jitter
      const baseDelay = options.initialDelay * Math.pow(
        options.backoffMultiplier,
        attempt
      )
      const delay = Math.min(
        baseDelay + Math.random() * 1000, // Add jitter
        options.maxDelay
      )

      console.log(`Retry ${attempt + 1}/${options.maxRetries} after ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// Usage
const data = await retryWithBackoff(
  async () => fetch('/api/data').then(r => r.json())
)
```

**Retry delays:**
- Attempt 1: 1000ms + jitter
- Attempt 2: 2000ms + jitter
- Attempt 3: 4000ms + jitter
- Attempt 4: 8000ms + jitter (capped at 10000ms)

### When to Retry

✅ Retry on:
- Network errors (timeout, connection refused)
- 5xx server errors (500, 502, 503, 504)
- Rate limiting (429)

❌ Don't retry on:
- 4xx client errors (400, 401, 403, 404)
- Successful responses (200-299)
- Known permanent failures

## Optimistic Updates

### Pattern

```typescript
import { useOptimisticUpdate } from '@/hooks/useOptimisticUpdate'

function LikeButton({ postId, isLiked }) {
  const [optimisticLiked, setOptimisticLiked] = useOptimisticUpdate(isLiked)

  const handleLike = async () => {
    // Update UI immediately
    setOptimisticLiked(!optimisticLiked)

    try {
      // Send request in background
      await api.likePost(postId)
    } catch (error) {
      // Rollback on error
      setOptimisticLiked(optimisticLiked)
      showError('Failed to like post')
    }
  }

  return (
    <Button
      onPress={handleLike}
      icon={optimisticLiked ? 'heart' : 'heart-outline'}
    />
  )
}
```

### Rollback on Error

```typescript
async function optimisticUpdate<T>(
  currentValue: T,
  newValue: T,
  updateFn: (value: T) => Promise<void>
): Promise<T> {
  try {
    await updateFn(newValue)
    return newValue
  } catch (error) {
    console.error('Optimistic update failed, rolling back')
    return currentValue
  }
}
```

### Best Practices

1. **Show loading indicator** during request
2. **Rollback on error** with user notification
3. **Queue offline updates** for later sync
4. **Handle conflicts** when server state differs
5. **Validate optimistically** before sending

## Prefetching Strategies

### Prefetch Next Screen

```typescript
import { useFocusEffect } from '@react-navigation/native'

function HomeScreen() {
  useFocusEffect(
    useCallback(() => {
      // Prefetch data for likely next screen
      prefetchUserProfile()
      prefetchUserPosts()
    }, [])
  )
}
```

### Prefetch on Hover/Press

```typescript
function ListItem({ item, onPress }) {
  const handlePressIn = useCallback(() => {
    // Start prefetching when user presses down
    prefetchItemDetails(item.id)
  }, [item.id])

  return (
    <Pressable
      onPress={() => onPress(item)}
      onPressIn={handlePressIn}
    >
      <Text>{item.title}</Text>
    </Pressable>
  )
}
```

### Prefetch on Visibility

```typescript
function UpcomingItem({ item }) {
  const ref = useRef(null)
  const isVisible = useIsVisible(ref)

  useEffect(() => {
    if (isVisible) {
      // Prefetch when item comes into view
      prefetchItemDetails(item.id)
    }
  }, [isVisible, item.id])

  return <View ref={ref}>...</View>
}
```

## Request Prioritization

### Priority Levels

```typescript
enum RequestPriority {
  HIGH = 3,    // User-initiated, blocking UI
  NORMAL = 2,  // Regular API calls
  LOW = 1,     // Background updates, analytics
}

class PriorityQueue {
  private queues: Map<RequestPriority, Request[]> = new Map()

  async add(request: Request, priority: RequestPriority) {
    const queue = this.queues.get(priority) || []
    queue.push(request)
    this.queues.set(priority, queue)

    return this.processNext()
  }

  private async processNext() {
    // Process highest priority first
    for (const priority of [
      RequestPriority.HIGH,
      RequestPriority.NORMAL,
      RequestPriority.LOW,
    ]) {
      const queue = this.queues.get(priority)
      if (queue && queue.length > 0) {
        const request = queue.shift()!
        return this.execute(request)
      }
    }
  }
}
```

### Usage

```typescript
// High priority - user waiting
await priorityQueue.add(
  fetchUserProfile(),
  RequestPriority.HIGH
)

// Normal priority - regular load
await priorityQueue.add(
  fetchPosts(),
  RequestPriority.NORMAL
)

// Low priority - background
await priorityQueue.add(
  syncAnalytics(),
  RequestPriority.LOW
)
```

## Offline Queue

### Implementation

```typescript
class OfflineQueue {
  private queue: Array<{
    id: string
    request: () => Promise<any>
    retries: number
  }> = []

  async add(request: () => Promise<any>) {
    const id = uuid()

    this.queue.push({
      id,
      request,
      retries: 0,
    })

    // Try to process immediately
    if (navigator.onLine) {
      await this.process()
    }
  }

  async process() {
    while (this.queue.length > 0 && navigator.onLine) {
      const item = this.queue[0]

      try {
        await item.request()
        this.queue.shift() // Remove on success
      } catch (error) {
        item.retries++

        if (item.retries >= 3) {
          console.error('Request failed after 3 retries:', error)
          this.queue.shift() // Remove after max retries
        } else {
          // Move to back of queue
          this.queue.shift()
          this.queue.push(item)
        }
      }
    }
  }
}

// Usage
const offlineQueue = new OfflineQueue()

// Add request
await offlineQueue.add(async () => {
  await api.updatePost(postId, data)
})

// Process queue when online
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    offlineQueue.process()
  }
})
```

## Performance Monitoring

### Request Timing

```typescript
async function timedFetch(url: string) {
  const start = performance.now()

  try {
    const response = await fetch(url)
    const duration = performance.now() - start

    console.log({
      url,
      duration,
      status: response.status,
    })

    return response
  } catch (error) {
    const duration = performance.now() - start
    console.error({ url, duration, error })
    throw error
  }
}
```

### Cache Hit Rate

```typescript
const cacheStats = cache.getStats()

console.log({
  hitRate: (cacheStats.hitRate * 100).toFixed(1) + '%',
  hits: cacheStats.hits,
  misses: cacheStats.misses,
  memorySize: (cacheStats.memorySize / 1024).toFixed(0) + 'KB',
})
```

### Network Quality

```typescript
import NetInfo from '@react-native-community/netinfo'

NetInfo.fetch().then(state => {
  console.log({
    isConnected: state.isConnected,
    type: state.type, // wifi, cellular, ethernet
    effectiveType: state.details?.cellularGeneration, // 2g, 3g, 4g, 5g
  })
})
```

## Best Practices Checklist

### Requests

- [ ] Batch related requests
- [ ] Cache cacheable responses
- [ ] Implement retry logic
- [ ] Use request deduplication
- [ ] Prioritize critical requests
- [ ] Implement request timeout
- [ ] Handle offline scenarios
- [ ] Use HTTP/2

### Caching

- [ ] Cache static resources
- [ ] Set appropriate TTL
- [ ] Invalidate on mutations
- [ ] Use multi-layer cache
- [ ] Monitor cache hit rate
- [ ] Prune expired entries
- [ ] Handle cache errors

### Optimization

- [ ] Use optimistic updates
- [ ] Prefetch next screen data
- [ ] Compress request/response
- [ ] Minimize payload size
- [ ] Use GraphQL field selection
- [ ] Paginate large lists
- [ ] Debounce search queries

## Benchmarks

### Typical Request Times

| Scenario | Without Optimization | With Optimization | Improvement |
|----------|---------------------|-------------------|-------------|
| Screen load (10 requests) | 1,500ms | 200ms | 7.5x faster |
| Cached response | 200ms | <1ms | 200x faster |
| Optimistic update | 200ms (blocking) | 0ms (instant) | Instant |
| Retry on failure | Failed | Success (95%) | Reliable |

### Cache Hit Rates

| Content Type | Target | Typical |
|--------------|--------|---------|
| User profile | 90% | 85% |
| Settings | 95% | 90% |
| Static content | 99% | 95% |
| User feed | 60% | 50% |

## Resources

- [HTTP/2 Documentation](https://developers.google.com/web/fundamentals/performance/http2)
- [Caching Best Practices](https://web.dev/http-cache/)
- [GraphQL DataLoader](https://github.com/graphql/dataloader)
- [React Query](https://tanstack.com/query/latest)

## Next Steps

1. Implement request batching for GraphQL
2. Add caching with appropriate TTLs
3. Implement retry logic with exponential backoff
4. Add optimistic updates for mutations
5. Monitor cache hit rate and request timing
6. Test offline scenarios

**Remember:** Profile network requests to identify bottlenecks. The Network tab in React Native Debugger is your best friend.
