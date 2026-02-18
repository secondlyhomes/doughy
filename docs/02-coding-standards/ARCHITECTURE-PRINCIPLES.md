# Architecture Principles

> Core principles for building maintainable React Native + Expo + Supabase applications.

## The Layer Cake

Every feature follows this dependency flow:

```
┌─────────────────────────────────────────────────────────────┐
│                        SCREENS                               │
│   app/tasks/index.tsx, app/profile/index.tsx                │
│   Compose hooks + components, handle navigation             │
├─────────────────────────────────────────────────────────────┤
│                       COMPONENTS                             │
│   src/components/TaskCard.tsx, src/components/Button.tsx    │
│   Pure UI, receive props, emit events                       │
├─────────────────────────────────────────────────────────────┤
│                         HOOKS                                │
│   src/hooks/useTasks.ts, src/hooks/useAuth.ts               │
│   State management, data fetching, business logic bridge    │
├─────────────────────────────────────────────────────────────┤
│                        SERVICES                              │
│   src/services/taskService.ts, src/services/authService.ts  │
│   API calls, data transformation, Supabase queries          │
├─────────────────────────────────────────────────────────────┤
│                         TYPES                                │
│   src/types/task.ts, src/types/user.ts                      │
│   TypeScript interfaces, database row types                 │
└─────────────────────────────────────────────────────────────┘
```

**Key Rules:**
- Arrows point DOWN only (Screens import Hooks, never reverse)
- Each layer has a single responsibility
- Skip layers when appropriate (Screen can use Service directly for simple cases)

---

## Principle 1: Separation of Concerns

Each layer handles one aspect of the application.

### The Anti-Pattern

```tsx
// BAD: Screen doing everything
// app/tasks/index.tsx
import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { supabase } from '@/src/lib/supabase';

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Data fetching in component
    const fetchTasks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        // Data transformation in component
        const formatted = data.map(task => ({
          ...task,
          createdAt: new Date(task.created_at),
          isOverdue: new Date(task.due_date) < new Date(),
        }));
        setTasks(formatted);
      }
      setLoading(false);
    };

    fetchTasks();
  }, []);

  // 200+ more lines of UI, handlers, validation...
}
```

### The Correct Pattern

**Layer 1: Types** (`src/types/task.ts`)

```tsx
// Database row type (matches Supabase schema)
export interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

// Frontend model (transformed for UI)
export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isOverdue: boolean;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

// Input types for mutations
export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: Date;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  dueDate?: Date | null;
}
```

**Layer 2: Service** (`src/services/taskService.ts`)

```tsx
import { supabase } from '@/src/lib/supabase';
import type { Task, TaskRow, CreateTaskInput, UpdateTaskInput } from '@/src/types/task';

// Transform database row to frontend model
function transformTask(row: TaskRow): Task {
  const dueDate = row.due_date ? new Date(row.due_date) : null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    status: row.status,
    dueDate,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    isOverdue: dueDate ? dueDate < new Date() : false,
  };
}

export async function fetchTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data.map(transformTask);
}

export async function fetchTaskById(taskId: string): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error) throw new Error(error.message);
  return transformTask(data);
}

export async function createTask(
  userId: string,
  input: CreateTaskInput
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      due_date: input.dueDate?.toISOString() ?? null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return transformTask(data);
}

export async function updateTask(
  taskId: string,
  input: UpdateTaskInput
): Promise<Task> {
  const updateData: Partial<TaskRow> = {};

  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.dueDate !== undefined) {
    updateData.due_date = input.dueDate?.toISOString() ?? null;
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return transformTask(data);
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw new Error(error.message);
}
```

**Layer 3: Hook** (`src/hooks/useTasks.ts`)

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/contexts/AuthContext';
import * as taskService from '@/src/services/taskService';
import type { CreateTaskInput, UpdateTaskInput } from '@/src/types/task';

const QUERY_KEY = ['tasks'];

export function useTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => taskService.fetchTasks(user!.id),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateTaskInput) =>
      taskService.createTask(user!.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      taskService.updateTask(taskId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: taskService.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error?.message ?? null,
    refetch: tasksQuery.refetch,
    createTask: createMutation.mutateAsync,
    updateTask: updateMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, taskId],
    queryFn: () => taskService.fetchTaskById(taskId),
    enabled: !!taskId,
  });
}
```

**Layer 4: Component** (`src/components/TaskCard.tsx`)

```tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/contexts/ThemeContext';
import type { Task } from '@/src/types/task';

