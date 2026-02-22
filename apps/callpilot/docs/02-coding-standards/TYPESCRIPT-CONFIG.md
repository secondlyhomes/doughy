# TypeScript Configuration

## Recommended tsconfig.json

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

## Path Aliases

Use path aliases for clean imports:

```typescript
// GOOD - Using path alias
import { TaskCard } from '@/components';
import { useAuth } from '@/hooks';
import { Task } from '@/types';

// AVOID - Relative paths
import { TaskCard } from '../../../components/TaskCard';
```

## Strict Mode Settings

Enable these for better type safety:

| Setting | Purpose |
|---------|---------|
| `strict: true` | Enables all strict checks |
| `noUncheckedIndexedAccess` | Arrays/objects may be undefined |
| `noImplicitAny` | Must explicitly type `any` |
| `strictNullChecks` | Catch null/undefined errors |

## Type Organization

### Central Types File

Export all types from a barrel file:

```typescript
// src/types/index.ts
export type { Task, TaskPriority, TaskStatus } from './task';
export type { User, UserProfile } from './user';
export type { AppSettings } from './settings';
```

### Type File Structure

```typescript
// src/types/task.ts

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'completed' | 'archived';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
}
```

## Anti-Patterns

### 1. Never Use `any`

```typescript
// BAD
function processData(data: any) { ... }

// GOOD
interface DataPayload {
  id: string;
  value: number;
}
function processData(data: DataPayload) { ... }

// If truly unknown, use `unknown` and narrow
function processUnknown(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // Now TypeScript knows it's an object
  }
}
```

### 2. Always Handle Optional Values

```typescript
// BAD - May crash
const name = user.profile.name;

// GOOD - Safe access
const name = user?.profile?.name ?? 'Anonymous';
```

### 3. Use Type Predicates

```typescript
// Type guard for narrowing
function isTask(obj: unknown): obj is Task {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj
  );
}

// Usage
if (isTask(data)) {
  console.log(data.title); // TypeScript knows it's a Task
}
```

## Running Type Checks

```bash
# Check types without emitting
npx tsc --noEmit

# Watch mode during development
npx tsc --noEmit --watch
```

## Common Errors

### "Cannot find module '@/...'"

Add to `babel.config.js`:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        alias: {
          '@': './src',
        },
      }],
    ],
  };
};
```

### "Type 'X' is not assignable to type 'Y'"

Usually means:
1. Missing optional property (`?`)
2. Wrong type in union
3. Missing null check

Check the exact error location and fix the type mismatch.

---

## Advanced Patterns

### Generic Components

Generic components allow type-safe reusability with any data type:

```typescript
// src/components/shared/SelectList.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

interface SelectListProps<T> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
  getValue: (option: T) => string;
}

export function SelectList<T>({
  options,
  value,
  onChange,
  getLabel,
  getValue,
}: SelectListProps<T>) {
  const { colors } = useTheme();
  const selectedValue = getValue(value);

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const optionValue = getValue(option);
        const isSelected = optionValue === selectedValue;

        return (
          <Pressable
            key={optionValue}
            style={[
              styles.option,
              { borderColor: colors.border },
              isSelected && { backgroundColor: colors.primary }
            ]}
            onPress={() => onChange(option)}
          >
            <Text style={[
              styles.label,
              { color: isSelected ? '#fff' : colors.text }
            ]}>
              {getLabel(option)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  label: { fontSize: 14 },
});

// Usage:
// interface Priority { id: string; name: string; color: string; }
// const priorities: Priority[] = [
//   { id: 'low', name: 'Low', color: 'green' },
//   { id: 'high', name: 'High', color: 'red' },
// ];
//
// <SelectList
//   options={priorities}
//   value={selectedPriority}
//   onChange={setSelectedPriority}
//   getLabel={(p) => p.name}
//   getValue={(p) => p.id}
// />
```

### Generic FlatList Pattern

```typescript
// Type-safe list rendering with generics
interface ListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
}

