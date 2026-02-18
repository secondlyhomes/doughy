# Hook Conventions

> Comprehensive guide for creating, naming, testing, and organizing React hooks in this codebase.

## Table of Contents

- [Naming Conventions](#naming-conventions)
- [Hook Categories](#hook-categories)
- [TanStack Query Patterns](#tanstack-query-patterns)
- [Custom Hook Patterns](#custom-hook-patterns)
- [Testing Hooks](#testing-hooks)
- [Performance](#performance)
- [Hook Composition](#hook-composition)
- [Full Examples](#full-examples)
- [Checklist](#checklist)

---

## Naming Conventions

### The `use` Prefix Rule

All React hooks MUST start with `use`. This is a React requirement that enables the linter to enforce the Rules of Hooks.

```typescript
// CORRECT
useAuth
useTasks
useCreateTask
useTaskFilters

// INCORRECT - React won't recognize these as hooks
getTasks        // Missing "use" prefix
fetchAuth       // Missing "use" prefix
taskHook        // Missing "use" prefix
```

### Descriptive Naming Guidelines

Hook names should clearly describe their purpose. Use specific, descriptive names over generic ones.

| Pattern | Example | Description |
|---------|---------|-------------|
| Resource | `useTasks`, `useUsers`, `useProjects` | Fetches a collection |
| Single Resource | `useTask`, `useUser`, `useProject` | Fetches one item by ID |
| Action | `useCreateTask`, `useUpdateUser` | Performs a mutation |
| State | `useTaskFilters`, `useSearchQuery` | Manages UI state |
| Derived | `useFilteredTasks`, `useSortedUsers` | Computes derived data |
| Platform | `useKeyboard`, `useSafeArea` | Platform-specific behavior |

### Query vs Mutation Naming

Distinguish between data fetching (queries) and data modification (mutations):

```typescript
// QUERIES - Fetch data (nouns or "get" verbs)
useTasks()              // Get all tasks
useTask(id)             // Get single task
useTasksByProject(id)   // Get tasks filtered by project
useCurrentUser()        // Get current authenticated user

// MUTATIONS - Modify data (action verbs)
useCreateTask()         // Create a new task
useUpdateTask()         // Update an existing task
useDeleteTask()         // Delete a task
useToggleTaskComplete() // Toggle task completion status
useArchiveTask()        // Archive a task
```

### File Naming Convention

| Rule | Example | Why |
|------|---------|-----|
| camelCase | `useTaskOperations` | React convention |
| `use` prefix | `useAuth`, `useStorage` | React requirement |
| Descriptive name | `useLocalStorage` | Clear purpose |
| `.ts` extension | `useAuth.ts` | Logic-only hooks |
| `.tsx` only if returns JSX | `useToast.tsx` | Rare case |

```typescript
// CORRECT
useAuth.ts
useLocalStorage.ts
useTaskOperations.ts
useNetworkStatus.ts

// INCORRECT - DO NOT USE
use-auth.ts        // kebab-case
UseAuth.ts         // PascalCase
authHook.ts        // no "use" prefix
auth.hook.ts       // dot notation
```

---

## Hook Categories

### 1. Data Hooks (TanStack Query Wrappers)

Data hooks fetch and cache server data using TanStack Query. They handle loading, error, and success states automatically.

```typescript
// src/hooks/useTasks.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Task } from '@/types';

export function useTasks(projectId?: string) {
  return useQuery({
    queryKey: ['tasks', { projectId }],
    queryFn: async (): Promise<Task[]> => {
      let query = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
```

**Common data hooks:**
- `useTasks()` - Fetch task list
- `useTask(id)` - Fetch single task
- `useCurrentUser()` - Fetch authenticated user profile
- `useProjects()` - Fetch project list
- `useNotifications()` - Fetch user notifications

### 2. Mutation Hooks (Create, Update, Delete)

Mutation hooks modify server data and handle cache invalidation.

```typescript
// src/hooks/useCreateTask.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { CreateTaskInput, Task } from '@/types';

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput): Promise<Task> => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch tasks
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
```

**Common mutation hooks:**
- `useCreateTask()` - Create new task
- `useUpdateTask()` - Update existing task
- `useDeleteTask()` - Delete task
- `useToggleComplete()` - Toggle task completion
- `useUploadAvatar()` - Upload user avatar

### 3. UI State Hooks

UI state hooks manage local component state and UI interactions.

```typescript
// src/hooks/useModal.ts
import { useState, useCallback } from 'react';

interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useModal(initialState = false): UseModalReturn {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}
```

```typescript
// src/hooks/useForm.ts
import { useState, useCallback } from 'react';

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  onSubmit,
  validate,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is modified
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (validate) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  return {
    values,
    errors,
    isSubmitting,
    setValue,
    handleSubmit,
    reset,
  };
}
```

**Common UI state hooks:**
- `useModal()` - Modal open/close state
- `useForm()` - Form state management
- `useSearch()` - Search input with debouncing
- `useFilters()` - Filter selection state
- `usePagination()` - Pagination state

### 4. Platform Hooks

Platform hooks abstract React Native and Expo platform-specific APIs.

```typescript
// src/hooks/useKeyboard.ts
import { useState, useEffect } from 'react';
import { Keyboard, KeyboardEvent, Platform } from 'react-native';

interface KeyboardState {
  isVisible: boolean;
  height: number;
}

export function useKeyboard(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
  });

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleShow = (event: KeyboardEvent) => {
      setState({
        isVisible: true,
        height: event.endCoordinates.height,
      });
    };

    const handleHide = () => {
      setState({
        isVisible: false,
        height: 0,
      });
    };

    const showSubscription = Keyboard.addListener(showEvent, handleShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return state;
}
```

```typescript
// src/hooks/useSafeArea.ts
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeAreaPadding {
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
}

export function useSafeAreaPadding(): SafeAreaPadding {
  const insets = useSafeAreaInsets();

  return {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };
}
```

**Common platform hooks:**
- `useKeyboard()` - Keyboard visibility and height
- `useSafeArea()` - Safe area insets
- `useNetworkStatus()` - Network connectivity
- `useAppState()` - App foreground/background state
- `useDimensions()` - Screen dimensions
- `useOrientation()` - Device orientation

### 5. Auth Hooks

Auth hooks manage authentication state and permissions.

```typescript
// src/hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
```

```typescript
// src/hooks/usePermissions.ts
import { useAuth } from './useAuth';
import { Permission } from '@/types';

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(hasPermission);
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(hasPermission);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin: user?.role === 'admin',
    isOwner: (resourceOwnerId: string) => user?.id === resourceOwnerId,
  };
}
```

**Common auth hooks:**
- `useAuth()` - Authentication state and methods
- `useSession()` - Session management
- `usePermissions()` - Permission checking
- `useRequireAuth()` - Redirect if not authenticated

---

## TanStack Query Patterns

### Query Key Conventions

Query keys must be consistent and hierarchical. Use arrays with the resource name first, followed by filters/parameters.

```typescript
// GOOD - Consistent, hierarchical keys
['tasks']                           // All tasks
['tasks', { projectId: '123' }]     // Tasks filtered by project
['tasks', { status: 'completed' }]  // Tasks filtered by status
['task', '456']                     // Single task by ID
['users', 'me']                     // Current user
['users', '789']                    // Single user by ID
['projects', { userId: 'abc' }]     // Projects for a user

// BAD - Inconsistent patterns
['getTasks']                        // Don't use verbs
['task-list']                       // Don't use strings for filters
['123', 'task']                     // Don't put ID before resource
```

**Key factory pattern for consistency:**

```typescript
// src/lib/queryKeys.ts
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

// Usage
useQuery({
  queryKey: taskKeys.detail(taskId),
  queryFn: () => fetchTask(taskId),
});

// Invalidation
queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
```

### Query Function with Supabase

Structure query functions to handle errors properly and return typed data.

```typescript
// src/hooks/useTasks.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Task, TaskFilters } from '@/types';
import { taskKeys } from '@/lib/queryKeys';

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: async (): Promise<Task[]> => {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          project:projects(id, name),
          assignee:users(id, name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.assigneeId) {
        query = query.eq('assignee_id', filters.assigneeId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch tasks: ${error.message}`);
      }

      return data;
    },
  });
}
```

### Enabled Conditions

Use the `enabled` option to conditionally run queries.

```typescript
// Only fetch when we have a user ID
export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId!),
    enabled: !!userId, // Only run when userId exists
  });
}

