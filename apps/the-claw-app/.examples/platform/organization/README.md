# Platform-Specific Code Organization

Guide to organizing, structuring, and maintaining platform-specific code in React Native + Expo projects.

## Quick Reference

### When to Use Each Strategy

| Situation | Strategy | Files |
|-----------|----------|-------|
| Small style differences | Single file with Platform.select | `Component.tsx` |
| Significant logic differences | Platform extensions | `Component.tsx`, `Component.ios.tsx`, `Component.android.tsx` |
| Entire platform-specific feature | Platform directories | `feature/ios/`, `feature/android/`, `feature/shared/` |
| Real-world mix | Hybrid approach | Combination of above |

## Organization Strategies

### Strategy 1: Single File with Platform.select

**When to use:**
- Minor styling differences
- Logic is 95% the same
- Component < 100 lines
- Quick to implement

```
components/
└── Header.tsx
```

**Example:**
```typescript
// Header.tsx
export function Header() {
  return (
    <View style={[
      styles.container,
      Platform.select({
        ios: styles.ios,
        android: styles.android,
      })
    ]}>
      <Text>Header</Text>
    </View>
  )
}
```

**Pros:**
- All code in one place
- Easy to understand
- No file resolution complexity

**Cons:**
- Can become messy with many checks
- Hard to test platform-specific logic
- Doesn't scale well

---

### Strategy 2: Platform Extensions

**When to use:**
- Significant implementation differences
- Different native modules needed
- 20-50% of code differs
- Want clean separation

```
components/
├── Button.tsx           # Shared types
├── Button.ios.tsx       # iOS implementation
└── Button.android.tsx   # Android implementation
```

**Example:**

**Button.tsx:**
```typescript
export interface ButtonProps {
  title: string
  onPress: () => void
}

// Metro automatically picks Button.ios.tsx or Button.android.tsx
export { Button } from './Button.native'
```

**Button.ios.tsx:**
```typescript
import type { ButtonProps } from './Button'

export function Button({ title, onPress }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.ios}
    >
      <Text>{title}</Text>
    </TouchableOpacity>
  )
}
```

**Button.android.tsx:**
```typescript
import type { ButtonProps } from './Button'

export function Button({ title, onPress }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.android}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
    >
      <Text>{title}</Text>
    </TouchableOpacity>
  )
}
```

**Pros:**
- Clean separation
- Automatic platform resolution
- Easier to test
- Scales well

**Cons:**
- More files to manage
- Need to extract shared logic carefully
- Can duplicate code

---

### Strategy 3: Platform Directories

**When to use:**
- Entire features differ
- Multiple related components
- Platform-exclusive features
- Need to organize large codebase

```
features/
└── widgets/
    ├── ios/
    │   ├── LiveActivity.tsx
    │   ├── HomeWidget.tsx
    │   └── utils.ts
    ├── android/
    │   ├── AppWidget.tsx
    │   ├── QuickSettingsTile.tsx
    │   └── utils.ts
    ├── shared/
    │   ├── types.ts
    │   └── api.ts
    └── index.tsx
```

**Example:**

**index.tsx:**
```typescript
import { Platform } from 'react-native'

// Export shared types
export * from './shared/types'

// Conditionally export platform-specific code
if (Platform.OS === 'ios') {
  export * from './ios/LiveActivity'
  export * from './ios/HomeWidget'
} else if (Platform.OS === 'android') {
  export * from './android/AppWidget'
  export * from './android/QuickSettingsTile'
}
```

**shared/types.ts:**
```typescript
export interface WidgetData {
  id: string
  title: string
  timestamp: Date
}
```

**ios/LiveActivity.tsx:**
```typescript
import { WidgetData } from '../shared/types'

export function startLiveActivity(data: WidgetData) {
  // iOS-specific Live Activities implementation
}
```

**android/AppWidget.tsx:**
```typescript
import { WidgetData } from '../shared/types'

export function updateWidget(data: WidgetData) {
  // Android-specific widget implementation
}
```

**Pros:**
- Clear organization
- Easy to find platform code
- Can share utilities within platform
- Good for large features

**Cons:**
- More complex structure
- Harder to share code
- Can lead to duplication

---

## File Naming Conventions

### Platform Extensions Reference

```
Component.tsx         → All platforms (types, shared logic)
Component.ios.tsx     → iOS only
Component.android.tsx → Android only
Component.web.tsx     → Web only
Component.native.tsx  → iOS + Android (not web)
```

### Resolution Order

When you import `./Component`:

