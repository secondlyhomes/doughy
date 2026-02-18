# Anti-Patterns: What NOT to Do

Learn from common mistakes. These patterns cause bugs, poor performance, or security issues.

## TypeScript Anti-Patterns

### Never Use `any`

```typescript
// BAD
function processData(data: any) {
  return data.value; // No type safety!
}

// GOOD
interface DataPayload {
  value: number;
}
function processData(data: DataPayload) {
  return data.value; // Type-safe
}
```

### Never Use Deprecated Methods

```typescript
// BAD - substr is deprecated
const sub = str.substr(2, 9);

// GOOD
const sub = str.substring(2, 11);
```

### Never Skip Null Checks

```typescript
// BAD - Will crash if user is null
const name = user.profile.name;

// GOOD
const name = user?.profile?.name ?? 'Anonymous';
```

---

## React Native Anti-Patterns

### Never Store Secrets in Code

```typescript
// BAD - API key in client code
const API_KEY = 'sk-abc123...';

// GOOD - Use environment variables (server-side only for secrets)
const API_KEY = process.env.OPENAI_API_KEY;

// For client-side public keys, use EXPO_PUBLIC_ prefix
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
```

### Never Create 200+ Line Components

```typescript
// BAD - Massive component
export function TaskScreen() {
  // 500 lines of mixed concerns
}

// GOOD - Split into smaller components
export function TaskScreen() {
  return (
    <View>
      <TaskHeader />
      <TaskList />
      <TaskInput />
    </View>
  );
}
```

### Never Skip useEffect Cleanup

```typescript
// BAD - Memory leak
useEffect(() => {
  const subscription = eventEmitter.subscribe(handler);
  // Missing cleanup!
}, []);

// GOOD
useEffect(() => {
  const subscription = eventEmitter.subscribe(handler);
  return () => subscription.unsubscribe();
}, []);
```

### Never Create Objects in Render

```typescript
// BAD - Creates new object every render
<View style={{ margin: 10 }} />

// GOOD - Use StyleSheet
const styles = StyleSheet.create({
  container: { margin: 10 }
});
<View style={styles.container} />
```

### Never Skip useNativeDriver

```typescript
// BAD - Runs on JS thread (slow)
Animated.timing(opacity, {
  toValue: 1,
  duration: 300,
}).start();

// GOOD - Runs on native thread (60fps)
Animated.timing(opacity, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,
}).start();
```

---

## Architecture Anti-Patterns

> For the positive principles, see [Architecture Principles](../02-coding-standards/ARCHITECTURE-PRINCIPLES.md).

### Never Call the Database from Components

```typescript
// BAD - Database logic mixed into component
export function TaskListScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setTasks(data);
      setLoading(false);
    };
    fetchTasks();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator /> : <TaskList tasks={tasks} />}
    </View>
  );
}

// GOOD - Use a hook with TanStack Query
// hooks/useTasks.ts
export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// screens/task-list-screen.tsx
export function TaskListScreen() {
  const { data: tasks, isLoading } = useTasks();

  return (
    <View style={styles.container}>
      {isLoading ? <ActivityIndicator /> : <TaskList tasks={tasks} />}
    </View>
  );
}
```

**Why:** Components should focus on UI. Data fetching in components makes testing hard, creates duplication, and prevents caching/deduplication that TanStack Query provides.

### Never Put Business Logic in Components

```typescript
// BAD - Pricing logic inside component
export function SubscriptionScreen() {
  const [plan, setPlan] = useState<Plan | null>(null);

  const calculatePrice = () => {
    if (!plan) return 0;
    let price = plan.basePrice;
    if (plan.isAnnual) price = price * 12 * 0.8; // 20% discount
    if (plan.teamSize > 5) price = price * 0.9; // Volume discount
    return price;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.price}>${calculatePrice()}/month</Text>
    </View>
  );
}

// GOOD - Business logic in service
// services/pricing.ts
export function calculateSubscriptionPrice(plan: Plan): number {
  let price = plan.basePrice;
  if (plan.isAnnual) price = price * 12 * 0.8;
  if (plan.teamSize > 5) price = price * 0.9;
  return price;
}

// screens/subscription-screen.tsx
export function SubscriptionScreen() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const price = plan ? calculateSubscriptionPrice(plan) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.price}>${price}/month</Text>
    </View>
  );
}
```

