# Real-Time Patterns

Complete guide and examples for implementing real-time features with Supabase in React Native.

## Overview

This directory contains production-ready patterns for:
- Real-time database subscriptions
- Collaborative editing
- Presence indicators (online/offline, typing)
- Live cursors
- Optimistic updates
- Conflict resolution

## When to Use Real-Time

### Good Use Cases

**Chat and Messaging**
- Live message updates
- Typing indicators
- Read receipts
- Online presence

**Collaborative Editing**
- Document editing
- Shared whiteboards
- Live comments
- Task management

**Live Dashboards**
- Analytics updates
- Stock prices
- Order tracking
- System monitoring

**Social Features**
- Activity feeds
- Notifications
- Like/reaction counts
- Live comments

### When to Avoid

**High-Frequency Data**
- Avoid for data changing more than once per second
- Use polling or server-sent events instead
- Example: real-time gaming, live sports scores

**Large Datasets**
- Don't subscribe to tables with 10,000+ rows
- Use filters to limit subscription scope
- Paginate and subscribe to visible data only

**Sensitive Data**
- Real-time subscriptions bypass some RLS edge cases
- Use broadcast for sensitive data (not database subscriptions)
- Always validate data on the server

**Battery-Constrained Scenarios**
- Consider user's battery life
- Use polling for background updates
- Throttle presence updates

## Performance Considerations

### Connection Management

```typescript
// GOOD: One channel per resource
const taskChannel = supabase.channel(`tasks:${userId}`);
const chatChannel = supabase.channel(`chat:${roomId}`);

// BAD: Multiple subscriptions on same channel
const channel = supabase.channel('everything')
  .on('postgres_changes', { table: 'tasks' }, ...)
  .on('postgres_changes', { table: 'messages' }, ...)
  .on('postgres_changes', { table: 'users' }, ...);
```

### Filter Server-Side

```typescript
// GOOD: Filter on server (only receive relevant updates)
channel.on(
  'postgres_changes',
  {
    event: '*',
    schema: 'public',
    table: 'tasks',
    filter: `user_id=eq.${userId}`, // Server-side filter
  },
  handleChange
);

// BAD: Receive all updates, filter on client
channel.on(
  'postgres_changes',
  { event: '*', table: 'tasks' },
  (payload) => {
    if (payload.new.user_id === userId) { // Client-side filter
      handleChange(payload);
    }
  }
);
```

### Cleanup Subscriptions

```typescript
// GOOD: Always cleanup
useEffect(() => {
  const channel = supabase.channel('my-channel').subscribe();

  return () => {
    supabase.removeChannel(channel); // Cleanup
  };
}, []);

// BAD: No cleanup (memory leak)
useEffect(() => {
  supabase.channel('my-channel').subscribe();
  // Missing cleanup
}, []);
```

### Batch State Updates

```typescript
// GOOD: Single state update
setData((prev) => {
  const updated = [...prev];
  // Make all changes
  updated.push(newItem);
  updated.sort(sortFn);
  return updated;
});

// BAD: Multiple state updates
setData((prev) => [...prev, newItem]);
setData((prev) => prev.sort(sortFn));
```

## Battery Impact

### Impact Levels

**Low Impact** (< 1% per hour)
- Single channel subscription
- Infrequent updates (< 1 per minute)
- Small payloads (< 1KB)
- Proper cleanup

**Medium Impact** (1-3% per hour)
- 2-5 channel subscriptions
- Regular updates (1-10 per minute)
- Presence tracking
- Typing indicators

**High Impact** (> 3% per hour)
- 5+ channel subscriptions
- Frequent updates (> 10 per minute)
- Large payloads (> 10KB)
- Continuous cursor tracking

### Optimization Strategies

**1. Throttle Presence Updates**

```typescript
// Update presence at most once every 5 seconds
const updatePresence = useCallback(
  throttle((position) => {
    channel.track({ position });
  }, 5000),
  []
);
```

**2. Pause When Background**

```typescript
import { AppState } from 'react-native';

useEffect(() => {
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'background') {
      channel.untrack(); // Stop presence tracking
    } else if (state === 'active') {
      channel.track({ ...presenceData }); // Resume
    }
  });

  return () => subscription.remove();
}, []);
```

