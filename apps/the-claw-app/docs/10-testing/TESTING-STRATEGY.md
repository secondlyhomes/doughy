# Testing Strategy

## The Testing Pyramid

```
        /\
       /  \     E2E Tests (10%)
      /----\    - Critical user flows
     /      \   - Slow, expensive
    /--------\
   /          \ Integration Tests (20%)
  /------------\ - API, database
 /              \- Medium speed
/----------------\
       Unit Tests (70%)
       - Components, hooks, utils
       - Fast, cheap
```

## Coverage Goals

| Category | Target | Priority |
|----------|--------|----------|
| Business Logic | 90%+ | Critical |
| Hooks | 80%+ | High |
| Utils | 80%+ | High |
| Components | 60%+ | Medium |
| Screens | 40%+ | Low |

### Why 70% Global Coverage?

We target 70% global coverage (vs. 80%+ common in web apps) because:

1. **Mobile-specific code** - Platform-specific code, native module bridges, and device APIs are difficult to unit test and better covered by E2E tests
2. **UI-heavy codebase** - React Native apps have higher UI-to-logic ratios; testing visual components provides diminishing returns
3. **E2E coverage** - Critical user flows are covered by Maestro E2E tests, reducing need for unit test duplication
4. **Diminishing returns** - Beyond 70%, each percentage point requires disproportionate effort for marginal bug prevention

**Note:** Business logic (services, utils) still targets 90%+ coverage. The 70% global threshold reflects the UI layer's lower coverage targets.

## Test Types

### 1. Unit Tests (Jest)

Fast tests for isolated logic:

```typescript
// src/__tests__/utils/dateParser.test.ts
import { parseDate } from '@/utils/dateParser';

describe('parseDate', () => {
  it('parses "tomorrow" correctly', () => {
    const result = parseDate('tomorrow');
    expect(result.getDate()).toBe(new Date().getDate() + 1);
  });

  it('returns null for invalid input', () => {
    expect(parseDate('not a date')).toBeNull();
  });
});
```

### 2. Integration Tests

Test API and database interactions:

```typescript
// src/__tests__/integration/taskService.test.ts
import { createTask, getTask } from '@/services/tasks';

describe('Task Service', () => {
  it('creates and retrieves a task', async () => {
    const created = await createTask({ title: 'Test Task' });
    const retrieved = await getTask(created.id);

    expect(retrieved.title).toBe('Test Task');
  });
});
```

### 3. E2E Tests (Maestro)

Test complete user flows:

```yaml
# e2e/create-task.yaml
appId: com.yourapp.app
---
- launchApp
- tapOn: "Add Task"
- inputText:
    id: "task-title"
    text: "Buy groceries"
- tapOn: "Save"
- assertVisible: "Buy groceries"
```

## Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

## Jest Setup

```javascript
// jest.setup.js
import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

// Silence console.warn in tests
global.console.warn = jest.fn();
```

## Running Tests

```bash
# Run all tests
npm test

# Watch mode (for development)
npm test -- --watch

# Run specific file
npm test -- taskService.test.ts

# Run with coverage
npm test -- --coverage

# Run only changed files
npm test -- --onlyChanged
```

## Pre-Commit Hooks

Set up with Husky:

```bash
npx husky install
npx husky add .husky/pre-commit "npm test -- --onlyChanged"
```

## CI/CD Testing

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm test -- --coverage
      - run: npx tsc --noEmit

      - name: Upload coverage
        uses: codecov/codecov-action@v4
```

## Testing Hooks

```typescript
// src/hooks/__tests__/useAuth.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '../useAuth';

describe('useAuth', () => {
  it('starts logged out', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoggedIn).toBe(false);
  });

  it('logs in user', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('email@test.com', 'password');
    });

    expect(result.current.isLoggedIn).toBe(true);
  });
});
```

## Testing Components

```typescript
// src/components/__tests__/TaskCard.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { TaskCard } from '../TaskCard';

describe('TaskCard', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    status: 'pending',
  };

  it('renders task title', () => {
    const { getByText } = render(<TaskCard task={mockTask} />);
    expect(getByText('Test Task')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <TaskCard task={mockTask} onPress={onPress} />
    );

    fireEvent.press(getByText('Test Task'));
    expect(onPress).toHaveBeenCalledWith(mockTask.id);
  });
});
```

## Mocking Best Practices

### Mock External Services

```typescript
// __mocks__/supabase.ts
export const supabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({ data: [], error: null })),
    insert: jest.fn(() => ({ data: { id: '1' }, error: null })),
    update: jest.fn(() => ({ data: {}, error: null })),
    delete: jest.fn(() => ({ data: {}, error: null })),
  })),
  auth: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
  },
};
```

### Don't Over-Mock

```typescript
// BAD - Mocking implementation details
jest.mock('../utils/formatDate', () => ({
  formatDate: () => 'Jan 1, 2024',
}));

// GOOD - Test with real implementation, mock only external deps
import { formatDate } from '../utils/formatDate';

it('formats date correctly', () => {
  expect(formatDate(new Date('2024-01-01'))).toBe('Jan 1, 2024');
});
```

## Checklist

Before submitting PR:
- [ ] All tests pass (`npm test`)
- [ ] Coverage meets thresholds
- [ ] New code has tests
- [ ] No console.log in tests
- [ ] Mocks are cleaned up after tests