// Only fetch when dependencies are ready
export function useProjectTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: taskKeys.list({ projectId }),
    queryFn: () => fetchTasksByProject(projectId!),
    enabled: !!projectId,
  });
}

// Combine multiple conditions
export function usePrivateData() {
  const { user, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['private-data', user?.id],
    queryFn: () => fetchPrivateData(user!.id),
    enabled: !authLoading && !!user,
  });
}
```

### Error Handling

Handle errors gracefully with proper typing and user feedback.

```typescript
// src/hooks/useTasks.ts
import { useQuery } from '@tanstack/react-query';
import { PostgrestError } from '@supabase/supabase-js';

export function useTasks() {
  const query = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof Error && error.message.includes('JWT')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Transform error for display
  const errorMessage = query.error
    ? getErrorMessage(query.error)
    : null;

  return {
    ...query,
    errorMessage,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Handle Supabase errors
    if ('code' in error) {
      const pgError = error as PostgrestError;
      switch (pgError.code) {
        case 'PGRST301':
          return 'You do not have permission to view this data';
        case '42P01':
          return 'Data not found';
        default:
          return 'An error occurred while loading data';
      }
    }
    return error.message;
  }
  return 'An unexpected error occurred';
}
```

### Cache Invalidation

Invalidate queries after mutations to refresh data.

```typescript
// src/hooks/useCreateTask.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskKeys } from '@/lib/queryKeys';

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onSuccess: (newTask) => {
      // Invalidate all task lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });

      // Optionally, add to cache directly for instant UI update
      queryClient.setQueryData(taskKeys.detail(newTask.id), newTask);
    },
  });
}

