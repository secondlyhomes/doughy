# Navigation Patterns

Complete navigation patterns using Expo Router for authentication flows and tab navigation.

## Overview

This directory contains:
- **TabNavigator** - Bottom tab navigation with styling
- **AuthNavigator** - Authentication guards and redirects
- **Navigation best practices** for mobile apps

## Expo Router Structure

```
app/
├── _layout.tsx              # Root layout with auth guard
├── index.tsx                # Landing/redirect screen
├── (auth)/                  # Auth group (public routes)
│   ├── _layout.tsx
│   ├── login.tsx
│   └── signup.tsx
├── (tabs)/                  # Tabs group (protected routes)
│   ├── _layout.tsx          # Tab navigator
│   ├── index.tsx            # Home tab
│   ├── tasks.tsx            # Tasks tab
│   ├── profile.tsx          # Profile tab
│   └── settings.tsx         # Settings tab
└── modal.tsx                # Modal screen
```

## Tab Navigation

### Basic Setup

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router'
import { useTheme } from '@/theme'

export default function TabLayout() {
  const { theme } = useTheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary[500],
        tabBarInactiveTintColor: theme.colors.neutral[400],
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => (
            <Icon name="checkbox" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
```

### With Icons (Ionicons)

```bash
npm install @expo/vector-icons
```

```tsx
import { Ionicons } from '@expo/vector-icons'

<Tabs.Screen
  name="index"
  options={{
    title: 'Home',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="home" size={size} color={color} />
    ),
  }}
/>
```

### With Badge Counts

```tsx
import { useTasks } from '@/features/tasks-local/TasksContext'

export default function TabLayout() {
  const { stats } = useTasks()

  return (
    <Tabs>
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarBadge: stats.incomplete > 0 ? stats.incomplete : undefined,
        }}
      />
    </Tabs>
  )
}
```

### Custom Tab Bar Styling

```tsx
<Tabs
  screenOptions={{
    tabBarActiveTintColor: theme.colors.primary[500],
    tabBarInactiveTintColor: theme.colors.neutral[400],
    tabBarStyle: {
      backgroundColor: theme.colors.background.primary,
      borderTopColor: theme.colors.border.default,
      borderTopWidth: 1,
      paddingBottom: 8,
      paddingTop: 8,
      height: 64,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '600',
    },
  }}
>
```

## Authentication Guards

### Root Layout with Auth Guard

```tsx
// app/_layout.tsx
import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { ThemeProvider } from '@/theme'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { LoadingState } from '@/components'

function RootLayoutNav() {
  const { isAuthenticated, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login
      router.replace('/login')
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home
      router.replace('/(tabs)')
    }
  }, [isAuthenticated, loading, segments])

  if (loading) {
    return <LoadingState />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  )
}
```

### Per-Screen Auth Guard

```tsx
// app/(tabs)/profile.tsx
import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'

export default function ProfileScreen() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, loading])

  if (loading) {
    return <LoadingState />
  }

  if (!isAuthenticated) {
    return null
  }

  return <ProfileContent />
}
```

### Reusable Auth Guard Component

```tsx
// src/components/RequireAuth.tsx
import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingState } from '@/components'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, loading])

  if (loading) return <LoadingState />
  if (!isAuthenticated) return null

  return <>{children}</>
}

// Usage:
function ProtectedScreen() {
  return (
    <RequireAuth>
      <YourContent />
    </RequireAuth>
  )
}
```

## Navigation Patterns

### Programmatic Navigation

```tsx
import { useRouter } from 'expo-router'

function MyComponent() {
  const router = useRouter()

  // Navigate to screen
  router.push('/tasks')

  // Navigate with params
  router.push({
    pathname: '/tasks/[id]',
    params: { id: '123' }
  })

  // Replace (no back button)
  router.replace('/(tabs)')

  // Go back
  router.back()

  // Navigate to external URL
  router.push('https://example.com')
}
```

### Modal Screens

```tsx
// app/(tabs)/_layout.tsx
<Tabs>
  <Tabs.Screen name="index" />

  {/* Modal screen */}
  <Tabs.Screen
    name="create-task"
    options={{
      presentation: 'modal',
      headerShown: true,
      title: 'New Task',
    }}
  />
</Tabs>

