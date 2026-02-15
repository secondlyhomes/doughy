# Reusable Components & Single Source of Truth

## Overview

Building reusable components with centralized values creates consistency, simplifies debugging, and makes maintenance easier. When something breaks, you know exactly where to look.

## Component Size Limits

Keep components small and focused:
- **Hard limit:** 200 lines per component file
- **Target:** 150 lines or fewer
- **If larger:** Split into smaller, composable components

## Core Principles

### 1. Single Source of Truth

Every value that appears multiple times should be defined in exactly one place.

```typescript
// BAD: - Hardcoded values scattered everywhere
// TaskCard.tsx
<View style={{ padding: 16, borderRadius: 12, backgroundColor: '#1E1E1E' }}>

// ProjectCard.tsx
<View style={{ padding: 16, borderRadius: 12, backgroundColor: '#1E1E1E' }}>

// SettingsCard.tsx
<View style={{ padding: 16, borderRadius: 12, backgroundColor: '#1e1e1e' }}> // Different case!
```

```typescript
// GOOD: - Single source of truth
// src/theme/tokens.ts
export const cardTokens = {
  padding: 16,
  borderRadius: 12,
};

// src/components/shared/Card.tsx
export function Card({ children }) {
  const { theme } = useTheme();
  return (
    <View style={{
      padding: cardTokens.padding,
      borderRadius: cardTokens.borderRadius,
      backgroundColor: theme.colors.surface,
    }}>
      {children}
    </View>
  );
}
```

### 2. Composition Over Configuration

Build complex components from simple, reusable parts.

```typescript
// BAD: - One mega component with many props
<Card
  title="Task"
  subtitle="Due tomorrow"
  icon="task"
  iconColor="blue"
  rightElement={<Checkbox />}
  leftElement={<Avatar />}
  showBorder
  elevated
  pressable
  onPress={handlePress}
  onLongPress={handleLongPress}
/>
```

```typescript
// GOOD: - Composable components
<Card pressable onPress={handlePress}>
  <Card.Header>
    <Avatar user={user} />
    <Card.Title>Task</Card.Title>
    <Checkbox checked={done} />
  </Card.Header>
  <Card.Content>
    <Text variant="secondary">Due tomorrow</Text>
  </Card.Content>
</Card>
```

## Component Library Structure

```
src/components/
├── shared/               # Reusable base components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   ├── Card/
│   │   ├── Card.tsx
│   │   ├── CardHeader.tsx
│   │   ├── CardContent.tsx
│   │   └── index.ts
│   ├── Input/
│   ├── Text/
│   ├── Icon/
│   └── index.ts          # Barrel export
├── features/             # Feature-specific components
│   ├── tasks/
│   │   ├── TaskCard.tsx      # Uses shared/Card
│   │   ├── TaskList.tsx
│   │   └── TaskForm.tsx
│   └── auth/
│       ├── LoginForm.tsx     # Uses shared/Input, Button
│       └── SignupForm.tsx
└── layout/               # Layout components
    ├── Screen.tsx
    ├── Header.tsx
    └── TabBar.tsx
```

## Design Tokens

### Centralize All Values

```typescript
// src/theme/tokens.ts

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Border radius
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// Typography
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Touch targets
export const touchTargets = {
  min: 44,      // iOS minimum
  default: 48,  // Recommended
  large: 56,    // Comfortable
} as const;

// Animation durations
export const durations = {
  fast: 100,
  normal: 200,
  slow: 300,
  celebration: 600,
} as const;

// Z-index layers
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  toast: 400,
  tooltip: 500,
} as const;
```

### Use Tokens Everywhere

```typescript
// BAD: - Magic numbers
<View style={{ padding: 16, marginBottom: 24, borderRadius: 12 }}>

// GOOD: - Token references
import { spacing, borderRadius } from '@/theme/tokens';

<View style={{
  padding: spacing.md,
  marginBottom: spacing.lg,
  borderRadius: borderRadius.lg,
}}>
```

## Base Component Examples

### Card Component

```typescript
// src/components/shared/Card/Card.tsx
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { spacing, borderRadius } from '@/theme/tokens';

interface CardProps {
  children: React.ReactNode;
  pressable?: boolean;
  onPress?: () => void;
  elevated?: boolean;
  style?: any;
}

export function Card({
  children,
  pressable = false,
  onPress,
  elevated = false,
  style,
}: CardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (pressable) {
      scale.value = withSpring(0.98);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const cardStyle = [
    styles.card,
    {
      backgroundColor: elevated
        ? theme.colors.surfaceElevated
        : theme.colors.surface,
      borderColor: theme.colors.border,
    },
    elevated && theme.shadows.md,
    style,
  ];

  if (pressable) {
    return (
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[cardStyle, animatedStyle]}>
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

// Sub-components
Card.Header = function CardHeader({ children }) {
  return <View style={styles.header}>{children}</View>;
};

Card.Content = function CardContent({ children }) {
  return <View style={styles.content}>{children}</View>;
};

Card.Footer = function CardFooter({ children }) {
  return <View style={styles.footer}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  content: {
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
});
```