**Why:** Business logic in components cannot be unit tested in isolation, leads to duplication when the same logic is needed elsewhere, and makes it hard to reason about what the component does.

### Never Build God Components

```typescript
// BAD - God component with too many responsibilities
export function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [privacy, setPrivacy] = useState('public');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  // ... 300+ more lines of mixed concerns
}

// GOOD - Decomposed into focused pieces
export function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <ProfileHeader />
      <ProfileForm />
      <NotificationSettings />
      <AppearanceSettings />
      <PrivacySettings />
      <SubscriptionCard />
      <DangerZone />
    </ScrollView>
  );
}

// Each sub-component manages its own state and logic
export function ProfileForm() {
  const { user, updateUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  // Focused on just the profile form
}
```

**Why:** God components are impossible to test, hard to debug, and create merge conflicts. Each component should have a single responsibility and stay under 200 lines (target 150).

### Never Prop-Drill Through More Than Two Levels

```typescript
// BAD - Threading theme through multiple levels
export function AppLayout({ theme }: { theme: Theme }) {
  return (
    <View style={styles.container}>
      <Sidebar theme={theme} />
      <MainContent theme={theme} />
    </View>
  );
}

function Sidebar({ theme }: { theme: Theme }) {
  return (
    <View style={styles.sidebar}>
      <NavItem theme={theme} label="Home" />
      <NavItem theme={theme} label="Tasks" />
      <NavItem theme={theme} label="Settings" />
    </View>
  );
}

function NavItem({ theme, label }: { theme: Theme; label: string }) {
  return (
    <Text style={{ color: theme.colors.text }}>{label}</Text>
  );
}

// GOOD - Use context with a custom hook
// contexts/ThemeContext.tsx
const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useColorScheme() === 'dark' ? darkTheme : lightTheme;
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used within ThemeProvider');
  return theme;
}

// Any component can access theme directly
function NavItem({ label }: { label: string }) {
  const theme = useTheme();
  return <Text style={{ color: theme.colors.text }}>{label}</Text>;
}
```

**Why:** Prop drilling makes components hard to refactor, creates tight coupling, and pollutes component interfaces with props they only pass through. Context provides clean access at any depth.

### Never Create Abstractions Before the Pattern Repeats

```typescript
// BAD - Premature abstraction
function useGenericCrudOperations<T>(tableName: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => { /* generic fetch */ };
  const create = async (item: Partial<T>) => { /* generic create */ };
  const update = async (id: string, item: Partial<T>) => { /* generic update */ };
  const remove = async (id: string) => { /* generic delete */ };

  return { items, loading, fetchAll, create, update, remove };
}

// Used for just one entity type
const tasks = useGenericCrudOperations<Task>('tasks');

// GOOD - Specific hooks that evolve naturally
// Start with specific implementations
function useTasks() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  const createTask = useMutation({
    mutationFn: (task: CreateTaskInput) => insertTask(task),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  return { tasks, isLoading, createTask };
}

function useProjects() {
  // Similar but with project-specific logic like member management
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const inviteMember = useMutation({
    mutationFn: (params: InviteParams) => sendProjectInvite(params),
  });

  return { projects, isLoading, inviteMember };
}
```

**Why:** Generic abstractions created before you have multiple concrete use cases often guess wrong about what needs to be shared. Wait until you have 3+ similar implementations, then extract the common pattern.

---

## Supabase Anti-Patterns

### Never Disable RLS

```sql
-- BAD - Security nightmare
ALTER TABLE my_table DISABLE ROW LEVEL SECURITY;

-- GOOD - Always have policies
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON my_table
  FOR SELECT USING (auth.uid() = user_id);
```

### Never Use Service Role Key on Client

```typescript
// BAD - Exposes admin access
const supabase = createClient(url, serviceRoleKey);

// GOOD - Use anon key on client
const supabase = createClient(url, anonKey);
```

### Never Trust User Input

```typescript
// BAD - SQL injection risk
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', userInput); // Could be malicious

// GOOD - Supabase parameterizes, but still validate
const email = validateEmail(userInput);
if (!email) throw new Error('Invalid email');
const { data } = await supabase.from('users').select('*').eq('email', email);
```

### Never Store Sensitive Data Without Encryption

