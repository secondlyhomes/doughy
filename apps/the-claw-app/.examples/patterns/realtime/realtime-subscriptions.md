# Real-Time Subscriptions

## Overview

Supabase real-time enables your app to listen to database changes, broadcast messages, and track user presence. This guide covers all real-time patterns with production-ready examples.

## Table Changes Subscription

### Basic Table Subscription

Listen to all changes on a table:

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import type { Database } from '@/types/database';

type Task = Database['public']['Tables']['tasks']['Row'];

export function useRealtimeTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    // Subscribe to all changes
    const channel = supabase
      .channel('tasks-all-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          console.log('Change received:', payload);

          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [payload.new as Task, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((task) =>
                task.id === payload.new.id ? (payload.new as Task) : task
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((task) => task.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return tasks;
}
```

### Subscribe to Specific Events

Listen only to specific event types:

```typescript
// Listen only to INSERTS
useEffect(() => {
  const channel = supabase
    .channel('new-tasks')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'tasks',
      },
      (payload) => {
        console.log('New task:', payload.new);
        setTasks((prev) => [payload.new as Task, ...prev]);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

// Listen only to UPDATES
useEffect(() => {
  const channel = supabase
    .channel('task-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tasks',
      },
      (payload) => {
        console.log('Task updated:', payload.new);
        setTasks((prev) =>
          prev.map((task) =>
            task.id === payload.new.id ? (payload.new as Task) : task
          )
        );
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## Filter Subscriptions by User

### User-Specific Changes

Only receive changes for the current user's data:

```typescript
export function useRealtimeUserTasks(userId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-tasks-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`, // Filter by user_id column
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [payload.new as Task, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((task) =>
                task.id === payload.new.id ? (payload.new as Task) : task
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((task) => task.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return tasks;
}
```

### Multiple Filters

Combine multiple filters:

```typescript
// Listen to tasks with specific status for a user
const channel = supabase
  .channel(`user-pending-tasks-${userId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'tasks',
      filter: `user_id=eq.${userId}&status=eq.pending`,
    },
    handleChange
  )
  .subscribe();
```

## Presence (Online/Offline Tracking)

### Track Online Users

Track which users are currently online:

```typescript
interface PresenceState {
  user_id: string;
  username: string;
  online_at: string;
}

export function usePresence(roomId: string) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: {
          key: 'user', // Unique key per user
        },
      },
    });

    // Handle presence sync (initial state)
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users = Object.values(state).flat() as PresenceState[];
      setOnlineUsers(users);
    });

    // Handle user joins
    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', key, newPresences);
      setOnlineUsers((prev) => [...prev, ...(newPresences as PresenceState[])]);
    });

    // Handle user leaves
    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', key, leftPresences);
      setOnlineUsers((prev) =>
        prev.filter(
          (user) =>
            !leftPresences.some(
              (left: PresenceState) => left.user_id === user.user_id
            )
        )
      );
    });

    // Subscribe and track this user's presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const user = await supabase.auth.getUser();
        if (user.data.user) {
          await channel.track({
            user_id: user.data.user.id,
            username: user.data.user.email || 'Anonymous',
            online_at: new Date().toISOString(),
          });
        }
      }
    });

    // Cleanup: untrack and unsubscribe
    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return onlineUsers;
}
```

### Typing Indicators

Show when users are typing:

```typescript
export function useTypingIndicator(roomId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`typing:${roomId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ username: string; typing: boolean }>();
        const typing = Object.values(state)
          .flat()
          .filter((user) => user.typing)
          .map((user) => user.username);
        setTypingUsers(typing);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const setTyping = async (isTyping: boolean) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;

    const channel = supabase.channel(`typing:${roomId}`);
    await channel.track({
      username: user.data.user.email || 'Anonymous',
      typing: isTyping,
    });
  };

  return { typingUsers, setTyping };
}
```

## Broadcast Messages

### Send and Receive Messages

Broadcast messages to all clients in a channel:

```typescript
interface BroadcastMessage {
  user_id: string;
  message: string;
  timestamp: string;
}

export function useBroadcast(channelName: string) {
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'message' }, (payload) => {
        console.log('Broadcast received:', payload);
        setMessages((prev) => [...prev, payload.payload as BroadcastMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName]);

  const sendMessage = async (message: string) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;

    const channel = supabase.channel(channelName);
    await channel.send({
      type: 'broadcast',
      event: 'message',
      payload: {
        user_id: user.data.user.id,
        message,
        timestamp: new Date().toISOString(),
      },
    });
  };

  return { messages, sendMessage };
}
```

### Targeted Broadcast

Send messages to specific users:

```typescript
// Send to specific user
await channel.send({
  type: 'broadcast',
  event: 'notification',
  payload: {
    to: targetUserId,
    from: currentUserId,
    message: 'You have a new notification',
  },
});

// Receive and filter
channel.on('broadcast', { event: 'notification' }, (payload) => {
  if (payload.payload.to === currentUserId) {
    console.log('Message for me:', payload.payload);
  }
});
```

## Connection State Management

### Track Connection Status

Monitor real-time connection state:

```typescript
export function useRealtimeConnection() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>(
    'connecting'
  );
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const channel = supabase.channel('connection-monitor');

    channel.subscribe((status, err) => {
      console.log('Connection status:', status, err);

      if (status === 'SUBSCRIBED') {
        setStatus('connected');
        setError(null);
      } else if (status === 'CHANNEL_ERROR') {
        setStatus('disconnected');
        setError(new Error(err?.message || 'Connection error'));
      } else if (status === 'TIMED_OUT') {
        setStatus('disconnected');
        setError(new Error('Connection timed out'));
      } else if (status === 'CLOSED') {
        setStatus('disconnected');
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { status, error };
}
```

### Auto-Reconnect with Retry

Handle reconnection with exponential backoff:

```typescript
export function useRealtimeWithRetry(channelName: string) {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;

  useEffect(() => {
    let channel = supabase.channel(channelName);
    let retryTimeout: NodeJS.Timeout;

    const subscribe = () => {
      channel.subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          if (retryCount < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
            console.log(`Retrying in ${delay}ms...`);

            retryTimeout = setTimeout(() => {
              setRetryCount((prev) => prev + 1);
              supabase.removeChannel(channel);
              channel = supabase.channel(channelName);
              subscribe();
            }, delay);
          } else {
            console.error('Max retries reached');
          }
        } else if (status === 'SUBSCRIBED') {
          setRetryCount(0); // Reset on success
        }
      });
    };

    subscribe();

    return () => {
      clearTimeout(retryTimeout);
      supabase.removeChannel(channel);
    };
  }, [channelName, retryCount]);
}
```

## Complete Real-Time Hook

Production-ready hook with all features:

```typescript
interface UseRealtimeOptions {
  channel: string;
  table?: string;
  filter?: string;
  enablePresence?: boolean;
  enableBroadcast?: boolean;
}

export function useRealtime<T>({
  channel: channelName,
  table,
  filter,
  enablePresence = false,
  enableBroadcast = false,
}: UseRealtimeOptions) {
  const [data, setData] = useState<T[]>([]);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>(
    'connecting'
  );
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);

  useEffect(() => {
    const channel = supabase.channel(channelName);

    // Subscribe to table changes
    if (table) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData((prev) => [payload.new as T, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setData((prev) =>
              prev.map((item: any) =>
                item.id === payload.new.id ? (payload.new as T) : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setData((prev) =>
              prev.filter((item: any) => item.id !== payload.old.id)
            );
          }
        }
      );
    }

    // Enable presence
    if (enablePresence) {
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          setOnlineUsers(Object.values(state).flat() as PresenceState[]);
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          setOnlineUsers((prev) => [...prev, ...(newPresences as PresenceState[])]);
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          setOnlineUsers((prev) =>
            prev.filter(
              (user) =>
                !leftPresences.some(
                  (left: PresenceState) => left.user_id === user.user_id
                )
            )
          );
        });
    }

    // Subscribe
    channel.subscribe(async (subscribeStatus) => {
      if (subscribeStatus === 'SUBSCRIBED') {
        setStatus('connected');

        // Track presence if enabled
        if (enablePresence) {
          const user = await supabase.auth.getUser();
          if (user.data.user) {
            await channel.track({
              user_id: user.data.user.id,
              username: user.data.user.email || 'Anonymous',
              online_at: new Date().toISOString(),
            });
          }
        }
      } else if (subscribeStatus === 'CHANNEL_ERROR') {
        setStatus('disconnected');
      }
    });

    return () => {
      if (enablePresence) {
        channel.untrack();
      }
      supabase.removeChannel(channel);
    };
  }, [channelName, table, filter, enablePresence, enableBroadcast]);

  return {
    data,
    status,
    onlineUsers,
  };
}
```

## Best Practices

### 1. Always Clean Up Subscriptions

```typescript
// GOOD: Cleanup on unmount
useEffect(() => {
  const channel = supabase.channel('my-channel').subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}, []);

// BAD: No cleanup (memory leak)
useEffect(() => {
  supabase.channel('my-channel').subscribe();
}, []);
```

### 2. Use Unique Channel Names

```typescript
// GOOD: Unique per resource
const channel = supabase.channel(`tasks:${userId}:${taskId}`);

// BAD: Generic name (conflicts)
const channel = supabase.channel('tasks');
```

### 3. Handle Connection States

```typescript
channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    // Connected successfully
  } else if (status === 'CHANNEL_ERROR') {
    // Handle error, maybe retry
  } else if (status === 'TIMED_OUT') {
    // Handle timeout
  }
});
```

### 4. Batch Updates for Performance

```typescript
// GOOD: Batch state updates
const handleChanges = (payload: any) => {
  setData((prev) => {
    const updated = [...prev];
    // Make all changes to updated array
    return updated;
  });
};

// BAD: Multiple state updates
const handleChanges = (payload: any) => {
  setData((prev) => [...prev, payload.new]);
  setLoading(false);
  setError(null);
};
```

### 5. Filter Server-Side

```typescript
// GOOD: Filter on server
const channel = supabase
  .channel('filtered-tasks')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'tasks',
      filter: `user_id=eq.${userId}`,
    },
    handleChange
  );

// BAD: Filter on client
const channel = supabase
  .channel('all-tasks')
  .on('postgres_changes', { event: '*', table: 'tasks' }, (payload) => {
    if (payload.new.user_id === userId) {
      handleChange(payload);
    }
  });
```

## Troubleshooting

### Subscription Not Working

1. Check RLS policies allow SELECT
2. Verify table has realtime enabled:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
```

3. Check connection status in callback

### Missing Updates

1. Ensure cleanup is working (no duplicate subscriptions)
2. Check filter syntax
3. Verify user has access via RLS

### Performance Issues

1. Use filters to reduce payload size
2. Unsubscribe when component unmounts
3. Consider debouncing rapid updates
4. Use broadcast for frequent, non-persistent messages

## Security Considerations

1. RLS policies apply to real-time subscriptions
2. Users only receive updates for data they can SELECT
3. Use filters to limit data exposure
4. Never send sensitive data via broadcast (not secured by RLS)
5. Validate all payload data before using

## See Also

- [Collaborative Editing](./collaborative-editing.md)
- [Presence Indicators](./presence-indicators.md)
- [Real-Time Examples](./README.md)
