# Collaborative Editing

## Overview

Implement real-time collaborative editing with live cursors, conflict resolution, and operational transforms. This guide covers patterns for building collaborative features like Google Docs.

## Live Cursors

### Basic Cursor Tracking

Track and display cursor positions for all collaborators:

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

interface Cursor {
  userId: string;
  username: string;
  position: { x: number; y: number };
  color: string;
}

export function useLiveCursors(documentId: string) {
  const [cursors, setCursors] = useState<Map<string, Cursor>>(new Map());
  const [myColor] = useState(() => generateRandomColor());

  useEffect(() => {
    const channel = supabase.channel(`document:${documentId}:cursors`);

    // Receive cursor updates from others
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<Cursor>();
        const cursorMap = new Map<string, Cursor>();

        Object.entries(state).forEach(([key, presences]) => {
          const presence = presences[0];
          if (presence) {
            cursorMap.set(key, presence);
          }
        });

        setCursors(cursorMap);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const presence = newPresences[0] as Cursor;
        setCursors((prev) => new Map(prev).set(key, presence));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setCursors((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const user = await supabase.auth.getUser();
          if (user.data.user) {
            await channel.track({
              userId: user.data.user.id,
              username: user.data.user.email || 'Anonymous',
              position: { x: 0, y: 0 },
              color: myColor,
            });
          }
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [documentId, myColor]);

  const updateCursor = async (position: { x: number; y: number }) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;

    const channel = supabase.channel(`document:${documentId}:cursors`);
    await channel.track({
      userId: user.data.user.id,
      username: user.data.user.email || 'Anonymous',
      position,
      color: myColor,
    });
  };

  return { cursors, updateCursor, myColor };
}

function generateRandomColor(): string {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
```

### Cursor Component

Display remote cursors:

```typescript
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface CursorProps {
  username: string;
  position: { x: number; y: number };
  color: string;
}

export function RemoteCursor({ username, position, color }: CursorProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withSpring(position.x, { damping: 20 }) },
      { translateY: withSpring(position.y, { damping: 20 }) },
    ],
  }));

  return (
    <Animated.View style={[styles.cursor, animatedStyle]}>
      <View style={[styles.pointer, { borderLeftColor: color }]} />
      <View style={[styles.label, { backgroundColor: color }]}>
        <Text style={styles.labelText}>{username}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cursor: {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 1000,
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  label: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  labelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
```

## Text Editing with Conflict Resolution

### Operational Transformation (OT)

Implement OT for concurrent text edits:

```typescript
interface TextOperation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  text?: string;
  length?: number;
  userId: string;
  timestamp: number;
}

export class OperationalTransform {
  /**
   * Transform operation A against operation B
   * Returns transformed version of A that can be applied after B
   */
  static transform(opA: TextOperation, opB: TextOperation): TextOperation {
    // Both operations are at the same position
    if (opA.position === opB.position) {
      if (opA.type === 'insert' && opB.type === 'insert') {
        // Resolve ties by user ID (deterministic)
        if (opA.userId < opB.userId) {
          return opA; // A goes first
        } else {
          return { ...opA, position: opA.position + (opB.text?.length || 0) };
        }
      }
    }

    // A is after B
    if (opA.position > opB.position) {
      if (opB.type === 'insert') {
        return { ...opA, position: opA.position + (opB.text?.length || 0) };
      } else if (opB.type === 'delete') {
        return { ...opA, position: Math.max(opB.position, opA.position - (opB.length || 0)) };
      }
    }

    // A is before B or doesn't conflict
    return opA;
  }

  /**
   * Apply operation to text
   */
  static apply(text: string, operation: TextOperation): string {
    switch (operation.type) {
      case 'insert':
        return (
          text.slice(0, operation.position) +
          (operation.text || '') +
          text.slice(operation.position)
        );
      case 'delete':
        return (
          text.slice(0, operation.position) +
          text.slice(operation.position + (operation.length || 0))
        );
      case 'retain':
        return text;
      default:
        return text;
    }
  }
}
```

### Collaborative Text Editor Hook

```typescript
interface CollaborativeTextState {
  text: string;
  version: number;
  pendingOps: TextOperation[];
}

export function useCollaborativeText(documentId: string, initialText: string = '') {
  const [state, setState] = useState<CollaborativeTextState>({
    text: initialText,
    version: 0,
    pendingOps: [],
  });
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    supabase.auth.getUser().then((result) => {
      if (result.data.user) {
        setUserId(result.data.user.id);
      }
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`document:${documentId}:text`)
      .on('broadcast', { event: 'operation' }, ({ payload }) => {
        const remoteOp = payload as TextOperation;

        // Skip our own operations
        if (remoteOp.userId === userId) return;

        setState((prev) => {
          // Transform remote operation against pending operations
          let transformedOp = remoteOp;
          for (const pendingOp of prev.pendingOps) {
            transformedOp = OperationalTransform.transform(transformedOp, pendingOp);
          }

          // Apply transformed operation
          const newText = OperationalTransform.apply(prev.text, transformedOp);

          return {
            text: newText,
            version: prev.version + 1,
            pendingOps: prev.pendingOps,
          };
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId, userId]);

  const applyOperation = async (operation: Omit<TextOperation, 'userId' | 'timestamp'>) => {
    const fullOperation: TextOperation = {
      ...operation,
      userId,
      timestamp: Date.now(),
    };

    // Apply locally (optimistic update)
    setState((prev) => ({
      text: OperationalTransform.apply(prev.text, fullOperation),
      version: prev.version + 1,
      pendingOps: [...prev.pendingOps, fullOperation],
    }));

    // Broadcast to others
    const channel = supabase.channel(`document:${documentId}:text`);
    await channel.send({
      type: 'broadcast',
      event: 'operation',
      payload: fullOperation,
    });

    // Remove from pending after broadcast
    setState((prev) => ({
      ...prev,
      pendingOps: prev.pendingOps.filter((op) => op.timestamp !== fullOperation.timestamp),
    }));
  };

  const insertText = (position: number, text: string) => {
    applyOperation({ type: 'insert', position, text });
  };

  const deleteText = (position: number, length: number) => {
    applyOperation({ type: 'delete', position, length });
  };

  return {
    text: state.text,
    version: state.version,
    insertText,
    deleteText,
  };
}
```

## Optimistic Updates

### Basic Optimistic Update Pattern

```typescript
interface Task {
  id: string;
  title: string;
  completed: boolean;
  version: number;
}

export function useOptimisticTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, Task>>(new Map());

  useEffect(() => {
    // Real-time subscription
    const channel = supabase
      .channel('tasks-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Task;

          // Remove from pending if this was our update
          setPendingUpdates((prev) => {
            const next = new Map(prev);
            next.delete(updated.id);
            return next;
          });

          // Update tasks
          setTasks((prev) =>
            prev.map((task) => (task.id === updated.id ? updated : task))
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateTask = async (id: string, updates: Partial<Task>) => {
    // Find current task
    const currentTask = tasks.find((t) => t.id === id);
    if (!currentTask) return;

    // Create optimistic version
    const optimisticTask: Task = {
      ...currentTask,
      ...updates,
      version: currentTask.version + 1,
    };

    // Update UI immediately
    setTasks((prev) => prev.map((task) => (task.id === id ? optimisticTask : task)));
    setPendingUpdates((prev) => new Map(prev).set(id, optimisticTask));

    try {
      // Send to server
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .eq('version', currentTask.version); // Optimistic locking

      if (error) throw error;
    } catch (error) {
      // Revert on error
      setTasks((prev) => prev.map((task) => (task.id === id ? currentTask : task)));
      setPendingUpdates((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      throw error;
    }
  };

  const isPending = (id: string) => pendingUpdates.has(id);

  return { tasks, updateTask, isPending };
}
```

### Optimistic Updates with Rollback

```typescript
export function useOptimisticUpdates<T extends { id: string; version: number }>() {
  const [items, setItems] = useState<T[]>([]);
  const [history, setHistory] = useState<Map<string, T[]>>(new Map());

  const optimisticUpdate = async (
    id: string,
    updates: Partial<T>,
    serverUpdate: () => Promise<void>
  ) => {
    const currentItem = items.find((item) => item.id === id);
    if (!currentItem) return;

    // Save to history
    setHistory((prev) => {
      const itemHistory = prev.get(id) || [];
      return new Map(prev).set(id, [...itemHistory, currentItem]);
    });

    // Apply optimistically
    const optimisticItem = { ...currentItem, ...updates } as T;
    setItems((prev) => prev.map((item) => (item.id === id ? optimisticItem : item)));

    try {
      await serverUpdate();
      // Clear history on success
      setHistory((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      // Rollback to last known good state
      const itemHistory = history.get(id);
      if (itemHistory && itemHistory.length > 0) {
        const lastGood = itemHistory[itemHistory.length - 1];
        setItems((prev) => prev.map((item) => (item.id === id ? lastGood : item)));
      }
      throw error;
    }
  };

  const rollback = (id: string) => {
    const itemHistory = history.get(id);
    if (itemHistory && itemHistory.length > 0) {
      const lastGood = itemHistory[itemHistory.length - 1];
      setItems((prev) => prev.map((item) => (item.id === id ? lastGood : item)));
      setHistory((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return { items, optimisticUpdate, rollback };
}
```

## Undo/Redo Patterns

### Command Pattern for Undo/Redo

```typescript
interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
}

class TextInsertCommand implements Command {
  constructor(
    private text: string,
    private position: number,
    private editor: { insertAt: (pos: number, text: string) => void; deleteAt: (pos: number, length: number) => void }
  ) {}

  execute() {
    this.editor.insertAt(this.position, this.text);
  }

  undo() {
    this.editor.deleteAt(this.position, this.text.length);
  }

  redo() {
    this.execute();
  }
}

class TextDeleteCommand implements Command {
  private deletedText: string = '';

  constructor(
    private position: number,
    private length: number,
    private editor: { insertAt: (pos: number, text: string) => void; deleteAt: (pos: number, length: number) => void; getTextAt: (pos: number, length: number) => string }
  ) {}

  execute() {
    this.deletedText = this.editor.getTextAt(this.position, this.length);
    this.editor.deleteAt(this.position, this.length);
  }

  undo() {
    this.editor.insertAt(this.position, this.deletedText);
  }

  redo() {
    this.execute();
  }
}

export class UndoRedoManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxStackSize = 100;

  executeCommand(command: Command) {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = []; // Clear redo stack

    // Limit stack size
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
  }

  undo() {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
      return true;
    }
    return false;
  }

  redo() {
    const command = this.redoStack.pop();
    if (command) {
      command.redo();
      this.undoStack.push(command);
      return true;
    }
    return false;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
```

### React Hook for Undo/Redo

```typescript
export function useUndoRedo<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const updateState = (newState: T | ((prev: T) => T)) => {
    const nextState = typeof newState === 'function'
      ? (newState as (prev: T) => T)(state)
      : newState;

    // Add to history
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(nextState);

    // Limit history size
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setCurrentIndex(currentIndex + 1);
    }

    setHistory(newHistory);
    setState(nextState);
  };

  const undo = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setState(history[newIndex]);
    }
  };

  const redo = () => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setState(history[newIndex]);
    }
  };

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    state,
    setState: updateState,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
```

## Conflict Resolution Strategies

### Last Write Wins (LWW)

```typescript
interface VersionedData {
  value: string;
  timestamp: number;
  userId: string;
}

export function resolveLastWriteWins(
  local: VersionedData,
  remote: VersionedData
): VersionedData {
  if (remote.timestamp > local.timestamp) {
    return remote;
  } else if (remote.timestamp === local.timestamp) {
    // Tie-break by user ID for determinism
    return remote.userId > local.userId ? remote : local;
  }
  return local;
}
```

### Three-Way Merge

```typescript
export function threeWayMerge(
  base: string,
  local: string,
  remote: string
): string | null {
  // No conflicts if one side didn't change
  if (local === base) return remote;
  if (remote === base) return local;

  // Both made the same change
  if (local === remote) return local;

  // Actual conflict - return null to indicate manual resolution needed
  return null;
}
```

### Automatic Conflict Resolution

```typescript
export function autoResolveConflict<T extends Record<string, any>>(
  base: T,
  local: T,
  remote: T,
  strategy: 'ours' | 'theirs' | 'merge' = 'merge'
): T {
  if (strategy === 'ours') return local;
  if (strategy === 'theirs') return remote;

  // Merge strategy: prefer remote for conflicts
  const result = { ...base };

  Object.keys({ ...local, ...remote }).forEach((key) => {
    const baseValue = base[key];
    const localValue = local[key];
    const remoteValue = remote[key];

    if (localValue === remoteValue) {
      result[key] = localValue;
    } else if (localValue === baseValue) {
      result[key] = remoteValue;
    } else if (remoteValue === baseValue) {
      result[key] = localValue;
    } else {
      // Conflict: prefer remote
      result[key] = remoteValue;
    }
  });

  return result;
}
```

## Best Practices

1. **Use Version Numbers**: Track versions for optimistic locking
2. **Implement Undo/Redo**: Essential for good UX in collaborative editing
3. **Show Conflicts**: Don't silently resolve conflicts - show users
4. **Throttle Updates**: Debounce cursor movements and typing
5. **Handle Offline**: Queue operations when offline, sync when back online
6. **Test Edge Cases**: Concurrent edits at same position, rapid undo/redo
7. **Limit History**: Cap undo/redo stack size to prevent memory issues

## See Also

- [Real-Time Subscriptions](./realtime-subscriptions.md)
- [Presence Indicators](./presence-indicators.md)
- [Example: Collaborative Editor](./CollaborativeEditorExample.tsx)