// More granular invalidation
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTask,
    onSuccess: (updatedTask) => {
      // Update specific task in cache
      queryClient.setQueryData(
        taskKeys.detail(updatedTask.id),
        updatedTask
      );

      // Invalidate lists to refetch with new data
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
```

### Optimistic Updates

Update the UI immediately before the server responds for better UX.

```typescript
// src/hooks/useToggleTaskComplete.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Task } from '@/types';
import { taskKeys } from '@/lib/queryKeys';

export function useToggleTaskComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Optimistically update before server responds
    onMutate: async (taskId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.all);

      // Optimistically update
      queryClient.setQueryData<Task[]>(taskKeys.all, (old) =>
        old?.map((task) =>
          task.id === taskId
            ? { ...task, is_completed: true, completed_at: new Date().toISOString() }
            : task
        )
      );

      // Return context for rollback
      return { previousTasks };
    },

    // Rollback on error
    onError: (err, taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.all, context.previousTasks);
      }
    },

    // Refetch after success or error
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
```

---

## Custom Hook Patterns

### State + Derived Values

Combine state with computed/derived values in a single hook.

```typescript
// src/hooks/useTaskFilters.ts
import { useState, useMemo, useCallback } from 'react';
import { TaskStatus, TaskPriority } from '@/types';

interface TaskFilters {
  status: TaskStatus | null;
  priority: TaskPriority | null;
  searchQuery: string;
  showCompleted: boolean;
}

const initialFilters: TaskFilters = {
  status: null,
  priority: null,
  searchQuery: '',
  showCompleted: false,
};

