# Performance Monitoring Guide

Complete guide for monitoring and optimizing React Native app performance with custom metrics tracking.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Basic Setup](#basic-setup)
- [Performance Metrics](#performance-metrics)
- [Component Tracking](#component-tracking)
- [API Performance](#api-performance)
- [Screen Load Tracking](#screen-load-tracking)
- [Custom Metrics](#custom-metrics)
- [Performance Budgets](#performance-budgets)
- [Dashboard Setup](#dashboard-setup)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Performance monitoring helps identify bottlenecks and optimize user experience.

### Key Metrics

- **FPS (Frames Per Second)**: UI smoothness (target: 60 FPS)
- **Screen Load Time**: Time from navigation to interactive
- **API Response Time**: Network request latency
- **Memory Usage**: App memory consumption
- **JavaScript Thread Usage**: JS execution performance
- **UI Thread Usage**: Native UI performance

### Goals

- **Smooth UI**: Maintain 60 FPS during interactions
- **Fast Loads**: Screen load under 2 seconds
- **Quick API**: API responses under 500ms
- **Low Memory**: Keep under 200MB for most screens

## Installation

### 1. Install Dependencies

```bash
npm install @react-native-async-storage/async-storage
npx expo install @supabase/supabase-js
```

### 2. Setup Database

Run the schema migration in `.examples/monitoring/metrics/database/schema.sql` (we'll create this next).

## Basic Setup

### 1. Add Performance Monitor

In your `App.tsx`:

```typescript
import { PerformanceMonitor } from './.examples/monitoring/performance/PerformanceMonitor';
import { metricsService } from './.examples/monitoring/performance/services/metricsService';

export default function App() {
  return (
    <>
      <PerformanceMonitor
        onMetric={(metric) => {
          // Send to metrics service
          metricsService.record(
            metric.name,
            metric.value,
            metric.tags,
            metric.unit
          );
        }}
        thresholds={{
          minFPS: 55,
          maxMemoryMB: 200,
          maxScreenLoadTime: 2000,
        }}
      />
      <YourApp />
    </>
  );
}
```

### 2. Configure Metrics Service

The metrics service automatically batches and sends metrics to your backend.

```typescript
import { metricsService } from './services/metricsService';

// Metrics are automatically flushed every 60 seconds
// or when buffer reaches 100 metrics

// Manual flush
await metricsService.flush();
```

## Performance Metrics

### FPS Monitoring

Track frames per second automatically:

```typescript
import { PerformanceMonitor } from './PerformanceMonitor';

<PerformanceMonitor
  enableFPSMonitoring={true}
  onMetric={(metric) => {
    if (metric.name === 'fps') {
      console.log('Current FPS:', metric.value);
    }
  }}
/>;
```

### Memory Monitoring

Monitor memory usage (web only with standard APIs):

```typescript
<PerformanceMonitor
  enableMemoryMonitoring={true}
  onMetric={(metric) => {
    if (metric.name === 'memory_usage') {
      console.log('Memory usage:', metric.value, 'MB');
    }
  }}
/>
```

### Startup Time

App startup is tracked automatically:

```typescript
<PerformanceMonitor
  onMetric={(metric) => {
    if (metric.name === 'app_startup') {
      console.log('App started in', metric.value, 'ms');
    }
  }}
/>
```

## Component Tracking

### Track Component Renders

```typescript
import { useRenderTracking } from './.examples/monitoring/performance/metrics/AppMetrics';

function MyComponent() {
  useRenderTracking('MyComponent', (metric) => {
    console.log('Render metric:', metric);
  });

  return <View>{/* Component content */}</View>;
}
```

### Count Re-Renders

```typescript
import { useRenderCounter } from './.examples/monitoring/performance/hooks/usePerformanceTracker';

function MyComponent() {
  const renderCount = useRenderCounter('MyComponent', (count) => {
    if (count > 10) {
      console.warn('Component re-rendering too frequently:', count);
    }
  });

  return <Text>Rendered {renderCount} times</Text>;
}
```

### Track Component Mount

```typescript
import { useScreenLoadTracking } from './.examples/monitoring/performance/metrics/AppMetrics';

function DashboardScreen() {
  const { markLoadStart, markLoadEnd } = useScreenLoadTracking('Dashboard');

  useEffect(() => {
    markLoadStart();

    fetchDashboardData()
      .then(() => {
        markLoadEnd(); // Tracks time from start to end
      });
  }, []);

  return <View>{/* Screen content */}</View>;
}
```

## API Performance

### Track API Calls

```typescript
import { useAPITracker } from './.examples/monitoring/performance/hooks/usePerformanceTracker';

function useUserData() {
  const trackAPI = useAPITracker();

  const fetchUser = async (id: string) => {
    return trackAPI('GET /api/users/:id', async () => {
      const response = await fetch(`/api/users/${id}`);
      return response.json();
    }, { userId: id });
  };

  return { fetchUser };
}
```

### Track Network Requests

```typescript
import { trackNetworkRequest } from './.examples/monitoring/performance/metrics/AppMetrics';

async function fetchData() {
  const tracker = trackNetworkRequest('GET', '/api/data');

  try {
    const response = await fetch('/api/data');
    tracker.complete(response.status, response.headers.get('content-length'));
    return await response.json();
  } catch (error) {
    tracker.complete(0); // 0 = network error
    throw error;
  }
}
```

## Screen Load Tracking

### Auto-Track Screen Transitions

```typescript
import { useScreenTransition } from './.examples/monitoring/performance/hooks/usePerformanceTracker';

function MyScreen() {
  useScreenTransition('MyScreen', (duration) => {
    console.log(`Screen loaded in ${duration}ms`);
  });

  return <View>{/* Screen content */}</View>;
}
```

### Track with React Navigation

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { trackScreenLoad } from './.examples/monitoring/performance/PerformanceMonitor';

function App() {
  const navigationRef = useRef();

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={() => {
        const currentRoute = navigationRef.current?.getCurrentRoute();
        if (currentRoute) {
          const tracker = trackScreenLoad(currentRoute.name);
          // Mark complete after interactions finish
          InteractionManager.runAfterInteractions(() => {
            tracker.complete();
          });
        }
      }}
    >
      {/* Your screens */}
    </NavigationContainer>
  );
}
```

## Custom Metrics

### Record Custom Metrics

```typescript
import { metricsService } from './services/metricsService';

// Record a metric
metricsService.record('user_action', 1, {
  action: 'button_click',
  screen: 'dashboard',
});

// Record with custom unit
metricsService.record('file_size', 2.5, { file_type: 'image' }, 'MB');
```

### Track Operations

```typescript
import { usePerformanceTracker } from './hooks/usePerformanceTracker';

function MyComponent() {
  const { trackOperation } = usePerformanceTracker();

  const handleProcess = async () => {
    await trackOperation('process_data', async () => {
      // Your operation
      await processData();
    }, {
      recordCount: 100,
      batchSize: 10,
    });
  };
}
```

### Track Timed Operations

```typescript
import { usePerformanceTracker } from './hooks/usePerformanceTracker';

function MyComponent() {
  const { startTimer } = usePerformanceTracker();

  const handleUpload = async () => {
    const endTimer = startTimer('file_upload');

    try {
      await uploadFile();
      endTimer(); // Records duration
    } catch (error) {
      endTimer();
      throw error;
    }
  };
}
```

### Track Long Tasks

```typescript
import { useLongTaskTracker } from './hooks/usePerformanceTracker';

function MyComponent() {
  const trackLongTask = useLongTaskTracker(100); // Warn if >100ms

  const handleProcess = async () => {
    await trackLongTask('heavy_computation', async () => {
      // This will warn if it takes >100ms
      await heavyComputation();
    });
  };
}
```

## Performance Budgets

### Define Budgets

Set performance budgets for key metrics:

```typescript
const PERFORMANCE_BUDGETS = {
  // Screen load times (ms)
  screenLoad: {
    Dashboard: 1500,
    Profile: 1000,
    Settings: 800,
  },

  // API response times (ms)
  api: {
    'GET /users': 500,
    'POST /tasks': 800,
    'GET /analytics': 2000,
  },

  // Component mount times (ms)
  componentMount: {
    TaskList: 200,
    UserCard: 100,
    Chart: 500,
  },
};
```

### Monitor Budgets

```typescript
import { metricsService } from './services/metricsService';

function checkBudget(metricName: string, value: number, budget: number) {
  if (value > budget) {
    console.warn(
      `Performance budget exceeded: ${metricName} took ${value}ms (budget: ${budget}ms)`
    );

    metricsService.record('budget_exceeded', value, {
      metric: metricName,
      budget: String(budget),
      overage: String(value - budget),
    });
  }
}

// Check screen load budget
useScreenLoadTracking('Dashboard', (duration) => {
  checkBudget('Dashboard screen load', duration, PERFORMANCE_BUDGETS.screenLoad.Dashboard);
});
```

## Dashboard Setup

### Supabase Dashboard

Query metrics using Supabase:

```sql
-- Average screen load time by screen
SELECT
  tags->>'screen' as screen_name,
  AVG(metric_value) as avg_duration,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY metric_value) as p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) as p95
FROM app_metrics
WHERE metric_name = 'screen_load'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY tags->>'screen'
ORDER BY avg_duration DESC;

-- Slowest API calls
SELECT
  tags->>'endpoint' as endpoint,
  AVG(metric_value) as avg_latency,
  MAX(metric_value) as max_latency,
  COUNT(*) as call_count
FROM app_metrics
WHERE metric_name LIKE 'api_%'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY tags->>'endpoint'
ORDER BY avg_latency DESC
LIMIT 10;

-- FPS over time
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  AVG(metric_value) as avg_fps,
  MIN(metric_value) as min_fps
FROM app_metrics
WHERE metric_name = 'fps'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

### Grafana Integration

1. Install Grafana
2. Add Supabase as data source (PostgreSQL)
3. Create dashboards with queries above
4. Set up alerts for threshold violations

## Best Practices

### 1. Set Realistic Thresholds

```typescript
// Bad: Too strict
thresholds: {
  minFPS: 60,  // Hard to maintain consistently
  maxScreenLoadTime: 500,  // Too aggressive
}

// Good: Achievable targets
thresholds: {
  minFPS: 55,  // Allows for occasional drops
  maxScreenLoadTime: 2000,  // Reasonable for complex screens
}
```

### 2. Track What Matters

```typescript
// Track user-facing metrics
metricsService.record('screen_load', duration, { screen: 'Dashboard' });
metricsService.record('button_response', delay, { button: 'Submit' });

// Don't track everything
// metricsService.record('variable_assignment', 0.001); // Too granular
```

### 3. Use Sampling in Production

```typescript
// Sample non-critical metrics to reduce storage
const shouldSample = Math.random() < 0.1; // 10% sampling

if (shouldSample) {
  metricsService.record('scroll_event', scrollY);
}

// Always track critical metrics
metricsService.record('purchase_completed', duration);
```

### 4. Batch Metrics

```typescript
// Bad: Flush after every metric
metricsService.record('click', 1);
await metricsService.flush(); // Too frequent

// Good: Auto-flush with buffer
metricsService.record('click', 1);
// Automatically flushes every 60s or at 100 metrics
```

### 5. Add Context with Tags

```typescript
// Bad: Generic metric
metricsService.record('load_time', 1500);

// Good: With context
metricsService.record('load_time', 1500, {
  screen: 'Dashboard',
  user_plan: 'premium',
  device_type: 'tablet',
  network: '4g',
});
```

### 6. Monitor Regressions

```typescript
// Set up alerts for performance regressions
const stats = await metricsService.getMetricStats('screen_load');

if (stats && stats.p95 > PERFORMANCE_BUDGETS.screenLoad.Dashboard * 1.2) {
  // P95 is 20% worse than budget
  alert('Performance regression detected!');
}
```

### 7. Test Performance

```typescript
// Add performance tests
test('Dashboard loads within budget', async () => {
  const startTime = Date.now();

  await render(<DashboardScreen />);
  await waitForLoadingToFinish();

  const loadTime = Date.now() - startTime;

  expect(loadTime).toBeLessThan(PERFORMANCE_BUDGETS.screenLoad.Dashboard);
});
```

## Troubleshooting

### High Memory Usage

1. **Check for memory leaks**:

```typescript
// Use React DevTools Profiler
// Look for components that don't unmount

// Add cleanup in useEffect
useEffect(() => {
  const subscription = eventEmitter.subscribe();

  return () => {
    subscription.unsubscribe(); // Important!
  };
}, []);
```

2. **Optimize images**:

```typescript
// Use appropriate image sizes
<Image
  source={{ uri: imageUrl }}
  style={{ width: 100, height: 100 }}
  resizeMode="cover"
/>

// Use FastImage for better caching
import FastImage from 'react-native-fast-image';

<FastImage
  source={{ uri: imageUrl, priority: FastImage.priority.normal }}
  style={{ width: 100, height: 100 }}
/>
```

### Low FPS

1. **Reduce re-renders**:

```typescript
// Use memo for expensive components
const ExpensiveComponent = memo(({ data }) => {
  return <ComplexUI data={data} />;
});

// Use useCallback for functions
const handlePress = useCallback(() => {
  doSomething();
}, [dependency]);

// Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
```

2. **Optimize lists**:

```typescript
// Use FlatList with proper configuration
<FlatList
  data={items}
  renderItem={({ item }) => <Item item={item} />}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={5}
/>
```

### Slow Screen Loads

1. **Defer non-critical work**:

```typescript
import { InteractionManager } from 'react-native';

function MyScreen() {
  useEffect(() => {
    // Critical: Load immediately
    loadCriticalData();

    // Non-critical: Defer until after interactions
    InteractionManager.runAfterInteractions(() => {
      loadAnalyticsData();
      loadRecommendations();
    });
  }, []);
}
```

2. **Code splitting**:

```typescript
// Lazy load heavy components
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyChart />
    </Suspense>
  );
}
```

### Slow API Calls

1. **Add request caching**:

```typescript
import { useQuery } from '@tanstack/react-query';

function useUserData(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
```

2. **Implement pagination**:

```typescript
// Instead of loading all data
const { data } = await supabase.from('tasks').select('*');

// Load in pages
const { data } = await supabase
  .from('tasks')
  .select('*')
  .range(0, 19); // First 20 items
```

## Resources

- [React Native Performance](https://reactnative.dev/docs/performance)
- [Profiling Guide](https://reactnative.dev/docs/profiling)
- [Hermes Engine](https://reactnative.dev/docs/hermes)
- [Metro Bundler](https://facebook.github.io/metro/)

## Next Steps

1. Add PerformanceMonitor to your app
2. Set up metrics database (see `metrics/database/schema.sql`)
3. Configure performance budgets
4. Monitor key metrics
5. Set up alerts for threshold violations
6. Create performance dashboard
7. Review metrics weekly
8. Optimize based on data

For error tracking, see `.examples/monitoring/sentry/README.md`.
For analytics, see `.examples/monitoring/analytics/README.md`.