**3. Use Broadcast for High-Frequency Updates**

```typescript
// GOOD: Use broadcast (no database writes)
channel.send({
  type: 'broadcast',
  event: 'cursor_move',
  payload: { x, y },
});

// BAD: Write to database (expensive)
await supabase.from('cursors').upsert({ x, y });
```

**4. Reduce Payload Size**

```typescript
// GOOD: Only send what changed
channel.track({ cursor_x: x, cursor_y: y });

// BAD: Send entire object
channel.track({ ...entireUserObject, cursor_x: x, cursor_y: y });
```

## Best Practices

### 1. Always Handle Connection States

```typescript
channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    setIsConnected(true);
  } else if (status === 'CHANNEL_ERROR') {
    setIsConnected(false);
    // Show error to user
  } else if (status === 'TIMED_OUT') {
    // Retry connection
  }
});
```

### 2. Implement Optimistic Updates

```typescript
// Update UI immediately
setTasks((prev) => [...prev, optimisticTask]);

// Send to server
const { error } = await supabase.from('tasks').insert(task);

// Revert on error
if (error) {
  setTasks((prev) => prev.filter((t) => t.id !== optimisticTask.id));
}
```

### 3. Use Unique Channel Names

```typescript
// GOOD: Unique and descriptive
const channel = supabase.channel(`document:${docId}:${userId}`);

// BAD: Generic name (potential conflicts)
const channel = supabase.channel('document');
```

### 4. Validate Real-Time Data

```typescript
channel.on('postgres_changes', { ... }, (payload) => {
  // Validate before using
  if (!payload.new || !payload.new.id) {
    console.error('Invalid payload:', payload);
    return;
  }

  handleChange(payload.new);
});
```

### 5. Handle Race Conditions

```typescript
// Use version numbers for optimistic locking
const { data, error } = await supabase
  .from('tasks')
  .update({ title: newTitle })
  .eq('id', taskId)
  .eq('version', currentVersion) // Prevent concurrent updates
  .select()
  .single();

if (error?.code === 'PGRST116') {
  // Conflict detected - refetch and retry
}
```

### 6. Limit Subscription Scope

```typescript
// GOOD: Subscribe to specific room
channel.on(
  'postgres_changes',
  { table: 'messages', filter: `room_id=eq.${roomId}` },
  handleMessage
);

// BAD: Subscribe to all messages
channel.on(
  'postgres_changes',
  { table: 'messages' },
  handleMessage
);
```

### 7. Avoid N+1 Subscriptions

```typescript
// GOOD: One subscription for all items
useEffect(() => {
  const channel = supabase
    .channel('all-tasks')
    .on('postgres_changes', { table: 'tasks', filter: `user_id=eq.${userId}` }, ...)
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [userId]);

// BAD: Subscription per item
tasks.forEach((task) => {
  useEffect(() => {
    const channel = supabase
      .channel(`task-${task.id}`)
      .on('postgres_changes', { table: 'tasks', filter: `id=eq.${task.id}` }, ...)
      .subscribe();
    // This creates N subscriptions!
  }, [task.id]);
});
```

## Security Best Practices

### 1. RLS Applies to Real-Time

Real-time subscriptions respect Row Level Security policies:

```sql
-- Users only receive updates for their own tasks
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);
```

### 2. Validate All Payloads

```typescript
// Always validate data received via real-time
channel.on('broadcast', { event: 'message' }, ({ payload }) => {
  // Validate structure
  if (!payload || typeof payload.message !== 'string') {
    console.error('Invalid message payload');
    return;
  }

  // Sanitize content
  const sanitized = sanitizeHtml(payload.message);
  addMessage(sanitized);
});
```

### 3. Don't Trust Client-Side Filters

```typescript
// WRONG: Client can modify this filter
const channel = supabase
  .channel('admin-data')
  .on('postgres_changes', {
    table: 'sensitive_data',
    filter: `user_id=eq.${userId}` // Client provides userId
  }, handleData);

// CORRECT: Server enforces via RLS
CREATE POLICY "Users see own data"
  ON sensitive_data FOR SELECT
  USING (auth.uid() = user_id);
```