export function useTaskFilters() {
  const [filters, setFilters] = useState<TaskFilters>(initialFilters);

  // Derived: check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== null ||
      filters.priority !== null ||
      filters.searchQuery !== '' ||
      filters.showCompleted !== false
    );
  }, [filters]);

  // Derived: count of active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status) count++;
    if (filters.priority) count++;
    if (filters.searchQuery) count++;
    if (filters.showCompleted) count++;
    return count;
  }, [filters]);

  // Actions
  const setStatus = useCallback((status: TaskStatus | null) => {
    setFilters((prev) => ({ ...prev, status }));
  }, []);

  const setPriority = useCallback((priority: TaskPriority | null) => {
    setFilters((prev) => ({ ...prev, priority }));
  }, []);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setFilters((prev) => ({ ...prev, searchQuery }));
  }, []);

  const setShowCompleted = useCallback((showCompleted: boolean) => {
    setFilters((prev) => ({ ...prev, showCompleted }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  return {
    filters,
    hasActiveFilters,
    activeFilterCount,
    setStatus,
    setPriority,
    setSearchQuery,
    setShowCompleted,
    resetFilters,
  };
}
```

### Callbacks with useCallback

Wrap callbacks in `useCallback` to maintain stable references.

```typescript
// src/hooks/useTaskActions.ts
import { useCallback } from 'react';
import { useCreateTask } from './useCreateTask';
import { useUpdateTask } from './useUpdateTask';
import { useDeleteTask } from './useDeleteTask';
import { Alert } from 'react-native';

export function useTaskActions() {
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  const createTask = useCallback(
    async (input: CreateTaskInput) => {
      try {
        await createMutation.mutateAsync(input);
      } catch (error) {
        Alert.alert('Error', 'Failed to create task');
        throw error;
      }
    },
    [createMutation]
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      try {
        await updateMutation.mutateAsync({ id, ...updates });
      } catch (error) {
        Alert.alert('Error', 'Failed to update task');
        throw error;
      }
    },
    [updateMutation]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        Alert.alert('Error', 'Failed to delete task');
        throw error;
      }
    },
    [deleteMutation]
  );

  const confirmAndDelete = useCallback(
    (id: string, taskTitle: string) => {
      Alert.alert(
        'Delete Task',
        `Are you sure you want to delete "${taskTitle}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteTask(id),
          },
        ]
      );
    },
    [deleteTask]
  );

  return {
    createTask,
    updateTask,
    deleteTask,
    confirmAndDelete,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
```

### Effect Cleanup

Always clean up subscriptions, timers, and event listeners.

```typescript
// src/hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    type: null,
  });

  useEffect(() => {
    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return status;
}
```

```typescript
// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up timer
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timer on value change or unmount
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### Dependencies Array Correctness

Include all values from the component scope that change over time and are used inside the effect.

```typescript
// BAD - Missing dependency
function useAutoSave(data: Data) {
  useEffect(() => {
    const timer = setInterval(() => {
      saveData(data); // Uses data but not in deps!
    }, 5000);
    return () => clearInterval(timer);
  }, []); // Missing data dependency
}

// GOOD - All dependencies included
function useAutoSave(data: Data) {
  useEffect(() => {
    const timer = setInterval(() => {
      saveData(data);
    }, 5000);
    return () => clearInterval(timer);
  }, [data]); // Correctly includes data
}

// GOOD - Using ref to avoid dependency when needed
function useAutoSave(data: Data) {
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    const timer = setInterval(() => {
      saveData(dataRef.current);
    }, 5000);
    return () => clearInterval(timer);
  }, []); // Empty deps is correct - ref is stable
}
```

---

## Testing Hooks

### Basic Setup with renderHook

Use `@testing-library/react-hooks` for testing hooks in isolation.

```typescript
// src/hooks/__tests__/useCounter.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useCounter } from '../useCounter';

describe('useCounter', () => {
  it('starts with initial value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('increments count', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('decrements count', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });
});
```

### Mocking Supabase

Create mock implementations for Supabase client.

```typescript
// __mocks__/supabase.ts
export const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  single: jest.fn(() => Promise.resolve({ data: null, error: null })),
  order: jest.fn(() => mockSupabase),
};

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));
```

```typescript
// src/hooks/__tests__/useTasks.test.ts
import { renderHook, waitFor } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTasks } from '../useTasks';
import { mockSupabase } from '@/__mocks__/supabase';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useTasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches tasks successfully', async () => {
    const mockTasks = [
      { id: '1', title: 'Task 1' },
      { id: '2', title: 'Task 2' },
    ];

    mockSupabase.select.mockResolvedValueOnce({
      data: mockTasks,
      error: null,
    });

    const { result } = renderHook(() => useTasks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTasks);
  });

  it('handles fetch error', async () => {
    mockSupabase.select.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    });

    const { result } = renderHook(() => useTasks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
```

### Testing Async Hooks

Handle async operations properly in tests.

```typescript
// src/hooks/__tests__/useCreateTask.test.ts
import { renderHook, waitFor, act } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateTask } from '../useCreateTask';
import { mockSupabase } from '@/__mocks__/supabase';