interface TaskCardProps {
  task: Task;
  onPress: (task: Task) => void;
  onStatusChange: (task: Task) => void;
}

export function TaskCard({ task, onPress, onStatusChange }: TaskCardProps) {
  const { colors } = useTheme();

  const statusIcon = {
    pending: 'ellipse-outline',
    in_progress: 'time-outline',
    completed: 'checkmark-circle',
  }[task.status] as keyof typeof Ionicons.glyphMap;

  return (
    <Pressable
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={() => onPress(task)}
    >
      <Pressable
        style={styles.statusButton}
        onPress={() => onStatusChange(task)}
        hitSlop={8}
      >
        <Ionicons
          name={statusIcon}
          size={24}
          color={task.status === 'completed' ? colors.success : colors.text}
        />
      </Pressable>

      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: colors.text },
            task.status === 'completed' && styles.completedTitle,
          ]}
          numberOfLines={1}
        >
          {task.title}
        </Text>

        {task.dueDate && (
          <Text
            style={[
              styles.dueDate,
              { color: task.isOverdue ? colors.error : colors.textSecondary },
            ]}
          >
            Due {task.dueDate.toLocaleDateString()}
          </Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusButton: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  dueDate: {
    fontSize: 13,
    marginTop: 4,
  },
});
```

**Layer 5: Screen** (`app/tasks/index.tsx`)

```tsx
import { View, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTasks } from '@/src/hooks/useTasks';
import { TaskCard } from '@/src/components/TaskCard';
import { EmptyState } from '@/src/components/EmptyState';
import { LoadingScreen } from '@/src/components/LoadingScreen';
import { ErrorScreen } from '@/src/components/ErrorScreen';
import { FAB } from '@/src/components/FAB';
import type { Task, TaskStatus } from '@/src/types/task';

export default function TasksScreen() {
  const router = useRouter();
  const { tasks, isLoading, error, refetch, updateTask } = useTasks();

  const handleTaskPress = (task: Task) => {
    router.push(`/tasks/${task.id}`);
  };

  const handleStatusChange = async (task: Task) => {
    const nextStatus: Record<TaskStatus, TaskStatus> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'pending',
    };
    await updateTask({
      taskId: task.id,
      input: { status: nextStatus[task.status] },
    });
  };

  const handleCreateTask = () => {
    router.push('/tasks/create');
  };

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} onRetry={refetch} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={handleTaskPress}
            onStatusChange={handleStatusChange}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="checkbox-outline"
            title="No tasks yet"
            description="Create your first task to get started"
            actionLabel="Create Task"
            onAction={handleCreateTask}
          />
        }
      />
      <FAB icon="add" onPress={handleCreateTask} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
});
```

---

## Principle 2: Single Responsibility

Each module should have one reason to change.

### Module Responsibilities

| Module | Does | Does NOT |
|--------|------|----------|
| **Type** | Define shape | Transform, validate |
| **Service** | API calls, transform | Manage state, render |
| **Hook** | Manage state, coordinate | Fetch directly, render |
| **Component** | Render UI, emit events | Fetch, business logic |
| **Screen** | Compose, navigate | Business logic, API calls |

### Example: Authentication

**AuthService** - Only handles Supabase auth operations:

```tsx
// src/services/authService.ts
import { supabase } from '@/src/lib/supabase';

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message);
}
```

**AuthContext** - Only manages auth state:

```tsx
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/src/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

**useSignIn Hook** - Only handles sign-in flow:

```tsx
// src/hooks/useSignIn.ts
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as authService from '@/src/services/authService';

export function useSignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.signInWithEmail(email, password);
      router.replace('/(app)/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return { signIn, isLoading, error, clearError: () => setError(null) };
}
```

---

## Principle 3: Composition Over Inheritance

Build complex components by combining simple ones.

### Component Composition

```tsx
// src/components/Card.tsx - Base card
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'outlined';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card },
        variant === 'outlined' && { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
  },
});
```

