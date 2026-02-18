# Accessibility (a11y)

> Comprehensive guide to building accessible React Native applications that work for all users, regardless of ability.

## Overview

Accessibility is not a feature to add later or a compliance checkbox. It is a fundamental quality attribute baked into every component, interaction, and content decision from the start.

Approximately 1 in 4 adults in the US live with a disability. Accessible design benefits everyone, including users with temporary impairments (broken arm, bright sunlight), aging users, and power users who prefer alternative input methods.

---

## React Native Accessibility Props

### Core Props

| Prop | Purpose | Example |
|------|---------|---------|
| `accessible` | Groups child elements into single focusable element | `<View accessible={true}>` |
| `accessibilityLabel` | Text read by screen reader (like `alt` text) | `accessibilityLabel="Close dialog"` |
| `accessibilityHint` | Additional context about what happens when activated | `accessibilityHint="Deletes the task permanently"` |
| `accessibilityRole` | Semantic role for assistive technology | `accessibilityRole="button"` |
| `accessibilityState` | Current state of the element | `accessibilityState={{ disabled: true, checked: true }}` |
| `accessibilityValue` | Current value for sliders/progress | `accessibilityValue={{ min: 0, max: 100, now: 50 }}` |
| `accessibilityActions` | Custom actions for screen reader users | Magic tap, escape, etc. |
| `accessibilityLiveRegion` | Announces dynamic content changes (Android) | `accessibilityLiveRegion="polite"` |

### Accessibility Roles

| Role | Use For |
|------|---------|
| `button` | Pressable elements that trigger actions |
| `link` | Navigation to another screen or external URL |
| `header` | Section headings |
| `image` | Images and icons |
| `text` | Static text content |
| `search` | Search input fields |
| `checkbox` | Toggle elements |
| `radio` | Radio button selections |
| `switch` | On/off toggles |
| `slider` | Range inputs |
| `progressbar` | Loading/progress indicators |
| `alert` | Important messages requiring attention |
| `menu` | Dropdown or popup menus |
| `menuitem` | Items within a menu |
| `tab` | Tab navigation |
| `tablist` | Container for tabs |

### Accessibility States

```typescript
// All available states
accessibilityState={{
  disabled: boolean,    // Element cannot be interacted with
  selected: boolean,    // Element is currently selected
  checked: boolean | 'mixed', // Checkbox/radio state
  busy: boolean,        // Element is loading
  expanded: boolean,    // Expandable element state
}}
```

---

## Accessible Components

### Button with Full Accessibility

```typescript
interface AccessibleButtonProps {
  label: string;
  hint?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function AccessibleButton({
  label,
  hint,
  onPress,
  disabled = false,
  loading = false,
}: AccessibleButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={loading ? `${label}, loading` : label}
      accessibilityHint={hint}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
    </Pressable>
  );
}
```

### Accessible Form Field

```typescript
interface AccessibleInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function AccessibleInput({
  label,
  value,
  onChangeText,
  error,
  hint,
  required = false,
}: AccessibleInputProps) {
  const inputId = useId();

  return (
    <View>
      <Text
        nativeID={`${inputId}-label`}
        accessibilityRole="text"
        style={styles.label}
      >
        {label}{required && ' *'}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        accessible={true}
        accessibilityLabel={label}
        accessibilityLabelledBy={`${inputId}-label`}
        accessibilityHint={hint}
        accessibilityState={{
          disabled: false,
        }}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        style={[styles.input, error && styles.inputError]}
      />

      {error && (
        <Text
          nativeID={`${inputId}-error`}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={styles.errorText}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
```

### Accessible Toggle/Switch

```typescript
export function AccessibleSwitch({
  label,
  value,
  onValueChange,
  disabled = false,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessible={true}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{
          checked: value,
          disabled,
        }}
      />
    </View>
  );
}
```

---

## Touch Target Sizes

### Minimum Requirements

| Platform | Minimum Size | Recommended |
|----------|--------------|-------------|
| iOS | 44x44 pt | 48x48 pt |
| Android | 48x48 dp | 48x48 dp |
| WCAG 2.1 AAA | 44x44 CSS px | 48x48 CSS px |

### Implementation

```typescript
const styles = StyleSheet.create({
  // Minimum touch target for interactive elements
  touchTarget: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // For icon-only buttons, add padding
  iconButton: {
    padding: 12, // 24px icon + 12px padding each side = 48px total
  },

  // For small visual elements, extend the hitSlop
  smallButton: {
    // Visual size can be smaller
    width: 24,
    height: 24,
  },
});

// Use hitSlop for visually small elements
<Pressable
  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
  style={styles.smallButton}
>
  <Icon name="close" size={24} />
</Pressable>
```

