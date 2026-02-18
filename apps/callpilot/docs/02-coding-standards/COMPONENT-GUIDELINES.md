# Component Guidelines

> Comprehensive guide for building React Native components in this codebase.

## Table of Contents

1. [Component Size Guidelines](#component-size-guidelines)
2. [Component Categories](#component-categories)
3. [Export Patterns](#export-patterns)
4. [Props Patterns](#props-patterns)
5. [Styling](#styling)
6. [Accessibility](#accessibility)
7. [Performance](#performance)
8. [Testing Components](#testing-components)
9. [Complete Examples](#complete-examples)
10. [Checklist](#checklist)

---

## Component Size Guidelines

### Hard Limits

| Metric | Target | Hard Limit | Action Required |
|--------|--------|------------|-----------------|
| Lines of code | 150 | 200 | Split component |
| Props count | 5-7 | 10 | Create compound component |
| useEffect hooks | 2 | 3 | Extract to custom hook |
| useState hooks | 3 | 5 | Extract to custom hook or reducer |

### When to Split a Component

Split when you see these warning signs:

1. **Multiple responsibilities** - Component does more than one thing
2. **Deep nesting** - More than 3 levels of conditional rendering
3. **Repeated patterns** - Same JSX structure appears multiple times
4. **Complex state** - More than 3 useState calls
5. **Long event handlers** - Inline functions exceed 10 lines

### How to Split Components

```typescript
// BEFORE: 250+ line component
export function TaskList({ tasks, filter, onTaskPress, onTaskDelete }) {
  // State management (50 lines)
  // Filter logic (30 lines)
  // Event handlers (40 lines)
  // Render helpers (50 lines)
  // Main render (80 lines)
}

// AFTER: Split into focused components

// TaskList.tsx (~80 lines) - Orchestration only
export function TaskList({ tasks, filter, onTaskPress, onTaskDelete }) {
  const { filteredTasks, stats } = useTaskFiltering(tasks, filter);

  return (
    <View style={styles.container}>
      <TaskListHeader stats={stats} />
      <TaskListContent
        tasks={filteredTasks}
        onTaskPress={onTaskPress}
        onTaskDelete={onTaskDelete}
      />
    </View>
  );
}

// TaskListHeader.tsx (~40 lines) - Header display
// TaskListContent.tsx (~60 lines) - List rendering
// useTaskFiltering.ts (~50 lines) - Filter logic
```

### Measuring Component Size

Use the included script to check component sizes:

```bash
node scripts/check-component-sizes.js
```

Components exceeding 200 lines will be flagged for refactoring.

---

## Component Categories

### 1. Screen Components (app/ directory)

Screen components are top-level views tied to routes. They:
- Handle navigation
- Fetch data
- Compose other components
- Manage screen-level state

```typescript
// app/(tabs)/tasks.tsx
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { TaskList, TaskHeader } from '@/components';
import { useTasks } from '@/hooks/useTasks';

export default function TasksScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const { tasks, isLoading, error } = useTasks();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} />;

  return (
    <View style={styles.container}>
      <TaskHeader taskCount={tasks.length} />
      <TaskList tasks={tasks} filter={filter} />
    </View>
  );
}
```

**Note:** Screen components use default exports for Expo Router compatibility.

### 2. Shared Components (src/components/)

Reusable UI components used across multiple screens:

```
src/components/
├── Button.tsx           # Primary action button
├── Card.tsx             # Container with shadow/border
├── Header.tsx           # Screen header with back button
├── Input.tsx            # Text input with validation
├── LoadingSpinner.tsx   # Loading indicator
├── Modal.tsx            # Modal wrapper
├── Toast.tsx            # Notification toast
└── index.ts             # Barrel export
```

Shared components should be:
- **Generic** - No business logic
- **Configurable** - Props for customization
- **Documented** - JSDoc comments for props
- **Tested** - Unit tests for variants

### 3. Feature-Specific Components (colocated)

Components used only within a feature are colocated:

```
src/
├── features/
│   └── tasks/
│       ├── components/
│       │   ├── TaskCard.tsx
│       │   ├── TaskFilters.tsx
│       │   └── TaskProgress.tsx
│       ├── hooks/
│       │   └── useTaskOperations.ts
│       └── index.ts
```

Benefits of colocation:
- Easy to find related code
- Clear ownership boundaries
- Simpler refactoring/deletion

### 4. Layout Components

Components that define page structure:

```typescript
// src/components/layouts/ScreenLayout.tsx
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenLayoutProps {
  children: React.ReactNode;
  padded?: boolean;
  scrollable?: boolean;
}

export function ScreenLayout({
  children,
  padded = true,
  scrollable = false
}: ScreenLayoutProps) {
  const insets = useSafeAreaInsets();

  const Container = scrollable ? ScrollView : View;

  return (
    <Container
      style={[
        styles.container,
        padded && styles.padded,
        { paddingTop: insets.top }
      ]}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  padded: {
    paddingHorizontal: 16,
  },
});
```

---

## Export Patterns

### Named Exports (Preferred)

```typescript
// PREFERRED: Named export
export function TaskCard({ task }: TaskCardProps) {
  return (
    <View style={styles.container}>
      <Text>{task.title}</Text>
    </View>
  );
}

// Import with:
import { TaskCard } from './TaskCard';
```

### Why Named Exports?

1. **Explicit imports** - You know exactly what you're importing
2. **Better refactoring** - IDE can track all usages
3. **No naming confusion** - Can't accidentally rename on import
4. **Tree shaking** - Bundlers can eliminate unused exports

### Barrel File Pattern (index.ts)

Re-export components from barrel files for clean imports:

```typescript
// src/components/index.ts
export { TaskCard } from './TaskCard';
export { Button } from './Button';
export { Header } from './Header';

// Now you can import from one place:
import { TaskCard, Button, Header } from '@/components';
```

### When Default Exports Are OK

- Page/Screen components for file-based routing (Expo Router)
- Configuration files
- Lazy-loaded components with dynamic imports

```typescript
// app/(tabs)/home.tsx - OK for routing
export default function HomeScreen() { ... }
```

---

## Props Patterns

### Interface Definition (Always Exported)

Always define and export prop interfaces:

```typescript
// Export for testing and composition
export interface ButtonProps {
  /** Button label text */
  label: string;
  /** Called when button is pressed */
  onPress: () => void;
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Disabled state */
  disabled?: boolean;
  /** Show loading spinner */
  loading?: boolean;
  /** Test identifier */
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  testID,
}: ButtonProps) {
  // ...
}
```

### Default Props via Destructuring

Use destructuring defaults instead of defaultProps:

```typescript
// GOOD: Defaults in destructuring
export function Card({
  children,
  elevated = false,
  padding = 16,
}: CardProps) {
  // ...
}

// AVOID: defaultProps (deprecated pattern)
Card.defaultProps = {
  elevated: false,
  padding: 16,
};
```

### Children Patterns

```typescript
// Simple children
interface ContainerProps {
  children: React.ReactNode;
}

// Typed children (specific component expected)
interface TabsProps {
  children: React.ReactElement<TabProps> | React.ReactElement<TabProps>[];
}

// Optional children with fallback
interface EmptyStateProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

export function EmptyState({ children, fallback }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {children ?? fallback ?? <Text>No content</Text>}
    </View>
  );
}
```

### Render Props

For maximum flexibility:

```typescript
interface ListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  keyExtractor: (item: T) => string;
}

export function List<T>({
  data,
  renderItem,
  renderEmpty,
  keyExtractor
}: ListProps<T>) {
  if (data.length === 0 && renderEmpty) {
    return <>{renderEmpty()}</>;
  }

  return (
    <View>
      {data.map((item, index) => (
        <View key={keyExtractor(item)}>
          {renderItem(item, index)}
        </View>
      ))}
    </View>
  );
}
```

### Forwarding Props (Spread Pattern)

```typescript
interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label: string;
  error?: string;
}

export function TextInput({
  label,
  error,
  ...inputProps
}: TextInputProps) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <RNTextInput
        style={[styles.input, error && styles.inputError]}
        {...inputProps}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}
```

---

## Styling

### StyleSheet.create Patterns

Always use StyleSheet.create for performance:

```typescript
import { StyleSheet } from 'react-native';

// At bottom of component file
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});
```

### Theme Token Usage

Never hardcode colors or spacing. Use theme tokens:

```typescript
// src/theme/tokens.ts
export const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: {
    primary: '#1A1A1A',
    secondary: '#666666',
    disabled: '#999999',
  },
  border: '#E0E0E0',
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const },
  h2: { fontSize: 24, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
};
```

Using tokens in components:

```typescript
import { colors, spacing, typography } from '@/theme/tokens';

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
});
```

### Responsive Styling

Using useWindowDimensions for responsive layouts:

```typescript
import { useWindowDimensions, StyleSheet } from 'react-native';

export function ResponsiveGrid({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();

  // Calculate columns based on screen width
  const columns = width > 768 ? 3 : width > 480 ? 2 : 1;
  const itemWidth = (width - spacing.md * (columns + 1)) / columns;

  return (
    <View style={styles.grid}>
      {React.Children.map(children, child => (
        <View style={{ width: itemWidth, marginBottom: spacing.md }}>
          {child}
        </View>
      ))}
    </View>
  );
}
```

### Platform-Specific Styles

```typescript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  input: {
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
});
```

For larger platform differences, use separate files:

```
Button/
├── Button.tsx          # Shared logic
├── Button.ios.tsx      # iOS-specific implementation
├── Button.android.tsx  # Android-specific implementation
└── index.ts
```

---

## Accessibility

### Required Accessibility Props

Every interactive component must have:

```typescript
export function TaskCard({ task, onPress }: TaskCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Task: ${task.title}`}
      accessibilityHint="Double tap to view task details"
    >
      <Text>{task.title}</Text>
    </Pressable>
  );
}
```

### accessibilityRole Values

| Role | Use Case |
|------|----------|
| `button` | Tappable elements |
| `link` | Navigation links |
| `header` | Section headings |
| `image` | Images (with label describing content) |
| `text` | Static text |
| `checkbox` | Toggle options |
| `radio` | Single-select options |
| `switch` | On/off toggles |
| `tab` | Tab navigation |
| `progressbar` | Progress indicators |

### accessibilityState

For dynamic states:

```typescript
export function Checkbox({ checked, disabled, onToggle }: CheckboxProps) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{
        checked,
        disabled,
      }}
      accessibilityLabel="Accept terms and conditions"
    >
      <View style={[styles.box, checked && styles.checked]}>
        {checked && <CheckIcon />}
      </View>
    </Pressable>
  );
}
```

### accessibilityHint

Provide context for complex interactions:

```typescript
// Good hints - explain what will happen
accessibilityHint="Double tap to delete this task"
accessibilityHint="Swipe left to reveal options"
accessibilityHint="Double tap to expand details"

// Bad hints - too vague
accessibilityHint="Tap to continue"
accessibilityHint="Press here"
```

### Testing with Screen Readers

1. **iOS VoiceOver**: Settings > Accessibility > VoiceOver
2. **Android TalkBack**: Settings > Accessibility > TalkBack

Test checklist:
- [ ] All interactive elements are focusable
- [ ] Labels clearly describe the element
- [ ] Hints explain non-obvious actions
- [ ] Focus order is logical (top-to-bottom, left-to-right)
- [ ] Decorative images are hidden from screen readers

Hide decorative elements:

```typescript
<Image
  source={decorativePattern}
  accessibilityElementsHidden={true}
  importantForAccessibility="no-hide-descendants"
/>
```

---

## Performance

### Memoization in React 19

React 19's compiler optimizes most re-renders automatically. Manual memoization is rarely needed.

**When to use `useMemo`:**
- Only for **measured** expensive computations (>16ms)
- Profile first with React DevTools before adding

```typescript
// Only if this computation is proven slow via profiling
const sortedTasks = useMemo(
  () => tasks.slice().sort((a, b) => a.dueDate - b.dueDate),
  [tasks]
);
```

**When NOT to memoize:**
- Simple prop transformations (React 19 handles this)
- Most component renders (compiler optimizes automatically)
- "Just in case" optimization (adds complexity without benefit)

> **Note:** `React.memo()` is still valid for edge cases with provably stable props and expensive renders, but profile before using. The React 19 compiler makes most manual memoization unnecessary.

### useCallback for Event Handlers

Stabilize callbacks passed to child components:

```typescript
export function TaskScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);

  // Stable callback - won't cause TaskList to re-render
  const handleTaskPress = useCallback((taskId: string) => {
    router.push(`/tasks/${taskId}`);
  }, []);

  const handleTaskDelete = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  return (
    <TaskList
      tasks={tasks}
      onTaskPress={handleTaskPress}
      onTaskDelete={handleTaskDelete}
    />
  );
}
```

### FlatList vs ScrollView

| Component | Use When |
|-----------|----------|
| `ScrollView` | < 20 items, all visible at once |
| `FlatList` | > 20 items, virtualized rendering |
| `SectionList` | Grouped data with headers |

FlatList optimization:

```typescript
export function TaskList({ tasks }: TaskListProps) {
  const renderItem = useCallback(({ item }: { item: Task }) => (
    <TaskCard task={item} />
  ), []);

  const keyExtractor = useCallback((item: Task) => item.id, []);

  return (
    <FlatList
      data={tasks}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      // Performance props
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={10}
      // Avoid layout thrashing
      getItemLayout={(data, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
    />
  );
}
```

### Image Optimization

```typescript
import { Image } from 'expo-image';

export function Avatar({ uri, size = 48 }: AvatarProps) {
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      // Performance optimizations
      contentFit="cover"
      transition={200}
      placeholder={blurhash}
      cachePolicy="memory-disk"
    />
  );
}
```

Image loading best practices:
- Use `expo-image` instead of React Native's Image
- Provide placeholder/blurhash for loading states
- Specify exact dimensions to prevent layout shift
- Use appropriate cache policies

---

## Testing Components

### React Native Testing Library Patterns

```typescript
// TaskCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TaskCard } from './TaskCard';

const mockTask = {
  id: '1',
  title: 'Test Task',
  completed: false,
};

describe('TaskCard', () => {
  it('renders task title', () => {
    render(<TaskCard task={mockTask} />);

    expect(screen.getByText('Test Task')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<TaskCard task={mockTask} onPress={onPress} />);

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledWith(mockTask.id);
  });

  it('shows completed state', () => {
    render(<TaskCard task={{ ...mockTask, completed: true }} />);

    expect(screen.getByRole('button')).toHaveAccessibilityState({
      checked: true
    });
  });
});
```

### Query Priority

Use queries in this order (most to least preferred):

1. **getByRole** - Best for accessibility
2. **getByLabelText** - Form inputs
3. **getByText** - Static text
4. **getByTestId** - Last resort

```typescript
// BEST: By role (also tests accessibility)
screen.getByRole('button', { name: 'Submit' });

// GOOD: By accessibility label
screen.getByLabelText('Email address');

// OK: By text content
screen.getByText('Welcome back!');

// AVOID: By testID (doesn't test user experience)
screen.getByTestId('submit-button');
```

### Snapshot Testing Guidelines

Use snapshots sparingly:

```typescript
// Good: Snapshot for complex static UI
it('matches snapshot', () => {
  const { toJSON } = render(<ComplexHeader title="Dashboard" />);
  expect(toJSON()).toMatchSnapshot();
});

// Bad: Snapshot for simple component (use assertions instead)
it('matches snapshot', () => {
  const { toJSON } = render(<Text>Hello</Text>);
  expect(toJSON()).toMatchSnapshot(); // Not useful
});
```

When to use snapshots:
- Complex, rarely-changing UI
- Generated components
- Visual regression detection

When NOT to use snapshots:
- Simple components
- Frequently changing UI
- Components with dynamic data

### Mocking Hooks

```typescript
// Mock a custom hook
jest.mock('@/hooks/useTasks', () => ({
  useTasks: () => ({
    tasks: [{ id: '1', title: 'Mocked Task' }],
    isLoading: false,
    error: null,
  }),
}));

// Mock with different states per test
import { useTasks } from '@/hooks/useTasks';
jest.mock('@/hooks/useTasks');

describe('TaskScreen', () => {
  it('shows loading state', () => {
    (useTasks as jest.Mock).mockReturnValue({
      tasks: [],
      isLoading: true,
      error: null,
    });

    render(<TaskScreen />);
    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
  });

  it('shows error state', () => {
    (useTasks as jest.Mock).mockReturnValue({
      tasks: [],
      isLoading: false,
      error: new Error('Network error'),
    });

    render(<TaskScreen />);
    expect(screen.getByText('Network error')).toBeTruthy();
  });
});
```

---

## Complete Examples

### Example 1: Button Component

```typescript
// src/components/Button.tsx
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, typography } from '@/theme/tokens';

export interface ButtonProps {
  /** Button label text */
  label: string;
  /** Called when button is pressed */
  onPress: () => void;
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state */
  disabled?: boolean;
  /** Show loading spinner */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Test identifier */
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#FFFFFF' : colors.primary}
          size="small"
        />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  md: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
  },
  primaryLabel: {
    color: '#FFFFFF',
  },
  secondaryLabel: {
    color: colors.primary,
  },
  ghostLabel: {
    color: colors.primary,
  },
});
```

### Example 2: Card Component

```typescript
// src/components/Card.tsx
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { colors, spacing } from '@/theme/tokens';

export interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Add elevation/shadow */
  elevated?: boolean;
  /** Custom padding (defaults to md) */
  padding?: keyof typeof spacing | number;
  /** Make card pressable */
  onPress?: () => void;
  /** Additional styles */
  style?: ViewStyle;
  /** Test identifier */
  testID?: string;
}

export function Card({
  children,
  elevated = false,
  padding = 'md',
  onPress,
  style,
  testID,
}: CardProps) {
  const paddingValue = typeof padding === 'number'
    ? padding
    : spacing[padding];

  const cardStyle = [
    styles.container,
    elevated && styles.elevated,
    { padding: paddingValue },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyle,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        testID={testID}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevated: {
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
```

### Example 3: Before/After Refactoring

**BEFORE: Monolithic component (280 lines)**

```typescript
// This component does too much
export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    // 30 lines of data fetching
  }, []);

  useEffect(() => {
    // 20 lines of filter logic
  }, [filter, sortBy]);

  const handleTaskCreate = async (data: TaskData) => {
    // 25 lines of creation logic
  };

  const handleTaskUpdate = async (id: string, data: TaskData) => {
    // 25 lines of update logic
  };

  const handleTaskDelete = async (id: string) => {
    // 15 lines of deletion logic
  };

  const renderTaskItem = (task: Task) => {
    // 30 lines of task card rendering
  };

  const renderFilters = () => {
    // 25 lines of filter UI
  };

  const renderHeader = () => {
    // 20 lines of header UI
  };

  // 50+ lines of main render
  return (
    <View>
      {renderHeader()}
      {renderFilters()}
      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        // ...
      />
      {selectedTask && <TaskModal task={selectedTask} />}
    </View>
  );
}
```

**AFTER: Refactored into focused components**

```typescript
// hooks/useTaskManager.ts (60 lines)
export function useTaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { data, isLoading, error } = useQuery(['tasks'], fetchTasks);

  const createTask = useMutation(/* ... */);
  const updateTask = useMutation(/* ... */);
  const deleteTask = useMutation(/* ... */);

  return {
    tasks: data ?? [],
    isLoading,
    error,
    createTask: createTask.mutate,
    updateTask: updateTask.mutate,
    deleteTask: deleteTask.mutate,
  };
}