1. `Component.ios.tsx` (if on iOS)
2. `Component.android.tsx` (if on Android)
3. `Component.native.tsx` (if on iOS/Android)
4. `Component.tsx` (fallback)

### Best Practices

```typescript
// ✅ DO: Let Metro handle resolution
import { Button } from './Button'

// ❌ DON'T: Explicitly import platform file
import { Button } from './Button.ios'

// ✅ DO: Use descriptive names
Component.ios.tsx
Component.android.tsx

// ❌ DON'T: Use vague names
Component.mobile.tsx
Component.native.tsx (unless truly for both iOS and Android)
```

---

## Directory Structures by Project Size

### Small Project (< 50 components)

```
mobile-app/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Header.tsx
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   └── SettingsScreen.tsx
│   └── utils/
│       └── platformDetection.ts
└── App.tsx
```

**Reasoning:**
- Flat structure
- Minimal platform-specific code
- Easy to navigate

---

### Medium Project (50-200 components)

```
mobile-app/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.ios.tsx
│   │   │   │   └── Button.android.tsx
│   │   │   └── Card.tsx
│   │   └── platform/
│   │       ├── ios/
│   │       │   └── IOSSpecificComponent.tsx
│   │       └── android/
│   │           └── AndroidSpecificComponent.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── screens/
│   │   │   └── hooks/
│   │   └── tasks/
│   │       ├── components/
│   │       ├── screens/
│   │       └── hooks/
│   └── utils/
│       ├── platform/
│       │   ├── platformDetection.ts
│       │   └── platformSelect.ts
│       └── validation.ts
└── App.tsx
```

**Reasoning:**
- Feature-based organization
- Platform code organized separately
- Scalable structure

---

### Large Project (200+ components)

```
mobile-app/
├── src/
│   ├── components/
│   │   ├── base/
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   └── Text/
│   │   ├── composite/
│   │   │   ├── Card/
│   │   │   └── List/
│   │   └── platform/
│   │       ├── ios/
│   │       │   ├── LiveActivityProvider/
│   │       │   └── WidgetProvider/
│   │       └── android/
│   │           ├── AppWidgetProvider/
│   │           └── QuickSettingsTileProvider/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── screens/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   │   ├── AuthService.ts
│   │   │   │   ├── AuthService.ios.ts
│   │   │   │   └── AuthService.android.ts
│   │   │   └── types/
│   │   ├── tasks/
│   │   └── widgets/
│   │       ├── ios/
│   │       ├── android/
│   │       └── shared/
│   ├── navigation/
│   │   ├── stacks/
│   │   ├── tabs/
│   │   │   ├── MainTabs.tsx
│   │   │   ├── MainTabs.ios.tsx
│   │   │   └── MainTabs.android.tsx
│   │   └── RootNavigator.tsx
│   ├── services/
│   │   ├── api/
│   │   ├── storage/
│   │   └── notifications/
│   │       ├── NotificationService.ts
│   │       ├── NotificationService.ios.ts
│   │       └── NotificationService.android.ts
│   └── utils/
│       ├── platform/
│       ├── validation/
│       └── formatting/
└── App.tsx
```

**Reasoning:**
- Highly organized
- Clear separation of concerns
- Platform code well-isolated
- Easy to maintain at scale

---

## Code Sharing Patterns

### Pattern 1: Shared Types

```
components/Button/
├── Button.tsx           # Types and exports
├── Button.ios.tsx       # iOS implementation
└── Button.android.tsx   # Android implementation
```

**Button.tsx:**
```typescript
// Shared types
export interface ButtonProps {
  title: string
  onPress: () => void
}

// Shared constants
export const BUTTON_HEIGHT = 48

// Re-export platform implementation
export { Button } from './Button.native'
```

---

### Pattern 2: Shared Logic, Platform UI

```
components/Form/
├── Form.tsx             # Logic controller
├── FormUI.tsx           # Shared UI interface
├── FormUI.ios.tsx       # iOS UI
├── FormUI.android.tsx   # Android UI
└── useFormValidation.ts # Shared hook
```

**Form.tsx:**
```typescript
import { FormUI } from './FormUI'
import { useFormValidation } from './useFormValidation'

export function Form() {
  // Shared business logic
  const { values, errors, handleChange } = useFormValidation()

  // Platform-specific UI
  return (
    <FormUI
      values={values}
      errors={errors}
      onChangeText={handleChange}
    />
  )
}
```

---

### Pattern 3: Shared Services

```
services/notifications/
├── NotificationService.ts         # Interface
├── NotificationService.ios.ts     # iOS implementation
├── NotificationService.android.ts # Android implementation
└── types.ts                       # Shared types
```

