# Local Tasks Feature (No Database)

Complete task management using AsyncStorage only - no backend required.

## Overview

Perfect for:
- Prototypes and demos
- Offline-first apps
- Apps without server infrastructure
- Learning CRUD patterns

**Not suitable for:**
- Multi-device sync
- Collaboration features
- Cloud backup requirements

## Usage

### 1. Copy to Your Project

```bash
cp -r .examples/features/tasks-local src/features/
```

### 2. Wrap Your App

```tsx
// app/_layout.tsx
import { TasksProvider } from '@/features/tasks-local/TasksContext'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <TasksProvider>
        <Stack />
      </TasksProvider>
    </ThemeProvider>
  )
}
```

### 3. Use in Components

```tsx
import { useTasks } from '@/features/tasks-local/TasksContext'

function TasksScreen() {
  const { tasks, loading, createTask, toggleTask, deleteTask } = useTasks()

  if (loading) {
    return <LoadingState message="Loading tasks..." />
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon="📝"
        title="No tasks yet"
        description="Create your first task to get started"
        actionText="Create Task"
        onAction={() => navigation.navigate('CreateTask')}
      />
    )
  }

  return (
    <FlatList
      data={tasks}
      renderItem={({ item }) => (
        <TaskCard
          task={item}
          onToggle={() => toggleTask(item.id)}
          onDelete={() => deleteTask(item.id)}
        />
      )}
      keyExtractor={item => item.id}
    />
  )
}
```

## API Reference

### `TasksProvider`

Provides task state to your app.

```tsx
<TasksProvider>
  {children}
</TasksProvider>
```

### `useTasks()`

Hook to access task operations.

**Returns:**
```typescript
{
  tasks: Task[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createTask: (input: CreateTaskInput) => Promise<Task>
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task | null>
  deleteTask: (id: string) => Promise<boolean>
  toggleTask: (id: string) => Promise<Task | null>
  clearCompleted: () => Promise<number>
  stats: {
    total: number
    completed: number
    incomplete: number
    byPriority: {
      high: number
      medium: number
      low: number
    }
  }
}
```

### Task Type

```typescript
interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  createdAt: string
  updatedAt: string
}
```

### CreateTaskInput

```typescript
interface CreateTaskInput {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
}
```

### UpdateTaskInput

```typescript
interface UpdateTaskInput {
  title?: string
  description?: string
  completed?: boolean
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
}
```

## Examples

### Create Task Screen

```tsx
function CreateTaskScreen() {
  const { createTask } = useTasks()
  const navigation = useNavigation()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    try {
      setLoading(true)
      setError('')
      await createTask({
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
      })
      navigation.goBack()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Input
        label="Title"
        placeholder="Enter task title"
        value={formData.title}
        onChangeText={title => setFormData({ ...formData, title })}
        error={error}
      />

      <Input
        label="Description (optional)"
        placeholder="Add details..."
        value={formData.description}
        onChangeText={description => setFormData({ ...formData, description })}
        multiline
        numberOfLines={4}
      />

      <Text variant="h5" style={styles.label}>Priority</Text>
      <View style={styles.priorityButtons}>
        {(['low', 'medium', 'high'] as const).map(priority => (
          <Button
            key={priority}
            title={priority.charAt(0).toUpperCase() + priority.slice(1)}
            variant={formData.priority === priority ? 'primary' : 'secondary'}
            onPress={() => setFormData({ ...formData, priority })}
          />
        ))}
      </View>

      <Button
        title="Create Task"
        variant="primary"
        onPress={handleSubmit}
        loading={loading}
        disabled={!formData.title.trim()}
      />
    </ScrollView>
  )
}
```

### Task Card Component

```tsx
interface TaskCardProps {
  task: Task
  onToggle: () => void
  onDelete: () => void
  onPress?: () => void
}

function TaskCard({ task, onToggle, onDelete, onPress }: TaskCardProps) {
  const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#22c55e',
  }

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onToggle}>
          <Text style={styles.checkbox}>
            {task.completed ? '✅' : '⬜'}
          </Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text
            variant="h4"
            style={[
              styles.title,
              task.completed && styles.completedText,
            ]}
          >
            {task.title}
          </Text>

          {task.description && (
            <Text
              variant="body"
              color={task.completed ? '#999' : '#666'}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          )}

          <View style={styles.meta}>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: priorityColors[task.priority] },
              ]}
            >
              <Text variant="caption" color="#fff">
                {task.priority}
              </Text>
            </View>

            {task.dueDate && (
              <Text variant="caption" color="#666">
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Text>🗑️</Text>
        </TouchableOpacity>
      </View>
    </Card>
  )
}
```

### Task List with Stats

