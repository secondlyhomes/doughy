# Data Flow Patterns

> How data moves through the application.

## Overview

Data flows **unidirectionally** through the app:

```
User Action → Component → Store/Context → Service → Supabase → RLS → Response
```

## Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Mobile App                               │
├─────────────────────────────────────────────────────────────────┤
│  User taps "Add Task"                                           │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │  Component  │ useState, local form state                      │
│  └──────┬──────┘                                                │
│         │ onSubmit                                               │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │   Zustand   │ Optimistic update: add temp task               │
│  │   Store     │                                                 │
│  └──────┬──────┘                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │  Service    │ supabase.from('tasks').insert()                │
│  └──────┬──────┘                                                │
└─────────┼───────────────────────────────────────────────────────┘
          │ HTTPS
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐                                                │
│  │   PostgREST │ API layer                                      │
│  └──────┬──────┘                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │     RLS     │ auth.uid() = user_id check                     │
│  │   Policy    │                                                 │
│  └──────┬──────┘                                                │
│         │ If authorized                                          │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │  PostgreSQL │ INSERT INTO tasks ...                          │
│  └──────┬──────┘                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │  Realtime   │ Broadcast change to subscribers                │
│  └─────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Login   │──▶│ Supabase │──▶│  Store   │──▶│ Secure   │
│  Screen  │   │   Auth   │   │  Token   │   │  Store   │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
                    │
                    ▼
              ┌──────────┐
              │  Auth    │
              │ Context  │──▶ App re-renders with user
              └──────────┘
```

### Implementation

```typescript
// src/contexts/AuthContext.tsx
export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Store token securely
        if (session?.access_token) {
          await SecureStore.setItemAsync('access_token', session.access_token);
        } else {
          await SecureStore.deleteItemAsync('access_token');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ... rest of context
}
```

## Real-Time Subscriptions

```typescript
// Subscribe to changes
useEffect(() => {
  const subscription = supabase
    .channel('tasks')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        switch (payload.eventType) {
          case 'INSERT':
            addTaskToState(payload.new as Task);
            break;
          case 'UPDATE':
            updateTaskInState(payload.new as Task);
            break;
          case 'DELETE':
            removeTaskFromState(payload.old.id);
            break;
        }
      }
    )
    .subscribe();

  // CRITICAL: Clean up on unmount
  return () => {
    subscription.unsubscribe();
  };
}, [user.id]);
```

## Optimistic Updates

Update UI immediately, then sync with server:

```typescript
// src/screens/tasks/use-task-store.ts
export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],

  addTask: async (title: string) => {
    const tempId = `temp-${Date.now()}`;
    const tempTask: Task = {
      id: tempId,
      title,
      completed: false,
      created_at: new Date().toISOString(),
    };

    // 1. Optimistic update
    set((state) => ({
      tasks: [tempTask, ...state.tasks],
    }));

    try {
      // 2. Server request
      const { data, error } = await supabase
        .from('tasks')
        .insert({ title })
        .select()
        .single();

      if (error) throw error;

      // 3. Replace temp with real
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === tempId ? data : t
        ),
      }));
    } catch (error) {
      // 4. Rollback on error
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== tempId),
      }));
      throw error;
    }
  },

  toggleTask: async (id: string) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    // 1. Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    }));

    try {
      // 2. Server request
      await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', id);
    } catch (error) {
      // 3. Rollback on error
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, completed: task.completed } : t
        ),
      }));
      throw error;
    }
  },
}));
```

## Error Handling Flow

```
Error occurs → Catch → User feedback → Log → Rollback (if needed)
```

```typescript
// src/utils/error-handling.ts
import { Alert } from 'react-native';
import * as Sentry from '@sentry/react-native';

export function handleError(error: unknown, context?: string) {
  const message = error instanceof Error ? error.message : 'Unknown error';

  // 1. User feedback
  Alert.alert(
    'Error',
    getUserFriendlyMessage(message),
    [{ text: 'OK' }]
  );

  // 2. Log for debugging
  console.error(`[${context}]`, error);

  // 3. Report to monitoring
  Sentry.captureException(error, {
    tags: { context },
  });
}

function getUserFriendlyMessage(error: string): string {
  // Map technical errors to user-friendly messages
  if (error.includes('network')) {
    return 'Please check your internet connection';
  }
  if (error.includes('unauthorized')) {
    return 'Please log in again';
  }
  return 'Something went wrong. Please try again.';
}
```

## Offline-First Pattern (Optional)

```typescript
// src/services/offline-queue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface QueuedAction {
  id: string;
  action: 'insert' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
}

const QUEUE_KEY = 'offline_queue';

export async function queueAction(action: QueuedAction) {
  const queue = await getQueue();
  queue.push(action);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function processQueue() {
  const isConnected = await NetInfo.fetch().then((s) => s.isConnected);
  if (!isConnected) return;

  const queue = await getQueue();
  if (queue.length === 0) return;

  for (const action of queue) {
    try {
      await executeAction(action);
      await removeFromQueue(action.id);
    } catch (error) {
      // Keep in queue for retry
      console.error('Failed to process queued action:', error);
    }
  }
}

// Listen for network changes
NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    processQueue();
  }
});
```

## AI Request Flow

```
User Input → Sanitize → Rate Check → AI Service → Validate Output → Display
```

```typescript
// src/services/ai/request-flow.ts
export async function getAISuggestion(userInput: string): Promise<Suggestion> {
  // 1. Sanitize input
  const sanitized = sanitizeInput(userInput);

  // 2. Check rate limits
  const canProceed = await checkRateLimit();
  if (!canProceed) {
    throw new Error('Rate limit exceeded');
  }

  // 3. Call AI service
  const response = await fetch(`${API_URL}/ai/suggest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ input: sanitized }),
  });

  if (!response.ok) {
    throw new Error('AI request failed');
  }

  // 4. Validate output
  const data = await response.json();
  const validated = SuggestionSchema.parse(data);

  return validated;
}
```

## Checklist

- [ ] All data flows unidirectionally
- [ ] Optimistic updates have rollback handlers
- [ ] Real-time subscriptions properly cleaned up
- [ ] Errors provide user-friendly feedback
- [ ] Errors logged to monitoring service
- [ ] Auth token stored securely
- [ ] Auth state changes trigger re-renders
- [ ] Offline queue implemented (if needed)

## Related Docs

- [State Management](./STATE-MANAGEMENT.md) - Store patterns
- [Supabase Setup](../03-database/SUPABASE-SETUP.md) - Database configuration
- [AI API Call](../patterns/AI-API-CALL.md) - AI request patterns
