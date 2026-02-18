## Unit Testing Guide

Comprehensive guide for writing unit tests in the Mobile App Blueprint project.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Testing Components](#testing-components)
- [Testing Hooks](#testing-hooks)
- [Testing Services](#testing-services)
- [Mocking Strategies](#mocking-strategies)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## Overview

Unit tests are the foundation of our testing strategy. They:

- Test individual units in isolation
- Run quickly (entire suite <5 seconds)
- Are easy to write and maintain
- Provide fast feedback during development
- Make up 70% of our test suite

### What to Unit Test

- **Components**: Rendering, props, events, states
- **Hooks**: State management, side effects, returns
- **Services**: API calls, data transformations, business logic
- **Utils**: Pure functions, data manipulation, validation

### What NOT to Unit Test

- Third-party libraries (already tested)
- Implementation details (internal state)
- Integration between multiple units (use integration tests)
- Visual appearance (use snapshot tests)

## Test Structure

### File Organization

Co-locate tests with the code they test:

```
src/
  components/
    Button.tsx
    Button.test.tsx       ← Unit test here
  hooks/
    useAuth.ts
    useAuth.test.ts       ← Unit test here
  services/
    api.ts
    api.test.ts           ← Unit test here
```

### Test File Template

```typescript
/**
 * [Component/Hook/Service Name] Tests
 *
 * Brief description of what's being tested
 */

import { render, fireEvent } from '@testing-library/react-native'
import { ComponentName } from './ComponentName'

describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Reset mocks, clear state
  })

  // Teardown
  afterEach(() => {
    // Cleanup
  })

  // Test groups
  describe('Feature Group', () => {
    it('should do something specific', () => {
      // Arrange
      const props = { /* ... */ }

      // Act
      const { getByText } = render(<ComponentName {...props} />)

      // Assert
      expect(getByText('Expected')).toBeTruthy()
    })
  })
})
```

## Testing Components

### Basic Component Test

```typescript
import { render } from '@testing-library/react-native'
import { Button } from './Button'

describe('Button', () => {
  it('renders with title', () => {
    const { getByText } = render(
      <Button title="Click Me" onPress={() => {}} />
    )
    expect(getByText('Click Me')).toBeTruthy()
  })
})
```

### Testing Props

```typescript
it('applies custom styles', () => {
  const customStyle = { backgroundColor: 'red' }
  const { getByA11yRole } = render(
    <Button title="Styled" onPress={() => {}} style={customStyle} />
  )

  const button = getByA11yRole('button')
  expect(button.props.style).toMatchObject(
    expect.objectContaining(customStyle)
  )
})
```

### Testing Events

```typescript
import { fireEvent } from '@testing-library/react-native'

it('calls onPress when pressed', () => {
  const onPressMock = jest.fn()
  const { getByText } = render(
    <Button title="Click" onPress={onPressMock} />
  )

  fireEvent.press(getByText('Click'))
  expect(onPressMock).toHaveBeenCalledTimes(1)
})
```

### Testing State Changes

```typescript
it('toggles visibility', () => {
  const { getByText, queryByText } = render(<ToggleComponent />)

  // Initially hidden
  expect(queryByText('Hidden Content')).toBeNull()

  // Click toggle
  fireEvent.press(getByText('Toggle'))

  // Now visible
  expect(getByText('Hidden Content')).toBeTruthy()
})
```

### Testing Conditional Rendering

```typescript
it('shows loading state', () => {
  const { getByTestId } = render(
    <Button title="Submit" onPress={() => {}} loading />
  )
  expect(getByTestId('loading-indicator')).toBeTruthy()
})

it('hides text when loading', () => {
  const { queryByText } = render(
    <Button title="Submit" onPress={() => {}} loading />
  )
  expect(queryByText('Submit')).toBeNull()
})
```

### Testing with Providers

```typescript
import { renderWithProviders } from '../../utils/testUtils'

it('uses theme correctly', () => {
  const { getByText } = renderWithProviders(
    <ThemedButton title="Themed" />,
    { theme: 'dark' }
  )
  expect(getByText('Themed')).toBeTruthy()
})
```

## Testing Hooks

### Basic Hook Test

```typescript
import { renderHook } from '@testing-library/react-native'
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter())
    expect(result.current.count).toBe(0)
  })
})
```

### Testing Hook State Updates

```typescript
import { renderHook, act } from '@testing-library/react-native'

it('increments counter', () => {
  const { result } = renderHook(() => useCounter())

  act(() => {
    result.current.increment()
  })

  expect(result.current.count).toBe(1)
})
```

### Testing Async Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react-native'

it('fetches data', async () => {
  const { result } = renderHook(() => useData())

  expect(result.current.loading).toBe(true)

  await waitFor(() => {
    expect(result.current.loading).toBe(false)
  })

  expect(result.current.data).toBeDefined()
})
```

### Testing Hook with Dependencies

```typescript
it('updates when dependency changes', () => {
  const { result, rerender } = renderHook(
    ({ id }) => useData(id),
    { initialProps: { id: 1 } }
  )

  expect(result.current.data.id).toBe(1)

  rerender({ id: 2 })

  expect(result.current.data.id).toBe(2)
})
```

### Testing Hook Cleanup

```typescript
it('cleans up on unmount', () => {
  const unsubscribe = jest.fn()
  jest.mock('./subscription', () => ({
    subscribe: jest.fn(() => unsubscribe),
  }))

  const { unmount } = renderHook(() => useSubscription())

  unmount()

  expect(unsubscribe).toHaveBeenCalled()
})
```

## Testing Services

### Testing API Calls

```typescript
import { fetchUser } from './api'

describe('API Service', () => {
  it('fetches user successfully', async () => {
    const mockUser = { id: '1', name: 'Test' }

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUser),
      })
    ) as jest.Mock

    const user = await fetchUser('1')

    expect(user).toEqual(mockUser)
    expect(fetch).toHaveBeenCalledWith('/api/users/1')
  })
})
```

### Testing Error Handling

```typescript
it('handles fetch errors', async () => {
  global.fetch = jest.fn(() =>
    Promise.reject(new Error('Network error'))
  ) as jest.Mock

  await expect(fetchUser('1')).rejects.toThrow('Network error')
})
```

### Testing Data Transformations

```typescript
import { transformUserData } from './transformers'