```typescript
// BAD - Storing sensitive data in plain text
await AsyncStorage.setItem('user_ssn', '123-45-6789');
await AsyncStorage.setItem('credit_card', '4111111111111111');

// GOOD - Use expo-secure-store for sensitive data
import * as SecureStore from 'expo-secure-store';

// Secure storage with hardware-backed encryption
await SecureStore.setItemAsync('auth_token', token);
await SecureStore.setItemAsync('biometric_key', key);

// For data that must be stored client-side, encrypt it
import * as Crypto from 'expo-crypto';

async function encryptData(data: string, key: string): Promise<string> {
  // Use proper encryption before storing
  const encrypted = await encrypt(data, key);
  await AsyncStorage.setItem('encrypted_data', encrypted);
  return encrypted;
}
```

**Why:** AsyncStorage is not encrypted by default. Use expo-secure-store for tokens, keys, and sensitive user data. For data that must go in AsyncStorage, encrypt it first.

---

## Performance Anti-Patterns

### Never Fetch on Every Render

```typescript
// BAD - Infinite API calls
function MyComponent() {
  const [data, setData] = useState(null);
  fetchData().then(setData); // Runs every render!
}

// GOOD
function MyComponent() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetchData().then(setData);
  }, []); // Runs once
}
```

### Never Use Large Images Without Optimization

```typescript
// BAD - 5MB image loading
<Image source={{ uri: 'https://example.com/huge-image.jpg' }} />

// GOOD - Use optimized image service
<Image
  source={{
    uri: 'https://example.com/huge-image.jpg?w=400&q=80'
  }}
  style={{ width: 200, height: 200 }}
/>
```

---

## UX Anti-Patterns

### Never Shame Users

```typescript
// BAD
<Text style={{ color: 'red' }}>
  You failed to complete 5 tasks!
</Text>

// GOOD
<Text>
  Ready to tackle today's tasks?
</Text>
```

### Never Block with Confirmation Dialogs

```typescript
// BAD - For reversible actions
Alert.alert('Delete task?', 'Are you sure?', [
  { text: 'Cancel' },
  { text: 'Delete', onPress: deleteTask },
]);

// GOOD - Use undo pattern
deleteTaskWithUndo(taskId);
showToast('Task deleted', { action: { label: 'Undo', onPress: undoDelete } });
```

### Never Use Linear Animations

```typescript
// BAD - Feels robotic
Animated.timing(scale, {
  toValue: 1,
  duration: 200,
  easing: Easing.linear, // Unnatural
}).start();

// GOOD - Use spring for natural feel
Animated.spring(scale, {
  toValue: 1,
  friction: 8,
  tension: 100,
}).start();
```

---

## AI Integration Anti-Patterns

### Never Expose API Keys

```typescript
// BAD - Key in client bundle
const openai = new OpenAI({ apiKey: 'sk-abc123' });

// GOOD - Call through Supabase Edge Functions
const { data, error } = await supabase.functions.invoke('ai-extract', {
  body: { input },
});
```

**Why:** Use `supabase.functions.invoke()` instead of raw `fetch()`. It automatically handles auth headers, base URL, and error formatting. The Edge Function keeps your API key server-side.

### Never Skip Rate Limiting on AI Endpoints

```typescript
// BAD: Edge Function with no rate limiting
Deno.serve(async (req) => {
  const { message } = await req.json();
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: message }],
  });
  return new Response(JSON.stringify(response));
});

// GOOD: Check rate limit before calling AI
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SECRET_KEY')!,
  );

  const authHeader = req.headers.get('Authorization')!;
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) return new Response('Unauthorized', { status: 401 });

  // Check rate limit: 20 requests per hour per user
  const { count } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', new Date(Date.now() - 3600_000).toISOString());

  if ((count ?? 0) >= 20) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Retry-After': '3600' },
    });
  }

  // Proceed with AI call and log usage...
});
```

**Why:** Without rate limiting, a single user can exhaust your AI budget in minutes. Always enforce per-user limits in the Edge Function before calling the AI provider.

### Never Trust AI Output Without Validation

```typescript
// BAD - Blindly trust AI response
const taskIds = aiResponse.matchedTaskIds;
await deleteTasksById(taskIds); // Could delete wrong tasks!

// GOOD - Validate against known data
const taskIds = aiResponse.matchedTaskIds;
const validIds = taskIds.filter(id => userTasks.has(id));
await deleteTasksById(validIds);
```

### Never Render AI Output Without Schema Validation

