# Tutorial 2: Building Your First Feature

In this tutorial, you'll build a complete feature from scratch: a Task List. You'll learn core React Native concepts, state management, and Supabase integration while following blueprint best practices.

## Table of Contents

1. [What You'll Build](#what-youll-build)
2. [Feature Planning](#feature-planning)
3. [Database Schema](#database-schema)
4. [Service Layer](#service-layer)
5. [UI Components](#ui-components)
6. [Screen Implementation](#screen-implementation)
7. [State Management](#state-management)
8. [Testing](#testing)
9. [Refinements](#refinements)
10. [Next Steps](#next-steps)

---

## What You'll Build

You'll create a complete task management feature with:

- **Task List View** - Display all tasks
- **Add Task** - Create new tasks
- **Edit Task** - Update existing tasks
- **Delete Task** - Remove tasks
- **Mark Complete** - Toggle task completion
- **Real-time Updates** - See changes instantly

**Final Result:**
```
┌─────────────────────────┐
│   My Tasks              │
├─────────────────────────┤
│ ☑ Buy groceries        │
│ ☐ Finish tutorial      │
│ ☐ Deploy app           │
├─────────────────────────┤
│ [+ Add Task]            │
└─────────────────────────┘
```

### Learning Objectives

By the end of this tutorial, you'll understand:
- How to structure a feature in the blueprint
- Database schema design and RLS policies
- Service layer pattern for API calls
- Component composition and reusability
- State management with React hooks
- Real-time subscriptions with Supabase
- Testing strategies

---

## Feature Planning

Before writing code, plan your feature following `docs/patterns/NEW-FEATURE.md`.

### 1. Define Requirements

**User Stories:**
- As a user, I want to create tasks so I can track what I need to do
- As a user, I want to mark tasks as complete so I know what's done
- As a user, I want to edit tasks so I can update details
- As a user, I want to delete tasks so I can remove items I no longer need

**Functional Requirements:**
- Users can only see their own tasks
- Tasks have a title (required) and description (optional)
- Tasks can be marked complete/incomplete
- Tasks are sorted by creation date (newest first)
- Real-time updates when tasks change

**Non-Functional Requirements:**
- Fast (<1s) task creation
- Optimistic UI updates
- Offline support (future enhancement)
- Accessible UI

### 2. Design Data Model

**Task Entity:**
```typescript
interface Task {
  id: string              // UUID primary key
  user_id: string         // Foreign key to auth.users
  title: string           // Required, max 255 chars
  description: string?    // Optional, max 1000 chars
  completed: boolean      // Default false
  created_at: timestamp   // Auto-generated
  updated_at: timestamp   // Auto-updated
}
```

### 3. Identify Components

**Component Hierarchy:**
```
TasksScreen
├── TaskList
│   └── TaskCard (repeated)
│       ├── Checkbox
│       ├── Text
│       └── IconButton (edit, delete)
└── AddTaskButton
    └── TaskForm (modal)
        ├── TextInput (title)
        ├── TextInput (description)
        └── Button (save)
```

### 4. Plan File Structure

```
src/
├── components/
│   ├── Checkbox.tsx           # Reusable checkbox
│   ├── TaskCard.tsx           # Single task item
│   └── TaskForm.tsx           # Add/edit form
├── hooks/
│   └── useTasks.ts            # Task operations hook
├── screens/
│   └── tasks-screen.tsx       # Main tasks screen
├── services/
│   └── taskService.ts         # Task API calls
└── types/
    └── index.ts               # Task type definition
```

---

## Database Schema

### Step 1: Create Migration

First, read the Supabase table pattern guide:

```bash
cat docs/patterns/SUPABASE-TABLE.md
```

Create a new migration:

```bash
# Create migration file
npx supabase migration new create_tasks_table

# This creates: supabase/migrations/20240207000000_create_tasks_table.sql
```

### Step 2: Define Schema

Open the migration file and add:

```sql
-- supabase/migrations/20240207000000_create_tasks_table.sql

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 255),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 1000),
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own tasks
CREATE POLICY "Users can view own tasks"
  ON public.tasks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tasks
CREATE POLICY "Users can insert own tasks"
  ON public.tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tasks
CREATE POLICY "Users can update own tasks"
  ON public.tasks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tasks
CREATE POLICY "Users can delete own tasks"
  ON public.tasks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
```

### Step 3: Apply Migration

```bash
# Push to Supabase
npx supabase db push

# Generate TypeScript types
npx supabase gen types typescript --linked > src/types/supabase.ts
```

**Expected output:**
```
✅ Migration applied successfully
✅ Types generated
```

### Step 4: Verify in Supabase Dashboard

1. Go to Supabase Dashboard → Table Editor
2. You should see the `tasks` table
3. Click on a table → Policies tab
4. Verify 4 policies are listed

### Understanding RLS Policies

**Why RLS is important:**
- Prevents users from seeing other users' tasks
- Enforces security at database level
- Can't be bypassed from client code
- Protects against SQL injection

**Policy explanation:**
```sql
-- This policy:
CREATE POLICY "Users can view own tasks"
  ON public.tasks           -- Applies to tasks table
  FOR SELECT                -- For SELECT queries
  USING (auth.uid() = user_id);  -- Only if logged-in user matches task owner
```

When a user runs `SELECT * FROM tasks`, Supabase automatically adds:
```sql
-- Becomes:
SELECT * FROM tasks WHERE user_id = '(current user's id)'
```

---

## Service Layer

Following the blueprint pattern, keep business logic separate from UI.

### Step 1: Create Task Service

Create `src/services/taskService.ts`:

```typescript
import { supabase } from './supabase'
import type { Task } from '@/types'

/**
 * Task Service
 *
 * Handles all task-related database operations.
 * Uses Supabase client for real-time database access.
 *
 * Security: RLS policies enforce user isolation
 */

export const taskService = {
  /**
   * Get all tasks for the current user
   * @returns Promise<Task[]>
   */
  async getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`)
    }

    return data as Task[]
  },

  /**
   * Get a single task by ID
   * @param id - Task UUID
   * @returns Promise<Task>
   */
  async getTask(id: string): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to fetch task: ${error.message}`)
    }

    return data as Task
  },

  /**
   * Create a new task
   * @param task - Task data (without id, timestamps)
   * @returns Promise<Task>
   */
  async createTask(task: {
    title: string
    description?: string
  }): Promise<Task> {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: task.title,
        description: task.description,
        completed: false,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`)
    }

    return data as Task
  },

  /**
   * Update an existing task
   * @param id - Task UUID
   * @param updates - Partial task data
   * @returns Promise<Task>
   */
  async updateTask(
    id: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'completed'>>
  ): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`)
    }

    return data as Task
  },

  /**
   * Toggle task completion status
   * @param id - Task UUID
   * @param completed - New completion status
   * @returns Promise<Task>
   */
  async toggleTask(id: string, completed: boolean): Promise<Task> {
    return this.updateTask(id, { completed })
  },

  /**
   * Delete a task
   * @param id - Task UUID
   * @returns Promise<void>
   */
  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`)
    }
  },

  /**
   * Subscribe to task changes (real-time)
   * @param callback - Function to call when tasks change
   * @returns Unsubscribe function
   */
  subscribeToTasks(callback: (payload: any) => void) {
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'tasks',
        },
        callback
      )
      .subscribe()

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel)
    }
  },
}
```

### Step 2: Define Task Type

Update `src/types/index.ts`:

```typescript
/**
 * Task entity
 * Represents a user's task/todo item
 */