### 4. Rate Limit Presence Updates

```typescript
// Prevent abuse
const updatePresence = useCallback(
  throttle((data) => {
    channel.track(data);
  }, 1000), // Max 1 update per second
  []
);
```

### 5. Sanitize Broadcast Messages

```typescript
// Broadcast bypasses RLS - sanitize everything
await channel.send({
  type: 'broadcast',
  event: 'message',
  payload: {
    message: sanitizeHtml(userInput),
    userId: currentUserId,
    timestamp: Date.now(),
  },
});
```

## Database Setup

### Enable Real-Time on Tables

```sql
-- Enable real-time for specific table
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- Enable for all tables (not recommended)
ALTER PUBLICATION supabase_realtime SET TABLE ALL;

-- Remove table from real-time
ALTER PUBLICATION supabase_realtime DROP TABLE tasks;
```

### Indexes for Performance

```sql
-- Index columns used in filters
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_messages_room_id ON messages(room_id);

-- Index for sorting
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

## Testing Real-Time Features

### Unit Tests

```typescript
import { supabase } from '@/services/supabase';

describe('Real-time tasks', () => {
  it('receives new task via real-time', async () => {
    const onInsert = jest.fn();

    const channel = supabase
      .channel('test-tasks')
      .on('postgres_changes', { event: 'INSERT', table: 'tasks' }, onInsert)
      .subscribe();

    // Create task
    await supabase.from('tasks').insert({ title: 'Test' });

    // Wait for real-time event
    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(onInsert).toHaveBeenCalled();

    // Cleanup
    supabase.removeChannel(channel);
  });
});
```

### Integration Tests

```typescript
// Test on multiple devices/browsers
// 1. Open app on device A
// 2. Open app on device B
// 3. Make change on device A
// 4. Verify change appears on device B
```

## Troubleshooting

### Subscription Not Receiving Updates

**Check 1: Real-time enabled on table**
```sql
-- Verify table is in publication
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'your_table';
```

**Check 2: RLS allows SELECT**
```sql
-- Test RLS policy
SELECT * FROM your_table; -- Must succeed for real-time to work
```

**Check 3: Filter syntax**
```typescript
// Correct filter format
filter: `user_id=eq.${userId}`  // ✓
filter: `user_id=${userId}`     // ✗
```

### High Battery Usage

- Reduce update frequency
- Use throttling for presence/cursor updates
- Unsubscribe when app is backgrounded
- Use broadcast instead of database writes

### Memory Leaks

- Always call `supabase.removeChannel(channel)` in cleanup
- Don't create subscriptions inside loops
- Verify cleanup runs on unmount

### Race Conditions

- Implement optimistic locking with version numbers
- Use transactions for critical updates
- Handle conflicts gracefully

## Examples

- [Real-Time Subscriptions](./realtime-subscriptions.md) - Complete subscription patterns
- [Collaborative Editing](./collaborative-editing.md) - Live editing, cursors, conflict resolution
- [Presence Indicators](./presence-indicators.md) - Online status, typing indicators
- [Presence Example](./PresenceExample.tsx) - Working presence component
- [Real-Time List Example](./RealtimeListExample.tsx) - Live-updating list
- [Chat Example](./ChatExample.tsx) - Full-featured chat app

## Further Reading

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Postgres LISTEN/NOTIFY](https://www.postgresql.org/docs/current/sql-notify.html)
- [Operational Transformation](https://en.wikipedia.org/wiki/Operational_transformation)
- [Conflict-Free Replicated Data Types (CRDTs)](https://crdt.tech/)

## Need Help?

- Check the troubleshooting section above
- Review example implementations
- Search [Supabase Discussions](https://github.com/supabase/supabase/discussions)
- Post in project Slack/Discord

---

**Next Steps:**
1. Review the patterns that match your use case
2. Test examples in your app
3. Implement with proper error handling and cleanup
4. Monitor battery usage and performance
5. Test on physical devices
