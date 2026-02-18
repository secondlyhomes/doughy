# New Screen Pattern

## Overview

This pattern guides creating new screens in Expo Router with proper structure, types, and accessibility.

## Quick Start

```bash
# Create new screen
touch app/feature-name.tsx

# Or with folder for related screens
mkdir app/feature
touch app/feature/index.tsx
touch app/feature/[id].tsx
```

## Screen Template

```typescript
// app/tasks.tsx
import { View, StyleSheet, FlatList } from 'react-native';
import { Stack } from 'expo-router';
import { useTasks } from '@/hooks/useTasks';
import { TaskCard } from '@/components/tasks/TaskCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { useTheme } from '@/theme';

export default function TasksScreen() {
  const theme = useTheme();
  const { tasks, isLoading, error, refetch } = useTasks();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={refetch} />;
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon="tasks"
        title="No tasks yet"
        description="Create your first task to get started"
        action={{ label: 'Create Task', onPress: () => router.push('/task/new') }}
      />
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Tasks',
          headerLargeTitle: true,
        }}
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TaskCard task={item} />}
          contentContainerStyle={styles.list}
          refreshing={isLoading}
          onRefresh={refetch}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    gap: 12,
  },
});
```

## Detail Screen with Params

```typescript
// app/task/[id].tsx
import { View, StyleSheet, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useTask } from '@/hooks/useTask';
import { TaskHeader } from '@/components/tasks/TaskHeader';
import { TaskDetails } from '@/components/tasks/TaskDetails';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { task, isLoading, error, updateTask, deleteTask } = useTask(id);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !task) {
    return (
      <ErrorState
        message={error?.message || 'Task not found'}
        onRetry={() => router.back()}
        retryLabel="Go Back"
      />
    );
  }

  const handleDelete = async () => {
    await deleteTask();
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: task.title,
          headerRight: () => (
            <TaskHeaderActions
              onEdit={() => router.push(`/task/${id}/edit`)}
              onDelete={handleDelete}
            />
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <TaskHeader task={task} />
        <TaskDetails task={task} onUpdate={updateTask} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

## Form Screen

```typescript
// app/task/new.tsx
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { useCreateTask } from '@/hooks/useCreateTask';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Button } from '@/components/shared/Button';
import * as Haptics from 'expo-haptics';

import type { TaskFormData } from '@/types/task';

export default function NewTaskScreen() {
  const { createTask, isLoading } = useCreateTask();
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    dueDate: null,
  });

  const handleSubmit = async () => {
    try {
      await createTask(formData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const isValid = formData.title.trim().length > 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'New Task',
          presentation: 'modal',
          headerRight: () => (
            <Button
              variant="text"
              onPress={handleSubmit}
              disabled={!isValid || isLoading}
              loading={isLoading}
            >
              Save
            </Button>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TaskForm
          data={formData}
          onChange={setFormData}
          autoFocus
        />
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

## Screen with Tabs

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { HomeIcon, TasksIcon, ProfileIcon } from '@/components/icons';
import { useTheme } from '@/theme';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary[500],
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => <TasksIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <ProfileIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
```

## Screen States

Every screen should handle:

```typescript
// 1. Loading
if (isLoading) {
  return <LoadingState />;
}

// 2. Error
if (error) {
  return <ErrorState message={error.message} onRetry={refetch} />;
}

// 3. Empty
if (data.length === 0) {
  return <EmptyState title="No items" />;
}

// 4. Success
return <DataView data={data} />;
```

## Accessibility

```typescript
<View
  accessible
  accessibilityRole="main"
  accessibilityLabel="Tasks screen"
>
  <FlatList
    accessibilityRole="list"
    data={tasks}
    renderItem={({ item }) => (
      <TaskCard
        task={item}
        accessibilityRole="button"
        accessibilityLabel={`Task: ${item.title}`}
        accessibilityHint="Double tap to view details"
      />
    )}
  />
</View>
```

## Checklist

- [ ] Screen file created in correct location
- [ ] Loading state handled
- [ ] Error state with retry
- [ ] Empty state with helpful message
- [ ] Navigation options set (title, header)
- [ ] Theme colors applied
- [ ] Accessibility labels added
- [ ] Keyboard avoiding for forms
- [ ] Haptic feedback on actions
