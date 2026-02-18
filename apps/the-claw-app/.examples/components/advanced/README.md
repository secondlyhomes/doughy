# Advanced Components

Full-featured, production-ready components with complete functionality and best practices.

## Overview

These are **reference implementations** - copy them to your `src/components/` directory and customize to your needs. All components are theme-aware, accessible, and follow React Native best practices.

## Components

### Card

Full-featured card component with variants, press handling, and shadows.

**Variants:**
- `elevated` - Card with shadow (default)
- `outlined` - Card with border
- `filled` - Card with solid background

**Use cases:**
- List items (products, articles, users)
- Content containers
- Clickable navigation cards

```tsx
import { Card } from '@/components'

// Basic card
<Card>
  <Text>Content</Text>
</Card>

// Pressable card
<Card onPress={() => navigate('Details')}>
  <Text variant="h4">Product</Text>
  <Text>$29.99</Text>
</Card>
```

**File:** `Card.tsx`

---

### LoadingState

Loading state with spinner and optional message.

**Features:**
- Customizable spinner size
- Optional loading message
- Full-screen overlay mode
- Theme-aware colors

**Use cases:**
- Data fetching states
- Form submission
- Page transitions

```tsx
import { LoadingState } from '@/components'

// Basic loading
<LoadingState />

// With message
<LoadingState message="Loading your data..." />

// Full-screen overlay
<LoadingState overlay message="Processing..." />
```

**File:** `LoadingState.tsx`

---

### ErrorState

Error state with icon, message, and retry functionality.

**Features:**
- Customizable title and message
- Retry button with callback
- Optional action button
- Error icon

**Use cases:**
- Network errors
- Failed data fetches
- Permission errors
- Generic error handling

```tsx
import { ErrorState } from '@/components'

// Basic error
<ErrorState
  message="Failed to load data"
  onRetry={() => refetch()}
/>

// Custom title
<ErrorState
  title="Network Error"
  message="Check your connection and try again"
  retryText="Retry"
  onRetry={handleRetry}
/>

// Without retry
<ErrorState
  message="This feature is not available"
  showRetry={false}
/>
```

**File:** `ErrorState.tsx`

---

### EmptyState

Empty state with icon, title, description, and optional CTA.

**Features:**
- Customizable icon (emoji or component)
- Title and description
- Optional call-to-action button
- Theme-aware styling

**Use cases:**
- Empty lists
- No search results
- Empty inbox/cart
- Onboarding screens

```tsx
import { EmptyState } from '@/components'

// With CTA
<EmptyState
  icon="📝"
  title="No tasks yet"
  description="Create your first task to get started"
  actionText="Create Task"
  onAction={() => navigate('CreateTask')}
/>

// No action needed
<EmptyState
  icon="🔍"
  title="No results found"
  description="Try a different search"
/>
```

**File:** `EmptyState.tsx`

---

### FormField

Complex form field with validation, icons, and password toggle.

**Features:**
- Built-in validation rules
- Password visibility toggle
- Left and right icons
- Success/error states
- Touch-based validation

**Validation rules:**
- `required` - Field must have a value
- `minLength` - Minimum character count
- `maxLength` - Maximum character count
- `pattern` - RegEx validation
- `validate` - Custom function

**Use cases:**
- Login/signup forms
- Profile editing
- Search inputs
- Password fields

```tsx
import { FormField } from '@/components'

// Email field
<FormField
  name="email"
  label="Email"
  placeholder="Enter your email"
  value={formData.email}
  onChangeText={(text) => setFormData({ ...formData, email: text })}
  rules={{
    required: 'Email is required',
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Invalid email format'
    }
  }}
  leftIcon="📧"
/>

// Password field
<FormField
  name="password"
  label="Password"
  placeholder="Enter your password"
  value={formData.password}
  onChangeText={(text) => setFormData({ ...formData, password: text })}
  secureTextEntry
  showPasswordToggle
  rules={{
    required: true,
    minLength: { value: 8, message: 'Min 8 characters' }
  }}
/>
```

**File:** `FormField.tsx`

---

## Usage Pattern

### 1. Copy to Your Project

```bash
# Copy specific component
cp .examples/components/advanced/Card.tsx src/components/

# Copy all advanced components
cp .examples/components/advanced/*.tsx src/components/
```

### 2. Import in Your Component

```tsx
import { Card, LoadingState, ErrorState, EmptyState } from '@/components'
```

### 3. Use in Screen Component

Example: List screen with all states

```tsx
function TasksScreen() {
  const { data, isLoading, error, refetch } = useTasksQuery()

  if (isLoading) {
    return <LoadingState message="Loading tasks..." />
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load tasks"
        onRetry={refetch}
      />
    )
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon="📝"
        title="No tasks yet"
        description="Create your first task to get started"
        actionText="Create Task"
        onAction={() => navigate('CreateTask')}
      />
    )
  }

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => (
        <Card onPress={() => navigate('TaskDetail', { id: item.id })}>
          <Text variant="h4">{item.title}</Text>
          <Text>{item.description}</Text>
        </Card>
      )}
    />
  )
}
```

## Customization

All components use theme tokens and accept custom styles:

```tsx
// Override variant styles
<Card
  variant="elevated"
  style={{
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[500],
  }}
>
  <Text>Custom styled card</Text>
</Card>

// Custom padding
<Card padding="lg">
  <Text>Large padding</Text>
</Card>
```

## Testing

All components should be tested for:
- Rendering with different props
- User interactions (press, retry)
- Accessibility
- Theme changes (light/dark)

Example test:

```tsx
import { render, fireEvent } from '@testing-library/react-native'
import { Card } from './Card'

test('calls onPress when pressed', () => {
  const onPress = jest.fn()
  const { getByRole } = render(
    <Card onPress={onPress}>
      <Text>Content</Text>
    </Card>
  )

  fireEvent.press(getByRole('button'))
  expect(onPress).toHaveBeenCalledTimes(1)
})
```

## Best Practices

1. **Always use theme tokens** - Never hardcode colors or spacing
2. **Accessibility first** - Include proper roles and labels
3. **Keep components focused** - Each component does one thing well
4. **Compose components** - Build complex UIs from simple components
5. **Test thoroughly** - Unit tests + visual tests

## Related

- **Basic Components:** [src/components/](../../../src/components/) - Button, Input, Text
- **Patterns:** [.examples/patterns/](../../patterns/) - Implementation guides
- **Theme:** [src/theme/](../../../src/theme/) - Design tokens and theming

## Questions?

See [docs/patterns/NEW-FEATURE.md](../../../docs/patterns/NEW-FEATURE.md) for feature implementation guide.