it('transforms user data correctly', () => {
  const input = {
    first_name: 'John',
    last_name: 'Doe',
  }

  const output = transformUserData(input)

  expect(output).toEqual({
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
  })
})
```

### Testing Business Logic

```typescript
import { calculatePrice } from './pricing'

describe('Pricing Service', () => {
  it('calculates price with tax', () => {
    const basePrice = 100
    const taxRate = 0.1
    const result = calculatePrice(basePrice, taxRate)
    expect(result).toBe(110)
  })

  it('applies discount correctly', () => {
    const price = 100
    const discount = 0.2
    const result = calculatePrice(price, 0, discount)
    expect(result).toBe(80)
  })
})
```

## Mocking Strategies

### Mocking Modules

```typescript
// Mock entire module
jest.mock('@/services/api', () => ({
  fetchUser: jest.fn(() => Promise.resolve({ id: '1' })),
}))

// Mock specific functions
jest.mock('@/services/api')
import { fetchUser } from '@/services/api'
(fetchUser as jest.Mock).mockResolvedValue({ id: '1' })
```

### Mocking React Native APIs

```typescript
// Mock in jest.setup.js
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')
jest.mock('@react-native-async-storage/async-storage')
```

### Mocking Navigation

```typescript
const mockNavigate = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockNavigate,
    replace: jest.fn(),
    back: jest.fn(),
  }),
}))
```

### Mocking Supabase

```typescript
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(() =>
      Promise.resolve({ data: { id: '1' }, error: null })
    ),
  })),
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}))
```

### Mocking Timers

```typescript
describe('Timer Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('calls callback after delay', () => {
    const callback = jest.fn()
    setTimeout(callback, 1000)

    jest.advanceTimersByTime(1000)

    expect(callback).toHaveBeenCalled()
  })
})
```

## Best Practices

### 1. Follow AAA Pattern

```typescript
it('increments counter', () => {
  // Arrange - Set up test data
  const { result } = renderHook(() => useCounter(0))

  // Act - Perform action
  act(() => {
    result.current.increment()
  })

  // Assert - Verify result
  expect(result.current.count).toBe(1)
})
```

### 2. Test Behavior, Not Implementation

```typescript
// ✅ Good - Tests behavior
it('shows success message after submission', async () => {
  const { getByText, findByText } = render(<Form />)
  fireEvent.press(getByText('Submit'))
  expect(await findByText('Success!')).toBeTruthy()
})

// ❌ Bad - Tests implementation
it('sets submitting state to true', () => {
  const { result } = renderHook(() => useForm())
  act(() => result.current.submit())
  expect(result.current.submitting).toBe(true)
})
```

### 3. Keep Tests Independent

```typescript
// ✅ Good - Independent tests
describe('Counter', () => {
  it('starts at 0', () => {
    const { result } = renderHook(() => useCounter())
    expect(result.current.count).toBe(0)
  })

  it('increments from 0', () => {
    const { result } = renderHook(() => useCounter())
    act(() => result.current.increment())
    expect(result.current.count).toBe(1)
  })
})