```tsx
function TasksScreen() {
  const { tasks, loading, stats, clearCompleted } = useTasks()
  const navigation = useNavigation()

  if (loading) {
    return <LoadingState message="Loading tasks..." />
  }

  return (
    <View style={styles.container}>
      {/* Stats Header */}
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text variant="h3">{stats.incomplete}</Text>
          <Text variant="caption">Active</Text>
        </View>
        <View style={styles.stat}>
          <Text variant="h3">{stats.completed}</Text>
          <Text variant="caption">Done</Text>
        </View>
        <View style={styles.stat}>
          <Text variant="h3">{stats.total}</Text>
          <Text variant="caption">Total</Text>
        </View>
      </View>

      {/* Clear Completed Button */}
      {stats.completed > 0 && (
        <Button
          title={`Clear ${stats.completed} completed`}
          variant="text"
          onPress={clearCompleted}
        />
      )}

      {/* Task List */}
      {tasks.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No tasks yet"
          actionText="Create Task"
          onAction={() => navigation.navigate('CreateTask')}
        />
      ) : (
        <FlatList
          data={tasks}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onToggle={() => toggleTask(item.id)}
              onDelete={() => deleteTask(item.id)}
              onPress={() => navigation.navigate('TaskDetail', { id: item.id })}
            />
          )}
          keyExtractor={item => item.id}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTask')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  )
}
```

### Filter by Priority

```tsx
function FilteredTasksScreen() {
  const { tasks } = useTasks()
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    return task.priority === filter
  })

  return (
    <View>
      <View style={styles.filters}>
        {(['all', 'high', 'medium', 'low'] as const).map(priority => (
          <Button
            key={priority}
            title={priority.charAt(0).toUpperCase() + priority.slice(1)}
            variant={filter === priority ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => setFilter(priority)}
          />
        ))}
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={({ item }) => <TaskCard task={item} />}
      />
    </View>
  )
}
```

## Data Persistence

All tasks are stored in AsyncStorage under the key `@app/tasks`.

**Format:**
```json
[
  {
    "id": "1234567890-abc123",
    "title": "Complete project",
    "description": "Finish the mobile app",
    "completed": false,
    "priority": "high",
    "dueDate": "2026-02-15T00:00:00.000Z",
    "createdAt": "2026-02-06T10:00:00.000Z",
    "updatedAt": "2026-02-06T10:00:00.000Z"
  }
]
```

## Upgrading to Database

When ready for multi-device sync:

### 1. Install Supabase

```bash
npm install @supabase/supabase-js
```

### 2. Replace with Database Version

```bash
cp .examples/features/tasks-supabase/TasksContext.tsx src/contexts/
```

### 3. Create Database Schema

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tasks
CREATE POLICY "Users can manage their own tasks"
  ON tasks FOR ALL
  USING (auth.uid() = user_id);
```

### 4. Migrate Data (Optional)

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '@/services/supabase'

async function migrateTasksToSupabase() {
  // 1. Load local tasks
  const localData = await AsyncStorage.getItem('@app/tasks')
  if (!localData) return

  const localTasks = JSON.parse(localData)

  // 2. Insert into Supabase
  for (const task of localTasks) {
    await supabase.from('tasks').insert({
      title: task.title,
      description: task.description,
      completed: task.completed,
      priority: task.priority,
      due_date: task.dueDate,
    })
  }

  // 3. Clear local storage
  await AsyncStorage.removeItem('@app/tasks')
  console.log(`Migrated ${localTasks.length} tasks`)
}
```

### 5. No UI changes needed - Same API!

The `useTasks()` hook remains identical.

## Testing

```tsx
import { renderHook, act } from '@testing-library/react-hooks'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { TasksProvider, useTasks } from './TasksContext'

beforeEach(() => {
  AsyncStorage.clear()
})

test('creates a task', async () => {
  const wrapper = ({ children }) => <TasksProvider>{children}</TasksProvider>
  const { result, waitForNextUpdate } = renderHook(() => useTasks(), { wrapper })

  await waitForNextUpdate() // Wait for initial load

  await act(async () => {
    await result.current.createTask({
      title: 'Test task',
      priority: 'high',
    })
  })

  expect(result.current.tasks).toHaveLength(1)
  expect(result.current.tasks[0].title).toBe('Test task')
  expect(result.current.tasks[0].priority).toBe('high')
})

test('toggles task completion', async () => {
  const wrapper = ({ children }) => <TasksProvider>{children}</TasksProvider>
  const { result, waitForNextUpdate } = renderHook(() => useTasks(), { wrapper })

  await waitForNextUpdate()

  let taskId: string

  await act(async () => {
    const task = await result.current.createTask({ title: 'Test' })
    taskId = task.id
  })

  expect(result.current.tasks[0].completed).toBe(false)

  await act(async () => {
    await result.current.toggleTask(taskId)
  })

  expect(result.current.tasks[0].completed).toBe(true)
})
```

## Related

- **Supabase Tasks:** [.examples/features/tasks-supabase/](../tasks-supabase/) (coming soon)
- **Auth:** [.examples/features/auth-local/](../auth-local/)
- **Components:** [.examples/components/advanced/](../../components/advanced/)
- **Patterns:** [docs/patterns/NEW-FEATURE.md](../../../docs/patterns/NEW-FEATURE.md)
