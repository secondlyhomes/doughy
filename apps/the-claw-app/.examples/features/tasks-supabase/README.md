# Supabase Tasks Feature

Complete task management using Supabase with real-time updates, optimistic UI, and comprehensive error handling.

## Overview

**Features:**
- Full CRUD operations with TypeScript types
- Real-time subscriptions (live updates across devices)
- Optimistic updates (instant UI feedback)
- Automatic retry logic with exponential backoff
- Row Level Security (RLS) for data isolation
- Task statistics and analytics
- Error handling and loading states

**Perfect for:**
- Multi-device sync
- Collaboration features
- Cloud backup
- Production apps with authentication

## Usage

### 1. Database Setup

First, create the tasks table in Supabase. See [Database Setup](#database-setup) section below.

### 2. Copy to Your Project

```bash
cp -r .examples/features/tasks-supabase src/features/
```

### 3. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 4. Setup Supabase Client

Copy the Supabase client configuration:

```bash
cp .examples/database/supabase-client.ts src/services/supabase.ts
```

Add environment variables to `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Wrap Your App

```tsx
// app/_layout.tsx
import { TasksProvider } from '@/features/tasks-supabase/TasksContext'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TasksProvider enableRealtime={true}>
          <Stack />
        </TasksProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
```

### 6. Use in Components

```tsx
import { useTasks } from '@/features/tasks-supabase/TasksContext'

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

Provides task state to your app with real-time sync.

**Props:**
- `enableRealtime` (boolean, default: true) - Enable real-time subscriptions
- `enableRetry` (boolean, default: true) - Retry failed requests automatically
- `maxRetries` (number, default: 3) - Maximum retry attempts

```tsx
<TasksProvider
  enableRealtime={true}
  enableRetry={true}
  maxRetries={3}
>
  {children}
</TasksProvider>
```

### `useTasks()`

Hook to access task operations.

**Returns:**
```typescript
{
  tasks: Task[]                                      // All tasks
  loading: boolean                                   // Initial load state
  error: string | null                               // Error message
  refresh: () => Promise<void>                       // Refresh from DB
  createTask: (input: CreateTaskInput) => Promise<Task>
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task>
  deleteTask: (id: string) => Promise<boolean>
  toggleTask: (id: string) => Promise<Task>
  clearCompleted: () => Promise<number>              // Returns count
  stats: TaskStats                                   // Task statistics
}
```

### Types

#### Task

```typescript
interface Task {
  id: string                                         // UUID
  userId: string                                     // Owner UUID
  title: string
  description?: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  dueDate?: string                                   // ISO string
  createdAt: string                                  // ISO string
  updatedAt: string                                  // ISO string
}
```

#### CreateTaskInput

```typescript
interface CreateTaskInput {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'               // Default: 'medium'
  dueDate?: string                                   // ISO string
}
```

#### UpdateTaskInput

```typescript
interface UpdateTaskInput {
  title?: string
  description?: string
  completed?: boolean
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string                                   // ISO string
}
```

#### TaskStats

```typescript
interface TaskStats {
  total: number
  completed: number
  incomplete: number
  byPriority: {
    high: number
    medium: number
    low: number
  }
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
  const { tasks, loading, stats, clearCompleted, error } = useTasks()
  const navigation = useNavigation()

  if (loading) {
    return <LoadingState message="Loading tasks..." />
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load tasks"
        message={error}
        actionText="Retry"
        onAction={() => refresh()}
      />
    )
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

### Filter and Sort Tasks

```tsx
function FilteredTasksScreen() {
  const { tasks } = useTasks()
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [sortBy, setSortBy] = useState<'created' | 'priority' | 'dueDate'>('created')

  const filteredAndSortedTasks = useMemo(() => {
    // Filter
    let filtered = tasks
    if (filter === 'active') {
      filtered = tasks.filter(t => !t.completed)
    } else if (filter === 'completed') {
      filtered = tasks.filter(t => t.completed)
    }

    // Sort
    const sorted = [...filtered]
    if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    } else if (sortBy === 'dueDate') {
      sorted.sort((a, b) => {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
    }

    return sorted
  }, [tasks, filter, sortBy])

  return (
    <View>
      {/* Filters */}
      <View style={styles.filters}>
        {(['all', 'active', 'completed'] as const).map(f => (
          <Button
            key={f}
            title={f.charAt(0).toUpperCase() + f.slice(1)}
            variant={filter === f ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => setFilter(f)}
          />
        ))}
      </View>

      {/* Sort */}
      <View style={styles.sort}>
        <Text variant="caption">Sort by:</Text>
        <Picker
          selectedValue={sortBy}
          onValueChange={setSortBy}
        >
          <Picker.Item label="Created" value="created" />
          <Picker.Item label="Priority" value="priority" />
          <Picker.Item label="Due Date" value="dueDate" />
        </Picker>
      </View>

      <FlatList
        data={filteredAndSortedTasks}
        renderItem={({ item }) => <TaskCard task={item} />}
      />
    </View>
  )
}
```

## Real-Time Subscriptions

The provider automatically subscribes to real-time changes when `enableRealtime={true}` (default).

**What happens:**
1. User A creates a task on Device 1
2. Database updates
3. Device 2 receives real-time event
4. Device 2 UI updates automatically

**No manual refresh needed!**

### Manual Real-Time Control

```tsx
// Disable real-time for specific screens
<TasksProvider enableRealtime={false}>
  <OfflineScreen />
</TasksProvider>

// Or manually refresh when needed
function ManualRefreshScreen() {
  const { refresh } = useTasks()

  return (
    <Button
      title="Refresh"
      onPress={refresh}
    />
  )
}
```

## Optimistic Updates

All mutations use optimistic updates for instant UI feedback:

1. **Create Task**: Temporary task appears immediately
2. **Update Task**: Changes visible instantly
3. **Delete Task**: Task disappears immediately
4. **On Error**: Automatic rollback to previous state

```tsx
async function handleCreate() {
  try {
    // Task appears in UI instantly (optimistic)
    await createTask({ title: 'New task' })
    // Background: saved to database
  } catch (err) {
    // On error: task removed from UI automatically
    console.error('Failed to create:', err)
  }
}
```

## Error Handling & Retry

### Automatic Retry

Failed requests retry automatically with exponential backoff:

- 1st retry: after 1 second
- 2nd retry: after 2 seconds
- 3rd retry: after 4 seconds
- Max: 10 seconds between retries

```tsx
<TasksProvider
  enableRetry={true}
  maxRetries={3}
>
  {children}
</TasksProvider>
```

### Manual Error Handling

```tsx
function TasksScreen() {
  const { error, refresh } = useTasks()

  if (error) {
    return (
      <ErrorState
        title="Something went wrong"
        message={error}
        actionText="Try Again"
        onAction={refresh}
      />
    )
  }

  // ... render tasks
}
```

### Error Boundaries

```tsx
import { ErrorBoundary } from 'react-error-boundary'

function App() {
  return (
    <ErrorBoundary
      fallback={<ErrorScreen />}
      onError={(error) => {
        console.error('Tasks error:', error)
        // Log to error tracking service
      }}
    >
      <TasksProvider>
        <TasksScreen />
      </TasksProvider>
    </ErrorBoundary>
  )
}
```

## Database Setup

### 1. Create Migration

```bash
supabase migration new create_tasks_table
```

### 2. Migration SQL

See [.examples/database/migrations/001_initial_schema.sql](./../../../database/migrations/001_initial_schema.sql) for the complete migration.

**Key schema:**

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX tasks_user_id_idx ON tasks(user_id);
CREATE INDEX tasks_completed_idx ON tasks(completed);
CREATE INDEX tasks_due_date_idx ON tasks(due_date);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
```

### 3. Apply Migration

```bash
# Local development
supabase db reset

# Remote (production)
supabase db push
```

### 4. Generate TypeScript Types

```bash
supabase gen types typescript --local > src/types/database.ts
```

## Row Level Security (RLS)

**Critical: RLS must ALWAYS be enabled for security.**

### Basic RLS Policies

Users can only access their own tasks:

```sql
-- View own tasks
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- Create own tasks
CREATE POLICY "Users can create their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update own tasks
CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- Delete own tasks
CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
```

### Test RLS Policies

```sql
-- Test as specific user (Supabase SQL Editor)
-- 1. Click "Run as user" dropdown
-- 2. Select user email
-- 3. Run query - should only see their tasks

SELECT * FROM tasks;
```

See [.examples/database/rls-examples.sql](./../../../database/rls-examples.sql) for more RLS patterns.

## Migration from Local Storage

### 1. Export Local Data

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '@/services/supabase'

async function migrateTasksToSupabase() {
  // 1. Load local tasks
  const localData = await AsyncStorage.getItem('@app/tasks')
  if (!localData) {
    console.log('No local tasks to migrate')
    return
  }

  const localTasks = JSON.parse(localData)
  console.log(`Migrating ${localTasks.length} tasks...`)

  // 2. Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // 3. Insert into Supabase
  const tasksToInsert = localTasks.map(task => ({
    user_id: user.id,
    title: task.title,
    description: task.description || null,
    completed: task.completed,
    priority: task.priority,
    due_date: task.dueDate || null,
  }))

  const { data, error } = await supabase
    .from('tasks')
    .insert(tasksToInsert)

  if (error) {
    throw new Error(`Migration failed: ${error.message}`)
  }

  // 4. Clear local storage
  await AsyncStorage.removeItem('@app/tasks')
  console.log(`Migrated ${localTasks.length} tasks successfully!`)

  return localTasks.length
}
```

### 2. Update Provider Import

```tsx
// Before (local storage)
import { TasksProvider } from '@/features/tasks-local/TasksContext'

// After (Supabase)
import { TasksProvider } from '@/features/tasks-supabase/TasksContext'
```

**No other code changes needed!** The API remains identical.

### 3. Run Migration

```tsx
// Add migration button in settings
function SettingsScreen() {
  const [migrating, setMigrating] = useState(false)

  async function handleMigrate() {
    try {
      setMigrating(true)
      const count = await migrateTasksToSupabase()
      Alert.alert('Success', `Migrated ${count} tasks to cloud`)
    } catch (err) {
      Alert.alert('Error', err.message)
    } finally {
      setMigrating(false)
    }
  }

  return (
    <Button
      title="Migrate to Cloud"
      onPress={handleMigrate}
      loading={migrating}
    />
  )
}
```

## Troubleshooting

### Real-time updates not working

**Check:**
1. Is `enableRealtime={true}` in provider?
2. Is Realtime enabled in Supabase dashboard?
3. Are RLS policies correct?
4. Check console for subscription errors

**Debug:**
```tsx
useEffect(() => {
  const channel = supabase
    .channel('tasks-debug')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
      console.log('Realtime event:', payload)
    })
    .subscribe((status) => {
      console.log('Subscription status:', status)
    })

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

### "Not authenticated" errors

**Cause:** User not logged in or session expired.

**Fix:**
```tsx
import { useAuth } from '@/features/auth/AuthContext'

function TasksScreen() {
  const { user } = useAuth()
  const { tasks, loading } = useTasks()

  if (!user) {
    return <LoginPrompt />
  }

  // ... render tasks
}
```

### RLS policy blocking queries

**Check policies:**
```sql
-- View all policies
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tasks';

-- Test as user
SET request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM tasks;
```

**Common issue:** Missing `WITH CHECK` clause on INSERT/UPDATE policies.

### Optimistic updates out of sync

**Cause:** Real-time events received before optimistic update completes.

**Fix:** Provider automatically handles this by checking for duplicate IDs.

If issues persist:
```tsx
<TasksProvider
  enableRealtime={false}  // Disable real-time temporarily
>
```

### Type errors with database.ts

**Regenerate types:**
```bash
supabase gen types typescript --local > src/types/database.ts
```

**Check schema matches:**
```sql
\d tasks
```

### Performance issues with large datasets

**Solutions:**
1. Add pagination
2. Add filters/search
3. Create database indexes
4. Use virtual lists (FlatList)

```tsx
const { data } = await supabase
  .from('tasks')
  .select('*')
  .range(0, 49)  // Limit to 50 tasks
  .order('created_at', { ascending: false })
```

## Performance Tips

### Pagination

```tsx
function usePaginatedTasks(pageSize = 20) {
  const [page, setPage] = useState(0)
  const [tasks, setTasks] = useState<Task[]>([])
  const [hasMore, setHasMore] = useState(true)

  async function loadMore() {
    const start = page * pageSize
    const end = start + pageSize - 1

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .range(start, end)
      .order('created_at', { ascending: false })

    if (error) throw error

    if (data.length < pageSize) {
      setHasMore(false)
    }

    setTasks(prev => [...prev, ...data.map(transformTask)])
    setPage(prev => prev + 1)
  }

  return { tasks, loadMore, hasMore }
}
```

### Search

```tsx
async function searchTasks(query: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .ilike('title', `%${query}%`)
    .limit(50)

  if (error) throw error
  return (data as TaskRow[]).map(transformTask)
}
```

### Caching

```tsx
import { useQuery } from '@tanstack/react-query'

function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: () => TaskAPI.getTasks(),
    staleTime: 30000,  // 30 seconds
  })
}
```

## Related

- **Local Tasks:** [.examples/features/tasks-local/](../tasks-local/)
- **Auth:** [.examples/features/auth-supabase/](../auth-supabase/) (coming soon)
- **Database:** [.examples/database/](../../database/)
- **Patterns:** [docs/patterns/SUPABASE-TABLE.md](../../../docs/patterns/SUPABASE-TABLE.md)
- **Security:** [docs/09-security/SECURITY-CHECKLIST.md](../../../docs/09-security/SECURITY-CHECKLIST.md)
