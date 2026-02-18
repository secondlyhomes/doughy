# Platform-Specific File Organization

Guide to organizing platform-specific code in React Native + Expo projects.

## Table of Contents

- [Organization Strategies](#organization-strategies)
- [File Naming Conventions](#file-naming-conventions)
- [Directory Structures](#directory-structures)
- [Import Resolution](#import-resolution)
- [Code Sharing Patterns](#code-sharing-patterns)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Organization Strategies

### Strategy 1: Single File with Platform.select

**Use when:**
- Minor styling differences only
- Logic is identical across platforms
- Component is simple (< 100 lines)
- Platform differences are < 20% of code

**Pros:**
- All code in one place
- Easy to understand at a glance
- No file resolution complexity
- Simple to maintain

**Cons:**
- Can become messy with many platform checks
- Harder to test platform-specific behavior
- Code becomes cluttered

**Example:**
```typescript
// components/Button.tsx
import { TouchableOpacity, Text, Platform, StyleSheet } from 'react-native'

export function Button({ title, onPress }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        Platform.select({
          ios: styles.iosButton,
          android: styles.androidButton,
        }),
      ]}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    padding: 12,
    alignItems: 'center',
  },
  iosButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  androidButton: {
    backgroundColor: '#1976D2',
    borderRadius: 4,
    elevation: 2,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})
```

**When this breaks down:**
```typescript
// DON'T DO THIS - too many platform checks
export function ComplexComponent() {
  return (
    <View>
      {Platform.OS === 'ios' ? (
        <IOSHeader />
      ) : (
        <AndroidHeader />
      )}
      <View style={Platform.select({ ios: styles.ios, android: styles.android })}>
        {Platform.OS === 'ios' ? (
          <IOSContent />
        ) : (
          <AndroidContent />
        )}
      </View>
      {Platform.OS === 'ios' ? (
        <IOSFooter />
      ) : (
        <AndroidFooter />
      )}
    </View>
  )
}

// Instead, use Strategy 2 (Platform Extensions)
```

---

### Strategy 2: Platform Extensions

**Use when:**
- Significant implementation differences (> 50 lines)
- Different native modules needed
- Complex platform-specific logic
- Platform differences are > 20% of code

**Pros:**
- Clean separation of concerns
- Automatic platform selection by Metro bundler
- Easier to test each platform
- Better for large differences
- Prevents code bloat

**Cons:**
- More files to manage
- Shared logic needs careful extraction
- Can duplicate code if not careful

**File structure:**
```
components/
├── Button.tsx           # Shared types, exports, documentation
├── Button.ios.tsx       # iOS implementation
├── Button.android.tsx   # Android implementation
└── Button.test.tsx      # Tests for both platforms
```

**Button.tsx (main file):**
```typescript
/**
 * Platform-specific button component
 *
 * iOS: Rounded with shadow, haptic feedback
 * Android: Rectangular with elevation, ripple effect
 */

// Shared types
export interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

// Shared constants
export const BUTTON_HEIGHT = 48

// Re-export platform-specific implementation
// Metro bundler automatically picks Button.ios.tsx or Button.android.tsx
export { Button } from './Button.native'
```

**Button.ios.tsx:**
```typescript
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'
import type { ButtonProps } from './Button'

export function Button({ title, onPress, variant = 'primary', disabled }: ButtonProps) {
  const handlePress = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      onPress()
    }
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.button,
        variant === 'primary' ? styles.primary : styles.secondary,
        disabled && styles.disabled,
      ]}
      disabled={disabled}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primary: {
    backgroundColor: '#007AFF',
  },
  secondary: {
    backgroundColor: '#8E8E93',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})
```

**Button.android.tsx:**
```typescript
import { TouchableOpacity, Text, StyleSheet, Vibration } from 'react-native'
import type { ButtonProps } from './Button'

export function Button({ title, onPress, variant = 'primary', disabled }: ButtonProps) {
  const handlePress = () => {
    if (!disabled) {
      Vibration.vibrate(10)
      onPress()
    }
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.button,
        variant === 'primary' ? styles.primary : styles.secondary,
        disabled && styles.disabled,
      ]}
      disabled={disabled}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.3)' }}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  primary: {
    backgroundColor: '#1976D2',
  },
  secondary: {
    backgroundColor: '#757575',
  },
  disabled: {
    opacity: 0.5,
    elevation: 0,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
})
```

---

### Strategy 3: Platform Directories

**Use when:**
- Entire features are platform-specific
- Multiple related components differ
- Need to organize large platform-specific codebases
- Building platform-exclusive features (e.g., iOS App Clips, Android Quick Settings Tile)

**Pros:**
- Clear organization
- Easy to find platform-specific code
- Can share utilities within platform
- Good for large features

**Cons:**
- More complex structure
- Harder to share code
- Can lead to duplication

**File structure:**
```
features/
└── widgets/
    ├── ios/
    │   ├── TaskWidget.tsx
    │   ├── CalendarWidget.tsx
    │   ├── WidgetProvider.tsx
    │   ├── styles.ts
    │   ├── utils.ts
    │   └── README.md
    ├── android/
    │   ├── TaskWidget.tsx
    │   ├── CalendarWidget.tsx
    │   ├── WidgetProvider.tsx
    │   ├── styles.ts
    │   ├── utils.ts
    │   └── README.md
    ├── shared/
    │   ├── types.ts
    │   ├── constants.ts
    │   ├── api.ts
    │   └── validation.ts
    └── index.tsx
```

**index.tsx (entry point):**
```typescript
import { Platform } from 'react-native'

// Platform-specific imports
let WidgetProvider: any = null

if (Platform.OS === 'ios') {
  WidgetProvider = require('./ios/WidgetProvider').WidgetProvider
} else if (Platform.OS === 'android') {
  WidgetProvider = require('./android/WidgetProvider').WidgetProvider
}

export { WidgetProvider }
export * from './shared/types'
```

**ios/TaskWidget.tsx:**
```typescript
import { SharedWidgetData } from '../shared/types'
import { WIDGET_SIZES } from '../shared/constants'

export function TaskWidget({ data }: { data: SharedWidgetData }) {
  // iOS-specific implementation using WidgetKit
  return (
    <div className="widget-container">
      {/* iOS widget UI */}
    </div>
  )
}
```

**android/TaskWidget.tsx:**
```typescript
import { SharedWidgetData } from '../shared/types'
import { WIDGET_SIZES } from '../shared/constants'

export function TaskWidget({ data }: { data: SharedWidgetData }) {
  // Android-specific implementation using AppWidgetProvider
  return (
    <div className="widget-container">
      {/* Android widget UI */}
    </div>
  )
}
```

**shared/types.ts:**
```typescript
// Shared types used by both platforms
export interface SharedWidgetData {
  id: string
  title: string
  description: string
  dueDate: Date
  completed: boolean
}

export interface WidgetConfig {
  size: 'small' | 'medium' | 'large'
  theme: 'light' | 'dark'
}
```

---

### Strategy 4: Hybrid Approach

**Use when:**
- Mix of simple and complex platform differences
- Want flexibility
- Real-world projects (most common)

**File structure:**
```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx           # Shared types
│   │   ├── Button.ios.tsx       # iOS implementation
│   │   └── Button.android.tsx   # Android implementation
│   ├── Card.tsx                 # Fully cross-platform
│   └── Header/
│       ├── Header.tsx           # Shared + Platform.select for styles
│       └── Header.test.tsx
├── features/
│   ├── auth/
│   │   ├── screens/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   └── components/
│   │       ├── BiometricAuth.ios.tsx
│   │       ├── BiometricAuth.android.tsx
│   │       └── BiometricAuth.tsx
│   └── widgets/
│       ├── ios/                 # iOS-only feature
│       │   └── LiveActivity/
│       ├── android/             # Android-only feature
│       │   └── QuickSettingsTile/
│       └── shared/
│           └── types.ts
└── utils/
    ├── platform/
    │   ├── platformDetection.ts
    │   ├── platformSelect.ts
    │   └── platformUtils.ios.ts
    └── validation.ts            # Fully cross-platform
```

---

## File Naming Conventions

### Platform Extensions

React Native's Metro bundler automatically resolves platform-specific files:

| Extension | Platforms | Use Case |
|-----------|-----------|----------|
| `.ios.tsx` | iOS only | iOS-specific implementation |
| `.android.tsx` | Android only | Android-specific implementation |
| `.web.tsx` | Web only | Web-specific implementation |
| `.native.tsx` | iOS + Android | Native mobile (not web) |
| `.tsx` | All platforms | Cross-platform or shared types |

### Resolution Priority

When importing `./Button`, Metro resolves in this order:

1. `Button.ios.tsx` (on iOS) or `Button.android.tsx` (on Android)
2. `Button.native.tsx` (on iOS/Android, not web)
3. `Button.tsx` (fallback for all platforms)

### Examples

```typescript
// Import statement (same on all platforms)
import { Button } from './components/Button'

// iOS resolves to: ./components/Button.ios.tsx
// Android resolves to: ./components/Button.android.tsx
// Web resolves to: ./components/Button.web.tsx or ./components/Button.tsx
```

---

## Directory Structures

### Small Project (< 50 components)

```
mobile-app/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Header.ios.tsx
│   │   ├── Header.android.tsx
│   │   └── Header.tsx
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── hooks/
│   │   └── usePlatformFeatures.ts
│   └── utils/
│       ├── platformDetection.ts
│       └── validation.ts
└── App.tsx
```

### Medium Project (50-200 components)

```
mobile-app/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.ios.tsx
│   │   │   │   ├── Button.android.tsx
│   │   │   │   └── Button.test.tsx
│   │   │   └── Card/
│   │   │       └── Card.tsx
│   │   └── platform/
│   │       ├── ios/
│   │       │   └── LiveActivityProvider.tsx
│   │       └── android/
│   │           └── QuickSettingsTileProvider.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── screens/
│   │   │   └── hooks/
│   │   └── tasks/
│   │       ├── components/
│   │       ├── screens/
│   │       └── hooks/
│   ├── navigation/
│   │   ├── Navigation.ios.tsx
│   │   ├── Navigation.android.tsx
│   │   └── Navigation.tsx
│   └── utils/
│       ├── platform/
│       │   ├── platformDetection.ts
│       │   └── platformSelect.ts
│       └── validation.ts
└── App.tsx
```

### Large Project (200+ components)

```
mobile-app/
├── src/
│   ├── components/
│   │   ├── base/                # Atomic components
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Text/
│   │   │   └── View/
│   │   ├── composite/           # Compound components
│   │   │   ├── Card/
│   │   │   ├── List/
│   │   │   └── Modal/
│   │   └── platform/            # Platform-specific
│   │       ├── ios/
│   │       └── android/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── screens/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types/
│   │   ├── tasks/
│   │   │   ├── components/
│   │   │   ├── screens/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types/
│   │   └── widgets/
│   │       ├── ios/
│   │       │   ├── LiveActivity/
│   │       │   └── HomeWidget/
│   │       ├── android/
│   │       │   ├── AppWidget/
│   │       │   └── QuickSettingsTile/
│   │       └── shared/
│   │           ├── types.ts
│   │           └── api.ts
│   ├── navigation/
│   │   ├── stacks/
│   │   │   ├── AuthStack.tsx
│   │   │   └── MainStack.tsx
│   │   ├── tabs/
│   │   │   ├── MainTabs.ios.tsx
│   │   │   ├── MainTabs.android.tsx
│   │   │   └── MainTabs.tsx
│   │   └── RootNavigator.tsx
│   ├── services/
│   │   ├── api/
│   │   ├── storage/
│   │   ├── notifications/
│   │   │   ├── NotificationService.ios.ts
│   │   │   ├── NotificationService.android.ts
│   │   │   └── NotificationService.ts
│   │   └── analytics/
│   ├── hooks/
│   │   ├── platform/
│   │   │   ├── usePlatformFeatures.ts
│   │   │   └── useHapticFeedback.ts
│   │   └── common/
│   │       └── useDebounce.ts
│   └── utils/
│       ├── platform/
│       │   ├── platformDetection.ts
│       │   ├── platformSelect.ts
│       │   └── platformUtils.ts
│       ├── validation/
│       └── formatting/
└── App.tsx
```

---

## Import Resolution

### How Metro Resolves Imports

```typescript
// Your import
import { Button } from './components/Button'

// Metro checks in order:
// 1. ./components/Button.ios.tsx (if on iOS)
// 2. ./components/Button.native.tsx (if on iOS/Android)
// 3. ./components/Button.tsx
// 4. ./components/Button/index.tsx
// 5. ./components/Button/index.ios.tsx
```

### Explicit Platform Imports

```typescript
// DON'T: Explicitly import platform file
import { Button } from './components/Button.ios'

// DO: Let Metro handle resolution
import { Button } from './components/Button'
```

### Conditional Imports

```typescript
// For dynamic imports based on runtime conditions
let WidgetService

if (Platform.OS === 'ios') {
  WidgetService = require('./services/WidgetService.ios').WidgetService
} else if (Platform.OS === 'android') {
  WidgetService = require('./services/WidgetService.android').WidgetService
}

// Better: Use automatic resolution when possible
import { WidgetService } from './services/WidgetService'
```

---

## Code Sharing Patterns

### Pattern 1: Shared Types

```
components/
├── Button.tsx           # Shared types and exports
├── Button.ios.tsx       # iOS implementation
└── Button.android.tsx   # Android implementation
```

**Button.tsx:**
```typescript
// Shared types
export interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
}

// Shared constants
export const BUTTON_HEIGHT = 48

// Re-export platform implementation
export { Button } from './Button.native'
```

### Pattern 2: Shared Logic, Platform UI

```
components/
├── Form.tsx             # Shared logic
├── FormUI.ios.tsx       # iOS UI
├── FormUI.android.tsx   # Android UI
└── FormUI.tsx           # Types
```

**Form.tsx:**
```typescript
import { FormUI } from './FormUI'
import { useFormValidation } from './useFormValidation'

export function Form({ onSubmit }: FormProps) {
  // Shared logic
  const { values, errors, handleChange, handleSubmit } = useFormValidation()

  // Platform-specific UI
  return (
    <FormUI
      values={values}
      errors={errors}
      onChangeText={handleChange}
      onSubmit={handleSubmit}
    />
  )
}
```

### Pattern 3: Shared Utilities

```
utils/
├── validation.ts        # Fully cross-platform
├── formatting.ts        # Fully cross-platform
└── platform/
    ├── haptics.ios.ts   # iOS haptics
    ├── haptics.android.ts # Android haptics
    └── haptics.ts       # Shared interface
```

**haptics.ts:**
```typescript
export interface HapticsService {
  impact(intensity: 'light' | 'medium' | 'heavy'): void
  notification(type: 'success' | 'warning' | 'error'): void
  selection(): void
}

export { haptics } from './haptics.native'
```

---

## Best Practices

### 1. Keep Shared Code Separate

```typescript
// Good: Shared logic in separate file
// validation.ts
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Form.ios.tsx
import { validateEmail } from './validation'

// Form.android.tsx
import { validateEmail } from './validation'
```

### 2. Use Barrel Exports

```typescript
// components/index.ts
export { Button } from './Button'
export { Card } from './Card'
export { Header } from './Header'

// Usage
import { Button, Card, Header } from '@/components'
```

### 3. Document Platform Differences

```typescript
/**
 * Button component with platform-specific behavior
 *
 * iOS:
 * - Rounded corners (10px)
 * - Shadow for depth
 * - Haptic feedback on press
 *
 * Android:
 * - Subtle rounded corners (4px)
 * - Elevation for depth
 * - Ripple effect on press
 *
 * @example
 * <Button title="Press Me" onPress={handlePress} />
 */
export function Button({ title, onPress }: ButtonProps) {
  // ...
}
```

### 4. Minimize Duplication

```typescript
// Bad: Duplicated styles
// Button.ios.tsx
const styles = StyleSheet.create({
  button: { padding: 16, alignItems: 'center' },
  text: { fontSize: 16, fontWeight: '600' },
})

// Button.android.tsx
const styles = StyleSheet.create({
  button: { padding: 16, alignItems: 'center' },
  text: { fontSize: 14, fontWeight: '500' },
})

// Good: Extract shared styles
// Button.styles.ts
export const sharedStyles = {
  button: { padding: 16, alignItems: 'center' },
}

// Button.ios.tsx
const styles = StyleSheet.create({
  ...sharedStyles,
  text: { fontSize: 16, fontWeight: '600' },
})

// Button.android.tsx
const styles = StyleSheet.create({
  ...sharedStyles,
  text: { fontSize: 14, fontWeight: '500' },
})
```

### 5. Test Both Platforms

```typescript
// Button.test.tsx
import { Platform } from 'react-native'
import { render } from '@testing-library/react-native'
import { Button } from './Button'

describe('Button', () => {
  it('renders correctly on iOS', () => {
    jest.spyOn(Platform, 'OS', 'get').mockReturnValue('ios')
    const { getByText } = render(<Button title="Test" onPress={() => {}} />)
    expect(getByText('Test')).toBeTruthy()
  })

  it('renders correctly on Android', () => {
    jest.spyOn(Platform, 'OS', 'get').mockReturnValue('android')
    const { getByText } = render(<Button title="Test" onPress={() => {}} />)
    expect(getByText('Test')).toBeTruthy()
  })
})
```

---

## Examples

### Example 1: Simple Platform Differences

```
components/
└── Header.tsx
```

```typescript
// Header.tsx
import { View, Text, Platform, StyleSheet } from 'react-native'

export function Header({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: Platform.select({ ios: 44, android: 56, default: 48 }),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: Platform.select({ ios: 'center', android: 'flex-start', default: 'center' }),
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E5EA',
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: Platform.select({ ios: 17, android: 20, default: 18 }),
    fontWeight: Platform.select({ ios: '600', android: '500', default: '600' }),
  },
})
```

### Example 2: Platform Extensions

```
components/
├── DatePicker.tsx
├── DatePicker.ios.tsx
└── DatePicker.android.tsx
```

**DatePicker.tsx:**
```typescript
export interface DatePickerProps {
  value: Date
  onChange: (date: Date) => void
  mode?: 'date' | 'time' | 'datetime'
}

export { DatePicker } from './DatePicker.native'
```

**DatePicker.ios.tsx:**
```typescript
import DateTimePicker from '@react-native-community/datetimepicker'
import type { DatePickerProps } from './DatePicker'

export function DatePicker({ value, onChange, mode = 'date' }: DatePickerProps) {
  return (
    <DateTimePicker
      value={value}
      mode={mode}
      display="spinner"
      onChange={(event, date) => date && onChange(date)}
      style={{ height: 216 }}
    />
  )
}
```

**DatePicker.android.tsx:**
```typescript
import DateTimePicker from '@react-native-community/datetimepicker'
import type { DatePickerProps } from './DatePicker'

export function DatePicker({ value, onChange, mode = 'date' }: DatePickerProps) {
  const [show, setShow] = useState(false)

  return (
    <>
      <TouchableOpacity onPress={() => setShow(true)}>
        <Text>{value.toLocaleDateString()}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value}
          mode={mode}
          display="default"
          onChange={(event, date) => {
            setShow(false)
            if (date) onChange(date)
          }}
        />
      )}
    </>
  )
}
```

### Example 3: Platform Directories

```
features/
└── widgets/
    ├── ios/
    │   ├── LiveActivity.tsx
    │   └── HomeWidget.tsx
    ├── android/
    │   ├── AppWidget.tsx
    │   └── QuickSettingsTile.tsx
    ├── shared/
    │   ├── types.ts
    │   └── api.ts
    └── index.tsx
```

**index.tsx:**
```typescript
import { Platform } from 'react-native'

export * from './shared/types'

if (Platform.OS === 'ios') {
  export * from './ios/LiveActivity'
  export * from './ios/HomeWidget'
} else if (Platform.OS === 'android') {
  export * from './android/AppWidget'
  export * from './android/QuickSettingsTile'
}
```

---

## Summary

1. **Choose the right strategy** based on complexity
2. **Use platform extensions** for significant differences
3. **Keep shared code separate** to avoid duplication
4. **Document platform differences** clearly
5. **Test on both platforms** always
6. **Let Metro handle resolution** - don't import platform files directly
7. **Organize by feature** when possible, not by platform

**Remember:** The goal is maintainable code, not perfect organization. Start simple and refactor as needed.