describe('useCreateTask', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('creates task successfully', async () => {
    const newTask = { id: '1', title: 'New Task' };

    mockSupabase.insert.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.single.mockResolvedValueOnce({
      data: newTask,
      error: null,
    });

    const { result } = renderHook(() => useCreateTask(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ title: 'New Task' });
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual(newTask);
  });

  it('invalidates task queries on success', async () => {
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    mockSupabase.single.mockResolvedValueOnce({
      data: { id: '1', title: 'New Task' },
      error: null,
    });

    const { result } = renderHook(() => useCreateTask(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ title: 'New Task' });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tasks'] });
  });
});
```

### Testing Error States

Verify hooks handle errors correctly.

```typescript
// src/hooks/__tests__/useTask.test.ts
describe('useTask error handling', () => {
  it('returns error state when task not found', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'Row not found' },
    });

    const { result } = renderHook(() => useTask('nonexistent'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.errorMessage).toBe('Task not found');
  });

  it('returns error state when permission denied', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST301', message: 'Permission denied' },
    });

    const { result } = renderHook(() => useTask('restricted'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.errorMessage).toBe(
      'You do not have permission to view this task'
    );
  });
});
```

---

## Performance

### Avoid Unnecessary Re-renders

Use `useMemo` and `useCallback` to prevent unnecessary re-renders.

```typescript
// BAD - Creates new object every render
function useTaskState() {
  const [tasks, setTasks] = useState<Task[]>([]);

  // This object is recreated every render!
  return {
    tasks,
    setTasks,
    isEmpty: tasks.length === 0,
  };
}

// GOOD - Memoize the return value
function useTaskState() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const isEmpty = useMemo(() => tasks.length === 0, [tasks]);

  // Or if returning object, memoize it
  return useMemo(
    () => ({
      tasks,
      setTasks,
      isEmpty,
    }),
    [tasks, isEmpty]
  );
}
```

### useMemo for Expensive Computations

Only use `useMemo` for computationally expensive operations.

```typescript
// src/hooks/useFilteredTasks.ts
import { useMemo } from 'react';
import { Task, TaskFilters } from '@/types';

export function useFilteredTasks(tasks: Task[], filters: TaskFilters) {
  // Expensive filtering and sorting - good use of useMemo
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by status
    if (filters.status) {
      result = result.filter((task) => task.status === filters.status);
    }

    // Filter by priority
    if (filters.priority) {
      result = result.filter((task) => task.priority === filters.priority);
    }

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
      );
    }

    // Sort by due date
    result.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

    return result;
  }, [tasks, filters.status, filters.priority, filters.searchQuery]);

  return filteredTasks;
}
```

### Stable References

Ensure callback and object references remain stable across renders.

```typescript
// BAD - New function every render causes child re-renders
function TaskList() {
  const handleTaskPress = (task: Task) => {
    navigation.navigate('TaskDetail', { id: task.id });
  };

  return tasks.map((task) => (
    <TaskItem key={task.id} task={task} onPress={handleTaskPress} />
  ));
}

// GOOD - Stable callback reference
function TaskList() {
  const handleTaskPress = useCallback(
    (task: Task) => {
      navigation.navigate('TaskDetail', { id: task.id });
    },
    [navigation]
  );

  return tasks.map((task) => (
    <TaskItem key={task.id} task={task} onPress={handleTaskPress} />
  ));
}
```

---

## Hook Composition

### Composing Multiple Hooks

Build complex hooks by combining simpler ones.

```typescript
// src/hooks/useTaskWithActions.ts
import { useTask } from './useTask';
import { useUpdateTask } from './useUpdateTask';
import { useDeleteTask } from './useDeleteTask';