---

## Dynamic Type / Font Scaling

### Respecting User Preferences

```typescript
import { PixelRatio, Text } from 'react-native';

// Check if user has increased font size
const fontScale = PixelRatio.getFontScale();
const hasLargeFonts = fontScale > 1.2;

// Allow text to scale with system settings (default behavior)
// Do NOT set allowFontScaling={false} unless absolutely necessary
<Text>This scales with system font size</Text>

// For fixed-size elements (rare), limit scaling range
<Text
  maxFontSizeMultiplier={1.5}  // Cap at 150% of base size
  style={styles.fixedText}
>
  Tab label
</Text>
```

### Testing Different Font Scales

**iOS:**
Settings > Accessibility > Display & Text Size > Larger Text

**Android:**
Settings > Accessibility > Font size

### Handling Layout with Large Fonts

```typescript
// Use flexible layouts that accommodate larger text
const styles = StyleSheet.create({
  // BAD: Fixed height will clip large text
  fixedContainer: {
    height: 48,
  },

  // GOOD: Min height allows expansion
  flexibleContainer: {
    minHeight: 48,
    paddingVertical: 12,
  },

  // Allow text to wrap instead of truncating
  flexibleText: {
    flexShrink: 1,
    flexWrap: 'wrap',
  },
});
```

---

## Reduce Motion

### Respecting User Preferences

```typescript
import { AccessibilityInfo } from 'react-native';

export function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );

    return () => subscription.remove();
  }, []);

  return reduceMotion;
}
```

### Conditional Animations

```typescript
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

function AnimatedCard({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (reduceMotion) {
      // Instant change for reduce motion users
      scale.value = 0.95;
    } else {
      // Spring animation for others
      scale.value = withSpring(0.95);
    }
  };

  const handlePressOut = () => {
    if (reduceMotion) {
      scale.value = 1;
    } else {
      scale.value = withSpring(1);
    }
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
```

---

## Screen Reader Announcements

### Announcing Dynamic Content

```typescript
import { AccessibilityInfo } from 'react-native';

// Announce important changes
function announceToScreenReader(message: string) {
  AccessibilityInfo.announceForAccessibility(message);
}

// Usage examples
announceToScreenReader('Task created successfully');
announceToScreenReader('3 items selected');
announceToScreenReader('Loading complete');
```

### Live Regions (Android)

```typescript
// For content that updates dynamically
<View accessibilityLiveRegion="polite">
  <Text>{itemCount} items in cart</Text>
</View>

// For critical alerts
<View accessibilityLiveRegion="assertive">
  <Text>Error: Payment failed</Text>
</View>
```

### Focus Management

```typescript
import { useRef } from 'react';
import { AccessibilityInfo, findNodeHandle } from 'react-native';

function ModalScreen() {
  const titleRef = useRef<Text>(null);

  useEffect(() => {
    // Move screen reader focus to modal title when opened
    const node = findNodeHandle(titleRef.current);
    if (node) {
      AccessibilityInfo.setAccessibilityFocus(node);
    }
  }, []);

  return (
    <View>
      <Text ref={titleRef} accessibilityRole="header">
        Modal Title
      </Text>
      {/* Modal content */}
    </View>
  );
}
```

---

## Color Contrast Requirements

### Minimum Ratios

| Content Type | Minimum Ratio | Example |
|--------------|---------------|---------|
| Normal text (< 18pt) | 4.5:1 | `#6B7280` on `#FFFFFF` = 5.0:1 |
| Large text (≥ 18pt or 14pt bold) | 3:1 | `#9CA3AF` on `#FFFFFF` = 3.0:1 |
| UI components (borders, icons) | 3:1 | Focus rings, buttons |
| Non-text contrast | 3:1 | Charts, graphs, icons |

### Theme Token Compliance

```typescript
// src/theme/colors.ts
export const colors = {
  // Text colors verified for contrast
  text: {
    primary: '#1F2937',     // 15.9:1 on white
    secondary: '#4B5563',   // 7.5:1 on white
    disabled: '#9CA3AF',    // 3.0:1 on white (meets large text only)
  },

  // Semantic colors meeting 3:1 on their backgrounds
  semantic: {
    error: '#DC2626',       // 5.9:1 on white
    success: '#16A34A',     // 4.5:1 on white
    warning: '#D97706',     // 4.5:1 on white
  },
};
```

