# Scaling Patterns

> Optimizing performance as your app and user base grow.

## Overview

Scaling concerns at different stages:

| Users | Focus |
|-------|-------|
| 0-1K | Ship features, don't optimize |
| 1K-10K | Database indexes, basic caching |
| 10K-100K | Connection pooling, CDN, rate limiting |
| 100K+ | Horizontal scaling, advanced caching, edge functions |

**Golden Rule:** Don't optimize prematurely. Profile first, then optimize.

## Database Scaling

### Indexing Strategy

```sql
-- Index foreign keys (always)
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Index frequently filtered columns
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Composite index for common query patterns
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);

-- Partial index for active records only
CREATE INDEX idx_active_tasks ON tasks(user_id, due_date)
WHERE completed = false;
```

### RLS Performance

```sql
-- ❌ BAD: Complex subquery in every row check
CREATE POLICY "slow_policy" ON tasks
FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM team_members
    WHERE team_id IN (SELECT team_id FROM teams WHERE ...)
  )
);

-- ✅ GOOD: Use SECURITY DEFINER function
CREATE OR REPLACE FUNCTION user_can_access_task(task_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN task_user_id = auth.uid();
END;
$$;

CREATE POLICY "fast_policy" ON tasks
FOR SELECT USING (user_can_access_task(user_id));
```

### Connection Pooling

Supabase uses PgBouncer. Configure in `supabase/config.toml`:

```toml
[db.pooler]
enabled = true
port = 6543
pool_mode = "transaction"
default_pool_size = 15
max_client_conn = 100
```

Use the pooled connection string for high-traffic endpoints:

```typescript
// For Edge Functions with high concurrency
const connectionString = process.env.DATABASE_URL_POOLED;
```

### Query Optimization

```typescript
// ❌ BAD: N+1 queries
const tasks = await supabase.from('tasks').select('*');
for (const task of tasks) {
  const user = await supabase.from('users').select('*').eq('id', task.user_id);
}

// ✅ GOOD: Join in single query
const tasks = await supabase
  .from('tasks')
  .select(`
    *,
    user:users(id, name, avatar_url)
  `);
```

## App Performance

### Code Splitting with Expo Router

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

// Each tab is lazy loaded automatically
export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
```

### Large List Optimization

```typescript
// ❌ BAD: ScrollView with many items
<ScrollView>
  {items.map((item) => <ItemCard key={item.id} item={item} />)}
</ScrollView>

// ✅ GOOD: FlatList with optimization props
<FlatList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  keyExtractor={(item) => item.id}
  // Performance props
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={10}
  // Stable callbacks
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### Memoization

```typescript
// Memoize expensive components
const MemoizedItem = React.memo(TaskItem, (prev, next) => {
  return prev.task.id === next.task.id &&
         prev.task.completed === next.task.completed;
});

// Memoize callbacks
function TaskList({ onComplete }) {
  const handleComplete = useCallback((id: string) => {
    onComplete(id);
  }, [onComplete]);

  return <FlatList renderItem={...} />;
}

// Memoize expensive calculations
function TaskStats({ tasks }) {
  const stats = useMemo(() => {
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      overdue: tasks.filter(t => new Date(t.due_date) < new Date()).length,
    };
  }, [tasks]);

  return <StatsDisplay stats={stats} />;
}
```

### Image Optimization

```typescript
import { Image } from 'expo-image';

// Use expo-image for better performance
<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  contentFit="cover"
  transition={200}
  placeholder={blurhash}
  cachePolicy="memory-disk"
/>

// Progressive loading for large images
<Image
  source={{ uri: thumbnailUrl }}
  style={styles.image}
  onLoad={() => {
    // Load full resolution after thumbnail
    setSource(fullResUrl);
  }}
/>
```

### Bundle Size

```bash
# Analyze bundle
npx expo export --platform ios
npx source-map-explorer dist/_expo/static/js/*.js

# Tree shaking - import only what you need
import { format } from 'date-fns'; // ❌ Imports entire library
import format from 'date-fns/format'; // ✅ Imports only format
```

