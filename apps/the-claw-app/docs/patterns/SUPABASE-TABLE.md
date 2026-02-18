# Supabase Table Pattern

## Overview

This pattern guides creating new database tables with proper types, RLS policies, and service functions.

## Quick Start

### 1. Create Migration

```bash
supabase migration new create_tasks_table
```

### 2. Write Migration

```sql
-- supabase/migrations/20240115000000_create_tasks_table.sql

-- Create enum for status
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'archived');

-- Create table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### 3. Apply Migration

```bash
supabase db reset  # Local
# or
supabase db push   # Remote
```

### 4. Generate Types

```bash
supabase gen types typescript --local > src/types/database.ts
```

## TypeScript Types

```typescript
// src/types/task.ts
import type { Database } from './database';

// Database row type
export type TaskRow = Database['public']['Tables']['tasks']['Row'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

// App-level type (with transformations)
export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'archived';
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Form data type
export interface TaskFormData {
  title: string;
  description: string;
  dueDate: Date | null;
}

// Transform database row to app type
export function transformTask(row: TaskRow): Task {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    status: row.status,
    dueDate: row.due_date ? new Date(row.due_date) : null,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
```

## Service Layer

```typescript
// src/services/taskService.ts
import { supabase } from '@/lib/supabase';
import { transformTask } from '@/types/task';
import type { Task, TaskFormData } from '@/types/task';

export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data.map(transformTask);
}

export async function getTask(id: string): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return transformTask(data);
}

export async function createTask(formData: TaskFormData): Promise<Task> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title: formData.title,
      description: formData.description || null,
      due_date: formData.dueDate?.toISOString() || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return transformTask(data);
}

export async function updateTask(
  id: string,
  updates: Partial<TaskFormData>
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.dueDate !== undefined && {
        due_date: updates.dueDate?.toISOString() || null,
      }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return transformTask(data);
}

export async function completeTask(id: string): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return transformTask(data);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}
```

## React Hook

```typescript
// src/hooks/useTasks.ts
import { useState, useEffect, useCallback } from 'react';
import { getTasks, createTask, deleteTask } from '@/services/taskService';
import type { Task, TaskFormData } from '@/types/task';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tasks'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (formData: TaskFormData) => {
    const newTask = await createTask(formData);
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const removeTask = async (id: string) => {
    await deleteTask(id);
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  return {
    tasks,
    isLoading,
    error,
    refetch: fetchTasks,
    addTask,
    removeTask,
  };
}
```

## Real-Time Updates

```typescript
// src/hooks/useTasks.ts (with real-time)
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useTasks() {
  // ... existing state

  useEffect(() => {
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [transformTask(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((task) =>
                task.id === payload.new.id ? transformTask(payload.new) : task
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) =>
              prev.filter((task) => task.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ... rest of hook
}
```

## Testing

```typescript
// src/services/__tests__/taskService.test.ts
import { createTask, getTasks, deleteTask } from '../taskService';

describe('taskService', () => {
  it('creates a task', async () => {
    const task = await createTask({
      title: 'Test Task',
      description: 'Test description',
      dueDate: null,
    });

    expect(task.id).toBeDefined();
    expect(task.title).toBe('Test Task');
  });

  it('fetches tasks for current user', async () => {
    const tasks = await getTasks();
    expect(Array.isArray(tasks)).toBe(true);
  });

  it('deletes a task', async () => {
    const task = await createTask({ title: 'To Delete', description: '', dueDate: null });
    await deleteTask(task.id);

    const tasks = await getTasks();
    expect(tasks.find((t) => t.id === task.id)).toBeUndefined();
  });
});
```

## Checklist

- [ ] Migration created and applied
- [ ] RLS policies for all operations
- [ ] Indexes on frequently queried columns
- [ ] Updated_at trigger
- [ ] TypeScript types generated
- [ ] Transform function for date handling
- [ ] Service layer with CRUD operations
- [ ] React hook with loading/error states
- [ ] Real-time updates (if needed)
- [ ] Tests for service functions