---

## VoiceOver (iOS) Testing

### Enabling VoiceOver

1. Settings > Accessibility > VoiceOver > On
2. Or: Triple-click side button (if configured)

### Key Gestures

| Gesture | Action |
|---------|--------|
| Tap | Select item under finger |
| Swipe right | Move to next element |
| Swipe left | Move to previous element |
| Double tap | Activate selected element |
| Two-finger swipe up | Read all from top |
| Two-finger tap | Pause/resume reading |
| Three-finger swipe | Scroll |
| Escape gesture (Z shape) | Go back / dismiss |

### Testing Checklist

- [ ] All interactive elements have accessible names
- [ ] Reading order matches visual flow
- [ ] Focus moves logically through the screen
- [ ] State changes are announced
- [ ] Images have descriptions (or are hidden if decorative)
- [ ] Forms announce errors clearly
- [ ] Modal focus is trapped appropriately
- [ ] Custom gestures have accessible alternatives

---

## TalkBack (Android) Testing

### Enabling TalkBack

1. Settings > Accessibility > TalkBack > On
2. Or: Hold both volume buttons (if configured)

### Key Gestures

| Gesture | Action |
|---------|--------|
| Tap | Select item under finger |
| Swipe right | Move to next element |
| Swipe left | Move to previous element |
| Double tap | Activate selected element |
| Swipe up then right | Global context menu |
| Swipe down then right | Local context menu |
| Two-finger scroll | Scroll |
| Swipe down then left | Go back |

### Android-Specific Props

```typescript
// Android-specific accessibility props
<View
  accessibilityLiveRegion="polite"  // Android only
  importantForAccessibility="yes"    // Android only
>
  {/* Content */}
</View>
```

---

## Testing Tools

### Development Testing

1. **Accessibility Inspector (iOS)**
   - Xcode > Open Developer Tool > Accessibility Inspector
   - Inspect elements, check labels, audit for issues

2. **Accessibility Scanner (Android)**
   - Download from Play Store
   - Scan your app for accessibility issues
   - Get suggestions for improvements

3. **React Native Accessibility Info**
   ```typescript
   // Check screen reader status in development
   AccessibilityInfo.isScreenReaderEnabled().then(enabled => {
     console.log('Screen reader enabled:', enabled);
   });
   ```

### Automated Testing

```typescript
// __tests__/accessibility.test.tsx
import { render, screen } from '@testing-library/react-native';

describe('Button Accessibility', () => {
  it('has accessible name', () => {
    render(<Button label="Submit" onPress={() => {}} />);

    expect(screen.getByRole('button', { name: 'Submit' })).toBeTruthy();
  });

  it('announces disabled state', () => {
    render(<Button label="Submit" onPress={() => {}} disabled />);

    const button = screen.getByRole('button');
    expect(button.props.accessibilityState.disabled).toBe(true);
  });
});
```

---

## Accessibility Checklist

### Every Screen

- [ ] Screen has a descriptive title/heading
- [ ] Reading order is logical (top to bottom, left to right)
- [ ] All interactive elements have accessible names
- [ ] Touch targets are at least 48x48 points
- [ ] Color is not the only indicator of meaning
- [ ] Text meets contrast requirements

### Forms

- [ ] All inputs have labels
- [ ] Required fields are indicated
- [ ] Errors are announced and associated with fields
- [ ] Hints provide helpful context
- [ ] Submit button has clear purpose

### Navigation

- [ ] Current screen is announced
- [ ] Tab bar items have labels
- [ ] Back button is accessible
- [ ] Modals trap focus appropriately
- [ ] Focus returns to trigger on dismiss

### Dynamic Content

- [ ] Loading states are announced
- [ ] Content updates are announced (aria-live)
- [ ] Toasts/alerts are accessible
- [ ] Animations respect reduce motion

### Images and Media

- [ ] Informative images have descriptions
- [ ] Decorative images are hidden from screen readers
- [ ] Videos have captions (if applicable)
- [ ] Audio has transcripts (if applicable)

---

## Related Documentation

- [Design Philosophy](./DESIGN-PHILOSOPHY.md)
- [Design System](./DESIGN-SYSTEM.md)
- [Component Guidelines](../02-coding-standards/COMPONENT-GUIDELINES.md)
- [Testing Strategy](../10-testing/TESTING-STRATEGY.md)
