# State Management Architecture

> A hybrid approach using React Context for global state and Zustand for feature state.

## Overview

This project uses a **layered state management approach**:

| Layer | Tool | Use Case |
|-------|------|----------|
| Component | `useState` | Ephemeral UI state (form inputs, toggles) |
| Feature | Zustand | Feature-specific shared state |
| Global | React Context | App-wide state (auth, theme, preferences) |
| Server | Supabase + subscriptions | Remote data, real-time sync |

## State Categories

### 1. Local Component State (useState)

For state that doesn't need to be shared:

```typescript
function TaskForm() {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only this component needs this state
}
```

**When to use:**
- Form inputs before submission
- UI toggles (modal open/closed)
- Loading states for single components
- Temporary values

### 2. Feature State (Zustand)

For state shared within a feature but not app-wide:

```typescript
// src/screens/tasks/use-task-store.tsx
import { create } from 'zustand';

interface TaskState {
  tasks: Task[];
  filter: 'all' | 'active' | 'completed';
  setFilter: (filter: TaskState['filter']) => void;
  addTask: (task: Task) => void;
  toggleTask: (id: string) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  filter: 'all',
  setFilter: (filter) => set({ filter }),
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task]
  })),
  toggleTask: (id) => set((state) => ({
    tasks: state.tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ),
  })),
}));
```

**When to use:**
- Feature-specific data (task list, cart items)
- Filter/sort preferences within a feature
- Draft states before saving

### 3. Global App State (React Context)

For state needed across the entire app:

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

**When to use:**
- Authentication state
- Theme/appearance settings
- User preferences
- Feature flags

### 4. Server State (Supabase)

For data that lives on the server:

```typescript
// src/screens/tasks/api.ts
import { supabase } from '@/services/supabase';
import { useEffect, useState } from 'react';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initial fetch
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) setError(error);
      else setTasks(data ?? []);
      setIsLoading(false);
    };

    fetchTasks();

    // Real-time subscription
    const subscription = supabase
      .channel('tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [payload.new as Task, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((t) => (t.id === payload.new.id ? payload.new as Task : t))
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { tasks, isLoading, error };
}
```

## Zustand Patterns

### Basic Store

```typescript
import { create } from 'zustand';

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));
```

### Store with Persistence (AsyncStorage)

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  setTheme: (theme: SettingsState['theme']) => void;
  toggleNotifications: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      notifications: true,
      setTheme: (theme) => set({ theme }),
      toggleNotifications: () => set((state) => ({
        notifications: !state.notifications
      })),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### Store with Supabase Sync

```typescript
import { create } from 'zustand';
import { supabase } from '@/services/supabase';

interface TaskStoreState {
  tasks: Task[];
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (title: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  tasks: [],
  isLoading: false,

  fetchTasks: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) set({ tasks: data ?? [] });
    set({ isLoading: false });
  },

  addTask: async (title: string) => {
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newTask = { id: tempId, title, completed: false };
    set((state) => ({ tasks: [newTask, ...state.tasks] }));

    // Server request
    const { data, error } = await supabase
      .from('tasks')
      .insert({ title })
      .select()
      .single();

    if (error) {
      // Rollback on error
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== tempId)
      }));
    } else {
      // Replace temp with real
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === tempId ? data : t)),
      }));
    }
  },

  deleteTask: async (id: string) => {
    // Optimistic removal
    const tasks = get().tasks;
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));

    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
      // Rollback
      set({ tasks });
    }
  },
}));
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     User Action                         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    Component                            │
│              (useState for local UI)                    │
└────────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
┌─────────────────┐           ┌─────────────────┐
│  Zustand Store  │           │  React Context  │
│ (feature state) │           │ (global state)  │
└────────┬────────┘           └────────┬────────┘
         │                             │
         └──────────────┬──────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   Service Layer                         │
│              (supabase.ts, aiClient.ts)                 │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      Supabase                           │
│              (Database with RLS)                        │
└─────────────────────────────────────────────────────────┘
```

## When to Use What

| State Type | When to Use | Example |
|------------|-------------|---------|
| `useState` | Component-only, ephemeral | Modal open, form inputs |
| Zustand | Feature-shared, client-only | Task filters, draft edits |
| Context | App-wide, rarely changes | Auth user, theme |
| Supabase | Server data, real-time | Tasks, messages, profiles |

## Anti-Patterns

### Don't Put Everything in Global State

```typescript
// ❌ BAD: Form state in global store
const useFormStore = create((set) => ({
  email: '',
  password: '',
  setEmail: (email) => set({ email }),
}));

// ✅ GOOD: Form state is local
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
}
```

### Don't Duplicate Server State

```typescript
// ❌ BAD: Duplicating what's in database
const useTasks = create((set) => ({
  tasks: [], // Already in Supabase
  fetchedAt: null, // Manual cache invalidation
}));

// ✅ GOOD: Subscribe to server state
function TaskList() {
  const { tasks } = useTasks(); // Hook that subscribes to Supabase
}
```

### Don't Forget Cleanup

```typescript
// ❌ BAD: Memory leak
useEffect(() => {
  const subscription = supabase.channel('tasks').subscribe();
  // Missing cleanup!
}, []);

// ✅ GOOD: Proper cleanup
useEffect(() => {
  const subscription = supabase.channel('tasks').subscribe();
  return () => subscription.unsubscribe();
}, []);
```

## Checklist

- [ ] Feature stores are self-contained in feature folders
- [ ] Context only for truly global state (auth, theme)
- [ ] Server state managed via Supabase hooks
- [ ] All subscriptions cleaned up in useEffect
- [ ] Optimistic updates have rollback handlers
- [ ] Persisted stores use AsyncStorage middleware
- [ ] No duplicated state between layers

## Related Docs

- [Folder Structure](./FOLDER-STRUCTURE.md)
- [Data Flow](./DATA-FLOW.md)
- [ADR-002: State Management](./ADR-002-STATE-MANAGEMENT.md)
- [Hook Conventions](../02-coding-standards/HOOK-CONVENTIONS.md)