// hooks/useTaskFilters.ts (40 lines)
export function useTaskFilters(tasks: Task[]) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(/* ... */)
      .sort(/* ... */);
  }, [tasks, filter, sortBy]);

  return { filteredTasks, filter, setFilter, sortBy, setSortBy };
}

// components/TaskHeader.tsx (45 lines)
export function TaskHeader({ taskCount }: TaskHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>My Tasks</Text>
      <Text style={styles.count}>{taskCount} tasks</Text>
    </View>
  );
}

// components/TaskFilters.tsx (55 lines)
export function TaskFilters({
  filter,
  setFilter,
  sortBy,
  setSortBy
}: TaskFiltersProps) {
  return (
    <View style={styles.filters}>
      <FilterChips value={filter} onChange={setFilter} />
      <SortDropdown value={sortBy} onChange={setSortBy} />
    </View>
  );
}

// components/TaskCard.tsx (50 lines)
export const TaskCard = React.memo(function TaskCard({
  task,
  onPress,
  onDelete,
}: TaskCardProps) {
  return (
    <Card onPress={() => onPress(task.id)}>
      <Text style={styles.title}>{task.title}</Text>
      <Text style={styles.date}>{formatDate(task.dueDate)}</Text>
    </Card>
  );
});

// components/TaskList.tsx (60 lines)
export function TaskList({
  tasks,
  onTaskPress,
  onTaskDelete
}: TaskListProps) {
  const renderItem = useCallback(({ item }: { item: Task }) => (
    <TaskCard
      task={item}
      onPress={onTaskPress}
      onDelete={onTaskDelete}
    />
  ), [onTaskPress, onTaskDelete]);

  return (
    <FlatList
      data={tasks}
      renderItem={renderItem}
      keyExtractor={item => item.id}
    />
  );
}