### Button Component

```typescript
// src/components/shared/Button/Button.tsx
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { spacing, borderRadius, fontSize, touchTargets } from '@/theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onPress,
  fullWidth = false,
}: ButtonProps) {
  const { theme } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const buttonStyles = getButtonStyles(variant, size, theme, disabled);
  const textStyles = getTextStyles(variant, size, theme, disabled);

  return (
    <Pressable
      style={[
        styles.button,
        buttonStyles,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={textStyles.color} />
      ) : (
        <Text style={textStyles}>{children}</Text>
      )}
    </Pressable>
  );
}

// Style generators based on variant and size
function getButtonStyles(variant, size, theme, disabled) {
  const baseStyles = {
    height: sizeMap[size].height,
    paddingHorizontal: sizeMap[size].paddingHorizontal,
    borderRadius: borderRadius.lg,
  };

  const variantStyles = {
    primary: {
      backgroundColor: disabled
        ? theme.colors.primary[300]
        : theme.colors.primary[500],
    },
    secondary: {
      backgroundColor: theme.colors.secondary[500],
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.primary[500],
    },
    ghost: {
      backgroundColor: 'transparent',
    },
  };

  return { ...baseStyles, ...variantStyles[variant] };
}

const sizeMap = {
  sm: { height: 36, paddingHorizontal: spacing.md, fontSize: fontSize.sm },
  md: { height: touchTargets.default, paddingHorizontal: spacing.lg, fontSize: fontSize.md },
  lg: { height: touchTargets.large, paddingHorizontal: spacing.xl, fontSize: fontSize.lg },
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
});
```

## Using Reusable Components

### Feature Component Using Base Components

```typescript
// src/components/features/tasks/TaskCard.tsx
import { Card } from '@/components/shared/Card';
import { Text } from '@/components/shared/Text';
import { Checkbox } from '@/components/shared/Checkbox';
import { Avatar } from '@/components/shared/Avatar';
import type { Task } from '@/types/task';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onComplete: () => void;
}

export function TaskCard({ task, onPress, onComplete }: TaskCardProps) {
  return (
    <Card pressable onPress={onPress}>
      <Card.Header>
        <Checkbox checked={task.completed} onChange={onComplete} />
        <Text variant="body" style={{ flex: 1, marginLeft: 12 }}>
          {task.title}
        </Text>
        {task.assignee && <Avatar user={task.assignee} size="sm" />}
      </Card.Header>
      {task.description && (
        <Card.Content>
          <Text variant="secondary" numberOfLines={2}>
            {task.description}
          </Text>
        </Card.Content>
      )}
    </Card>
  );
}
```

## Benefits of This Approach

### 1. Easier Debugging

When a bug appears:
- If it's in **one place** → Bug is in the feature component
- If it's **everywhere** → Bug is in the shared component

```
Bug only in TaskCard? → Check TaskCard.tsx
Bug in all cards? → Check shared/Card/Card.tsx
```

### 2. Consistent Updates

Change once, update everywhere:

```typescript
// Before: Need to update 50 files for border radius change
// After: Update one line in tokens.ts

export const borderRadius = {
  lg: 16,  // Changed from 12 to 16
};

// Every Card, Button, Input now has updated border radius
```

### 3. Design System Compliance

Designers and developers speak the same language:

```
Designer: "Use md spacing and lg border radius"
Developer: spacing.md, borderRadius.lg
```

### 4. Faster Development

New features use existing components:

```typescript
// New feature using existing components
export function NewFeatureCard({ item }) {
  return (
    <Card elevated>
      <Card.Header>
        <Icon name={item.icon} />
        <Text variant="heading">{item.title}</Text>
      </Card.Header>
      <Card.Content>
        <Text>{item.description}</Text>
      </Card.Content>
      <Card.Footer>
        <Button variant="primary" onPress={handleAction}>
          Action
        </Button>
      </Card.Footer>
    </Card>
  );
}
```

## Composition Patterns

Beyond basic component composition, these advanced patterns provide flexibility for complex UIs.

### Compound Components with Context

Compound components share implicit state through React Context, providing a flexible and expressive API:

```typescript
// src/components/shared/Tabs/Tabs.tsx
import { createContext, useContext, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within <Tabs>');
  }
  return context;
}

// Root component
interface TabsProps {
  defaultTab: string;
  children: React.ReactNode;
  onChange?: (tab: string) => void;
}

export function Tabs({ defaultTab, children, onChange }: TabsProps) {
  const [activeTab, setActiveTabState] = useState(defaultTab);

  function setActiveTab(tab: string) {
    setActiveTabState(tab);
    onChange?.(tab);
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <View>{children}</View>
    </TabsContext.Provider>
  );
}

// Tab list container
interface TabListProps {
  children: React.ReactNode;
}

export function TabList({ children }: TabListProps) {
  return (
    <View style={styles.tabList} accessibilityRole="tablist">
      {children}
    </View>
  );
}

// Individual tab trigger
interface TabProps {
  value: string;
  children: React.ReactNode;
}

export function Tab({ value, children }: TabProps) {
  const { activeTab, setActiveTab } = useTabs();
  const { colors } = useTheme();
  const isActive = activeTab === value;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      onPress={() => setActiveTab(value)}
      style={[
        styles.tab,
        { borderBottomColor: isActive ? colors.primary : 'transparent' },
      ]}
    >
      <Text
        style={[
          styles.tabText,
          { color: isActive ? colors.primary : colors.textSecondary },
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

// Tab content panel
interface TabPanelProps {
  value: string;
  children: React.ReactNode;
}

export function TabPanel({ value, children }: TabPanelProps) {
  const { activeTab } = useTabs();

  if (activeTab !== value) return null;

  return (
    <View accessibilityRole="tabpanel" style={styles.tabPanel}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  tabList: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  tab: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: '500' },
  tabPanel: { padding: spacing.md },
});

// Usage:
// <Tabs defaultTab="overview" onChange={(tab) => console.log(tab)}>
//   <TabList>
//     <Tab value="overview">Overview</Tab>
//     <Tab value="tasks">Tasks</Tab>
//     <Tab value="settings">Settings</Tab>
//   </TabList>
//
//   <TabPanel value="overview"><OverviewContent /></TabPanel>
//   <TabPanel value="tasks"><TasksContent /></TabPanel>
//   <TabPanel value="settings"><SettingsContent /></TabPanel>
// </Tabs>
```

### Render Props Pattern

For components that need to delegate rendering to the consumer:

```typescript
// src/components/shared/DataLoader.tsx
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

interface DataLoaderProps<T> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  children: (data: T) => ReactNode;
  loading?: ReactNode;
  error?: (error: Error) => ReactNode;
}

export function DataLoader<T>({
  queryKey,
  queryFn,
  children,
  loading,
  error: errorRenderer,
}: DataLoaderProps<T>) {
  const { data, isLoading, error } = useQuery({ queryKey, queryFn });

  if (isLoading) {
    return loading ?? (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return errorRenderer?.(error) ?? (
      <View style={styles.center}>
        <Text style={styles.error}>Error: {error.message}</Text>
      </View>
    );
  }

  if (!data) return null;

  return <>{children(data)}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: 'red', textAlign: 'center' },
});

// Usage:
// <DataLoader queryKey={['projects']} queryFn={fetchProjects}>
//   {(projects) => (
//     <FlatList
//       data={projects}
//       keyExtractor={(p) => p.id}
//       renderItem={({ item }) => <ProjectCard project={item} />}
//     />
//   )}
// </DataLoader>
```

### Polymorphic Components

In React Native, polymorphic components switch between different native components:

```typescript
// src/components/shared/Box.tsx
import { View, Pressable, StyleSheet } from 'react-native';
import type { ViewStyle, PressableProps, ViewProps } from 'react-native';

type BoxBaseProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof paddingMap;
  margin?: keyof typeof paddingMap;
};

type BoxAsView = BoxBaseProps & ViewProps & {
  pressable?: false;
};

type BoxAsPressable = BoxBaseProps & Omit<PressableProps, 'style'> & {
  pressable: true;
};

type BoxProps = BoxAsView | BoxAsPressable;

const paddingMap = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export function Box(props: BoxProps) {
  const {
    children,
    style,
    padding = 'none',
    margin = 'none',
    ...rest
  } = props;

  const computedStyle: ViewStyle = {
    padding: paddingMap[padding],
    margin: paddingMap[margin],
    ...style,
  };

  if ('pressable' in props && props.pressable) {
    const { pressable, ...pressableProps } = rest as BoxAsPressable;
    return (
      <Pressable style={computedStyle} {...pressableProps}>
        {children}
      </Pressable>
    );
  }

  return (
    <View style={computedStyle} {...(rest as ViewProps)}>
      {children}
    </View>
  );
}

// Usage:
// <Box padding="md">
//   <Text>Static content</Text>
// </Box>
//
// <Box pressable padding="md" onPress={handlePress}>
//   <Text>Pressable content</Text>
// </Box>
```