export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  completed: boolean
  created_at: string
  updated_at: string
}

/**
 * Task creation input
 * Used when creating a new task (omits generated fields)
 */
export type TaskInput = Pick<Task, 'title' | 'description'>

/**
 * Task update input
 * Used when updating a task (all fields optional)
 */
export type TaskUpdate = Partial<Pick<Task, 'title' | 'description' | 'completed'>>
```

---

## UI Components

### Step 1: Create Checkbox Component

Create `src/components/Checkbox.tsx`:

```typescript
import { TouchableOpacity, View, Text } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'

interface CheckboxProps {
  checked: boolean
  onToggle: () => void
  label?: string
  disabled?: boolean
}

export function Checkbox({ checked, onToggle, label, disabled = false }: CheckboxProps) {
  const { theme } = useTheme()

  return (
    <TouchableOpacity
      onPress={onToggle}
      disabled={disabled}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        opacity: disabled ? 0.5 : 1,
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: theme.borderRadius.sm,
          borderWidth: 2,
          borderColor: checked ? theme.colors.primary[500] : theme.colors.neutral[300],
          backgroundColor: checked ? theme.colors.primary[500] : 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {checked && (
          <Text style={{ color: theme.colors.white, fontSize: 16, fontWeight: 'bold' }}>
            ✓
          </Text>
        )}
      </View>
      {label && (
        <Text
          style={{
            marginLeft: theme.spacing[2],
            fontSize: 16,
            color: theme.colors.text.primary,
            textDecorationLine: checked ? 'line-through' : 'none',
            opacity: checked ? 0.6 : 1,
          }}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  )
}
```

### Step 2: Create TaskCard Component

Create `src/components/TaskCard.tsx`:

```typescript
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Checkbox } from './Checkbox'
import { useTheme } from '@/contexts/ThemeContext'
import type { Task } from '@/types'

interface TaskCardProps {
  task: Task
  onToggle: (id: string, completed: boolean) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

export function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  const { theme } = useTheme()

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing[4],
        marginBottom: theme.spacing[2],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Checkbox
          checked={task.completed}
          onToggle={() => onToggle(task.id, !task.completed)}
        />

        <View style={{ flex: 1, marginLeft: theme.spacing[3] }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.colors.text.primary,
              textDecorationLine: task.completed ? 'line-through' : 'none',
              opacity: task.completed ? 0.6 : 1,
            }}
          >
            {task.title}
          </Text>

          {task.description && (
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.text.secondary,
                marginTop: theme.spacing[1],
                textDecorationLine: task.completed ? 'line-through' : 'none',
                opacity: task.completed ? 0.6 : 1,
              }}
            >
              {task.description}
            </Text>
          )}

          <Text
            style={{
              fontSize: 12,
              color: theme.colors.text.tertiary,
              marginTop: theme.spacing[1],
            }}
          >
            {new Date(task.created_at).toLocaleDateString()}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', marginLeft: theme.spacing[2] }}>
          <TouchableOpacity
            onPress={() => onEdit(task)}
            style={{
              padding: theme.spacing[2],
            }}
            accessibilityRole="button"
            accessibilityLabel="Edit task"
          >
            <Text style={{ fontSize: 20 }}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onDelete(task.id)}
            style={{
              padding: theme.spacing[2],
            }}
            accessibilityRole="button"
            accessibilityLabel="Delete task"
          >
            <Text style={{ fontSize: 20 }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
```

### Step 3: Create TaskForm Component

Create `src/components/TaskForm.tsx`:

```typescript
import { useState } from 'react'
import { View, TextInput, TouchableOpacity, Text, Modal, KeyboardAvoidingView, Platform } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import type { Task } from '@/types'

interface TaskFormProps {
  visible: boolean
  task?: Task | null
  onSave: (title: string, description: string) => void
  onCancel: () => void
}

export function TaskForm({ visible, task, onSave, onCancel }: TaskFormProps) {
  const { theme } = useTheme()
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')

  const handleSave = () => {
    if (title.trim()) {
      onSave(title.trim(), description.trim())
      setTitle('')
      setDescription('')
    }
  }

  const handleCancel = () => {
    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
    onCancel()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.borderRadius.xl,
            borderTopRightRadius: theme.borderRadius.xl,
            padding: theme.spacing[6],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[4],
            }}
          >
            {task ? 'Edit Task' : 'New Task'}
          </Text>

          <TextInput
            placeholder="Task title"
            value={title}
            onChangeText={setTitle}
            style={{
              backgroundColor: theme.colors.background,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing[3],
              fontSize: 16,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[3],
            }}
            placeholderTextColor={theme.colors.text.tertiary}
            maxLength={255}
            autoFocus
          />

          <TextInput
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: theme.colors.background,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing[3],
              fontSize: 16,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[4],
              textAlignVertical: 'top',
            }}
            placeholderTextColor={theme.colors.text.tertiary}
            maxLength={1000}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity
              onPress={handleCancel}
              style={{
                padding: theme.spacing[3],
                paddingHorizontal: theme.spacing[6],
                marginRight: theme.spacing[2],
              }}
            >
              <Text style={{ color: theme.colors.text.secondary, fontSize: 16 }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={!title.trim()}
              style={{
                backgroundColor: title.trim() ? theme.colors.primary[500] : theme.colors.neutral[300],
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing[3],
                paddingHorizontal: theme.spacing[6],
              }}
            >
              <Text style={{ color: theme.colors.white, fontSize: 16, fontWeight: '600' }}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
```

---

## Screen Implementation

### Create Tasks Screen

Create `src/screens/tasks-screen.tsx`:

```typescript
import { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { TaskCard } from '@/components/TaskCard'
import { TaskForm } from '@/components/TaskForm'
import { useTheme } from '@/contexts/ThemeContext'
import { taskService } from '@/services/taskService'
import type { Task } from '@/types'

export function TasksScreen() {
  const { theme } = useTheme()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [formVisible, setFormVisible] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Load tasks on mount
  useEffect(() => {
    loadTasks()
  }, [])

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = taskService.subscribeToTasks(() => {
      loadTasks() // Reload tasks when changes occur
    })

    return unsubscribe
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const data = await taskService.getTasks()
      setTasks(data)
    } catch (error) {
      Alert.alert('Error', 'Failed to load tasks')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id: string, completed: boolean) => {
    // Optimistic update
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, completed } : task
      )
    )

    try {
      await taskService.toggleTask(id, completed)
    } catch (error) {
      // Revert on error
      loadTasks()
      Alert.alert('Error', 'Failed to update task')
    }
  }

  const handleSave = async (title: string, description: string) => {
    try {
      if (editingTask) {
        await taskService.updateTask(editingTask.id, { title, description })
      } else {
        await taskService.createTask({ title, description })
      }
      setFormVisible(false)
      setEditingTask(null)
      loadTasks()
    } catch (error) {
      Alert.alert('Error', 'Failed to save task')
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setFormVisible(true)
  }

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await taskService.deleteTask(id)
              loadTasks()
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task')
            }
          },
        },
      ]
    )
  }

  const handleAdd = () => {
    setEditingTask(null)
    setFormVisible(true)
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          padding: theme.spacing[4],
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.neutral[200],
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: theme.colors.text.primary,
          }}
        >
          My Tasks
        </Text>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={{ padding: theme.spacing[4] }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: theme.spacing[8] }}>
            <Text style={{ fontSize: 48, marginBottom: theme.spacing[2] }}>📝</Text>
            <Text style={{ fontSize: 18, color: theme.colors.text.secondary }}>
              No tasks yet
            </Text>
            <Text style={{ fontSize: 14, color: theme.colors.text.tertiary, marginTop: theme.spacing[1] }}>
              Tap the + button to create your first task
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        onPress={handleAdd}
        style={{
          position: 'absolute',
          bottom: theme.spacing[6],
          right: theme.spacing[6],
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.colors.primary[500],
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
        accessibilityRole="button"
        accessibilityLabel="Add task"
      >
        <Text style={{ fontSize: 28, color: theme.colors.white }}>+</Text>
      </TouchableOpacity>

      <TaskForm
        visible={formVisible}
        task={editingTask}
        onSave={handleSave}
        onCancel={() => {
          setFormVisible(false)
          setEditingTask(null)
        }}
      />
    </View>
  )
}
```

---

## State Management

### Understanding State in This Feature

We used several state management patterns:

1. **Local State (useState)**
   ```typescript
   const [tasks, setTasks] = useState<Task[]>([])
   const [loading, setLoading] = useState(true)
   ```
   - Good for component-specific state
   - Simple and performant

2. **Side Effects (useEffect)**
   ```typescript
   useEffect(() => {
     loadTasks()
   }, [])
   ```
   - Load data on mount
   - Subscribe to real-time updates
   - Clean up subscriptions

3. **Optimistic Updates**
   ```typescript
   // Update UI immediately
   setTasks(prev => prev.map(...))

   // Then sync with server
   await taskService.toggleTask(id, completed)
   ```
   - Instant feedback for users
   - Revert if server fails

### When to Use Context

For this simple feature, local state is sufficient. Use Context when:
- State needs to be shared across many components
- State changes affect unrelated parts of the app
- You want to avoid prop drilling

Example: If tasks need to be accessed from multiple screens, create `TaskContext`.

---

## Testing

### Unit Tests for Service

Create `src/services/taskService.test.ts`:

```typescript
import { taskService } from './taskService'
import { supabase } from './supabase'

