## E2E Testing with Detox

Comprehensive guide for end-to-end testing using Detox in the Mobile App Blueprint project.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [Debugging](#debugging)
- [CI/CD Integration](#ci-cd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

Detox is a gray box end-to-end testing framework for React Native applications. It runs tests on real devices or simulators, testing the app as users would use it.

### Why Detox?

- **Real device testing**: Tests run on actual iOS/Android devices or simulators
- **Automatic synchronization**: Waits for app to be idle before continuing
- **Fast and reliable**: Faster than black-box solutions like Appium
- **Developer-friendly**: JavaScript API, good error messages
- **CI-ready**: Works in CI/CD pipelines

### When to Use E2E Tests

- Critical user flows (auth, checkout, onboarding)
- Cross-screen navigation
- Integration with device features
- Regression testing before releases
- Smoke testing after deployments

## Setup

### Prerequisites

```bash
# macOS only (for iOS testing)
xcode-select --install
brew tap wix/brew
brew install applesimutils

# For Android
# Install Android Studio and SDK tools
```

### Installation

```bash
# Install Detox CLI globally
npm install -g detox-cli

# Install Detox dependency
npm install --save-dev detox

# Initialize Detox
detox init
```

### Configuration

Detox configuration is in `.detoxrc.js`:

```javascript
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/App.app',
      build: 'xcodebuild ...',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug ...',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 15 Pro' },
    },
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Pixel_5_API_33' },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
  },
}
```

### iOS Setup

1. **Add Detox to iOS project** (if not already added):

```bash
# In ios/ directory
pod install
```

2. **Build the app**:

```bash
detox build --configuration ios.sim.debug
```

### Android Setup

1. **Create Android emulator**:

```bash
# List available system images
sdkmanager --list

# Download system image
sdkmanager "system-images;android-33;google_apis;arm64-v8a"

# Create AVD
avdmanager create avd -n Pixel_5_API_33 -k "system-images;android-33;google_apis;arm64-v8a" -d "pixel_5"
```

2. **Build the app**:

```bash
detox build --configuration android.emu.debug
```

## Running Tests

### Basic Commands

```bash
# Run all tests on iOS simulator
detox test --configuration ios.sim.debug

# Run all tests on Android emulator
detox test --configuration android.emu.debug

# Run specific test file
detox test --configuration ios.sim.debug e2e/auth.e2e.ts

# Run with verbose logging
detox test --configuration ios.sim.debug --loglevel verbose

# Run with screenshots on failure
detox test --configuration ios.sim.debug --take-screenshots failing

# Run and record video
detox test --configuration ios.sim.debug --record-videos failing
```

### Development Workflow

```bash
# 1. Start packager
npm start

# 2. Build app (in another terminal)
detox build --configuration ios.sim.debug

# 3. Run tests
detox test --configuration ios.sim.debug

# 4. Rebuild only when native code changes
# Otherwise, just run tests again
```

### Watch Mode

```bash
# Run tests in watch mode (requires jest-watch-typeahead)
detox test --configuration ios.sim.debug --watch
```

## Writing Tests

### Basic Test Structure

```typescript
import { device, element, by, expect as detoxExpect } from 'detox'

describe('Feature Name', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  it('should do something', async () => {
    // Find element
    const button = element(by.id('submit-button'))

    // Interact with element
    await button.tap()

    // Assert result
    await detoxExpect(element(by.text('Success'))).toBeVisible()
  })
})
```

### Selecting Elements

```typescript
// By testID (RECOMMENDED)
element(by.id('login-button'))

// By text
element(by.text('Sign In'))

// By label (accessibility label)
element(by.label('Submit form'))

// By type
element(by.type('RCTTextInput'))

// Combining matchers
element(by.id('email-input').and(by.type('RCTTextInput')))

// Finding child elements
element(by.id('form').withDescendant(by.text('Submit')))

// Finding parent elements
element(by.id('button').withAncestor(by.id('form')))
```

### Interactions

```typescript
// Tap element
await element(by.id('button')).tap()

// Long press
await element(by.id('button')).longPress()

// Double tap
await element(by.id('button')).multiTap(2)

// Type text
await element(by.id('input')).typeText('Hello')

// Replace text (clears first)
await element(by.id('input')).replaceText('World')

// Clear text
await element(by.id('input')).clearText()

// Scroll
await element(by.id('scrollview')).scrollTo('bottom')
await element(by.id('scrollview')).scroll(200, 'down')

// Swipe
await element(by.id('card')).swipe('left')
await element(by.id('card')).swipe('left', 'fast', 0.8)
```

### Assertions

```typescript
// Visibility
await detoxExpect(element(by.id('element'))).toBeVisible()
await detoxExpect(element(by.id('element'))).not.toBeVisible()

// Existence
await detoxExpect(element(by.id('element'))).toExist()

// Text content
await detoxExpect(element(by.id('label'))).toHaveText('Expected')

// Partial text match
await detoxExpect(element(by.id('label'))).toHaveText(
  expect.stringContaining('part')
)

// Value (for inputs)
await detoxExpect(element(by.id('input'))).toHaveValue('text')

// Toggle state
await detoxExpect(element(by.id('switch'))).toHaveToggleValue(true)

// Focus state
await detoxExpect(element(by.id('input'))).toHaveFocus()

// Accessibility label
await detoxExpect(element(by.id('button'))).toHaveLabel('Submit')
```

### Waiting

```typescript
// Wait for element to be visible
await waitFor(element(by.id('element')))
  .toBeVisible()
  .withTimeout(5000)

// Wait for element to not be visible
await waitFor(element(by.id('loading')))
  .not.toBeVisible()
  .withTimeout(10000)

// Wait with custom timeout
await waitFor(element(by.id('element')))
  .toBeVisible()
  .withTimeout(20000)

// Wait while element is visible (polling)
await waitFor(element(by.id('loading')))
  .not.toBeVisible()
  .whileElement(by.id('scrollview'))
  .scroll(100, 'down')
```

### Device Actions

```typescript
// Reload app
await device.reloadReactNative()

// Restart app
await device.launchApp({ newInstance: true })

// Send app to background
await device.sendToHome()

// Reopen app
await device.launchApp({ newInstance: false })

// Set device orientation
await device.setOrientation('landscape')
await device.setOrientation('portrait')

// Shake device
await device.shake()

// Set location
await device.setLocation(37.7749, -122.4194) // San Francisco

// Grant permissions
await device.launchApp({
  permissions: {
    notifications: 'YES',
    camera: 'YES',
    location: 'always',
  },
})

// Open URL (deep linking)
await device.openURL({ url: 'myapp://screen' })

// Take screenshot
await device.takeScreenshot('screenshot-name')
```

## Best Practices

### 1. Use testID for Element Selection

```typescript
// ✅ Good - Use testID
<Button testID="submit-button" title="Submit" />
await element(by.id('submit-button')).tap()

// ❌ Bad - Use text (fragile, changes with copy)
await element(by.text('Submit')).tap()
```

### 2. Wait for Elements

```typescript
// ✅ Good - Wait for element
await waitFor(element(by.id('home-screen')))
  .toBeVisible()
  .withTimeout(5000)

// ❌ Bad - Assume element is there
await element(by.id('home-screen')).tap() // Might fail!
```

### 3. Keep Tests Independent

```typescript
// ✅ Good - Reset state between tests
beforeEach(async () => {
  await device.reloadReactNative()
})

// ❌ Bad - Tests depend on each other
describe('Bad Tests', () => {
  it('creates user', async () => {
    // Creates user
  })

  it('uses created user', async () => {
    // Depends on previous test!
  })
})
```

### 4. Test Real User Flows

```typescript
// ✅ Good - Complete user flow
it('complete sign up flow', async () => {
  await element(by.id('email-input')).typeText('user@example.com')
  await element(by.id('password-input')).typeText('password123')
  await element(by.id('signup-button')).tap()
  await waitFor(element(by.id('home-screen'))).toBeVisible()
})

// ❌ Bad - Testing implementation
it('state changes', async () => {
  // Can't test state in E2E
})
```

### 5. Use Descriptive Test Names

```typescript
// ✅ Good
it('should navigate to profile after tapping avatar', async () => {})

// ❌ Bad
it('test 1', async () => {})
```

### 6. Handle Async Properly

```typescript
// ✅ Good - Always await
await element(by.id('button')).tap()
await waitFor(element(by.id('result'))).toBeVisible()

// ❌ Bad - Missing await
element(by.id('button')).tap() // No await!
```

### 7. Add testIDs to All Interactive Elements

```tsx
// Add testIDs in your components
<View testID="login-screen">
  <TextInput testID="email-input" />
  <TextInput testID="password-input" />
  <Button testID="submit-button" title="Sign In" />
</View>
```

### 8. Use Meaningful testIDs

```typescript
// ✅ Good - Descriptive
testID="email-input"
testID="submit-button"
testID="home-screen"

// ❌ Bad - Generic
testID="input1"
testID="button"
testID="screen"
```

## Debugging

### Enable Verbose Logging

```bash
detox test --configuration ios.sim.debug --loglevel verbose
```

### Take Screenshots

```bash
# Screenshot on failure
detox test --take-screenshots failing

# Screenshot always
detox test --take-screenshots all
```

### Record Videos

```bash
# Record video on failure
detox test --record-videos failing

# Record all tests
detox test --record-videos all
```

### Debug in Test

```typescript
it('debug test', async () => {
  // Add breakpoint
  await element(by.id('button')).tap()

  // Take screenshot for inspection
  await device.takeScreenshot('debug-screenshot')

  // Log element attributes
  const attributes = await element(by.id('element')).getAttributes()
  console.log(attributes)
})
```

### Use React Native Debugger

```bash
# Start with debugging
detox test --configuration ios.sim.debug --debug-synchronization
```

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Detox CLI
        run: npm install -g detox-cli

      - name: Build app
        run: detox build --configuration ios.sim.debug

      - name: Run tests
        run: detox test --configuration ios.sim.debug --cleanup

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: detox-screenshots
          path: e2e/artifacts/*.png
```

### Pre-release E2E Check

```bash
# Add to package.json
{
  "scripts": {
    "e2e:ios": "detox test --configuration ios.sim.debug",
    "e2e:android": "detox test --configuration android.emu.debug",
    "pre-release": "npm run e2e:ios && npm run e2e:android"
  }
}
```

## Troubleshooting

### Tests Timeout

```typescript
// Increase timeout
await waitFor(element(by.id('element')))
  .toBeVisible()
  .withTimeout(30000) // 30 seconds
```

### Element Not Found

```bash
# Enable element inspector
detox test --configuration ios.sim.debug --inspect

# Check element hierarchy
await element(by.id('parent')).getAttributes()
```

### App Crashes

```bash
# Check crash logs
# iOS: ~/Library/Logs/DiagnosticReports/
# Android: adb logcat
```

### Synchronization Issues

```bash
# Disable synchronization
await device.disableSynchronization()
await element(by.id('button')).tap()
await device.enableSynchronization()
```

### Flaky Tests

```typescript
// Add retries
jest.retryTimes(3)

// Use more specific waits
await waitFor(element(by.id('element')))
  .toBeVisible()
  .withTimeout(10000)
```

## Resources

- [Detox Documentation](https://wix.github.io/Detox/)
- [Detox API Reference](https://wix.github.io/Detox/docs/api/actions)
- [Detox Best Practices](https://wix.github.io/Detox/docs/guide/test-lifecycle)
- [Troubleshooting Guide](https://wix.github.io/Detox/docs/troubleshooting/running-tests)

## Example Tests

See example E2E tests in this directory:

- `auth.e2e.ts` - Authentication flows
- `navigation.e2e.ts` - Navigation testing
- `forms.e2e.ts` - Form interactions

---

**Remember**: E2E tests are slow and can be brittle. Use them for critical flows and keep the suite small. Most testing should be done with unit and integration tests.
