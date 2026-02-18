# Testing Quick Start Guide

Get started with testing in the Mobile App Blueprint in 5 minutes.

## TL;DR

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- Button.test.tsx
```

## Your First Test

### 1. Create a Component

```tsx
// src/components/Counter.tsx
import { useState } from 'react'
import { View, Text, Button } from 'react-native'

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <View>
      <Text testID="count-text">Count: {count}</Text>
      <Button
        testID="increment-button"
        title="Increment"
        onPress={() => setCount(count + 1)}
      />
    </View>
  )
}
```

### 2. Create the Test

```tsx
// src/components/Counter.test.tsx
import { render, fireEvent } from '@testing-library/react-native'
import { Counter } from './Counter'

describe('Counter', () => {
  it('increments count when button is pressed', () => {
    // Arrange
    const { getByTestId } = render(<Counter />)

    // Act
    fireEvent.press(getByTestId('increment-button'))

    // Assert
    expect(getByTestId('count-text')).toHaveTextContent('Count: 1')
  })
})
```

### 3. Run the Test

```bash
npm test -- Counter.test.tsx
```

That's it! ✅

## Common Test Patterns

### Testing Props

```tsx
it('renders with custom title', () => {
  const { getByText } = render(<Button title="Click Me" onPress={() => {}} />)
  expect(getByText('Click Me')).toBeTruthy()
})
```

### Testing Events

```tsx
it('calls onPress when pressed', () => {
  const onPressMock = jest.fn()
  const { getByText } = render(<Button title="Click" onPress={onPressMock} />)

  fireEvent.press(getByText('Click'))

  expect(onPressMock).toHaveBeenCalledTimes(1)
})
```

### Testing State Changes

```tsx
it('shows error when validation fails', async () => {
  const { getByPlaceholderText, getByText, findByText } = render(<LoginForm />)

  fireEvent.changeText(getByPlaceholderText('Email'), 'invalid')
  fireEvent.press(getByText('Submit'))

  expect(await findByText('Invalid email')).toBeTruthy()
})
```

### Testing Async Operations

```tsx
it('loads data', async () => {
  const { findByText } = render(<DataComponent />)

  // Wait for data to load
  expect(await findByText('Loaded Data')).toBeTruthy()
})
```

### Testing with Hooks

```tsx
import { renderHook, act } from '@testing-library/react-native'

it('increments counter', () => {
  const { result } = renderHook(() => useCounter())

  act(() => {
    result.current.increment()
  })

  expect(result.current.count).toBe(1)
})
```

## Test Utilities

### Render with Providers

```tsx
import { renderWithProviders } from '../../.examples/testing/utils/testUtils'

it('uses theme correctly', () => {
  const { getByText } = renderWithProviders(
    <ThemedComponent />,
    { theme: 'dark' }
  )
  expect(getByText('Content')).toBeTruthy()
})
```

### Create Mock Data

```tsx
import { createMockUser } from '../../.examples/testing/utils/testUtils'

it('displays user info', () => {
  const user = createMockUser({ name: 'John Doe' })
  const { getByText } = render(<UserProfile user={user} />)
  expect(getByText('John Doe')).toBeTruthy()
})
```

## Mocking

### Mock a Module

```tsx
jest.mock('@/services/api', () => ({
  fetchUser: jest.fn(() => Promise.resolve({ id: '1', name: 'Test' })),
}))
```

### Mock Navigation

```tsx
const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

it('navigates to details', () => {
  const { getByText } = render(<ItemList />)
  fireEvent.press(getByText('Item 1'))
  expect(mockPush).toHaveBeenCalledWith('/details/1')
})
```

### Mock Supabase

Supabase is already mocked globally in `jest.setup.js`. Use it like this:

```tsx
it('fetches tasks', async () => {
  const mockSupabase = global.mockSupabaseClient

  mockSupabase.from.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    then: jest.fn((resolve) =>
      resolve({ data: [{ id: '1', title: 'Task 1' }], error: null })
    ),
  })

  const { findByText } = render(<TaskList />)
  expect(await findByText('Task 1')).toBeTruthy()
})
```

## Debugging Tests

### Run Single Test

```bash
npm test -- MyComponent.test.tsx
```

### Run in Watch Mode

```bash
npm test -- --watch
```

### Debug in VSCode

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "${file}"],
  "console": "integratedTerminal"
}
```

### Log in Tests

```tsx
it('debug test', () => {
  const { debug } = render(<Component />)
  debug() // Prints component tree
})
```

## Coverage

### View Coverage

```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

### Coverage Requirements

- **Statements**: 70%
- **Branches**: 60%
- **Functions**: 70%
- **Lines**: 70%

## E2E Tests (Detox)

### Setup

```bash
# Install Detox CLI
npm install -g detox-cli

# Build app
npm run e2e:build:ios

# Run tests
npm run e2e:test:ios
```

### Write E2E Test

```typescript
// e2e/my-flow.e2e.ts
import { device, element, by, expect as detoxExpect } from 'detox'

describe('My Flow', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  it('completes flow', async () => {
    await element(by.id('input')).typeText('test')
    await element(by.id('submit')).tap()
    await detoxExpect(element(by.text('Success'))).toBeVisible()
  })
})
```

## Best Practices

### ✅ Do

- Co-locate tests with code
- Use descriptive test names
- Test behavior, not implementation
- Mock external dependencies
- Keep tests independent
- Test edge cases
- Use testID for E2E tests

### ❌ Don't

- Test third-party libraries
- Test implementation details
- Write dependent tests
- Skip error scenarios
- Ignore flaky tests
- Commit failing tests

## Getting Help

1. **Read the docs**: `.examples/testing/README.md`
2. **Check examples**: `.examples/testing/unit/components/Button.test.tsx`
3. **Use utilities**: `.examples/testing/utils/testUtils.tsx`
4. **Ask the team**: Team chat or create an issue

## Cheat Sheet

| Task | Command |
|------|---------|
| Run all tests | `npm test` |
| Run in watch mode | `npm test -- --watch` |
| Run with coverage | `npm test -- --coverage` |
| Run single file | `npm test -- MyFile.test.tsx` |
| Update snapshots | `npm test -- -u` |
| Run unit tests | `npm run test:unit` |
| Run integration tests | `npm run test:integration` |
| Run E2E tests | `npm run e2e:test:ios` |
| Debug tests | `npm run test:debug` |

## What to Test

### Always Test

- ✅ User interactions (clicks, typing, etc.)
- ✅ Conditional rendering (loading, error states)
- ✅ Form validation
- ✅ Navigation
- ✅ Error handling
- ✅ Edge cases (empty, null, long text)

### Don't Test

- ❌ Third-party libraries
- ❌ Constants/configuration
- ❌ Simple getters/setters
- ❌ Implementation details

## Next Steps

1. **Read** the main testing guide: `.examples/testing/README.md`
2. **Review** the Button test example: `.examples/testing/unit/components/Button.test.tsx`
3. **Write** tests for your components
4. **Run** tests before committing: `npm test`
5. **Check** coverage: `npm test -- --coverage`

---

**Happy Testing!** 🎉

For detailed guides, see:
- Unit Testing: `.examples/testing/unit/README.md`
- E2E Testing: `e2e/README.md`
- Full Guide: `.examples/testing/README.md`