### Typography Component with Variants

```typescript
// src/components/shared/Text.tsx
import { Text as RNText, StyleSheet } from 'react-native';
import type { TextProps as RNTextProps } from 'react-native';
import { useTheme } from '@/theme';

type TextVariant = 'heading1' | 'heading2' | 'heading3' | 'body' | 'caption' | 'label';
type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';
type TextColor = 'primary' | 'secondary' | 'disabled' | 'error' | 'success';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: TextColor;
  children: React.ReactNode;
}

export function Text({
  variant = 'body',
  weight = 'normal',
  color = 'primary',
  style,
  children,
  ...rest
}: TextProps) {
  const { colors } = useTheme();

  const colorValue = {
    primary: colors.text,
    secondary: colors.textSecondary,
    disabled: colors.textDisabled,
    error: colors.error,
    success: colors.success,
  }[color];

  return (
    <RNText
      style={[
        variantStyles[variant],
        weightStyles[weight],
        { color: colorValue },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

const variantStyles = StyleSheet.create({
  heading1: { fontSize: 32, lineHeight: 40 },
  heading2: { fontSize: 24, lineHeight: 32 },
  heading3: { fontSize: 20, lineHeight: 28 },
  body: { fontSize: 16, lineHeight: 24 },
  caption: { fontSize: 12, lineHeight: 16 },
  label: { fontSize: 14, lineHeight: 20, letterSpacing: 0.5 },
});

const weightStyles = StyleSheet.create({
  normal: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
});

// Usage:
// <Text variant="heading1" weight="bold">Page Title</Text>
// <Text variant="body">Body text paragraph.</Text>
// <Text variant="caption" color="secondary">Last updated 2 hours ago</Text>
```

### Slot Pattern

For components that accept content in named slots:

```typescript
// src/components/shared/ScreenHeader.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import type { ReactNode } from 'react';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Slot for left content (e.g., back button) */
  leftSlot?: ReactNode;
  /** Slot for right content (e.g., action buttons) */
  rightSlot?: ReactNode;
  /** Slot for content below the title */
  bottomSlot?: ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  leftSlot,
  rightSlot,
  bottomSlot,
}: ScreenHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        {leftSlot && <View style={styles.leftSlot}>{leftSlot}</View>}

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>

        {rightSlot && <View style={styles.rightSlot}>{rightSlot}</View>}
      </View>

      {bottomSlot && <View style={styles.bottomSlot}>{bottomSlot}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  leftSlot: { marginRight: spacing.sm },
  titleContainer: { flex: 1 },
  title: { fontSize: 20, fontWeight: '600' },
  subtitle: { fontSize: 14, marginTop: 2 },
  rightSlot: { marginLeft: spacing.sm },
  bottomSlot: { marginTop: spacing.sm },
});

// Usage:
// <ScreenHeader
//   title="Projects"
//   subtitle="Manage your active projects"
//   leftSlot={<BackButton onPress={goBack} />}
//   rightSlot={
//     <IconButton icon="plus" onPress={createProject} />
//   }
//   bottomSlot={
//     <SearchInput value={search} onChangeText={setSearch} />
//   }
// />
```

---

## Anti-Patterns

### Don't Copy-Paste Components

```typescript
// BAD: - Duplicating component code
// TaskCard.tsx
<View style={cardStyles}>...</View>

// ProjectCard.tsx (copy-pasted)
<View style={cardStyles}>...</View>  // Drift will occur!
```

### Don't Override Tokens Inline

```typescript
// BAD: - Overriding tokens defeats the purpose
<Button style={{ borderRadius: 20 }}>  // Magic number!

// GOOD: - Use variant or extend component properly
<Button variant="pill">  // Pill variant uses borderRadius.full
```

### Don't Create One-Off Components

```typescript
// BAD: - Task-specific button when regular Button works
<TaskActionButton />  // Just use <Button variant="primary">

// GOOD: - Create reusable variant if truly needed
<Button variant="action" icon="check">Complete</Button>
```

## Checklist

- [ ] All spacing uses tokens (no magic numbers)
- [ ] All colors from theme
- [ ] Base components in `shared/`
- [ ] Feature components compose base components
- [ ] No copy-pasted component code
- [ ] Consistent prop APIs across components
- [ ] Components are documented
- [ ] Components have tests