export function useTaskWithActions(taskId: string) {
  const taskQuery = useTask(taskId);
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  return {
    // Query state
    task: taskQuery.data,
    isLoading: taskQuery.isLoading,
    error: taskQuery.error,

    // Mutation methods
    updateTask: (updates: Partial<Task>) =>
      updateMutation.mutateAsync({ id: taskId, ...updates }),
    deleteTask: () => deleteMutation.mutateAsync(taskId),

    // Mutation state
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
```

### Facade Hooks

Create facade hooks that combine multiple hooks for a specific screen or feature.

```typescript
// src/screens/tasks/hooks/useTasksPage.ts
import { useTasks } from '@/hooks/useTasks';
import { useTaskFilters } from '@/hooks/useTaskFilters';
import { useFilteredTasks } from '@/hooks/useFilteredTasks';
import { useCreateTask } from '@/hooks/useCreateTask';
import { useModal } from '@/hooks/useModal';

export function useTasksPage() {
  // Data fetching
  const tasksQuery = useTasks();

  // Filtering
  const {
    filters,
    hasActiveFilters,
    activeFilterCount,
    setStatus,
    setPriority,
    setSearchQuery,
    resetFilters,
  } = useTaskFilters();

  // Filtered results
  const filteredTasks = useFilteredTasks(tasksQuery.data ?? [], filters);

  // Create task modal
  const createModal = useModal();

  // Create mutation
  const createTask = useCreateTask();

  // Handle create task
  const handleCreateTask = async (input: CreateTaskInput) => {
    await createTask.mutateAsync(input);
    createModal.close();
  };

  return {
    // Data
    tasks: filteredTasks,
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    refetch: tasksQuery.refetch,

    // Filters
    filters,
    hasActiveFilters,
    activeFilterCount,
    setStatus,
    setPriority,
    setSearchQuery,
    resetFilters,

    // Create modal
    isCreateModalOpen: createModal.isOpen,
    openCreateModal: createModal.open,
    closeCreateModal: createModal.close,

    // Create action
    handleCreateTask,
    isCreating: createTask.isPending,
  };
}
```

Usage in the screen component:

```typescript
// src/screens/tasks/TasksScreen.tsx
export function TasksScreen() {
  const {
    tasks,
    isLoading,
    error,
    filters,
    hasActiveFilters,
    setSearchQuery,
    resetFilters,
    isCreateModalOpen,
    openCreateModal,
    closeCreateModal,
    handleCreateTask,
    isCreating,
  } = useTasksPage();

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  return (
    <Screen>
      <SearchBar value={filters.searchQuery} onChange={setSearchQuery} />

      {hasActiveFilters && (
        <Button title="Clear Filters" onPress={resetFilters} />
      )}

      <TaskList tasks={tasks} />

      <FAB icon="plus" onPress={openCreateModal} />

      <CreateTaskModal
        visible={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateTask}
        isSubmitting={isCreating}
      />
    </Screen>
  );
}
```

---

## Full Examples

### Full Data Hook Example

```typescript
// src/hooks/useTasks.ts
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Task, TaskFilters } from '@/types';
import { taskKeys } from '@/lib/queryKeys';

interface UseTasksOptions {
  filters?: TaskFilters;
  enabled?: boolean;
}

interface UseTasksResult extends Omit<UseQueryResult<Task[], Error>, 'data'> {
  tasks: Task[];
  isEmpty: boolean;
}

export function useTasks(options: UseTasksOptions = {}): UseTasksResult {
  const { filters = {}, enabled = true } = options;

  const query = useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: async (): Promise<Task[]> => {
      let queryBuilder = supabase
        .from('tasks')
        .select(`
          *,
          project:projects(id, name, color),
          assignee:users(id, name, avatar_url),
          tags:task_tags(tag:tags(id, name, color))
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.projectId) {
        queryBuilder = queryBuilder.eq('project_id', filters.projectId);
      }

      if (filters.status) {
        queryBuilder = queryBuilder.eq('status', filters.status);
      }

      if (filters.priority) {
        queryBuilder = queryBuilder.eq('priority', filters.priority);
      }

      if (filters.assigneeId) {
        queryBuilder = queryBuilder.eq('assignee_id', filters.assigneeId);
      }

      if (!filters.showCompleted) {
        queryBuilder = queryBuilder.eq('is_completed', false);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        throw new Error(`Failed to fetch tasks: ${error.message}`);
      }

      return data;
    },
    enabled,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    ...query,
    tasks: query.data ?? [],
    isEmpty: !query.isLoading && (query.data?.length ?? 0) === 0,
  };
}
```

### Full Mutation Hook Example

```typescript
// src/hooks/useUpdateTask.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Task, UpdateTaskInput } from '@/types';
import { taskKeys } from '@/lib/queryKeys';

interface UpdateTaskVariables {
  id: string;
  updates: UpdateTaskInput;
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateTaskVariables): Promise<Task> => {
      // Add updated_at timestamp
      const payload = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', id)
        .select(`
          *,
          project:projects(id, name, color),
          assignee:users(id, name, avatar_url)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to update task: ${error.message}`);
      }

      return data;
    },

    // Optimistic update
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      // Snapshot current state
      const previousTask = queryClient.getQueryData<Task>(taskKeys.detail(id));
      const previousLists = queryClient.getQueriesData<Task[]>({
        queryKey: taskKeys.lists(),
      });

      // Optimistically update the detail cache
      if (previousTask) {
        queryClient.setQueryData<Task>(taskKeys.detail(id), {
          ...previousTask,
          ...updates,
        });
      }

      // Optimistically update list caches
      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.lists() }, (old) =>
        old?.map((task) =>
          task.id === id ? { ...task, ...updates } : task
        )
      );

      return { previousTask, previousLists };
    },

    // Rollback on error
    onError: (error, variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(
          taskKeys.detail(variables.id),
          context.previousTask
        );
      }

      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    // Always refetch after mutation
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
```

### UI Hook Example

```typescript
// src/hooks/useSearch.ts
import { useState, useCallback, useMemo } from 'react';
import { useDebounce } from './useDebounce';

interface UseSearchOptions {
  debounceMs?: number;
  minLength?: number;
}

interface UseSearchReturn {
  query: string;
  debouncedQuery: string;
  setQuery: (query: string) => void;
  clear: () => void;
  isSearching: boolean;
  hasMinLength: boolean;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { debounceMs = 300, minLength = 2 } = options;

  const [query, setQueryState] = useState('');
  const debouncedQuery = useDebounce(query, debounceMs);

  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
  }, []);

  const clear = useCallback(() => {
    setQueryState('');
  }, []);

  // Derived state
  const isSearching = useMemo(
    () => query !== debouncedQuery,
    [query, debouncedQuery]
  );

  const hasMinLength = useMemo(
    () => debouncedQuery.length >= minLength,
    [debouncedQuery, minLength]
  );

  return {
    query,
    debouncedQuery,
    setQuery,
    clear,
    isSearching,
    hasMinLength,
  };
}
```

### Composed Hook Example

```typescript
// src/screens/project/hooks/useProjectPage.ts
import { useCallback } from 'react';
import { useProject } from '@/hooks/useProject';
import { useTasks } from '@/hooks/useTasks';
import { useProjectMembers } from '@/hooks/useProjectMembers';
import { useUpdateProject } from '@/hooks/useUpdateProject';
import { useDeleteProject } from '@/hooks/useDeleteProject';
import { useModal } from '@/hooks/useModal';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';

export function useProjectPage(projectId: string) {
  const navigation = useNavigation();

  // Data queries
  const projectQuery = useProject(projectId);
  const tasksQuery = useTasks({ filters: { projectId } });
  const membersQuery = useProjectMembers(projectId);

  // Mutations
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  // UI state
  const editModal = useModal();
  const deleteConfirm = useConfirmDialog();

  // Derived data
  const taskStats = useMemo(() => {
    const tasks = tasksQuery.tasks;
    return {
      total: tasks.length,
      completed: tasks.filter((t) => t.is_completed).length,
      overdue: tasks.filter(
        (t) => !t.is_completed && new Date(t.due_date) < new Date()
      ).length,
    };
  }, [tasksQuery.tasks]);

  // Actions
  const handleUpdateProject = useCallback(
    async (updates: UpdateProjectInput) => {
      try {
        await updateProject.mutateAsync({ id: projectId, updates });
        editModal.close();
      } catch (error) {
        Alert.alert('Error', 'Failed to update project');
      }
    },
    [projectId, updateProject, editModal]
  );

  const handleDeleteProject = useCallback(async () => {
    const confirmed = await deleteConfirm.confirm({
      title: 'Delete Project',
      message: `Are you sure you want to delete "${projectQuery.data?.name}"? This will also delete all tasks.`,
      confirmText: 'Delete',
      destructive: true,
    });

    if (confirmed) {
      try {
        await deleteProject.mutateAsync(projectId);
        navigation.goBack();
      } catch (error) {
        Alert.alert('Error', 'Failed to delete project');
      }
    }
  }, [projectId, projectQuery.data, deleteProject, deleteConfirm, navigation]);

  // Loading state
  const isLoading =
    projectQuery.isLoading || tasksQuery.isLoading || membersQuery.isLoading;

  // Error state
  const error = projectQuery.error || tasksQuery.error || membersQuery.error;

  return {
    // Data
    project: projectQuery.data,
    tasks: tasksQuery.tasks,
    members: membersQuery.data ?? [],
    taskStats,

    // Loading/error state
    isLoading,
    error,
    refetch: useCallback(() => {
      projectQuery.refetch();
      tasksQuery.refetch();
      membersQuery.refetch();
    }, [projectQuery, tasksQuery, membersQuery]),

    // Edit modal
    isEditModalOpen: editModal.isOpen,
    openEditModal: editModal.open,
    closeEditModal: editModal.close,

    // Actions
    handleUpdateProject,
    handleDeleteProject,
    isUpdating: updateProject.isPending,
    isDeleting: deleteProject.isPending,

    // Confirm dialog
    confirmDialog: deleteConfirm.dialogProps,
  };
}
```

---

## Directory Structure

### Feature-Specific Hooks

Place in the feature's hooks directory:

```
src/features/tasks/hooks/
├── useTaskOperations.ts
├── useTaskFiltering.ts
└── index.ts
```

### Component-Specific Hooks

Place alongside the component if only used by that component:

```
src/components/TaskCard/
├── TaskCard.tsx
├── useTaskCardAnimation.ts
└── index.ts
```

### Shared/Global Hooks

Place in root hooks directory:

```
src/hooks/
├── useAuth.ts
├── useLocalStorage.ts
├── useNetworkStatus.ts
└── index.ts
```

### Export Pattern

Always export from an `index.ts` barrel file:

```typescript
// src/hooks/index.ts
export { useAuth } from './useAuth';
export { useLocalStorage } from './useLocalStorage';
export { useNetworkStatus } from './useNetworkStatus';
export { useTasks } from './useTasks';
export { useCreateTask } from './useCreateTask';
```

---

## Common Mistakes

### 1. Calling Hooks Conditionally

```typescript
// BAD - Breaks rules of hooks
if (isLoggedIn) {
  const user = useAuth(); // ERROR!
}

// GOOD - Call unconditionally, use enabled option
const { user, isLoggedIn } = useAuth();
const profileQuery = useProfile({ enabled: isLoggedIn });
```

### 2. Missing Cleanup

```typescript
// BAD - Memory leak
useEffect(() => {
  const subscription = subscribe();
  // No cleanup!
}, []);

// GOOD - Always cleanup
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();
}, []);
```

### 3. Missing Dependencies

```typescript
// BAD - Stale closure
useEffect(() => {
  fetchData(userId);
}, []); // userId not in deps!

// GOOD - Include all deps
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

### 4. Creating Callbacks in Render

```typescript
// BAD - New function every render
function TaskList({ tasks }: { tasks: Task[] }) {
  return tasks.map((task) => (
    <TaskItem
      key={task.id}
      task={task}
      onPress={() => handlePress(task)} // New function every render!
    />
  ));
}

// GOOD - Stable callback
function TaskList({ tasks }: { tasks: Task[] }) {
  const handlePress = useCallback((task: Task) => {
    navigation.navigate('Task', { id: task.id });
  }, [navigation]);

  return tasks.map((task) => (
    <TaskItem key={task.id} task={task} onPress={handlePress} />
  ));
}
```

### 5. Overusing useMemo/useCallback

```typescript
// BAD - Unnecessary memoization
const name = useMemo(() => user.name, [user.name]); // Just a property access!
const isValid = useMemo(() => value.length > 0, [value]); // Trivial computation

// GOOD - Only memoize expensive operations
const sortedTasks = useMemo(
  () => [...tasks].sort((a, b) => a.priority - b.priority),
  [tasks]
);
```

---

## ESLint Rules

Enforce with ESLint:

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
};
```

---

## Checklist

When creating hooks:

- [ ] Name starts with `use` in camelCase
- [ ] Uses `.ts` extension (or `.tsx` only if returns JSX)
- [ ] Exported from barrel file (`index.ts`)
- [ ] Has cleanup for subscriptions/timers
- [ ] All dependencies listed in useEffect/useCallback/useMemo
- [ ] Has corresponding test file
- [ ] Uses `useCallback` for callbacks passed to children
- [ ] Uses `useMemo` only for expensive computations
- [ ] Returns stable references (memoized objects/arrays when needed)

For TanStack Query hooks:

- [ ] Uses consistent query key pattern from `queryKeys.ts`
- [ ] Has proper TypeScript return types
- [ ] Handles error states appropriately
- [ ] Uses `enabled` option for conditional fetching
- [ ] Invalidates correct queries on mutation success
- [ ] Implements optimistic updates where appropriate

For mutation hooks:

- [ ] Returns mutation state (`isPending`, `isError`, `isSuccess`)
- [ ] Invalidates related queries on success
- [ ] Has rollback logic for optimistic updates
- [ ] Shows appropriate error feedback to user

For composed/facade hooks:

- [ ] Combines related hooks for a specific feature/screen
- [ ] Exposes clean, focused API
- [ ] Handles loading states from multiple queries
- [ ] Memoizes derived data
- [ ] Provides stable callback references