## Edge Function Scaling

### Cold Start Mitigation

```typescript
// Lazy initialization outside handler
let supabase: SupabaseClient | null = null;

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SECRET_KEY')!
    );
  }
  return supabase;
}

Deno.serve(async (req) => {
  const supabase = getSupabase(); // Reused across requests
  // ...
});
```

### Distributed Rate Limiting

```typescript
// Using Upstash Redis for distributed rate limiting
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

Deno.serve(async (req) => {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const { success, limit, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return new Response(JSON.stringify({ error: 'Rate limited' }), {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
      },
    });
  }

  // Process request...
});
```

## Caching Strategies

### Client-Side Caching

```typescript
// React Query / TanStack Query
const { data } = useQuery({
  queryKey: ['tasks', userId],
  queryFn: fetchTasks,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
});

// AsyncStorage for offline
const CACHE_KEY = 'tasks_cache';
const CACHE_TTL = 5 * 60 * 1000;

async function getCachedTasks() {
  const cached = await AsyncStorage.getItem(CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
  }
  return null;
}

async function setCachedTasks(data: Task[]) {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
    data,
    timestamp: Date.now(),
  }));
}
```

### Server-Side Caching (Edge Functions)

```typescript
// In-memory cache for Edge Functions
const cache = new Map<string, { data: any; expires: number }>();

function getCached<T>(key: string): T | null {
  const item = cache.get(key);
  if (item && item.expires > Date.now()) {
    return item.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any, ttlSeconds: number) {
  cache.set(key, {
    data,
    expires: Date.now() + ttlSeconds * 1000,
  });
}
```

## Cost Scaling

### AI API Costs

See [Cost Optimization](../07-ai-integration/COST-OPTIMIZATION.md) for:
- 3-tier model routing
- Response caching
- Token limits
- Usage tracking

### Supabase Costs

| Tier | Included | When to Upgrade |
|------|----------|-----------------|
| Free | 500MB DB, 1GB storage | Development |
| Pro ($25/mo) | 8GB DB, 100GB storage | 1K+ users |
| Team ($599/mo) | Dedicated resources | 50K+ users |

Monitor usage:
```sql
-- Check database size
SELECT pg_database_size(current_database()) / 1024 / 1024 AS size_mb;

-- Check table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

## Monitoring

### Key Metrics

```typescript
// Performance metrics to track
interface AppMetrics {
  // User experience
  appStartTime: number;
  screenLoadTime: number;
  apiResponseTime: number;

  // Errors
  crashRate: number;
  apiErrorRate: number;

  // Usage
  dailyActiveUsers: number;
  apiRequestsPerDay: number;
}
```

### Error Tracking

```typescript
// Sentry setup
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2, // 20% of transactions
  profilesSampleRate: 0.1, // 10% of transactions
});

// Track performance
const transaction = Sentry.startTransaction({
  name: 'Load Tasks',
  op: 'navigation',
});

await loadTasks();

transaction.finish();
```

## Checklist

### Database
- [ ] Foreign keys indexed
- [ ] RLS uses security definer functions for complex checks
- [ ] Connection pooling enabled
- [ ] Queries optimized (no N+1)
- [ ] Database size monitored

### App
- [ ] Large lists use FlatList
- [ ] Images optimized with expo-image
- [ ] Callbacks memoized
- [ ] Bundle size analyzed
- [ ] Lazy loading for screens

### Infrastructure
- [ ] Rate limiting on all endpoints
- [ ] Edge function cold starts mitigated
- [ ] Caching strategy defined
- [ ] Error tracking configured
- [ ] Monitoring dashboards set up

## Related Docs

- [Cost Optimization](../07-ai-integration/COST-OPTIMIZATION.md) - AI cost management
- [RLS Policies](../03-database/RLS-POLICIES.md) - Database security
- [CI/CD](../11-deployment/CI-CD.md) - Deployment pipeline