jest.mock('./supabase')

describe('taskService', () => {
  describe('getTasks', () => {
    it('fetches tasks successfully', async () => {
      const mockTasks = [
        { id: '1', title: 'Test Task', completed: false },
      ]

      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockTasks,
            error: null,
          }),
        }),
      })

      const tasks = await taskService.getTasks()
      expect(tasks).toEqual(mockTasks)
    })

    it('throws error on failure', async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      })

      await expect(taskService.getTasks()).rejects.toThrow('Failed to fetch tasks')
    })
  })
})
```

### Component Tests

Create `src/components/TaskCard.test.tsx`:

```typescript
import { render, fireEvent } from '@testing-library/react-native'
import { TaskCard } from './TaskCard'

const mockTask = {
  id: '1',
  user_id: 'user-1',
  title: 'Test Task',
  description: 'Test Description',
  completed: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('TaskCard', () => {
  it('renders task correctly', () => {
    const { getByText } = render(
      <TaskCard
        task={mockTask}
        onToggle={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    )

    expect(getByText('Test Task')).toBeTruthy()
    expect(getByText('Test Description')).toBeTruthy()
  })

  it('calls onToggle when checkbox pressed', () => {
    const onToggle = jest.fn()
    const { getByA11yRole } = render(
      <TaskCard
        task={mockTask}
        onToggle={onToggle}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    )

    fireEvent.press(getByA11yRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('1', true)
  })
})
```

### Run Tests

```bash
npm test
```

---

## Refinements

### Add Loading States

Improve UX with loading indicators:

```typescript
const [deletingId, setDeletingId] = useState<string | null>(null)

const handleDelete = async (id: string) => {
  setDeletingId(id)
  try {
    await taskService.deleteTask(id)
  } finally {
    setDeletingId(null)
  }
}

// In TaskCard, show spinner when deleting
{deletingId === task.id && <ActivityIndicator />}
```

### Add Error Handling

Show specific error messages:

```typescript
const handleSave = async (title: string, description: string) => {
  try {
    await taskService.createTask({ title, description })
  } catch (error) {
    if (error.message.includes('unique')) {
      Alert.alert('Error', 'A task with this title already exists')
    } else if (error.message.includes('length')) {
      Alert.alert('Error', 'Title is too long')
    } else {
      Alert.alert('Error', 'Failed to save task')
    }
  }
}
```

### Add Animations

Use `react-native-reanimated` for smooth animations:

```typescript
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

// Animated task card
<Animated.View entering={FadeIn} exiting={FadeOut}>
  <TaskCard task={task} ... />
</Animated.View>
```

### Add Filtering

Let users filter completed tasks:

```typescript
const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

const filteredTasks = tasks.filter(task => {
  if (filter === 'active') return !task.completed
  if (filter === 'completed') return task.completed
  return true
})
```

---

## Next Steps

Congratulations! You've built a complete feature following blueprint best practices.

### What You Learned

- Database schema design with RLS
- Service layer pattern
- Component composition
- State management
- Real-time subscriptions
- Testing strategies

### Improve Your Feature

Try these enhancements:

1. **Add due dates** - Let users set deadlines
2. **Add categories/tags** - Organize tasks
3. **Add search** - Find tasks quickly
4. **Add sorting** - Sort by date, title, or completion
5. **Add offline support** - Work without internet
6. **Add task sharing** - Collaborate with others

### Continue Learning

Move on to the next tutorials:

1. **[Tutorial 3: Adding Authentication →](./03-adding-authentication.md)**
   - User signup/login
   - Session management
   - Protected routes

2. **[Tutorial 4: Database Integration](./04-database-integration.md)**
   - Advanced queries
   - Relationships
   - Transactions

3. **[Tutorial 5: Deployment](./05-deployment.md)**
   - Build for production
   - Submit to stores
   - CI/CD setup

---

## Summary

### Key Concepts

**Service Layer Pattern:**
- Separates business logic from UI
- Makes testing easier
- Enables code reuse

**Optimistic Updates:**
- Update UI immediately
- Sync with server in background
- Revert on errors

**Real-time Subscriptions:**
- Subscribe to database changes
- Update UI automatically
- Unsubscribe on cleanup

### File Checklist

You created:
- ✅ Database migration (`supabase/migrations/...`)
- ✅ Service layer (`src/services/taskService.ts`)
- ✅ Type definitions (`src/types/index.ts`)
- ✅ UI components (`src/components/Checkbox.tsx`, `TaskCard.tsx`, `TaskForm.tsx`)
- ✅ Screen (`src/screens/tasks-screen.tsx`)
- ✅ Tests (`*.test.ts`, `*.test.tsx`)

### Best Practices Applied

- ✅ RLS enabled on all tables
- ✅ Named exports only
- ✅ Type-safe TypeScript
- ✅ Theme tokens (no hardcoded styles)
- ✅ Accessibility labels
- ✅ Error handling
- ✅ Loading states
- ✅ Components <200 lines (target 150)

**Ready for more? Continue to [Tutorial 3: Adding Authentication →](./03-adding-authentication.md)**
