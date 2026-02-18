# Performance Testing Guide

## Overview

Performance testing ensures your app stays fast as it grows. We use [Reassure](https://github.com/callstack/reassure) for React Native performance regression testing.

## Setup

### Install Reassure

```bash
npm install --save-dev reassure
```

### Configure Reassure

```javascript
// reassure.config.js
module.exports = {
  runs: 10,
  outputFile: '.reassure/output.json',
  testMatch: '**/*.perf-test.tsx',
};
```

### Update package.json

```json
{
  "scripts": {
    "test:perf": "reassure",
    "test:perf:baseline": "reassure --baseline"
  }
}
```

## Writing Performance Tests

### Component Render Performance

```typescript
// src/components/__tests__/TaskList.perf-test.tsx
import { measurePerformance } from 'reassure';
import { TaskList } from '../TaskList';

const mockTasks = Array.from({ length: 100 }, (_, i) => ({
  id: `task-${i}`,
  title: `Task ${i}`,
  status: i % 2 === 0 ? 'pending' : 'completed',
}));

describe('TaskList Performance', () => {
  it('renders 100 tasks efficiently', async () => {
    await measurePerformance(
      <TaskList tasks={mockTasks} onTaskPress={() => {}} />
    );
  });

  it('re-renders efficiently when single task updates', async () => {
    const { rerender } = await measurePerformance(
      <TaskList tasks={mockTasks} onTaskPress={() => {}} />
    );

    const updatedTasks = [...mockTasks];
    updatedTasks[0] = { ...updatedTasks[0], status: 'completed' };

    await measurePerformance(
      <TaskList tasks={updatedTasks} onTaskPress={() => {}} />,
      { scenario: async () => rerender() }
    );
  });
});
```

### FlatList Performance

```typescript
// src/components/__tests__/VirtualizedList.perf-test.tsx
import { measurePerformance } from 'reassure';
import { render, fireEvent } from '@testing-library/react-native';
import { VirtualizedTaskList } from '../VirtualizedTaskList';

const generateTasks = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `task-${i}`,
    title: `Task ${i}`,
    description: `Description for task ${i}`,
  }));

describe('VirtualizedTaskList Performance', () => {
  it('initial render with 1000 items', async () => {
    const tasks = generateTasks(1000);

    await measurePerformance(
      <VirtualizedTaskList tasks={tasks} />
    );
  });

  it('scroll performance', async () => {
    const tasks = generateTasks(1000);

    await measurePerformance(
      <VirtualizedTaskList tasks={tasks} />,
      {
        scenario: async (screen) => {
          const list = screen.getByTestId('task-list');
          // Simulate scroll
          fireEvent.scroll(list, {
            nativeEvent: {
              contentOffset: { y: 5000 },
              contentSize: { height: 50000 },
              layoutMeasurement: { height: 800 },
            },
          });
        },
      }
    );
  });
});
```

### Hook Performance

```typescript
// src/hooks/__tests__/useTasks.perf-test.tsx
import { measurePerformance } from 'reassure';
import { renderHook } from '@testing-library/react-hooks';
import { useTasks } from '../useTasks';

describe('useTasks Performance', () => {
  it('processes large dataset efficiently', async () => {
    const largeTasks = Array.from({ length: 500 }, (_, i) => ({
      id: `task-${i}`,
      title: `Task ${i}`,
      status: ['pending', 'completed', 'archived'][i % 3],
    }));

    await measurePerformance(
      () => {
        renderHook(() => useTasks(largeTasks));
      }
    );
  });
});
```

## Running Performance Tests

```bash
# Create baseline (run on main branch)
npm run test:perf:baseline

# Run comparison (on feature branch)
npm run test:perf

# View results
cat .reassure/output.md
```

## CI Integration

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  pull_request:
    branches: [main]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      # Checkout main and create baseline
      - name: Checkout main
        run: git checkout main

      - name: Create baseline
        run: npm run test:perf:baseline

      # Return to PR branch and compare
      - name: Checkout PR
        run: git checkout ${{ github.head_ref }}

      - name: Run performance tests
        run: npm run test:perf

      - name: Comment PR with results
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const results = fs.readFileSync('.reassure/output.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: results
            });
```

## Manual Performance Profiling

### React Native Performance Monitor

```typescript
// Enable in development
if (__DEV__) {
  // Show performance overlay
  // Settings > Dev Menu > Show Perf Monitor
}
```

### Flipper Integration

```typescript
// Install Flipper plugin for React DevTools
// View component render times and re-renders
```

### Console Timing

```typescript
// Quick performance check
console.time('TaskList render');
// ... render operation
console.timeEnd('TaskList render');
```

## Performance Budgets

Define acceptable thresholds:

```javascript
// reassure.config.js
module.exports = {
  runs: 10,
  outputFile: '.reassure/output.json',

  // Fail if regression exceeds these thresholds
  thresholds: {
    renderTime: {
      regression: 20, // 20% slower = fail
    },
    renderCount: {
      regression: 10, // 10% more renders = fail
    },
  },
};
```

## Common Performance Issues

### 1. Unnecessary Re-renders

```typescript
// BAD - Creates new object every render
<TaskCard task={task} style={{ marginBottom: 10 }} />

// GOOD - Memoize styles
const styles = StyleSheet.create({
  card: { marginBottom: 10 },
});
<TaskCard task={task} style={styles.card} />
```

### 2. Missing Keys in Lists

```typescript
// BAD - Index as key
tasks.map((task, index) => <TaskCard key={index} task={task} />)

// GOOD - Stable unique key
tasks.map((task) => <TaskCard key={task.id} task={task} />)
```

### 3. Heavy Computations in Render

```typescript
// BAD - Sorts on every render
function TaskList({ tasks }) {
  const sorted = tasks.sort((a, b) => a.date - b.date);
  return sorted.map(...);
}

// GOOD - Memoize expensive operations
function TaskList({ tasks }) {
  const sorted = useMemo(
    () => [...tasks].sort((a, b) => a.date - b.date),
    [tasks]
  );
  return sorted.map(...);
}
```

### 4. Missing useCallback

```typescript
// BAD - New function every render
<TaskCard onPress={() => handlePress(task.id)} />

// GOOD - Memoized callback
const handlePress = useCallback((id) => {
  navigation.navigate('TaskDetail', { id });
}, [navigation]);
```

### 5. Large Images

```typescript
// BAD - Full resolution image
<Image source={{ uri: user.avatarUrl }} />

// GOOD - Resized image with caching
<Image
  source={{ uri: `${user.avatarUrl}?w=100&h=100` }}
  style={{ width: 50, height: 50 }}
  cachePolicy="memory-disk"
/>
```

## Performance Checklist

- [ ] Reassure configured and running in CI
- [ ] Performance budgets defined
- [ ] FlatList used for long lists (>50 items)
- [ ] Heavy computations memoized with useMemo
- [ ] Callbacks memoized with useCallback
- [ ] Styles created with StyleSheet.create
- [ ] Images optimized and cached
- [ ] No console.log in production
- [ ] Animations use native driver
- [ ] Bundle size monitored
