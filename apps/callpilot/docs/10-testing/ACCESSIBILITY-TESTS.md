# Accessibility Testing Guide

## Overview

Accessibility testing ensures your app works for users with disabilities. This includes visual impairments, motor difficulties, and cognitive differences (including ADHD).

## WCAG & Mobile Standards

| Standard | Level | What it Covers |
|----------|-------|----------------|
| WCAG 2.1 AA | Required | Color contrast, text size, keyboard nav |
| iOS VoiceOver | Required | Screen reader support |
| Android TalkBack | Required | Screen reader support |
| ADHD-friendly | Recommended | Reduced cognitive load |

## Automated Testing

### React Native Testing Library

```typescript
// src/components/__tests__/Button.a11y.test.tsx
import { render } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button Accessibility', () => {
  it('has accessible role', () => {
    const { getByRole } = render(
      <Button onPress={() => {}}>Submit</Button>
    );

    expect(getByRole('button')).toBeTruthy();
  });

  it('has accessible label', () => {
    const { getByLabelText } = render(
      <Button onPress={() => {}} accessibilityLabel="Submit form">
        Submit
      </Button>
    );

    expect(getByLabelText('Submit form')).toBeTruthy();
  });

  it('announces disabled state', () => {
    const { getByRole } = render(
      <Button onPress={() => {}} disabled>
        Submit
      </Button>
    );

    expect(getByRole('button').props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });
});
```

### axe-core for React Native

```bash
npm install --save-dev @axe-core/react
```

```typescript
// src/__tests__/setup/a11y.ts
import { configureAxe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

export const axe = configureAxe({
  rules: {
    'color-contrast': { enabled: true },
    'landmark-one-main': { enabled: false }, // Not applicable to mobile
  },
});
```

```typescript
// Usage in tests
import { axe } from '@tests/setup/a11y';

it('has no accessibility violations', async () => {
  const { container } = render(<TaskCard task={mockTask} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Manual Testing Checklist

### VoiceOver (iOS)

```
Settings > Accessibility > VoiceOver > ON
```

Test these flows:
- [ ] Can navigate entire app with swipe gestures
- [ ] All interactive elements are announced
- [ ] Custom components have proper labels
- [ ] Images have alt text or are marked decorative
- [ ] Form inputs announce labels and errors
- [ ] Buttons announce their purpose
- [ ] Loading states are announced
- [ ] Alerts and modals trap focus

### TalkBack (Android)

```
Settings > Accessibility > TalkBack > ON
```

Test the same flows as VoiceOver.

### Dynamic Type (iOS)

```
Settings > Accessibility > Display & Text Size > Larger Text
```

- [ ] Text scales up to 200% without breaking layout
- [ ] No text truncation hides critical info
- [ ] Touch targets remain accessible

### Reduce Motion

```
Settings > Accessibility > Motion > Reduce Motion
```

- [ ] Animations are minimized or disabled
- [ ] No content depends solely on animation

## Accessibility Props

### Essential Props

```typescript
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Delete task"
  accessibilityHint="Double tap to delete this task"
  accessibilityRole="button"
  accessibilityState={{ disabled: isDeleting }}
  onPress={handleDelete}
>
  <TrashIcon />
</TouchableOpacity>
```

### Roles Reference

| Role | Use Case |
|------|----------|
| `button` | Clickable elements |
| `link` | Navigation links |
| `header` | Section headings |
| `text` | Static text |
| `image` | Decorative images |
| `imagebutton` | Clickable images |
| `checkbox` | Toggle options |
| `radio` | Single select options |
| `switch` | On/off toggles |
| `alert` | Important messages |
| `progressbar` | Loading indicators |

### Grouping Related Elements

```typescript
// Group card elements for single focus
<View
  accessible={true}
  accessibilityLabel={`Task: ${task.title}, due ${task.dueDate}`}
>
  <Text>{task.title}</Text>
  <Text>{task.dueDate}</Text>
</View>
```

### Hiding Decorative Elements

```typescript
// Hide from screen readers
<Image
  source={decorativePattern}
  accessibilityElementsHidden={true}
  importantForAccessibility="no-hide-descendants"
/>
```

## Color Contrast

### Minimum Ratios (WCAG AA)

| Element | Ratio | Example |
|---------|-------|---------|
| Normal text | 4.5:1 | #666 on #fff ❌, #555 on #fff ✓ |
| Large text (18pt+) | 3:1 | More flexibility |
| UI components | 3:1 | Buttons, inputs |

### Testing Contrast

```typescript
// src/utils/__tests__/colorContrast.test.ts
import { getContrastRatio } from '../colorContrast';

describe('Color Contrast', () => {
  it('primary text meets AA standard', () => {
    const ratio = getContrastRatio('#1a1a1a', '#ffffff');
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('secondary text meets AA standard', () => {
    const ratio = getContrastRatio('#666666', '#ffffff');
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('button text meets AA standard', () => {
    const ratio = getContrastRatio('#ffffff', '#0066cc');
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
```

### Contrast Utility

```typescript
// src/utils/colorContrast.ts
function getLuminance(hex: string): number {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;

  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(fg: string, bg: string): number {
  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
```

## Touch Targets

### Minimum Sizes

| Platform | Minimum | Recommended |
|----------|---------|-------------|
| iOS | 44×44pt | 48×48pt |
| Android | 48×48dp | 56×56dp |

```typescript
// Ensure minimum touch target
<TouchableOpacity
  style={{ minWidth: 48, minHeight: 48 }}
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  onPress={handlePress}
>
  <SmallIcon />
</TouchableOpacity>
```

## ADHD-Friendly Testing

### Cognitive Load Checklist

- [ ] One primary action per screen
- [ ] Clear visual hierarchy
- [ ] No auto-playing content
- [ ] Undo available for destructive actions
- [ ] Progress indicators for long operations
- [ ] No time limits on tasks
- [ ] Consistent navigation patterns

### Focus Management

```typescript
// Auto-focus important elements
useEffect(() => {
  if (isOpen) {
    AccessibilityInfo.setAccessibilityFocus(
      findNodeHandle(inputRef.current)
    );
  }
}, [isOpen]);
```

## CI Integration

```yaml
# .github/workflows/a11y.yml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Run a11y tests
        run: npm test -- --testPathPattern=a11y

      - name: Check color contrast
        run: npm run check:contrast
```

## Accessibility Checklist

### Before Release

- [ ] All interactive elements have labels
- [ ] All images have alt text
- [ ] Color contrast meets WCAG AA
- [ ] Touch targets are 48×48pt minimum
- [ ] VoiceOver tested on iOS
- [ ] TalkBack tested on Android
- [ ] Dynamic Type works up to 200%
- [ ] Reduce Motion respected
- [ ] No flashing content (>3 flashes/sec)
- [ ] Focus order is logical
- [ ] Error messages are announced
- [ ] Loading states are announced

### Component Checklist

```typescript
// Use this interface to ensure a11y props
interface AccessibleProps {
  accessible?: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole: AccessibilityRole;
  accessibilityState?: AccessibilityState;
}
```
