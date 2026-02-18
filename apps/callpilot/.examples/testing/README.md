## Testing Strategy & Guide

Comprehensive testing infrastructure for the Mobile App Blueprint project.

## Table of Contents

- [Overview](#overview)
- [Test Pyramid](#test-pyramid)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Coverage Requirements](#coverage-requirements)
- [CI/CD Integration](#ci-cd-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

This project uses a comprehensive testing strategy covering:

- **Unit Tests** (70%): Fast, isolated tests for components, hooks, and services
- **Integration Tests** (20%): Tests for feature workflows and component integration
- **E2E Tests** (10%): Full application tests on real/simulated devices
- **Visual Regression Tests**: Snapshot tests for UI consistency
- **Performance Tests**: Render time and memory usage tests

### Testing Tools

- **Jest**: Test runner and assertion library
- **React Native Testing Library**: Component testing utilities
- **Detox**: E2E testing framework
- **jest-image-snapshot**: Visual regression testing

## Test Pyramid

```
           /\
          /  \
         / E2E \         10% - Full application flows
        /--------\
       /          \
      / Integration \    20% - Feature workflows
     /--------------\
    /                \
   /   Unit Tests     \  70% - Components, hooks, services
  /____________________\
```

### Why This Distribution?

- **Unit tests** are fast, focused, and easy to maintain
- **Integration tests** verify features work together correctly
- **E2E tests** catch issues users would experience, but are slower and more brittle

## Getting Started

### Installation

Install testing dependencies:

```bash
npm install --save-dev \
  jest \
  @testing-library/react-native \
  @testing-library/jest-native \
  detox \
  jest-image-snapshot
```

### Configuration

The project includes pre-configured testing setup:

- `jest.config.js` - Jest configuration
- `jest.setup.js` - Global test setup and mocks
- `.detoxrc.js` - Detox E2E configuration
- `e2e/jest.config.js` - E2E test configuration

## Running Tests

### All Tests

```bash
# Run all unit and integration tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode (for development)
npm test -- --watch
```

### Unit Tests Only

```bash
# Run specific test file
npm test -- Button.test.tsx

# Run tests matching pattern
npm test -- --testPathPattern=components

# Update snapshots
npm test -- -u
```

### Integration Tests

```bash
# Run integration tests
npm test -- --testPathPattern=integration

# Run specific integration test
npm test -- auth-flow.test.tsx
```

### E2E Tests

```bash
# Build app for E2E testing
detox build --configuration ios.debug

# Run E2E tests
detox test --configuration ios.debug

# Run specific E2E test
detox test --configuration ios.debug e2e/auth.e2e.ts

# Run with screenshots on failure
detox test --configuration ios.debug --take-screenshots failing
```

### Performance Tests

```bash
# Run performance tests
npm test -- --testPathPattern=performance

# Run with detailed output
npm test -- --testPathPattern=performance --verbose
```

## Writing Tests

### Unit Tests

Unit tests should be co-located with the code they test:

```
src/
  components/
    Button.tsx
    Button.test.tsx  ← Unit test here
```

Example unit test:

```typescript
import { render, fireEvent } from '@testing-library/react-native'
import { Button } from './Button'

describe('Button', () => {
  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn()
    const { getByText } = render(
      <Button title="Click" onPress={onPressMock} />
    )

    fireEvent.press(getByText('Click'))
    expect(onPressMock).toHaveBeenCalledTimes(1)
  })
})
```

### Integration Tests

Integration tests go in `.examples/testing/integration/`:

```typescript
import { renderWithProviders } from '../utils/testUtils'

describe('Auth Flow Integration', () => {
  it('completes sign up → login → logout flow', async () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(
      <App />
    )

    // Test complete flow...
  })
})
```

### E2E Tests

E2E tests go in `e2e/` directory:

```typescript
import { device, element, by, expect as detoxExpect } from 'detox'

describe('Auth E2E', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  it('should sign in user', async () => {
    await element(by.id('email-input')).typeText('test@example.com')
    await element(by.id('password-input')).typeText('password123')
    await element(by.id('submit-button')).tap()

    await detoxExpect(element(by.id('home-screen'))).toBeVisible()
  })
})
```

## Coverage Requirements

### Global Coverage Thresholds

Enforced on CI:

- **Statements**: 70%
- **Branches**: 60%
- **Functions**: 70%
- **Lines**: 70%

### Per-File Coverage

Critical files should have higher coverage:

- Authentication: 90%+
- Payment processing: 95%+
- Data services: 85%+
- UI components: 70%+

### Viewing Coverage

```bash
# Generate coverage report
npm test -- --coverage

# Open HTML report
open coverage/lcov-report/index.html
```

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/test.yml`:

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test -- --ci --coverage --maxWorkers=2
      - uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

Tests run automatically before commits:

```bash
# In .husky/pre-commit
npm test -- --passWithNoTests --findRelatedTests
npx tsc --noEmit
```

## Best Practices

### 1. Test Naming

Use descriptive test names that explain intent:

```typescript
// ✅ Good
it('should disable submit button when form is invalid', () => {})

// ❌ Bad
it('test button', () => {})
```

### 2. Arrange-Act-Assert Pattern

Structure tests clearly:

```typescript
it('should increment counter', () => {
  // Arrange
  const { getByText } = render(<Counter />)

  // Act
  fireEvent.press(getByText('Increment'))

  // Assert
  expect(getByText('Count: 1')).toBeTruthy()
})
```

### 3. Test One Thing

Each test should verify a single behavior:

```typescript
// ✅ Good - One assertion
it('should show loading state', () => {
  const { getByTestId } = render(<Button loading />)
  expect(getByTestId('loading-spinner')).toBeTruthy()
})

// ❌ Bad - Multiple concerns
it('should work correctly', () => {
  // Tests loading, disabled, onPress, styling...
})
```

### 4. Use Test Utilities

Leverage shared test utilities:

```typescript
import { renderWithProviders, createMockUser } from '../utils/testUtils'

it('should show user profile', () => {
  const user = createMockUser({ name: 'John' })
  const { getByText } = renderWithProviders(
    <Profile />,
    { authenticated: true, user }
  )
  expect(getByText('John')).toBeTruthy()
})
```

### 5. Mock External Dependencies

Always mock:
- API calls
- Database queries
- Navigation
- Device APIs
- Third-party services

```typescript
jest.mock('@/services/api', () => ({
  fetchUser: jest.fn(() => Promise.resolve({ id: '1', name: 'Test' }))
}))
```

### 6. Test Edge Cases

Don't just test the happy path:

```typescript
describe('UserProfile', () => {
  it('renders with valid user', () => {})
  it('handles missing user data', () => {})
  it('handles undefined fields', () => {})
  it('handles null values', () => {})
  it('handles empty strings', () => {})
  it('handles special characters', () => {})
  it('handles very long names', () => {})
})
```

### 7. Avoid Implementation Details

Test behavior, not implementation:

```typescript
// ✅ Good - Tests behavior
it('should show error message when login fails', () => {
  // Test that error message appears
})

// ❌ Bad - Tests implementation
it('should set error state to true', () => {
  // Tests internal state
})
```

### 8. Keep Tests Fast

- Use `jest.mock()` instead of real implementations
- Avoid `setTimeout` and `setInterval`
- Use `jest.useFakeTimers()` for time-based tests
- Don't test third-party libraries

### 9. Use Snapshots Carefully

Snapshots are useful but can be brittle:

```typescript
// ✅ Good - Specific snapshot
it('matches snapshot for empty state', () => {
  const { toJSON } = render(<EmptyList />)
  expect(toJSON()).toMatchSnapshot()
})

// ❌ Bad - Large, complex snapshot
it('matches snapshot', () => {
  const { toJSON } = render(<EntireApp />)
  expect(toJSON()).toMatchSnapshot() // Too broad!
})
```

### 10. Test Accessibility

Always test accessibility:

```typescript
it('has proper accessibility labels', () => {
  const { getByA11yRole, getByA11yLabel } = render(<Button title="Submit" />)

  expect(getByA11yRole('button')).toBeTruthy()
  expect(getByA11yLabel('Submit')).toBeTruthy()
})
```

## Troubleshooting

### Tests Timeout

```bash
# Increase timeout
jest.setTimeout(10000)

# Or per test
it('slow test', async () => {
  // test code
}, 15000) // 15 second timeout
```

### Mock Not Working

```bash
# Clear mock between tests
beforeEach(() => {
  jest.clearAllMocks()
})

# Reset mock implementation
afterEach(() => {
  jest.resetAllMocks()
})
```

### Snapshot Failed

```bash
# Update snapshots
npm test -- -u

# Update specific snapshot
npm test -- Button.test.tsx -u
```

### React Native Module Not Found

Add to `jest.config.js`:

```javascript
transformIgnorePatterns: [
  'node_modules/(?!(react-native|@react-native|expo|@expo)/)'
]
```

### E2E Test Flaky

```bash
# Add wait conditions
await waitFor(element(by.id('button')))
  .toBeVisible()
  .withTimeout(5000)

# Use device synchronization
await device.synchronize()
```

### Memory Leaks in Tests

```bash
# Force garbage collection
global.gc && global.gc()

# Run with leak detection
npm test -- --detectLeaks
```

## Test File Organization

```
.examples/testing/
├── unit/
│   ├── components/
│   │   ├── Button.test.tsx
│   │   └── Input.test.tsx
│   ├── hooks/
│   │   ├── useAuth.test.ts
│   │   └── useTheme.test.ts
│   └── services/
│       └── api.test.ts
├── integration/
│   ├── auth-flow.test.tsx
│   └── task-crud.test.tsx
├── visual/
│   ├── components.test.tsx
│   └── screens.test.tsx
├── performance/
│   ├── render-time.test.tsx
│   └── memory.test.ts
└── utils/
    ├── testUtils.tsx
    ├── mockData.ts
    └── mockSupabase.ts

e2e/
├── auth.e2e.ts
├── tasks.e2e.ts
└── navigation.e2e.ts
```

## Resources

### Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Detox Documentation](https://wix.github.io/Detox/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Example Tests

All example tests are in `.examples/testing/`:

- `unit/components/Button.test.tsx` - Component testing
- `unit/hooks/useAuth.test.ts` - Hook testing
- `integration/auth-flow.test.tsx` - Integration testing
- `e2e/auth.e2e.ts` - E2E testing

### Internal Docs

- `docs/patterns/TESTING-PATTERNS.md` - Testing patterns specific to this project
- `docs/anti-patterns/WHAT-NOT-TO-DO.md` - Common testing mistakes to avoid

## Getting Help

1. Check this documentation
2. Review example tests in `.examples/testing/`
3. Search for similar tests in the codebase
4. Ask in team chat or create an issue
5. Check tool documentation (Jest, RTL, Detox)

## Contributing

When adding new features:

1. Write tests first (TDD approach preferred)
2. Ensure coverage stays above thresholds
3. Add integration test for complete feature flow
4. Update this documentation if adding new patterns
5. Run full test suite before PR: `npm test && npx tsc --noEmit`

---

**Remember**: Good tests give you confidence to refactor and add features without breaking existing functionality. Invest time in writing quality tests—it pays off!