```typescript
// BAD - Trusting AI structure without validation
const { data } = await supabase.functions.invoke('ai-suggest', {
  body: { prompt: 'Suggest tasks' },
});
// Rendering data.suggestions without checking structure
data.suggestions.map(s => <TaskCard task={s} />);

// GOOD - Validate with Zod before rendering
import { z } from 'zod';

const AISuggestionSchema = z.object({
  suggestions: z.array(z.object({
    title: z.string().max(200),
    priority: z.enum(['low', 'medium', 'high']),
  })).max(10),
});

const { data } = await supabase.functions.invoke('ai-suggest', {
  body: { prompt: 'Suggest tasks' },
});

const parsed = AISuggestionSchema.safeParse(data);
if (!parsed.success) {
  return <Text>AI returned unexpected data</Text>;
}

return parsed.data.suggestions.map((s, i) => (
  <TaskCard key={i} title={s.title} priority={s.priority} />
));
```

---

## Additional TypeScript Anti-Patterns

### Never Use @ts-ignore

```typescript
// BAD - Silently ignoring type errors hides bugs
// @ts-ignore
const value = someFunction(wrongArg);

// GOOD - Fix the actual type error
const value = someFunction(correctArg as ExpectedType);

// ACCEPTABLE (rare) - Use @ts-expect-error with explanation
// @ts-expect-error -- Third-party library types are incorrect (issue #1234)
const value = libraryFunction(arg);
```

**Why:** `@ts-ignore` permanently silences errors, so you won't know when the underlying issue is fixed or if new errors appear. `@ts-expect-error` will error if the expected error disappears, alerting you to update the code.

### Never Use Non-Null Assertion Without Validation

```typescript
// BAD - Asserting non-null without checking
const user = getUser()!;
console.log(user.name); // Crashes if getUser returns null

// GOOD - Handle the null case explicitly
const user = getUser();
if (!user) {
  throw new Error('User not found');
}
console.log(user.name);

// ACCEPTABLE - When you've already validated
const validated = schema.parse(data); // Zod throws if invalid
const user = validated.user!; // Safe because Zod validated
```

### Never Export Mutable State

```typescript
// BAD - Exported mutable variable
export let currentUser: User | null = null;
export let isLoggedIn = false;

// Any file can modify these, causing unpredictable bugs
import { currentUser } from './auth';
currentUser = null; // Breaks other parts of the app

// GOOD - Use a store or context
// contexts/AuthContext.tsx
const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

// State changes go through the provider, maintaining single source of truth
```

### Never Use Type Assertions to Lie

```typescript
// BAD - Casting to a wrong type
const response = await fetch('/api/data');
const data = (await response.json()) as Project[]; // Could be anything!

// GOOD - Validate at runtime
import { z } from 'zod';

const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'archived']),
});

const response = await fetch('/api/data');
const json: unknown = await response.json();
const data = z.array(ProjectSchema).parse(json); // Throws if invalid
```

---

## Additional React Native Anti-Patterns

### Never Use Index as Key for Dynamic Lists

```typescript
// BAD - Using array index as key
<FlatList
  data={items}
  keyExtractor={(item, index) => index.toString()}
  renderItem={({ item }) => <TaskCard task={item} />}
/>
// Breaks when items are reordered, inserted, or deleted

// GOOD - Use a stable, unique identifier
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <TaskCard task={item} />}
/>
```

**Why:** When using index as key, React can't track which items changed. If you insert an item at the start, React thinks all items shifted and re-renders everything incorrectly.

### Never Fetch Without Cancellation

```typescript
// BAD - Race condition when ID changes quickly
useEffect(() => {
  fetchTask(taskId).then(setTask);
}, [taskId]);
// If taskId changes rapidly, stale data may overwrite fresh data

// GOOD - Abort previous request
useEffect(() => {
  const controller = new AbortController();

  fetchTask(taskId, { signal: controller.signal })
    .then(setTask)
    .catch(err => {
      if (err.name !== 'AbortError') console.error(err);
    });

  return () => controller.abort();
}, [taskId]);

// BETTER - Use TanStack Query (handles this automatically)
const { data: task } = useQuery({
  queryKey: ['task', taskId],
  queryFn: () => fetchTask(taskId),
});
```

### Never Ignore Loading and Error States

```typescript
// BAD - Crashes on first render when data is null
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  return <Text>{user.name}</Text>; // Crashes!
}

// GOOD - Handle all states
function UserProfile({ userId }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error loading profile</Text>;
  if (!user) return <Text>User not found</Text>;

  return <Text>{user.name}</Text>;
}
```