```tsx
// src/components/StatCard.tsx - Composed from Card
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { useTheme } from '@/src/contexts/ThemeContext';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
}

export function StatCard({ icon, label, value, trend }: StatCardProps) {
  const { colors } = useTheme();

  return (
    <Card>
      <View style={styles.header}>
        <Ionicons name={icon} size={20} color={colors.primary} />
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      {trend && (
        <View style={styles.trend}>
          <Ionicons
            name={trend.isPositive ? 'trending-up' : 'trending-down'}
            size={16}
            color={trend.isPositive ? colors.success : colors.error}
          />
          <Text
            style={[
              styles.trendValue,
              { color: trend.isPositive ? colors.success : colors.error },
            ]}
          >
            {trend.value}%
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  trendValue: {
    fontSize: 13,
    fontWeight: '500',
  },
});
```

### Hook Composition

```tsx
// src/hooks/useTaskFilters.ts - Focused on filtering
import { useState, useMemo } from 'react';
import type { Task, TaskStatus } from '@/src/types/task';

export function useTaskFilters(tasks: Task[]) {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesSearch = task.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [tasks, statusFilter, searchQuery]);

  return {
    filteredTasks,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    activeFilterCount: (statusFilter !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0),
  };
}
```

```tsx
// src/hooks/useTasksWithFilters.ts - Composed hook
import { useTasks } from './useTasks';
import { useTaskFilters } from './useTaskFilters';

export function useTasksWithFilters() {
  const tasksData = useTasks();
  const filters = useTaskFilters(tasksData.tasks);

  return {
    ...tasksData,
    ...filters,
  };
}
```

---

## Principle 4: Dependency Direction

Dependencies flow in one direction: UI -> Hooks -> Services -> Types.

### Correct Import Patterns

```tsx
// Screen imports hooks and components
import { useTasks } from '@/src/hooks/useTasks';
import { TaskCard } from '@/src/components/TaskCard';

// Hook imports services and types
import * as taskService from '@/src/services/taskService';
import type { Task } from '@/src/types/task';

// Service imports only types
import type { TaskRow, Task } from '@/src/types/task';

// Types import nothing from the app (only external types)
import type { Database } from '@/src/types/supabase';
```

### What NOT To Do

```tsx
// BAD: Service importing a hook
import { useAuth } from '@/src/contexts/AuthContext'; // WRONG!

// BAD: Type file importing a service
import { fetchTasks } from '@/src/services/taskService'; // WRONG!

// BAD: Component directly calling Supabase
import { supabase } from '@/src/lib/supabase'; // Should go through service
```

### Dependency Visualization

```
app/tasks/index.tsx (Screen)
    │
    ├── imports src/hooks/useTasks.ts (Hook)
    │       │
    │       ├── imports src/services/taskService.ts (Service)
    │       │       │
    │       │       └── imports src/types/task.ts (Types)
    │       │
    │       └── imports src/types/task.ts (Types)
    │
    └── imports src/components/TaskCard.tsx (Component)
            │
            └── imports src/types/task.ts (Types)
```

---

## Principle 5: DRY With Judgment

Don't Repeat Yourself - but extract only after seeing 3+ repetitions.

### When To Extract

| Repetitions | Action |
|-------------|--------|
| 1 | Leave it |
| 2 | Note it, leave it |
| 3+ | Extract to shared module |

### Good Extraction: Shared Utilities

```tsx
// src/utils/formatters.ts
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}
```

### Bad Extraction: Premature Abstraction

```tsx
// BAD: Abstracting after one use
// src/utils/taskHelpers.ts
export function getTaskDisplayData(task: Task) {
  return {
    title: task.title,
    subtitle: task.description,
    isComplete: task.status === 'completed',
  };
}

// This is only used in one place - keep it inline!
```

### Shared Styles Example

```tsx
// src/styles/common.ts - Extract after 3+ uses
import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

---

## Principle 6: KISS (Keep It Simple, Stupid)

Choose the simplest solution that solves the problem.

### Simple State Before Complex State

```tsx
// GOOD: Simple useState for local state
function TaskForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Simple, readable, works
}

// OVERKILL: useReducer for simple form
function TaskForm() {
  const [state, dispatch] = useReducer(formReducer, initialState);
  // dispatch({ type: 'SET_TITLE', payload: 'value' })
  // Too complex for this use case
}
```

### When Complexity Is Warranted

```tsx
// useReducer IS appropriate for complex state with many transitions
interface FormState {
  values: Record<string, string>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  submitCount: number;
}