// screens/TaskManagerScreen.tsx (70 lines - orchestration only)
export default function TaskManagerScreen() {
  const { tasks, isLoading, error, deleteTask } = useTaskManager();
  const { filteredTasks, filter, setFilter, sortBy, setSortBy } =
    useTaskFilters(tasks);
  const router = useRouter();

  const handleTaskPress = useCallback((id: string) => {
    router.push(`/tasks/${id}`);
  }, [router]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} />;

  return (
    <ScreenLayout>
      <TaskHeader taskCount={filteredTasks.length} />
      <TaskFilters
        filter={filter}
        setFilter={setFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
      <TaskList
        tasks={filteredTasks}
        onTaskPress={handleTaskPress}
        onTaskDelete={deleteTask}
      />
    </ScreenLayout>
  );
}
```

---

## Checklist

### Before Creating a Component

- [ ] Check if similar component exists in `src/components/`
- [ ] Determine category: shared, feature-specific, or layout
- [ ] Plan props interface

### Component Structure

- [ ] Uses named export (not default, unless screen component)
- [ ] Props interface is defined and exported
- [ ] Props have JSDoc comments
- [ ] Default values via destructuring
- [ ] Under 200 lines (target: 150)

### Styling

- [ ] Uses `StyleSheet.create`
- [ ] Uses theme tokens (no hardcoded colors/spacing)
- [ ] Handles both iOS and Android
- [ ] Responsive to screen size changes

### Accessibility

- [ ] Has `accessibilityRole`
- [ ] Has `accessibilityLabel`
- [ ] Has `accessibilityHint` for complex actions
- [ ] Uses `accessibilityState` for dynamic states
- [ ] Tested with VoiceOver/TalkBack

### Performance

- [ ] Uses `useMemo` only for measured expensive computations
- [ ] Uses `FlatList` for long lists
- [ ] Images optimized with `expo-image`

### Testing

- [ ] Has unit tests
- [ ] Tests cover main variants/states
- [ ] Uses accessible queries (byRole, byLabelText)
- [ ] Mocks external dependencies

### Before PR

- [ ] Added to barrel export (`index.ts`)
- [ ] `npm test` passes
- [ ] `npx tsc --noEmit` passes
- [ ] Tested on physical device (iOS and Android)
- [ ] Run `node scripts/check-component-sizes.js`

---

## Related Documentation

- [Design Philosophy](../05-ui-ux/DESIGN-PHILOSOPHY.md)
- [TypeScript Guidelines](./TYPESCRIPT-GUIDELINES.md)
- [Testing Strategy](../06-testing/TESTING-STRATEGY.md)
- [Theme Tokens](../05-ui-ux/THEMING.md)
