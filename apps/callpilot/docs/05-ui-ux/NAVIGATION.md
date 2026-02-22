# Navigation Patterns

## Overview

Navigation should feel native and predictable. We use Expo Router (file-based routing) for type-safe, intuitive navigation.

## Setup

### Install Expo Router

```bash
npx expo install expo-router expo-linking expo-constants expo-status-bar
```

### Configure app.json

```json
{
  "expo": {
    "scheme": "yourapp",
    "plugins": ["expo-router"],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

## File Structure

```
app/
├── _layout.tsx           # Root layout
├── index.tsx             # Home screen (/)
├── (tabs)/               # Tab navigator group
│   ├── _layout.tsx       # Tab layout
│   ├── index.tsx         # First tab
│   ├── tasks.tsx         # Tasks tab
│   └── settings.tsx      # Settings tab
├── (auth)/               # Auth screens group
│   ├── _layout.tsx       # Auth layout
│   ├── login.tsx         # /login
│   └── signup.tsx        # /signup
├── task/
│   └── [id].tsx          # /task/123
├── modal.tsx             # Modal screen
└── +not-found.tsx        # 404 screen
```

## Root Layout

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/theme';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
```

## Tab Navigation

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { useTheme } from '@/theme';
import { HomeIcon, TasksIcon, SettingsIcon } from '@/components/icons';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary[500],
        tabBarInactiveTintColor: theme.colors.neutral[500],
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopWidth: 0,
          elevation: 0,
          height: 88,
          paddingBottom: 34, // Safe area
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Lexend_500Medium',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => (
            <TasksIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <SettingsIcon color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
```

## Protected Routes

```typescript
// app/(tabs)/_layout.tsx
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function TabLayout() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs>
      {/* ... */}
    </Tabs>
  );
}
```

## Navigation Actions

### Basic Navigation

```typescript
import { router } from 'expo-router';

// Navigate to screen
router.push('/task/123');

// Replace current screen
router.replace('/home');

// Go back
router.back();

// Navigate with params
router.push({
  pathname: '/task/[id]',
  params: { id: '123' },
});
```

### Type-Safe Navigation

```typescript
// With typed routes enabled
import { Link, router } from 'expo-router';

// Links
<Link href="/task/123">View Task</Link>
<Link href={{ pathname: '/task/[id]', params: { id: task.id } }}>
  {task.title}
</Link>

// Programmatic
router.push('/task/123'); // Type-checked!
```

### Reading Params

```typescript
// app/task/[id].tsx
import { useLocalSearchParams } from 'expo-router';

export default function TaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <TaskDetail taskId={id} />;
}
```

## Modal Patterns

### Present Modal

```typescript
// From any screen
import { router } from 'expo-router';

function TaskCard({ task }) {
  const openDetails = () => {
    router.push({
      pathname: '/task-modal',
      params: { id: task.id },
    });
  };

  return (
    <Pressable onPress={openDetails}>
      <Text>{task.title}</Text>
    </Pressable>
  );
}
```

### Modal Screen

```typescript
// app/task-modal.tsx
import { router, useLocalSearchParams } from 'expo-router';
import { useTask } from '@/hooks/useTask';

export default function TaskModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { task } = useTask(id);

  const close = () => router.back();

  return (
    <View style={styles.modal}>
      <View style={styles.header}>
        <Text style={styles.title}>{task?.title}</Text>
        <Pressable onPress={close}>
          <CloseIcon />
        </Pressable>
      </View>
      <TaskForm task={task} onSave={close} />
    </View>
  );
}
```

## Deep Linking

### Configure Links

```typescript
// app.json
{
  "expo": {
    "scheme": "yourapp",
    "ios": {
      "associatedDomains": ["applinks:yourapp.com"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            { "scheme": "https", "host": "yourapp.com", "pathPrefix": "/app" }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### Handle Deep Links

```typescript
// app/_layout.tsx
import { useEffect } from 'react';
import { Linking } from 'react-native';
import { router } from 'expo-router';

export default function RootLayout() {
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const path = extractPath(event.url);
      router.push(path);
    };

    Linking.addEventListener('url', handleDeepLink);

    // Check for initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      Linking.removeAllListeners('url');
    };
  }, []);

  return <Stack />;
}
```

## Back Navigation

### Hardware Back Button (Android)

```typescript
import { useBackHandler } from '@react-native-community/hooks';

function Screen() {
  useBackHandler(() => {
    if (hasUnsavedChanges) {
      showConfirmDialog();
      return true; // Prevent default back
    }
    return false; // Allow default back
  });

  return <View />;
}
```

### Custom Back Button

```typescript
import { router, useNavigation } from 'expo-router';

function Header() {
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();

  return (
    <View style={styles.header}>
      {canGoBack && (
        <Pressable onPress={() => router.back()}>
          <BackIcon />
        </Pressable>
      )}
      <Text>Title</Text>
    </View>
  );
}
```

## Navigation State

### Get Current Route

```typescript
import { usePathname, useSegments } from 'expo-router';

function Component() {
  const pathname = usePathname(); // '/task/123'
  const segments = useSegments(); // ['task', '123']

  return null;
}
```

### Navigation Events

```typescript
import { useNavigation } from 'expo-router';

function Screen() {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Screen focused - refresh data
      refetch();
    });

    return unsubscribe;
  }, [navigation]);

  return <View />;
}
```

## Best Practices

### 1. Keep Navigation Simple

```
GOOD: Home → Tasks → Task Detail
BAD:  Home → Tasks → Task Detail → Edit → Category → Back → ...
```

### 2. Use Consistent Patterns

- Tabs for top-level navigation
- Stack for hierarchical navigation
- Modals for focused tasks

### 3. Maintain Context

```typescript
// Pass minimal params, fetch full data
router.push({ pathname: '/task/[id]', params: { id: '123' } });

// In the screen
const { task } = useTask(id); // Fetch fresh data
```

### 4. Handle Errors Gracefully

```typescript
// app/task/[id].tsx
export default function TaskScreen() {
  const { id } = useLocalSearchParams();
  const { task, error } = useTask(id);

  if (error) {
    return <ErrorScreen onRetry={refetch} />;
  }

  if (!task) {
    return <NotFound />;
  }

  return <TaskDetail task={task} />;
}
```

## Checklist

- [ ] Expo Router configured
- [ ] Typed routes enabled
- [ ] Tab navigation for main sections
- [ ] Protected routes implemented
- [ ] Deep linking configured
- [ ] Back navigation works correctly
- [ ] Modals use presentation: 'modal'
- [ ] Navigation state persists appropriately