### Never Mutate State Directly

```typescript
// BAD - Direct mutation (won't trigger re-render)
function TaskList() {
  const [tasks, setTasks] = useState([]);

  const addTask = (task) => {
    tasks.push(task); // Mutating existing array!
    setTasks(tasks);  // Same reference, no re-render
  };
}

// GOOD - Create new array
function TaskList() {
  const [tasks, setTasks] = useState([]);

  const addTask = (task) => {
    setTasks([...tasks, task]); // New array triggers re-render
  };

  const updateTask = (id, updates) => {
    setTasks(tasks.map(t =>
      t.id === id ? { ...t, ...updates } : t
    ));
  };
}
```

### Never Store Derived State

```typescript
// BAD - Storing derived data that can be computed
function TaskList({ tasks }) {
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setCompletedCount(tasks.filter(t => t.completed).length);
    setPendingCount(tasks.filter(t => !t.completed).length);
  }, [tasks]);
}

// GOOD - Compute derived values directly
function TaskList({ tasks }) {
  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  // Or use useMemo if computation is expensive
  const stats = useMemo(() => ({
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
  }), [tasks]);
}
```

---

## Network Anti-Patterns

### Never Ignore Offline State

```typescript
// BAD - Assuming network is always available
async function saveTask(task: Task) {
  await supabase.from('tasks').insert(task);
  showToast('Task saved!');
}

// GOOD - Handle offline gracefully
import NetInfo from '@react-native-community/netinfo';

async function saveTask(task: Task) {
  const { isConnected } = await NetInfo.fetch();

  if (!isConnected) {
    await saveToLocalQueue(task);
    showToast('Saved offline. Will sync when online.');
    return;
  }

  try {
    await supabase.from('tasks').insert(task);
    showToast('Task saved!');
  } catch (error) {
    await saveToLocalQueue(task);
    showToast('Network error. Saved locally.');
  }
}
```

### Never Ignore Error Responses

```typescript
// BAD - Only checking success case
const { data } = await supabase.from('tasks').select('*');
setTasks(data); // data could be null if there's an error!

// GOOD - Always check for errors
const { data, error } = await supabase.from('tasks').select('*');
if (error) {
  console.error('Failed to fetch tasks:', error);
  showError('Could not load tasks. Please try again.');
  return;
}
setTasks(data ?? []);
```

### Never Skip Retry Logic for Critical Operations

```typescript
// BAD - Single attempt for important operations
async function submitPayment(paymentData) {
  const response = await fetch('/api/payment', { body: paymentData });
  return response.json();
}

// GOOD - Retry with exponential backoff
async function submitPayment(paymentData, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('/api/payment', { body: paymentData });
      if (response.ok) return response.json();

      // Don't retry client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Payment failed: ${response.statusText}`);
      }
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
}
```

---

## Navigation Anti-Patterns

### Never Break the Back Button

```typescript
// BAD - Using replace when you should push
import { router } from 'expo-router';

function onTaskCreated(taskId: string) {
  router.replace(`/tasks/${taskId}`); // Can't go back!
}

// GOOD - Use push for normal navigation
function onTaskCreated(taskId: string) {
  router.push(`/tasks/${taskId}`); // Back button works
}

// Use replace only for login flows or explicit redirects
function onLogout() {
  router.replace('/login'); // Correct: prevent going back to authenticated screen
}
```

### Never Ignore Deep Link Validation

```typescript
// BAD - Trusting deep link parameters
// Attacker could craft: myapp://tasks/delete?ids=all
function handleDeepLink(url: string) {
  const { pathname, params } = parseUrl(url);
  if (pathname === '/tasks/delete') {
    deleteTasksById(params.ids); // Dangerous!
  }
}

// GOOD - Validate and require confirmation for destructive actions
function handleDeepLink(url: string) {
  const { pathname, params } = parseUrl(url);

  if (pathname === '/tasks') {
    // Safe: just navigate to view
    router.push(`/tasks/${params.id}`);
  }

  // Never allow destructive actions via deep links
  // Require user interaction in-app
}
```

### Never Navigate Without Loading State

```typescript
// BAD - Navigation with no feedback
<Pressable onPress={() => router.push('/heavy-screen')}>
  <Text>Go</Text>
</Pressable>
// User taps, nothing happens for 2 seconds while screen loads