**NotificationService.ts:**
```typescript
export interface NotificationService {
  send(title: string, body: string): Promise<void>
  schedule(date: Date, title: string): Promise<void>
}

export { notificationService } from './NotificationService.native'
```

**NotificationService.ios.ts:**
```typescript
class IOSNotificationService implements NotificationService {
  async send(title: string, body: string) {
    // iOS-specific APNs implementation
  }
}

export const notificationService = new IOSNotificationService()
```

---

## Import Resolution Best Practices

### Use Absolute Imports

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}

// Usage
import { Button } from '@components/Button'
import { platformDetection } from '@utils/platform'
```

### Barrel Exports

```typescript
// components/index.ts
export { Button } from './Button'
export { Card } from './Card'
export { Header } from './Header'

// Usage
import { Button, Card, Header } from '@/components'
```

---

## Maintenance Guidelines

### Document Platform Differences

```typescript
/**
 * Button component with platform-specific styling
 *
 * iOS:
 * - Rounded corners (10px)
 * - Shadow for depth
 * - Haptic feedback
 *
 * Android:
 * - Rounded corners (4px)
 * - Elevation for depth
 * - Ripple effect
 */
export function Button() {
  // ...
}
```

### Keep Shared Logic DRY

```typescript
// ✅ Good: Shared validation
// validation.ts
export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Form.ios.tsx
import { validateEmail } from './validation'

// Form.android.tsx
import { validateEmail } from './validation'

// ❌ Bad: Duplicated validation
// Form.ios.tsx
const validateEmail = (email) => { /* ... */ }

// Form.android.tsx
const validateEmail = (email) => { /* ... */ }
```

### Test Platform-Specific Code

```typescript
// Button.test.tsx
describe('Button', () => {
  it('renders on iOS', () => {
    jest.spyOn(Platform, 'OS', 'get').mockReturnValue('ios')
    const { getByText } = render(<Button title="Test" />)
    expect(getByText('Test')).toBeTruthy()
  })

  it('renders on Android', () => {
    jest.spyOn(Platform, 'OS', 'get').mockReturnValue('android')
    const { getByText } = render(<Button title="Test" />)
    expect(getByText('Test')).toBeTruthy()
  })
})
```

---

## Common Pitfalls

### Pitfall 1: Over-organizing

```typescript
// ❌ Too many directories for simple component
components/
└── Button/
    ├── ios/
    │   ├── Button.tsx
    │   ├── styles.ts
    │   └── utils.ts
    ├── android/
    │   ├── Button.tsx
    │   ├── styles.ts
    │   └── utils.ts
    └── shared/
        └── types.ts

// ✅ Simple structure for simple component
components/
├── Button.tsx
├── Button.ios.tsx
└── Button.android.tsx
```

### Pitfall 2: Duplicating Logic

```typescript
// ❌ Duplicated logic
// Form.ios.tsx
function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Form.android.tsx
function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ✅ Shared logic
// validation.ts
export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Both platforms import from validation.ts
```

### Pitfall 3: Not Using Barrel Exports

```typescript
// ❌ Long imports
import { Button } from '../../components/Button/Button'
import { Card } from '../../components/Card/Card'
import { Header } from '../../components/Header/Header'

// ✅ Short imports with barrel export
import { Button, Card, Header } from '@/components'
```

---

## Summary

### Quick Decision Guide

```
Need platform-specific code?
├─ Yes
│  ├─ Is it just styling?
│  │  └─ Use Platform.select in single file
│  ├─ Is logic significantly different?
│  │  └─ Use platform extensions (.ios.tsx, .android.tsx)
│  └─ Is entire feature platform-specific?
│     └─ Use platform directories (ios/, android/)
└─ No
   └─ Use single cross-platform file
```

### Best Practices Checklist

- [ ] Choose appropriate organization strategy
- [ ] Use platform extensions for automatic resolution
- [ ] Extract shared logic to avoid duplication
- [ ] Document platform differences
- [ ] Use absolute imports with path aliases
- [ ] Create barrel exports for clean imports
- [ ] Test on both platforms
- [ ] Keep structure consistent across project

### Resources

- [File Structure Guide](./FileStructure.md) - Detailed file organization patterns
- [Platform Detection](../utils/platformDetection.ts) - Platform utility functions
- [Platform Selection](../utils/platformSelect.ts) - Type-safe platform selection
- [Feature Parity](../FEATURE-PARITY.md) - iOS vs Android feature comparison