type FormAction =
  | { type: 'SET_VALUE'; field: string; value: string }
  | { type: 'SET_ERROR'; field: string; error: string }
  | { type: 'TOUCH_FIELD'; field: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; errors: Record<string, string> }
  | { type: 'RESET' };

// This complexity is justified by the number of state transitions
```

### Avoid Clever Code

```tsx
// BAD: Clever but unclear
const tasks = data?.filter(Boolean).map(t => ({ ...t, done: t.status === 'completed' })) ?? [];

// GOOD: Clear and readable
const tasks = data ?? [];
const tasksWithDoneFlag = tasks.map((task) => ({
  ...task,
  done: task.status === 'completed',
}));
```

---

## Principle 7: Explicit Over Implicit

Make your intentions clear in the code.

### Explicit Props

```tsx
// BAD: Spreading unknown props
interface ButtonProps {
  label: string;
  [key: string]: any; // What can I pass?
}

// GOOD: Explicit prop interface
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
}
```

### Explicit Return Types

```tsx
// BAD: Implicit return type
async function fetchUser(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  return data; // What type is this?
}

// GOOD: Explicit return type
async function fetchUser(id: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return transformUser(data);
}
```

### Explicit Error Handling

```tsx
// BAD: Silent failures
async function saveTask(task: Task) {
  try {
    await taskService.updateTask(task.id, task);
  } catch {
    // Silently ignored
  }
}

// GOOD: Explicit error handling
async function saveTask(task: Task): Promise<{ success: boolean; error?: string }> {
  try {
    await taskService.updateTask(task.id, task);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save task';
    console.error('saveTask failed:', message);
    return { success: false, error: message };
  }
}
```

### Named Exports Only

```tsx
// BAD: Default export - unclear what's being imported
export default function TaskCard() { }

// GOOD: Named export - explicit about what's exported
export function TaskCard() { }
```

---

## Principle 8: Colocation

Keep related files together.

### Feature-Based Structure

For larger features, colocate all related files:

```
src/features/
└── tasks/
    ├── components/
    │   ├── TaskCard.tsx
    │   ├── TaskForm.tsx
    │   └── TaskFilters.tsx
    ├── hooks/
    │   ├── useTasks.ts
    │   └── useTaskFilters.ts
    ├── services/
    │   └── taskService.ts
    ├── types/
    │   └── task.ts
    └── index.ts  # Public API
```

### Screen-Specific Components

Components used by only one screen live with that screen:

```
app/
└── tasks/
    ├── index.tsx           # Task list screen
    ├── [id].tsx            # Task detail screen
    ├── create.tsx          # Create task screen
    └── _components/        # Components only used in tasks screens
        ├── TaskHeader.tsx
        └── TaskActions.tsx
```

### Shared vs. Feature Components

```
src/
├── components/           # Shared across features
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   └── Modal.tsx
│
└── features/
    └── tasks/
        └── components/   # Task-specific components
            └── TaskCard.tsx
```

### Test Colocation

Keep tests next to the code they test:

```
src/
├── hooks/
│   ├── useTasks.ts
│   └── __tests__/
│       └── useTasks.test.ts
├── services/
│   ├── taskService.ts
│   └── __tests__/
│       └── taskService.test.ts
└── utils/
    ├── formatters.ts
    └── __tests__/
        └── formatters.test.ts
```

---

## Component Size Guidelines

### Hard Limit: 200 Lines

Components over 200 lines MUST be split.

### Target: 150 Lines

Aim for components under 150 lines.

### When To Split

| Signal | Action |
|--------|--------|
| Component >200 lines | Must split |
| Component >150 lines | Consider splitting |
| Multiple unrelated concerns | Split by concern |
| Reusable UI patterns | Extract to shared component |
| Complex inline logic | Extract to hook |

### Splitting Strategy

**Before (too large):**

```tsx
// app/profile/index.tsx - 280 lines
export default function ProfileScreen() {
  // 50 lines of state and hooks
  // 80 lines of handlers
  // 150 lines of JSX with inline components
}
```

**After (split properly):**

```tsx
// app/profile/index.tsx - 60 lines
export default function ProfileScreen() {
  const profile = useProfile();
  const { signOut } = useSignOut();

  return (
    <ScrollView style={styles.container}>
      <ProfileHeader profile={profile.data} />
      <ProfileStats stats={profile.stats} />
      <ProfileSettings onSignOut={signOut} />
    </ScrollView>
  );
}