// GOOD - Show immediate feedback
function NavigationButton({ to, children }) {
  const [isNavigating, setIsNavigating] = useState(false);

  const handlePress = () => {
    setIsNavigating(true);
    router.push(to);
    // Reset on navigation complete (via focus listener)
  };

  return (
    <Pressable onPress={handlePress} disabled={isNavigating}>
      {isNavigating ? <ActivityIndicator /> : children}
    </Pressable>
  );
}
```

---

## StyleSheet Anti-Patterns

### Never Use Magic Numbers

```typescript
// BAD - Hardcoded values everywhere
const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 24,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    marginBottom: 12,
  },
});

// GOOD - Use design tokens
import { spacing, fontSize, borderRadius } from '@/theme/tokens';

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
  },
  title: {
    fontSize: fontSize.lg,
    marginBottom: spacing.sm,
  },
});
```

### Never Hardcode Colors

```typescript
// BAD - Colors scattered in styles
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e0e0e0',
  },
  title: {
    color: '#1a1a1a',
  },
  subtitle: {
    color: '#666666',
  },
});

// GOOD - Use theme colors
function Card() {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    }]}>
      <Text style={{ color: colors.text }}>Title</Text>
      <Text style={{ color: colors.textSecondary }}>Subtitle</Text>
    </View>
  );
}
```

### Never Ignore Safe Areas

```typescript
// BAD - Content hidden behind notch or home indicator
<View style={{ flex: 1 }}>
  <Text>Title overlaps notch!</Text>
</View>

// GOOD - Use SafeAreaView or useSafeAreaInsets
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView style={{ flex: 1 }}>
  <Text>Content respects device safe areas</Text>
</SafeAreaView>

// Or for more control:
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function Screen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    }}>
      <Text>Properly padded content</Text>
    </View>
  );
}
```

---

## FlatList Anti-Patterns

### Never Forget getItemLayout for Fixed-Size Items

```typescript
// BAD - Slow scrolling for long lists
<FlatList
  data={items}
  renderItem={({ item }) => <FixedHeightCard item={item} />}
/>

// GOOD - Provide getItemLayout for fixed-height items
const ITEM_HEIGHT = 80;

<FlatList
  data={items}
  renderItem={({ item }) => <FixedHeightCard item={item} />}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### Never Skip windowSize and initialNumToRender

```typescript
// BAD - Renders too many items off-screen
<FlatList data={largeDataset} renderItem={renderItem} />

// GOOD - Optimize virtualization
<FlatList
  data={largeDataset}
  renderItem={renderItem}
  initialNumToRender={10}       // Render 10 items initially
  maxToRenderPerBatch={10}      // Render 10 items per batch
  windowSize={5}                // Render 5 screens worth of items
  removeClippedSubviews={true}  // Unmount off-screen items
/>
```

### Never Create New Functions in renderItem

```typescript
// BAD - Creates new function on every render
<FlatList
  data={items}
  renderItem={({ item }) => (
    <TaskCard
      task={item}
      onPress={() => handlePress(item.id)} // New function every render!
    />
  )}
/>

// GOOD - Use useCallback or pass item to child
const handlePress = useCallback((id: string) => {
  router.push(`/tasks/${id}`);
}, []);

<FlatList
  data={items}
  renderItem={({ item }) => (
    <TaskCard
      task={item}
      onPress={handlePress} // Stable reference
    />
  )}
/>

// In TaskCard:
function TaskCard({ task, onPress }) {
  return (
    <Pressable onPress={() => onPress(task.id)}>
      <Text>{task.title}</Text>
    </Pressable>
  );
}
```

---

## Liquid Glass Anti-Patterns

### Never Use Opaque Backgrounds on iOS 26 Navigation Chrome

```typescript
// BAD - Opaque background kills the glass effect
<NativeTabs backgroundColor="#FFFFFF">

// GOOD - Transparent background lets glass show through
<NativeTabs backgroundColor="transparent">
```

### Never Skip Glass Initialization

```typescript
// BAD - Flash of fallback on first render
export default function RootLayout() {
  return <Stack />;
}

// GOOD - Resolve glass status before rendering
export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    ensureLiquidGlassStatusResolved().then(() => setIsReady(true));
  }, []);

  if (!isReady) return null;
  return <Stack />;
}
```

### Never Increment Focus Key on Every Focus