// Navigate to modal
router.push('/create-task')
```

### Deep Linking

```tsx
// app.json
{
  "expo": {
    "scheme": "myapp",
    "web": {
      "bundler": "metro"
    }
  }
}

// Navigate from external link:
// myapp://tasks/123

// In app/(tabs)/tasks/[id].tsx
import { useLocalSearchParams } from 'expo-router'

export default function TaskDetail() {
  const { id } = useLocalSearchParams()
  // Load task with id
}
```

### Passing Data Between Screens

```tsx
// Navigate with params
router.push({
  pathname: '/tasks/[id]',
  params: {
    id: task.id,
    title: task.title, // Additional params
  }
})

// Receive params
import { useLocalSearchParams } from 'expo-router'

function TaskDetail() {
  const { id, title } = useLocalSearchParams()
}
```

### Navigation Events

```tsx
import { useEffect } from 'react'
import { useRouter, useFocusEffect } from 'expo-router'

function MyScreen() {
  // Run when screen comes into focus
  useFocusEffect(() => {
    console.log('Screen focused')
    // Refresh data

    return () => {
      console.log('Screen unfocused')
    }
  })

  // Run on mount only
  useEffect(() => {
    console.log('Screen mounted')
  }, [])
}
```

## Header Customization

### Per-Screen Header

```tsx
// app/(tabs)/tasks.tsx
import { Stack } from 'expo-router'

export default function TasksScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'My Tasks',
          headerRight: () => (
            <TouchableOpacity onPress={handleAdd}>
              <Text>Add</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <TasksContent />
    </>
  )
}
```

### Dynamic Header Title

```tsx
import { useEffect } from 'react'
import { Stack, useLocalSearchParams } from 'expo-router'

export default function TaskDetail() {
  const { id } = useLocalSearchParams()
  const [task, setTask] = useState(null)

  useEffect(() => {
    // Load task
  }, [id])

  return (
    <>
      <Stack.Screen
        options={{
          title: task?.title ?? 'Task',
        }}
      />
      <TaskContent />
    </>
  )
}
```

### Hide Header

```tsx
<Stack.Screen
  options={{
    headerShown: false,
  }}
/>
```

## Best Practices

### 1. Use Route Groups

Group related screens together:
```
app/
├── (auth)/        # Public routes
├── (tabs)/        # Main app (protected)
├── (modals)/      # Modal screens
└── (admin)/       # Admin-only routes
```

### 2. Centralize Navigation Logic

```tsx
// src/navigation/routes.ts
export const routes = {
  home: '/(tabs)',
  login: '/login',
  signup: '/signup',
  tasks: '/tasks',
  taskDetail: (id: string) => `/tasks/${id}`,
} as const

// Usage
router.push(routes.taskDetail('123'))
```

### 3. Handle Navigation State

```tsx
import { useNavigation } from 'expo-router'

function MyComponent() {
  const navigation = useNavigation()

  // Check if can go back
  const canGoBack = navigation.canGoBack()

  // Go back if possible
  if (canGoBack) {
    navigation.goBack()
  } else {
    router.replace('/(tabs)')
  }
}
```

### 4. Loading States

```tsx
function MyScreen() {
  const { isLoading } = useQuery()

  if (isLoading) {
    return <LoadingState />
  }

  return <Content />
}
```

### 5. Error Boundaries

```tsx
// app/_layout.tsx
import { ErrorBoundary } from '@/components'

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <Stack />
    </ErrorBoundary>
  )
}
```

## Testing Navigation

```tsx
import { render } from '@testing-library/react-native'
import { useRouter } from 'expo-router'

jest.mock('expo-router')

test('navigates to task detail', () => {
  const mockPush = jest.fn()
  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })

  const { getByText } = render(<TaskCard task={mockTask} />)

  fireEvent.press(getByText('View Details'))

  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/tasks/[id]',
    params: { id: mockTask.id }
  })
})
```

## Related

- **Tab Navigator:** [TabNavigator.tsx](TabNavigator.tsx)
- **Auth Navigator:** [AuthNavigator.tsx](AuthNavigator.tsx)
- **Auth Context:** [.examples/features/auth-local/](../features/auth-local/)
- **Expo Router Docs:** [docs.expo.dev/router](https://docs.expo.dev/router/introduction/)
- **Navigation Guide:** [docs/06-navigation/NAVIGATION-PATTERNS.md](../../docs/06-navigation/NAVIGATION-PATTERNS.md)