// ❌ Bad - Dependent tests
describe('Counter', () => {
  const { result } = renderHook(() => useCounter())

  it('starts at 0', () => {
    expect(result.current.count).toBe(0)
  })

  it('increments', () => {
    // Depends on previous test state!
    act(() => result.current.increment())
    expect(result.current.count).toBe(1)
  })
})
```

### 4. Use Descriptive Names

```typescript
// ✅ Good
it('disables submit button when form is invalid', () => {})
it('shows error message when email is invalid', () => {})
it('calls onSuccess callback after successful submission', () => {})

// ❌ Bad
it('test 1', () => {})
it('button disabled', () => {})
it('works', () => {})
```

### 5. Test Edge Cases

```typescript
describe('Input Validation', () => {
  it('accepts valid email', () => {})
  it('rejects email without @', () => {})
  it('rejects email without domain', () => {})
  it('handles empty string', () => {})
  it('handles null value', () => {})
  it('handles undefined value', () => {})
  it('handles very long email', () => {})
  it('handles special characters', () => {})
})
```

### 6. Don't Test Third-Party Code

```typescript
// ❌ Bad - Tests React Native TextInput
it('TextInput accepts text', () => {
  const { getByPlaceholder } = render(
    <TextInput placeholder="Test" />
  )
  fireEvent.changeText(getByPlaceholder('Test'), 'hello')
  // React Native already tests this!
})

// ✅ Good - Tests your component's behavior
it('validates email on input change', () => {
  const { getByPlaceholder, findByText } = render(<EmailInput />)
  fireEvent.changeText(getByPlaceholder('Email'), 'invalid')
  expect(await findByText('Invalid email')).toBeTruthy()
})
```

### 7. Clean Up After Tests

```typescript
describe('Component', () => {
  let mockFn: jest.Mock

  beforeEach(() => {
    mockFn = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it('test case', () => {
    // Test uses mockFn
  })
})
```

## Common Patterns

### Testing Forms

```typescript
describe('LoginForm', () => {
  it('submits with valid credentials', async () => {
    const onSubmit = jest.fn()
    const { getByPlaceholderText, getByText } = render(
      <LoginForm onSubmit={onSubmit} />
    )

    fireEvent.changeText(
      getByPlaceholderText('Email'),
      'test@example.com'
    )
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123')
    fireEvent.press(getByText('Submit'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })
})
```

### Testing Lists

```typescript
describe('TaskList', () => {
  it('renders all tasks', () => {
    const tasks = [
      { id: '1', title: 'Task 1' },
      { id: '2', title: 'Task 2' },
    ]

    const { getByText } = render(<TaskList tasks={tasks} />)

    expect(getByText('Task 1')).toBeTruthy()
    expect(getByText('Task 2')).toBeTruthy()
  })

  it('handles empty list', () => {
    const { getByText } = render(<TaskList tasks={[]} />)
    expect(getByText('No tasks')).toBeTruthy()
  })
})
```

### Testing Navigation

```typescript
describe('Navigation', () => {
  it('navigates to detail screen', () => {
    const mockPush = jest.fn()
    jest.mock('expo-router', () => ({
      useRouter: () => ({ push: mockPush }),
    }))

    const { getByText } = render(<ItemList />)
    fireEvent.press(getByText('Item 1'))

    expect(mockPush).toHaveBeenCalledWith('/details/1')
  })
})
```

## Troubleshooting

### Test Times Out

```typescript
// Increase timeout
it('slow test', async () => {
  // test code
}, 10000) // 10 second timeout
```

### Async Code Not Waiting

```typescript
// Use waitFor
import { waitFor } from '@testing-library/react-native'

it('waits for async operation', async () => {
  const { getByText } = render(<AsyncComponent />)

  await waitFor(() => {
    expect(getByText('Loaded')).toBeTruthy()
  })
})
```

### Act Warning

```typescript
// Wrap state updates in act()
import { act } from '@testing-library/react-native'

it('updates state', () => {
  const { result } = renderHook(() => useState(0))

  act(() => {
    result.current[1](1)
  })

  expect(result.current[0]).toBe(1)
})
```

### Mock Not Working

```typescript
// Mock before importing
jest.mock('./module')
import { function } from './module'

// Not the other way around!
```

## Resources

- [React Native Testing Library Docs](https://callstack.github.io/react-native-testing-library/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Examples

See example tests in this directory:

- `components/Button.test.tsx` - Component testing
- `hooks/useAuth.test.ts` - Hook testing
- `services/taskService.test.ts` - Service testing