```typescript
// BAD - Causes visible flashing on every tab switch
useFocusEffect(
  useCallback(() => {
    setFocusKey(prev => prev + 1); // Fires every focus!
  }, [])
);

// GOOD - Only increment on first focus to fix pre-mounted tab issue
useFocusEffect(
  useCallback(() => {
    if (!hasBeenFocused.current) {
      hasBeenFocused.current = true;
      setFocusKey(prev => prev + 1);
    }
  }, [])
);
```

### Never Set Opacity on GlassView

```typescript
// BAD - Causes rendering errors with expo-glass-effect
<GlassView style={{ opacity: 0.5 }}> ... </GlassView>

// GOOD - Wrap in Animated.View for opacity animations
<Animated.View style={{ opacity: fadeAnim }}>
  <GlassView> ... </GlassView>
</Animated.View>
```

### Never Use @expo/vector-icons with NativeTabs

```typescript
// BAD - Vector icons don't render in native UITabBarController
<NativeTabs.Trigger name="home">
  <Ionicons name="home" size={24} />
</NativeTabs.Trigger>

// GOOD - Use SF Symbols for iOS native tabs
<NativeTabs.Trigger name="home">
  <Icon sf={{ default: 'house', selected: 'house.fill' }} />
  <Label>Home</Label>
</NativeTabs.Trigger>
```

### Never Apply Glass to Everything

```typescript
// BAD - Glass on every surface kills readability and performance
<GlassView style={styles.screenBackground}>
  <GlassView style={styles.header}>
    <GlassView style={styles.title}>
      <GlassView style={styles.button}>

// GOOD - Glass on navigation layer only (Apple's guidance)
<View style={styles.screenBackground}>
  <GlassView style={styles.floatingCard}>
    <Text>Elevated content on glass</Text>
  </GlassView>
</View>
```

### Never Forget Platform Fallbacks

```typescript
// BAD - Only handles iOS 26+, crashes or shows nothing elsewhere
if (isLiquidGlassAvailable()) {
  return <NativeGlassView />;
}
// Nothing rendered on Android!

// GOOD - Three-tier fallback (handled by GlassView component)
// iOS 26+: native glass → iOS < 26: blur → Android: semi-transparent
<GlassView glassStyle="regular">
  <Text>Works everywhere</Text>
</GlassView>
```

**Full guide:** [Liquid Glass](../05-ui-ux/LIQUID-GLASS.md)

---

## Summary Checklist

Use this checklist during code review:

### TypeScript

- [ ] No `any` types (use `unknown` if needed)
- [ ] No `@ts-ignore` (use `@ts-expect-error` with explanation)
- [ ] No non-null assertions without validation
- [ ] No exported mutable state
- [ ] No type assertions to wrong types

### React Native

- [ ] No secrets in client code
- [ ] No components over 200 lines
- [ ] All useEffect hooks have cleanup (when needed)
- [ ] No inline objects/arrays in props
- [ ] No index as key for dynamic lists
- [ ] Loading, error, and empty states handled
- [ ] All animations use `useNativeDriver`

### Architecture

- [ ] No database calls from components (use hooks with services)
- [ ] No business logic in components (use services)
- [ ] No prop drilling past 2 levels (use Context)

### Supabase

- [ ] RLS enabled on all tables
- [ ] Service role key never used in client code
- [ ] All error responses handled

### Performance

- [ ] FlatLists use proper keyExtractor
- [ ] Large lists use windowSize and initialNumToRender
- [ ] Images are optimized and sized appropriately
- [ ] Data is paginated for large datasets

### Network

- [ ] Offline state handled gracefully
- [ ] Request cancellation for rapid changes
- [ ] Retry logic for critical operations

### AI Integration

- [ ] AI API calls go through Edge Functions
- [ ] AI endpoints have per-user rate limiting
- [ ] AI output validated with Zod before use

### UX

- [ ] No shame/guilt language in empty states
- [ ] Reversible actions use undo toast (not confirmation dialogs)
- [ ] Animations use spring or ease curves (not linear)

### Styling

- [ ] No hardcoded colors (use theme)
- [ ] No magic numbers (use design tokens)
- [ ] Safe areas respected on all screens

### Liquid Glass

- [ ] No opaque backgrounds on iOS 26 navigation chrome
- [ ] Glass initialization called before first render
- [ ] No opacity < 1 on GlassView directly
- [ ] SF Symbols used for NativeTabs icons (not vector icons)
- [ ] Platform fallbacks provided for Android and older iOS
