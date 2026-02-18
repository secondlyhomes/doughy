# Unit Testing Guide

## Overview

Unit tests verify individual functions, hooks, and components work correctly in isolation. They're fast, cheap, and should make up 70% of your tests.

## Setup

### Install Dependencies

```bash
npm install --save-dev jest jest-expo @testing-library/react-native @testing-library/jest-native
```

### Jest Configuration

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
    '!src/**/*.stories.tsx',
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
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
```

### Jest Setup File

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
  notificationAsync: jest.fn(),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Silence specific warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes('Animated')) return;
  originalWarn(...args);
};
```

## Testing Patterns

### Testing Utility Functions

```typescript
// src/utils/__tests__/formatDate.test.ts
import { formatDate, formatRelativeDate } from '../formatDate';

describe('formatDate', () => {
  it('formats ISO date to readable string', () => {
    const result = formatDate('2024-01-15T10:30:00Z');
    expect(result).toBe('Jan 15, 2024');
  });

  it('handles null gracefully', () => {
    expect(formatDate(null)).toBe('');
  });

  it('handles invalid date', () => {
    expect(formatDate('not-a-date')).toBe('Invalid date');
  });
});

describe('formatRelativeDate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns "Today" for today', () => {
    expect(formatRelativeDate('2024-01-15')).toBe('Today');
  });

  it('returns "Tomorrow" for tomorrow', () => {
    expect(formatRelativeDate('2024-01-16')).toBe('Tomorrow');
  });

  it('returns "Yesterday" for yesterday', () => {
    expect(formatRelativeDate('2024-01-14')).toBe('Yesterday');
  });
});
```

### Testing Async Functions

```typescript
// src/services/__tests__/taskService.test.ts
import { createTask, getTask, updateTask } from '../taskService';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase');

describe('taskService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('creates task and returns it', async () => {
      const mockTask = { id: '1', title: 'Test Task' };
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockTask, error: null }),
          }),
        }),
      });

      const result = await createTask({ title: 'Test Task' });

      expect(result).toEqual(mockTask);
      expect(supabase.from).toHaveBeenCalledWith('tasks');
    });

    it('throws on Supabase error', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Insert failed' },
            }),
          }),
        }),
      });

      await expect(createTask({ title: 'Test' })).rejects.toThrow('Insert failed');
    });
  });
});
```

### Testing React Hooks

```typescript
// src/hooks/__tests__/useCounter.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useCounter } from '../useCounter';

describe('useCounter', () => {
  it('starts with initial value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('increments count', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('decrements count', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });

  it('resets to initial value', () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });

    expect(result.current.count).toBe(10);
  });
});
```

### Testing Hooks with Context

```typescript
// src/hooks/__tests__/useAuth.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-hooks';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '../useAuth';

const wrapper = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  it('starts logged out', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('logs in user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(true);
    });
  });

  it('logs out user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Login first
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    // Then logout
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isLoggedIn).toBe(false);
  });
});
```

### Testing Components

```typescript
// src/components/__tests__/TaskCard.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TaskCard } from '../TaskCard';

describe('TaskCard', () => {
  const mockTask = {
    id: '1',
    title: 'Buy groceries',
    description: 'Milk, eggs, bread',
    status: 'pending',
    dueDate: '2024-01-20',
  };

  it('renders task title', () => {
    const { getByText } = render(<TaskCard task={mockTask} />);
    expect(getByText('Buy groceries')).toBeTruthy();
  });

  it('renders task description', () => {
    const { getByText } = render(<TaskCard task={mockTask} />);
    expect(getByText('Milk, eggs, bread')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <TaskCard task={mockTask} onPress={onPress} />
    );

    fireEvent.press(getByText('Buy groceries'));
    expect(onPress).toHaveBeenCalledWith('1');
  });

  it('calls onComplete when checkbox pressed', () => {
    const onComplete = jest.fn();
    const { getByTestId } = render(
      <TaskCard task={mockTask} onComplete={onComplete} />
    );

    fireEvent.press(getByTestId('complete-checkbox'));
    expect(onComplete).toHaveBeenCalledWith('1');
  });

  it('shows completed style when task is done', () => {
    const completedTask = { ...mockTask, status: 'completed' };
    const { getByText } = render(<TaskCard task={completedTask} />);

    const title = getByText('Buy groceries');
    expect(title.props.style).toContainEqual(
      expect.objectContaining({ textDecorationLine: 'line-through' })
    );
  });
});
```

### Snapshot Testing

```typescript
// src/components/__tests__/Button.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('matches snapshot - primary', () => {
    const { toJSON } = render(
      <Button variant="primary" onPress={() => {}}>
        Click Me
      </Button>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('matches snapshot - secondary', () => {
    const { toJSON } = render(
      <Button variant="secondary" onPress={() => {}}>
        Click Me
      </Button>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('matches snapshot - disabled', () => {
    const { toJSON } = render(
      <Button disabled onPress={() => {}}>
        Click Me
      </Button>
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
```

## Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Run specific file
npm test -- taskService.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="creates task"

# With coverage
npm test -- --coverage

# Update snapshots
npm test -- --updateSnapshot
```

## Coverage Goals

| Category | Target | Notes |
|----------|--------|-------|
| Utils | 90%+ | Pure functions, easy to test |
| Services | 80%+ | Mock external dependencies |
| Hooks | 80%+ | Test all state transitions |
| Components | 60%+ | Focus on behavior, not visuals |

## Anti-Patterns

### Don't Test Implementation Details

```typescript
// BAD - Testing internal state
it('sets loading to true', () => {
  const { result } = renderHook(() => useTasks());
  expect(result.current._internalLoading).toBe(true);
});

// GOOD - Test observable behavior
it('shows loading indicator while fetching', () => {
  const { result } = renderHook(() => useTasks());
  expect(result.current.isLoading).toBe(true);
});
```

### Don't Over-Mock

```typescript
// BAD - Mocking everything
jest.mock('../utils/formatDate');
jest.mock('../utils/validateEmail');

// GOOD - Only mock external dependencies
jest.mock('@/lib/supabase');
// Let formatDate and validateEmail run naturally
```

### Don't Write Brittle Tests

```typescript
// BAD - Depends on exact text
expect(getByText('Error: Invalid email address provided')).toBeTruthy();

// GOOD - Flexible assertion
expect(getByText(/invalid email/i)).toBeTruthy();
```

## Checklist

- [ ] Jest configured with jest-expo preset
- [ ] Setup file mocks native modules
- [ ] Coverage thresholds set (70%+)
- [ ] Utils have 90%+ coverage
- [ ] Hooks test all state changes
- [ ] Components test user interactions
- [ ] No implementation detail tests
- [ ] Tests run in under 60 seconds