export function List<T>({
  data,
  renderItem,
  keyExtractor,
  emptyMessage = 'No items',
}: ListProps<T>) {
  if (data.length === 0) {
    return <Text style={styles.empty}>{emptyMessage}</Text>;
  }

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={({ item, index }) => renderItem(item, index)}
    />
  );
}
```

### Discriminated Union Types

Model exclusive states that can't exist simultaneously:

```typescript
// src/types/async.ts
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// Usage in components
function TaskListScreen() {
  const [state, setState] = useState<AsyncState<Task[]>>({ status: 'idle' });

  // TypeScript enforces exhaustive handling
  switch (state.status) {
    case 'idle':
      return null;
    case 'loading':
      return <ActivityIndicator />;
    case 'success':
      return <TaskList tasks={state.data} />; // data is guaranteed to exist
    case 'error':
      return <ErrorView error={state.error} />; // error is guaranteed to exist
  }
}
```

### Navigation Route Params

Type-safe navigation with discriminated unions:

```typescript
// src/types/navigation.ts
type RootStackParamList = {
  Home: undefined;
  TaskDetail: { taskId: string };
  ProjectDetail: { projectId: string; tab?: 'overview' | 'tasks' | 'settings' };
  Profile: { userId: string };
};

// In a screen component
import { useLocalSearchParams } from 'expo-router';

export default function TaskDetailScreen() {
  // Type-safe params
  const { taskId } = useLocalSearchParams<{ taskId: string }>();

  // taskId is typed as string | string[] | undefined
  // Handle the type safely
  const id = Array.isArray(taskId) ? taskId[0] : taskId;
  if (!id) return <Text>Invalid task ID</Text>;

  // Now id is string
  return <TaskDetail taskId={id} />;
}
```

### Template Literal Types

Create constrained string types for consistency:

```typescript
// Route path patterns
type AppRoute = `/(tabs)/${string}` | `/(auth)/${string}` | `/(modals)/${string}`;

// API endpoint patterns
type ApiEndpoint = `/api/v1/${string}`;

// Event handler naming
type EventHandler = `on${Capitalize<string>}`;

// Usage
interface ComponentProps {
  onPress?: () => void;      // Valid: starts with 'on' + Capitalized
  onClick?: () => void;      // Valid
  onChange?: (v: string) => void; // Valid
}

// Storage key patterns
type StorageKey = `@app/${string}`;

const STORAGE_KEYS = {
  AUTH_TOKEN: '@app/auth_token' as StorageKey,
  USER_PREFS: '@app/user_prefs' as StorageKey,
  ONBOARDING: '@app/onboarding_complete' as StorageKey,
} as const;
```

### Branded Types

Prevent mixing up similar primitive types (IDs, amounts, etc.):

```typescript
// src/types/branded.ts

// The brand utility type
type Brand<T, B extends string> = T & { readonly __brand: B };

// Branded ID types - can't be mixed up at compile time
export type ProjectId = Brand<string, 'ProjectId'>;
export type TaskId = Brand<string, 'TaskId'>;
export type UserId = Brand<string, 'UserId'>;
export type TenantId = Brand<string, 'TenantId'>;

// Factory functions with optional validation
export function asProjectId(id: string): ProjectId {
  if (!id || id.length < 1) {
    throw new Error('Invalid project ID');
  }
  return id as ProjectId;
}

export function asTaskId(id: string): TaskId {
  return id as TaskId;
}

export function asUserId(id: string): UserId {
  return id as UserId;
}

// Usage - compiler prevents mixing IDs
function deleteProject(id: ProjectId): Promise<void> { /* ... */ }
function completeTask(id: TaskId): Promise<void> { /* ... */ }

const projectId = asProjectId('proj-123');
const taskId = asTaskId('task-456');

deleteProject(projectId);  // OK
deleteProject(taskId);     // Compile error! TaskId is not ProjectId

// Branded numeric types
export type Cents = Brand<number, 'Cents'>;
export type Dollars = Brand<number, 'Dollars'>;

function asCents(amount: number): Cents {
  return Math.round(amount) as Cents;
}

function centsToDisplay(cents: Cents): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Prevents accidentally mixing currency representations
const price = asCents(1999);  // $19.99 in cents
centsToDisplay(price);        // "$19.99"
centsToDisplay(19.99);        // Compile error! number is not Cents
```

### Type-Safe API Responses with Zod

Combine TypeScript with runtime validation:

```typescript
// src/types/api.ts
import { z } from 'zod';

// Define schema with Zod
const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  status: z.enum(['pending', 'completed', 'archived']),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

// Infer TypeScript type from schema
export type Task = z.infer<typeof TaskSchema>;

// Type-safe API response validation
export async function fetchTask(id: string): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}`);
  const json = await response.json();

  // Validates at runtime, returns typed data
  return TaskSchema.parse(json);
}
```
