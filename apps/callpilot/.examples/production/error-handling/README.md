# Error Handling Patterns

## Overview

Comprehensive error handling is critical for production React Native applications. This guide covers patterns for gracefully handling errors, recovering from failures, and providing excellent user experience even when things go wrong.

## Table of Contents

1. [Error Boundary Implementation](#error-boundary-implementation)
2. [Error Types and Categorization](#error-types-and-categorization)
3. [Recovery Strategies](#recovery-strategies)
4. [Error Reporting](#error-reporting)
5. [User Communication](#user-communication)
6. [Best Practices](#best-practices)

---

## Error Boundary Implementation

### Basic Error Boundary

```tsx
import { ErrorBoundary } from '.examples/production/error-handling/ErrorBoundary';

// Wrap entire app
function App() {
  return (
    <ErrorBoundary>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </ErrorBoundary>
  );
}
```

### Feature-Specific Boundaries

```tsx
import { FeatureErrorBoundary } from '.examples/production/error-handling/ErrorBoundary';

// Isolate feature errors
function TasksScreen() {
  return (
    <FeatureErrorBoundary featureName="Tasks">
      <TasksList />
    </FeatureErrorBoundary>
  );
}
```

### Async Operation Boundaries

```tsx
import { AsyncErrorBoundary } from '.examples/production/error-handling/ErrorBoundary';

function DataLoadingComponent() {
  return (
    <AsyncErrorBoundary
      onError={(error) => {
        console.log('Async operation failed:', error);
      }}
    >
      <RemoteDataComponent />
    </AsyncErrorBoundary>
  );
}
```

---

## Error Types and Categorization

### 1. Network Errors

**Characteristics:**
- Timeout errors
- Connection failures
- DNS resolution failures
- 5xx server errors

**Handling:**

```tsx
class NetworkError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isTimeout = false
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

async function fetchWithRetry<T>(
  fetcher: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000, onRetry } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetcher();
    } catch (error) {
      const isNetworkError =
        error instanceof NetworkError ||
        error.message.includes('network') ||
        error.message.includes('timeout');

      if (!isNetworkError || attempt === maxRetries) {
        throw error;
      }

      if (onRetry) {
        onRetry(attempt);
      }

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1))
      );
    }
  }

  throw new Error('Max retries exceeded');
}

// Usage
try {
  const data = await fetchWithRetry(
    () => supabase.from('tasks').select('*'),
    {
      maxRetries: 3,
      onRetry: (attempt) => {
        console.log(`Retry attempt ${attempt}`);
        showToast(`Retrying... (${attempt}/3)`);
      },
    }
  );
} catch (error) {
  if (error instanceof NetworkError) {
    showErrorAlert('Network Error', 'Please check your internet connection');
  } else {
    showErrorAlert('Error', 'Failed to load tasks');
  }
}
```

### 2. Validation Errors

**Characteristics:**
- User input validation
- Business rule violations
- Data integrity issues

**Handling:**

```tsx
class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public errors?: Record<string, string>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

function validateTaskInput(data: Partial<Task>): void {
  const errors: Record<string, string> = {};

  if (!data.title?.trim()) {
    errors.title = 'Title is required';
  }

  if (data.title && data.title.length > 200) {
    errors.title = 'Title must be less than 200 characters';
  }

  if (data.dueDate && new Date(data.dueDate) < new Date()) {
    errors.dueDate = 'Due date cannot be in the past';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', undefined, errors);
  }
}

// In component
function TaskForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (data: Partial<Task>) => {
    try {
      validateTaskInput(data);
      await createTask(data);
      navigation.goBack();
    } catch (error) {
      if (error instanceof ValidationError) {
        setErrors(error.errors || {});
        showToast('Please fix the errors');
      } else {
        showErrorAlert('Error', 'Failed to create task');
      }
    }
  };

  return (
    <View>
      <TextInput
        value={title}
        onChangeText={setTitle}
        error={errors.title}
      />
      {errors.title && <Text style={styles.error}>{errors.title}</Text>}
    </View>
  );
}
```

### 3. Authentication Errors

**Characteristics:**
- Session expired
- Invalid credentials
- Insufficient permissions

**Handling:**

```tsx
class AuthError extends Error {
  constructor(
    message: string,
    public code: 'EXPIRED' | 'INVALID' | 'FORBIDDEN'
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

async function authenticatedFetch<T>(
  fetcher: () => Promise<T>
): Promise<T> {
  try {
    return await fetcher();
  } catch (error) {
    // Check for auth errors
    if (error.status === 401) {
      // Session expired - try to refresh
      try {
        await refreshSession();
        return await fetcher(); // Retry with new session
      } catch (refreshError) {
        // Refresh failed - redirect to login
        throw new AuthError('Session expired', 'EXPIRED');
      }
    }

    if (error.status === 403) {
      throw new AuthError('Insufficient permissions', 'FORBIDDEN');
    }

    throw error;
  }
}

// Global auth error handler
export function setupAuthErrorHandler(navigation: NavigationProp) {
  const originalFetch = global.fetch;

  global.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);

      if (response.status === 401) {
        // Redirect to login
        navigation.navigate('Login');
      }

      return response;
    } catch (error) {
      throw error;
    }
  };
}
```

### 4. Business Logic Errors

**Characteristics:**
- Rule violations
- State conflicts
- Precondition failures

**Handling:**

```tsx
class BusinessError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}

async function completeTask(taskId: string): Promise<void> {
  const task = await getTask(taskId);

  // Check preconditions
  if (!task) {
    throw new BusinessError(
      'Task not found',
      'TASK_NOT_FOUND',
      'This task no longer exists'
    );
  }

  if (task.status === 'completed') {
    throw new BusinessError(
      'Task already completed',
      'TASK_ALREADY_COMPLETED',
      'This task is already completed'
    );
  }

  if (task.hasIncompleteSubtasks) {
    throw new BusinessError(
      'Incomplete subtasks exist',
      'INCOMPLETE_SUBTASKS',
      'Please complete all subtasks first'
    );
  }

  // Proceed with completion
  await updateTask(taskId, { status: 'completed' });
}

// In component
try {
  await completeTask(task.id);
  showToast('Task completed!');
} catch (error) {
  if (error instanceof BusinessError) {
    // Show user-friendly message
    showErrorAlert('Cannot Complete Task', error.userMessage);
  } else {
    showErrorAlert('Error', 'Failed to complete task');
  }
}
```

### 5. Resource Errors

**Characteristics:**
- Out of memory
- Storage full
- File not found
- Permission denied

**Handling:**

```tsx
class ResourceError extends Error {
  constructor(
    message: string,
    public resourceType: 'memory' | 'storage' | 'file' | 'permission'
  ) {
    super(message);
    this.name = 'ResourceError';
  }
}

async function saveFile(data: Blob, filename: string): Promise<void> {
  try {
    // Check storage availability
    if (Platform.OS !== 'web') {
      const { available } = await FileSystem.getFreeDiskStorageAsync();
      const requiredSpace = data.size * 1.5; // Add 50% buffer

      if (available < requiredSpace) {
        throw new ResourceError(
          'Insufficient storage space',
          'storage'
        );
      }
    }

    // Attempt to save
    await FileSystem.writeAsStringAsync(filename, data);
  } catch (error) {
    if (error.code === 'ENOSPC') {
      throw new ResourceError('Storage full', 'storage');
    }

    if (error.code === 'EACCES') {
      throw new ResourceError('Permission denied', 'permission');
    }

    throw error;
  }
}

// Error handler
try {
  await saveFile(imageData, 'photo.jpg');
} catch (error) {
  if (error instanceof ResourceError) {
    switch (error.resourceType) {
      case 'storage':
        showErrorAlert(
          'Storage Full',
          'Please free up some space and try again'
        );
        break;
      case 'permission':
        showErrorAlert(
          'Permission Denied',
          'Please grant storage permission in settings'
        );
        break;
    }
  }
}
```

---

## Recovery Strategies

### 1. Automatic Retry

```tsx
import { ErrorRecovery } from '.examples/production/error-handling/ErrorBoundary';

async function loadUserData(userId: string): Promise<User> {
  return await ErrorRecovery.attemptRecovery(
    // Primary operation
    () => supabase.from('users').select('*').eq('id', userId).single(),

    // Fallback strategies
    [
      // Strategy 1: Try from cache
      async () => {
        const cached = await AsyncStorage.getItem(`user_${userId}`);
        if (!cached) throw new Error('No cache');
        return JSON.parse(cached);
      },

      // Strategy 2: Try with reduced data
      async () => {
        return await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', userId)
          .single();
      },
    ],

    {
      maxRetries: 3,
      retryDelay: 1000,
      onRetry: (attempt, error) => {
        console.log(`Retry ${attempt}: ${error.message}`);
      },
    }
  );
}
```

### 2. Graceful Degradation

```tsx
function TasksScreen() {
  const [data, setData] = useState<Task[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      // Try to load from server
      const tasks = await fetchTasks();
      setData(tasks);
      setIsOffline(false);

      // Cache for offline use
      await AsyncStorage.setItem('cached_tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to load tasks:', error);

      // Fall back to cached data
      try {
        const cached = await AsyncStorage.getItem('cached_tasks');
        if (cached) {
          setData(JSON.parse(cached));
          setIsOffline(true);
          showToast('Showing offline data');
        } else {
          throw new Error('No cached data');
        }
      } catch (cacheError) {
        setError(error);
        showErrorAlert('Error', 'Failed to load tasks');
      }
    }
  }

  if (error) {
    return <ErrorState onRetry={loadTasks} />;
  }

  return (
    <View>
      {isOffline && (
        <Banner type="warning">
          You're viewing offline data. Some features may be limited.
        </Banner>
      )}
      <TasksList tasks={data} />
    </View>
  );
}
```

### 3. Circuit Breaker

```tsx
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();

      // Success - reset if half-open
      if (this.state === 'HALF_OPEN') {
        this.reset();
      }

      return result;
    } catch (error) {
      this.recordFailure();

      if (this.state === 'HALF_OPEN') {
        this.state = 'OPEN';
      }

      throw error;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      console.warn('Circuit breaker opened');
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    return Date.now() - this.lastFailureTime >= this.timeout;
  }

  private reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
    console.log('Circuit breaker reset');
  }

  getState() {
    return this.state;
  }
}

// Usage
const apiCircuitBreaker = new CircuitBreaker(5, 60000);

async function callAPI<T>(endpoint: string): Promise<T> {
  try {
    return await apiCircuitBreaker.execute(() =>
      fetch(endpoint).then((r) => r.json())
    );
  } catch (error) {
    if (error.message === 'Circuit breaker is OPEN') {
      // Use fallback or cached data
      return getCachedData(endpoint);
    }
    throw error;
  }
}
```

### 4. Fallback UI

```tsx
function DataComponent() {
  const { data, error, isLoading } = useQuery('data', fetchData);

  // Loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Error with retry
  if (error) {
    return (
      <ErrorState
        title="Failed to Load"
        message="We couldn't load your data. Please try again."
        onRetry={() => queryClient.invalidateQueries('data')}
        actions={[
          {
            label: 'View Offline Data',
            onPress: () => navigation.navigate('OfflineData'),
          },
          {
            label: 'Contact Support',
            onPress: () => navigation.navigate('Support'),
          },
        ]}
      />
    );
  }

  // Success
  return <DataList data={data} />;
}

// Reusable ErrorState component
function ErrorState({
  title,
  message,
  onRetry,
  actions,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  actions?: Array<{ label: string; onPress: () => void }>;
}) {
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorMessage}>{message}</Text>

      {onRetry && (
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      )}

      {actions && (
        <View style={styles.actionsContainer}>
          {actions.map((action, index) => (
            <Pressable
              key={index}
              style={styles.actionButton}
              onPress={action.onPress}
            >
              <Text style={styles.actionText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
```

### 5. Optimistic Updates with Rollback

```tsx
function useOptimisticUpdate<T>(
  mutationFn: (data: T) => Promise<void>,
  queryKey: string
) {
  const queryClient = useQueryClient();

  return async (data: T) => {
    // Store previous data
    const previousData = queryClient.getQueryData(queryKey);

    // Optimistically update
    queryClient.setQueryData(queryKey, (old: T[]) => [...old, data]);

    try {
      // Attempt mutation
      await mutationFn(data);
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(queryKey, previousData);

      // Show error
      showErrorAlert('Error', 'Failed to save changes. Changes reverted.');

      throw error;
    }
  };
}

// Usage
function TaskForm() {
  const createTaskMutation = useOptimisticUpdate(
    (task: Task) => supabase.from('tasks').insert(task),
    'tasks'
  );

  const handleSubmit = async (task: Task) => {
    try {
      await createTaskMutation(task);
      showToast('Task created!');
      navigation.goBack();
    } catch (error) {
      // Error already handled by useOptimisticUpdate
    }
  };
}
```

---

## Error Reporting

### 1. Sentry Integration

```tsx
import * as Sentry from '@sentry/react-native';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 0.2,
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 30000,

  beforeSend(event, hint) {
    // Don't send in development
    if (__DEV__) {
      console.log('Sentry event (not sent in dev):', event);
      return null;
    }

    // Filter out expected errors
    const error = hint.originalException;
    if (error instanceof ValidationError) {
      return null; // Don't report validation errors
    }

    // Add custom context
    event.contexts = {
      ...event.contexts,
      app: {
        version: '1.0.0',
        build: '123',
      },
    };

    return event;
  },

  integrations: [
    new Sentry.ReactNativeTracing({
      tracingOrigins: ['api.example.com'],
      routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
    }),
  ],
});

// Capture with context
function reportError(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('custom', context);
    }

    scope.setLevel('error');
    Sentry.captureException(error);
  });
}

// Usage
try {
  await deleteTask(taskId);
} catch (error) {
  reportError(error, {
    taskId,
    operation: 'delete',
    timestamp: Date.now(),
  });

  showErrorAlert('Error', 'Failed to delete task');
}
```

### 2. Custom Error Tracking

```tsx
interface ErrorLog {
  id: string;
  timestamp: number;
  error: string;
  stack?: string;
  context: Record<string, any>;
  userId?: string;
  sessionId: string;
  deviceInfo: {
    platform: string;
    version: string;
    model?: string;
  };
}

class ErrorTracker {
  private sessionId: string;
  private logs: ErrorLog[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36)}`;
  }

  async logError(error: Error, context: Record<string, any> = {}): Promise<void> {
    const log: ErrorLog = {
      id: this.generateSessionId(),
      timestamp: Date.now(),
      error: error.toString(),
      stack: error.stack,
      context,
      sessionId: this.sessionId,
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version.toString(),
        model: Platform.select({
          ios: 'iOS Device',
          android: 'Android Device',
        }),
      },
    };

    // Add to local logs
    this.logs.push(log);

    // Persist to storage
    await this.persistLog(log);

    // Send to backend (async, don't block)
    this.sendToBackend(log).catch((e) =>
      console.error('Failed to send error log:', e)
    );
  }

  private async persistLog(log: ErrorLog): Promise<void> {
    try {
      const existingLogs = await this.getStoredLogs();
      const updatedLogs = [log, ...existingLogs].slice(0, 100); // Keep last 100
      await AsyncStorage.setItem('error_logs', JSON.stringify(updatedLogs));
    } catch (e) {
      console.error('Failed to persist error log:', e);
    }
  }

  private async getStoredLogs(): Promise<ErrorLog[]> {
    try {
      const stored = await AsyncStorage.getItem('error_logs');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  private async sendToBackend(log: ErrorLog): Promise<void> {
    await fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
  }

  async exportLogs(): Promise<ErrorLog[]> {
    return await this.getStoredLogs();
  }

  async clearLogs(): Promise<void> {
    this.logs = [];
    await AsyncStorage.removeItem('error_logs');
  }
}

// Global instance
export const errorTracker = new ErrorTracker();
```

---

## User Communication

### 1. Error Messages

```tsx
// Good error messages
const errorMessages = {
  network: {
    title: 'Connection Error',
    message: 'Please check your internet connection and try again.',
  },
  auth: {
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again.',
  },
  validation: {
    title: 'Invalid Input',
    message: 'Please check your input and try again.',
  },
  serverError: {
    title: 'Something Went Wrong',
    message: 'We're working on fixing this. Please try again later.',
  },
  notFound: {
    title: 'Not Found',
    message: 'The item you're looking for doesn't exist or was deleted.',
  },
};

// Error message component
function ErrorMessage({ type }: { type: keyof typeof errorMessages }) {
  const message = errorMessages[type];

  return (
    <View style={styles.errorMessage}>
      <Ionicons name="alert-circle" size={24} color="#ef4444" />
      <View style={styles.errorContent}>
        <Text style={styles.errorTitle}>{message.title}</Text>
        <Text style={styles.errorText}>{message.message}</Text>
      </View>
    </View>
  );
}
```

### 2. Toast Notifications

```tsx
import Toast from 'react-native-toast-message';

// Error toast
function showErrorToast(message: string, description?: string) {
  Toast.show({
    type: 'error',
    text1: message,
    text2: description,
    position: 'bottom',
    visibilityTime: 4000,
  });
}

// Success toast
function showSuccessToast(message: string) {
  Toast.show({
    type: 'success',
    text1: message,
    position: 'bottom',
    visibilityTime: 2000,
  });
}

// Usage
try {
  await saveTask(task);
  showSuccessToast('Task saved!');
} catch (error) {
  showErrorToast('Failed to save task', 'Please try again');
}
```

### 3. Alert Dialogs

```tsx
import { Alert } from 'react-native';

function showErrorAlert(title: string, message: string, retry?: () => void) {
  const buttons = [{ text: 'OK', style: 'cancel' }];

  if (retry) {
    buttons.unshift({
      text: 'Retry',
      onPress: retry,
    });
  }

  Alert.alert(title, message, buttons);
}

// Usage
try {
  await deleteTask(taskId);
} catch (error) {
  showErrorAlert(
    'Delete Failed',
    'Failed to delete task. Would you like to retry?',
    () => deleteTask(taskId)
  );
}
```

---

## Best Practices

### 1. Error Classification

```tsx
// Classify errors by severity
enum ErrorSeverity {
  LOW = 'low', // Expected, user-recoverable
  MEDIUM = 'medium', // Unexpected, needs investigation
  HIGH = 'high', // Critical, immediate attention
  CRITICAL = 'critical', // System failure, page support
}

function classifyError(error: Error): ErrorSeverity {
  if (error instanceof ValidationError) return ErrorSeverity.LOW;
  if (error instanceof NetworkError) return ErrorSeverity.MEDIUM;
  if (error instanceof AuthError) return ErrorSeverity.MEDIUM;
  if (error instanceof BusinessError) return ErrorSeverity.LOW;

  // Unknown errors are high severity
  return ErrorSeverity.HIGH;
}
```

### 2. Context Preservation

```tsx
// Always preserve error context
class ContextualError extends Error {
  constructor(
    message: string,
    public context: Record<string, any>,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ContextualError';

    // Preserve stack trace
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

// Usage
try {
  await updateTask(taskId, updates);
} catch (error) {
  throw new ContextualError(
    'Failed to update task',
    {
      taskId,
      updates,
      timestamp: Date.now(),
      user: currentUser.id,
    },
    error
  );
}
```

### 3. Error Aggregation

```tsx
// Aggregate multiple errors
class AggregateError extends Error {
  constructor(
    message: string,
    public errors: Error[]
  ) {
    super(message);
    this.name = 'AggregateError';
  }
}

async function batchUpdate(items: Task[]): Promise<void> {
  const results = await Promise.allSettled(
    items.map((item) => updateTask(item.id, item))
  );

  const errors = results
    .filter((r) => r.status === 'rejected')
    .map((r) => (r as PromiseRejectedResult).reason);

  if (errors.length > 0) {
    throw new AggregateError(
      `Failed to update ${errors.length} of ${items.length} tasks`,
      errors
    );
  }
}
```

### 4. Error Metrics

```tsx
// Track error metrics
class ErrorMetrics {
  private static metrics = {
    totalErrors: 0,
    errorsByType: new Map<string, number>(),
    errorsBySeverity: new Map<ErrorSeverity, number>(),
  };

  static recordError(error: Error, severity: ErrorSeverity): void {
    this.metrics.totalErrors++;

    const type = error.constructor.name;
    this.metrics.errorsByType.set(
      type,
      (this.metrics.errorsByType.get(type) || 0) + 1
    );

    this.metrics.errorsBySeverity.set(
      severity,
      (this.metrics.errorsBySeverity.get(severity) || 0) + 1
    );
  }

  static getMetrics() {
    return {
      total: this.metrics.totalErrors,
      byType: Object.fromEntries(this.metrics.errorsByType),
      bySeverity: Object.fromEntries(this.metrics.errorsBySeverity),
    };
  }

  static reset(): void {
    this.metrics.totalErrors = 0;
    this.metrics.errorsByType.clear();
    this.metrics.errorsBySeverity.clear();
  }
}
```

### 5. Testing Error Handling

```tsx
// Test error scenarios
describe('TaskService', () => {
  it('should retry on network error', async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new NetworkError('Timeout'))
      .mockRejectedValueOnce(new NetworkError('Timeout'))
      .mockResolvedValueOnce({ data: [] });

    const result = await fetchWithRetry(fetchMock, { maxRetries: 3 });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ data: [] });
  });

  it('should fallback to cache on error', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('Network error'));

    await AsyncStorage.setItem('cached_tasks', JSON.stringify([{ id: '1' }]));

    const result = await loadTasksWithFallback(fetchMock);

    expect(result).toEqual([{ id: '1' }]);
  });

  it('should show error UI when all strategies fail', async () => {
    const { getByText } = render(<TasksScreen />);

    // Mock all strategies to fail
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('All failed'));
    await AsyncStorage.clear();

    await waitFor(() => {
      expect(getByText('Failed to Load')).toBeTruthy();
    });
  });
});
```

---

## Checklist

### Error Handling Implementation

- [ ] Global error boundary wraps app
- [ ] Feature-specific boundaries isolate features
- [ ] Network errors have retry logic
- [ ] Authentication errors handled globally
- [ ] Validation errors show field-specific messages
- [ ] Business errors have user-friendly messages
- [ ] Resource errors provide actionable guidance

### Recovery Strategies

- [ ] Automatic retry with exponential backoff
- [ ] Circuit breaker for failing services
- [ ] Fallback to cached data when offline
- [ ] Optimistic updates with rollback
- [ ] Graceful degradation for non-critical features

### Error Reporting

- [ ] Sentry configured for production
- [ ] Errors categorized by severity
- [ ] Context preserved in error reports
- [ ] User actions tracked in breadcrumbs
- [ ] Error metrics collected and monitored

### User Communication

- [ ] Error messages are clear and actionable
- [ ] Toast notifications for minor errors
- [ ] Alert dialogs for critical errors
- [ ] Retry options provided when appropriate
- [ ] Support contact info easily accessible

### Testing

- [ ] Error scenarios covered in tests
- [ ] Retry logic tested
- [ ] Fallback paths tested
- [ ] Error UI tested
- [ ] Recovery strategies validated

---

## Related Documentation

- [Production Operations](../../docs/13-lifecycle/PRODUCTION-OPERATIONS.md)
- [Monitoring Guide](../monitoring/README.md)
- [Logging Guide](../logging/README.md)
- [Testing Guide](../../docs/06-testing/TESTING-STRATEGY.md)