// app/profile/_components/ProfileHeader.tsx - 45 lines
// app/profile/_components/ProfileStats.tsx - 55 lines
// app/profile/_components/ProfileSettings.tsx - 70 lines
```

---

## Storage Patterns

### Secure Storage for Sensitive Data

```tsx
// src/services/secureStorage.ts
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
} as const;

export async function saveSecure(
  key: keyof typeof KEYS,
  value: string
): Promise<void> {
  await SecureStore.setItemAsync(KEYS[key], value);
}

export async function getSecure(
  key: keyof typeof KEYS
): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS[key]);
}

export async function deleteSecure(key: keyof typeof KEYS): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS[key]);
}
```

### AsyncStorage for Non-Sensitive Data

```tsx
// src/services/localStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ONBOARDING_COMPLETE: 'onboarding_complete',
  THEME_PREFERENCE: 'theme_preference',
  LAST_SYNC: 'last_sync',
} as const;

export async function save<T>(
  key: keyof typeof KEYS,
  value: T
): Promise<void> {
  const jsonValue = JSON.stringify(value);
  await AsyncStorage.setItem(KEYS[key], jsonValue);
}

export async function get<T>(key: keyof typeof KEYS): Promise<T | null> {
  const jsonValue = await AsyncStorage.getItem(KEYS[key]);
  return jsonValue ? JSON.parse(jsonValue) : null;
}

export async function remove(key: keyof typeof KEYS): Promise<void> {
  await AsyncStorage.removeItem(KEYS[key]);
}
```

---

## Navigation Patterns

### Type-Safe Navigation with Expo Router

```tsx
// src/types/navigation.ts
export type RootStackParamList = {
  '/(app)/': undefined;
  '/(app)/tasks/': undefined;
  '/(app)/tasks/[id]': { id: string };
  '/(app)/tasks/create': undefined;
  '/(app)/profile/': undefined;
  '/(auth)/sign-in': undefined;
  '/(auth)/sign-up': undefined;
};

// Usage in component
import { useRouter } from 'expo-router';

function TaskCard({ task }: { task: Task }) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/tasks/${task.id}`);
  };

  return (
    <Pressable onPress={handlePress}>
      {/* ... */}
    </Pressable>
  );
}
```

### Navigation Hooks

```tsx
// src/hooks/useNavigationHelpers.ts
import { useRouter, useLocalSearchParams } from 'expo-router';

export function useTaskNavigation() {
  const router = useRouter();

  return {
    goToTaskList: () => router.push('/tasks/'),
    goToTask: (id: string) => router.push(`/tasks/${id}`),
    goToCreateTask: () => router.push('/tasks/create'),
    goBack: () => router.back(),
  };
}

export function useTaskParams() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    throw new Error('Task ID is required');
  }

  return { taskId: id };
}
```

---

## Architecture Checklist

Use this checklist when building new features:

### Layer Structure

- [ ] Types defined in `src/types/` or feature's `types/`
- [ ] Service handles all Supabase/API calls
- [ ] Hook manages state and coordinates services
- [ ] Components are pure UI with props
- [ ] Screen composes hooks and components

### Single Responsibility

- [ ] Each file has one clear purpose
- [ ] Functions do one thing
- [ ] Components render one concept

### Dependencies

- [ ] No circular imports
- [ ] Dependencies flow downward only
- [ ] Types have no app imports

### Code Quality

- [ ] Components under 200 lines
- [ ] Named exports only
- [ ] Explicit return types on functions
- [ ] No implicit any types
- [ ] Error handling is explicit

### React Native Specific

- [ ] StyleSheet.create for all styles
- [ ] No inline style objects in render
- [ ] Expo SDK utilities preferred
- [ ] SecureStore for sensitive data
- [ ] AsyncStorage for preferences

### Colocation

- [ ] Tests next to source files
- [ ] Feature components in feature folder
- [ ] Shared components in `src/components/`
- [ ] Screen-specific components in `_components/`

---

## Related Documentation

- **Anti-Patterns:** `../anti-patterns/WHAT-NOT-TO-DO.md`
- **New Feature Guide:** `../patterns/NEW-FEATURE.md`
- **New Screen Guide:** `../patterns/NEW-SCREEN.md`
- **Security Checklist:** `../09-security/SECURITY-CHECKLIST.md`
- **Component Guidelines:** `./COMPONENT-GUIDELINES.md`
