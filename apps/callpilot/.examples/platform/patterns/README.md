# Platform-Specific Patterns

Guide to implementing platform-specific behavior and UI in React Native + Expo apps.

## Table of Contents

- [When to Use Platform-Specific Code](#when-to-use-platform-specific-code)
- [Conditional Rendering Patterns](#conditional-rendering-patterns)
- [File Naming Conventions](#file-naming-conventions)
- [Navigation Patterns](#navigation-patterns)
- [Testing Platform-Specific Code](#testing-platform-specific-code)
- [Best Practices](#best-practices)

## When to Use Platform-Specific Code

### Use Platform-Specific Code When:

1. **Platform conventions differ significantly**
   - iOS: Tabs at bottom, swipe to go back
   - Android: Bottom navigation, hardware back button

2. **Native features are platform-exclusive**
   - iOS: Live Activities, Dynamic Island, Siri Shortcuts
   - Android: Material You, Quick Settings Tiles, Bubbles

3. **Design guidelines mandate different approaches**
   - iOS: Human Interface Guidelines (rounded corners, shadows)
   - Android: Material Design (elevation, ripple effects)

4. **Performance requirements differ**
   - iOS: Smoother with native animations
   - Android: Better with Material Design transitions

### Avoid Platform-Specific Code When:

1. **Logic is identical across platforms**
   - Use shared code with platform-specific styling only

2. **Small styling differences**
   - Use `Platform.select` instead of separate files

3. **Feature can be abstracted**
   - Create platform-agnostic wrapper

## Conditional Rendering Patterns

### Pattern 1: Platform.select for Simple Cases

**Use when:** Only styles or simple values differ

```typescript
import { Platform } from 'react-native'

const headerHeight = Platform.select({
  ios: 44,
  android: 56,
  default: 48,
})

const buttonStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  android: {
    elevation: 5,
  },
})
```

**Pros:**
- Simple and concise
- All code in one place
- Easy to understand

**Cons:**
- Can become messy with complex logic
- Not suitable for large differences

### Pattern 2: Inline Conditional Rendering

**Use when:** Small portions of UI differ

```typescript
export function Header() {
  return (
    <View>
      {Platform.OS === 'ios' ? (
        <IOSHeader />
      ) : Platform.OS === 'android' ? (
        <AndroidHeader />
      ) : (
        <WebHeader />
      )}
    </View>
  )
}
```

**Pros:**
- Clear what differs
- Easy to read
- No extra files

**Cons:**
- Can clutter component
- Limited to simple cases

### Pattern 3: Feature Guards

**Use when:** Feature availability depends on platform version

```typescript
export function AdvancedFeature() {
  // iOS 16.1+ Live Activities
  if (Platform.OS === 'ios' && PlatformUtils.iOSVersion! >= 16.1) {
    return <LiveActivityWidget />
  }

  // Android 12+ Material You
  if (Platform.OS === 'android' && PlatformUtils.androidVersion! >= 31) {
    return <MaterialYouWidget />
  }

  // Fallback for older versions
  return <StandardWidget />
}
```

**Pros:**
- Handles version requirements
- Clear fallback logic
- Progressive enhancement

**Cons:**
- Can be verbose
- Needs testing across versions

### Pattern 4: Separate Platform Files

**Use when:** Implementations differ significantly (>50 lines)

**File structure:**
```
components/
├── Button.tsx           # Shared types and exports
├── Button.ios.tsx       # iOS implementation
├── Button.android.tsx   # Android implementation
└── Button.web.tsx       # Web implementation (optional)
```

**Button.tsx:**
```typescript
export interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
}

// React Native auto-imports .ios.tsx on iOS, .android.tsx on Android
export { Button } from './Button.native'
```

**Button.ios.tsx:**
```typescript
import { TouchableOpacity, Text } from 'react-native'
import type { ButtonProps } from './Button'

export function Button({ title, onPress, variant = 'primary' }: ButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.iOSButton}>
      <Text style={styles.iOSText}>{title}</Text>
    </TouchableOpacity>
  )
}
```

**Button.android.tsx:**
```typescript
import { TouchableOpacity, Text } from 'react-native'
import type { ButtonProps } from './Button'

export function Button({ title, onPress, variant = 'primary' }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.androidButton}
      android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
    >
      <Text style={styles.androidText}>{title}</Text>
    </TouchableOpacity>
  )
}
```

**Pros:**
- Clean separation of concerns
- Automatic platform selection
- Easier to maintain
- Better for large differences

**Cons:**
- More files to manage
- Shared logic needs careful extraction
- Can duplicate code if not careful

### Pattern 5: Platform Component Wrapper

**Use when:** Need type-safe component selection

```typescript
import { platformComponent } from '../utils/platformSelect'

const DatePicker = platformComponent({
  ios: IOSDatePicker,
  android: AndroidDatePicker,
  web: WebDatePicker,
  default: GenericDatePicker,
})

export function DateSelector() {
  const [date, setDate] = useState(new Date())

  if (!DatePicker) {
    return <Text>Date picker not available</Text>
  }

  return <DatePicker value={date} onChange={setDate} />
}
```

**Pros:**
- Type-safe
- Clean API
- Easy to test

**Cons:**
- Requires utility setup
- Extra abstraction layer

### Pattern 6: Custom Hooks

**Use when:** Platform logic is reusable across components

```typescript
export function usePlatformFeatures() {
  const supportsHaptics = PlatformUtils.supportsHaptics()
  const supportsWidgets = PlatformUtils.supportsWidgets()

  const triggerHaptic = useCallback(() => {
    if (!supportsHaptics) return

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    } else if (Platform.OS === 'android') {
      Vibration.vibrate(50)
    }
  }, [supportsHaptics])

  return {
    supportsHaptics,
    supportsWidgets,
    triggerHaptic,
  }
}
```

**Pros:**
- Reusable logic
- Testable
- Clean component code

**Cons:**
- Extra abstraction
- Hooks can't be conditional

### Pattern 7: Higher-Order Components (HOC)

**Use when:** Want to enhance components with platform behavior

```typescript
export function withPlatformBehavior<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return (props: P) => {
    const platformProps = Platform.select({
      ios: { hapticFeedback: true },
      android: { rippleEffect: true },
      default: {},
    })

    return <Component {...props} {...platformProps} />
  }
}

// Usage
const EnhancedButton = withPlatformBehavior(TouchableOpacity)
```

**Pros:**
- Composable
- Reusable
- Type-safe

**Cons:**
- Can be confusing
- Adds component layer

## File Naming Conventions

### Platform Extensions

React Native automatically selects the correct file based on platform:

```
MyComponent.tsx         # Shared types, exports
MyComponent.ios.tsx     # iOS implementation
MyComponent.android.tsx # Android implementation
MyComponent.web.tsx     # Web implementation (optional)
MyComponent.native.tsx  # Both iOS and Android (not web)
```

**Import resolution order:**
1. Platform-specific (`.ios.tsx`, `.android.tsx`)
2. Native (`.native.tsx`)
3. Base file (`.tsx`)

### When to Use Each

| Extension | Use Case |
|-----------|----------|
| `.ios.tsx` | iOS-specific implementation |
| `.android.tsx` | Android-specific implementation |
| `.web.tsx` | Web-specific implementation |
| `.native.tsx` | iOS + Android (not web) |
| `.tsx` | Shared types, exports, or fully cross-platform |

### Examples

**Example 1: Shared types, platform implementations**

```
Button/
├── index.tsx           # Exports
├── Button.types.ts     # Shared types
├── Button.ios.tsx      # iOS implementation
└── Button.android.tsx  # Android implementation
```

**Example 2: Native vs. Web**

```
Storage/
├── index.tsx         # Exports
├── Storage.native.ts # iOS + Android (AsyncStorage)
└── Storage.web.ts    # Web (localStorage)
```

**Example 3: Minor differences**

```
Header/
└── Header.tsx        # Single file with Platform.select
```

## Navigation Patterns

### iOS Navigation

```typescript
// iOS: Swipe from left edge to go back
const iosNavConfig = {
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  animation: 'slide_from_right',
  headerStyle: {
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 0,
  },
  headerTitleAlign: 'center',
  headerBackTitle: 'Back',
}
```

### Android Navigation

```typescript
// Android: Hardware back button
const androidNavConfig = {
  gestureEnabled: false, // Use back button
  animation: 'fade_from_bottom',
  headerStyle: {
    backgroundColor: '#FFFFFF',
    elevation: 4,
  },
  headerTitleAlign: 'left',
  headerBackTitle: undefined,
}
```

### Platform-Specific Tab Bar

```typescript
<Tab.Navigator
  screenOptions={{
    ...Platform.select({
      ios: {
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0.5,
          borderTopColor: '#E5E5EA',
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      },
      android: {
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 8,
        },
        tabBarActiveTintColor: '#1976D2',
        tabBarInactiveTintColor: '#757575',
      },
    }),
  }}
>
  {/* Tabs */}
</Tab.Navigator>
```

## Testing Platform-Specific Code

### Unit Tests

```typescript
import { Platform } from 'react-native'

describe('Platform-specific functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should use iOS implementation on iOS', () => {
    jest.spyOn(Platform, 'OS', 'get').mockReturnValue('ios')

    const result = getPlatformSpecificValue()
    expect(result).toBe('iOS value')
  })

  it('should use Android implementation on Android', () => {
    jest.spyOn(Platform, 'OS', 'get').mockReturnValue('android')

    const result = getPlatformSpecificValue()
    expect(result).toBe('Android value')
  })
})
```

### Integration Tests

```typescript
describe('Platform-specific components', () => {
  it('should render correctly on iOS', () => {
    const { getByTestId } = render(<PlatformComponent />)

    if (Platform.OS === 'ios') {
      expect(getByTestId('ios-specific-element')).toBeTruthy()
    }
  })

  it('should render correctly on Android', () => {
    const { getByTestId } = render(<PlatformComponent />)

    if (Platform.OS === 'android') {
      expect(getByTestId('android-specific-element')).toBeTruthy()
    }
  })
})
```

### E2E Tests

```typescript
// Detox example
describe('Platform-specific E2E', () => {
  it('should navigate using platform-appropriate gesture', async () => {
    await element(by.id('detail-screen')).tap()

    if (device.getPlatform() === 'ios') {
      // iOS: Swipe from left
      await element(by.id('detail-screen')).swipe('right')
    } else {
      // Android: Back button
      await device.pressBack()
    }

    await expect(element(by.id('home-screen'))).toBeVisible()
  })
})
```

## Best Practices

### 1. Document Platform Differences

Always explain why code is platform-specific:

```typescript
/**
 * Trigger haptic feedback
 *
 * iOS: Uses Haptic Engine for precise feedback
 * Android: Uses Vibration API (Android 8+)
 * Fallback: No haptic feedback on unsupported platforms
 */
export function triggerHaptic(intensity: 'light' | 'medium' | 'heavy') {
  if (Platform.OS === 'ios') {
    // iOS implementation
  } else if (Platform.OS === 'android') {
    // Android implementation
  }
}
```

### 2. Provide Fallbacks

Always handle unsupported platforms:

```typescript
// Good: Fallback provided
const value = Platform.select({
  ios: iosValue,
  android: androidValue,
  default: defaultValue, // Web or other platforms
})

// Bad: No fallback
const value = Platform.select({
  ios: iosValue,
  android: androidValue,
})
```

### 3. Use Feature Detection

Prefer feature detection over platform detection:

```typescript
// Good: Feature detection
if (PlatformUtils.supportsHaptics()) {
  triggerHaptic()
}

// Less good: Platform detection
if (Platform.OS === 'ios' || Platform.OS === 'android') {
  triggerHaptic()
}
```

### 4. Keep Shared Logic Separate

Extract shared logic to avoid duplication:

```typescript
// shared/validation.ts
export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Button.ios.tsx
import { validateEmail } from './shared/validation'

// Button.android.tsx
import { validateEmail } from './shared/validation'
```

### 5. Test on Both Platforms

Always test platform-specific code on both platforms:

```typescript
// Run on iOS
npm run ios

// Run on Android
npm run android

// Run tests
npm test
```

### 6. Use Type-Safe Wrappers

Leverage TypeScript for type safety:

```typescript
import { platformSelect } from '../utils/platformSelect'

// Type-safe platform selection
const config = platformSelect<Config>({
  ios: iosConfig,
  android: androidConfig,
  default: defaultConfig,
})
```

### 7. Minimize Platform Checks

Group platform logic instead of scattering checks:

```typescript
// Good: Centralized platform logic
const platformConfig = Platform.select({
  ios: { a: 1, b: 2, c: 3 },
  android: { a: 4, b: 5, c: 6 },
})

// Bad: Multiple platform checks
const a = Platform.OS === 'ios' ? 1 : 4
const b = Platform.OS === 'ios' ? 2 : 5
const c = Platform.OS === 'ios' ? 3 : 6
```

### 8. Consider Bundle Size

Use conditional imports for large platform-specific code:

```typescript
// Good: Conditional import
const PlatformModule = Platform.select({
  ios: () => require('./Module.ios'),
  android: () => require('./Module.android'),
})()

// Bad: Both modules in bundle
import IOSModule from './Module.ios'
import AndroidModule from './Module.android'
```

## Common Pitfalls

### 1. Forgetting Web Platform

```typescript
// Bad: Only iOS and Android
const config = Platform.select({
  ios: iosConfig,
  android: androidConfig,
})

// Good: Include web or default
const config = Platform.select({
  ios: iosConfig,
  android: androidConfig,
  web: webConfig,
  default: defaultConfig,
})
```

### 2. Hardcoding Platform Values

```typescript
// Bad: Hardcoded
const headerHeight = Platform.OS === 'ios' ? 44 : 56

// Good: Use constants
const HEADER_HEIGHT = Platform.select({
  ios: 44,
  android: 56,
  default: 48,
})
```

### 3. Not Testing Platform Code

```typescript
// Bad: No tests
export function platformFeature() {
  if (Platform.OS === 'ios') {
    return 'iOS'
  }
  return 'Android'
}

// Good: With tests
describe('platformFeature', () => {
  it('returns iOS on iOS', () => {
    jest.spyOn(Platform, 'OS', 'get').mockReturnValue('ios')
    expect(platformFeature()).toBe('iOS')
  })

  it('returns Android on Android', () => {
    jest.spyOn(Platform, 'OS', 'get').mockReturnValue('android')
    expect(platformFeature()).toBe('Android')
  })
})
```

### 4. Over-Engineering

```typescript
// Bad: Unnecessary abstraction
const Button = platformComponent({
  ios: () => <TouchableOpacity />,
  android: () => <TouchableOpacity />,
})

// Good: Use shared component
const Button = TouchableOpacity
```

## Summary

- Use platform-specific code only when necessary
- Follow platform conventions (iOS HIG, Android Material Design)
- Use appropriate pattern for the level of difference
- Always provide fallbacks for unsupported platforms
- Test on both iOS and Android
- Document why code is platform-specific
- Keep shared logic separate from platform-specific code
