# Logging Best Practices

## Overview

Effective logging is essential for debugging, monitoring, and understanding production systems. This guide covers logging strategies, what to log, how to structure logs, and integration with log aggregation services.

## Table of Contents

1. [Logger Setup](#logger-setup)
2. [What to Log](#what-to-log)
3. [Log Levels](#log-levels)
4. [Structured Logging](#structured-logging)
5. [Performance Logging](#performance-logging)
6. [Log Aggregation](#log-aggregation)
7. [Privacy and Security](#privacy-and-security)
8. [Best Practices](#best-practices)

---

## Logger Setup

### Initialize Logger

```tsx
import { logger } from '.examples/production/logging/Logger';

// Initialize in App.tsx
useEffect(() => {
  // Configure logger
  logger.setUserId(user?.id);

  // Cleanup on unmount
  return () => {
    logger.destroy();
  };
}, [user]);
```

### Configure for Environment

```tsx
import { Logger, LogLevel } from '.examples/production/logging/Logger';

// Development configuration
const devLogger = Logger.getInstance({
  minLevel: LogLevel.DEBUG,
  enableConsole: true,
  enableFile: false,
  enableRemote: false,
});

// Production configuration
const prodLogger = Logger.getInstance({
  minLevel: LogLevel.INFO,
  enableConsole: false,
  enableFile: true,
  enableRemote: true,
  remoteUrl: 'https://api.example.com/logs',
  sampleRate: 0.1, // Sample 10% of logs
  filterPII: true,
});

// Use the appropriate logger
export const logger = __DEV__ ? devLogger : prodLogger;
```

---

## What to Log

### DO Log

#### 1. User Actions

```tsx
import { StructuredLogger } from '.examples/production/logging/Logger';

function TaskCard({ task }) {
  const handleComplete = async () => {
    StructuredLogger.userAction('task_completed', {
      taskId: task.id,
      taskTitle: task.title,
      completionTime: Date.now(),
    });

    await completeTask(task.id);
  };

  return <Button onPress={handleComplete}>Complete</Button>;
}
```

#### 2. API Calls

```tsx
async function fetchTasks(): Promise<Task[]> {
  StructuredLogger.apiCall('GET', '/tasks', {
    timestamp: Date.now(),
  });

  try {
    const { data, error } = await supabase.from('tasks').select('*');

    if (error) {
      logger.error('API call failed', error, {
        endpoint: '/tasks',
        method: 'GET',
      });
      throw error;
    }

    StructuredLogger.apiCall('GET', '/tasks', {
      status: 'success',
      recordCount: data.length,
      duration: Date.now() - startTime,
    });

    return data;
  } catch (error) {
    logger.error('Failed to fetch tasks', error);
    throw error;
  }
}
```

#### 3. Navigation Events

```tsx
function useNavigationLogging() {
  const navigation = useNavigation();
  const routeNameRef = useRef<string>();

  useEffect(() => {
    const unsubscribe = navigation.addListener('state', () => {
      const currentRoute = navigation.getCurrentRoute();
      const currentRouteName = currentRoute?.name;

      if (routeNameRef.current !== currentRouteName) {
        StructuredLogger.navigation(
          routeNameRef.current || 'none',
          currentRouteName || 'none',
          {
            params: currentRoute?.params,
          }
        );

        logger.setScreen(currentRouteName || 'unknown');
        routeNameRef.current = currentRouteName;
      }
    });

    return unsubscribe;
  }, [navigation]);
}
```

#### 4. Authentication Events

```tsx
async function signIn(email: string, password: string) {
  StructuredLogger.auth('sign_in_attempt', { email });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      StructuredLogger.auth('sign_in_failed', {
        error: error.message,
        email,
      });
      throw error;
    }

    StructuredLogger.auth('sign_in_success', {
      userId: data.user.id,
    });

    logger.setUserId(data.user.id);

    return data;
  } catch (error) {
    logger.error('Sign in failed', error);
    throw error;
  }
}
```

#### 5. Database Operations

```tsx
async function createTask(task: Partial<Task>): Promise<Task> {
  StructuredLogger.database('insert', 'tasks', {
    taskData: task,
  });

  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) {
      logger.error('Database insert failed', error, {
        table: 'tasks',
        operation: 'insert',
      });
      throw error;
    }

    StructuredLogger.database('insert', 'tasks', {
      status: 'success',
      taskId: data.id,
    });

    return data;
  } catch (error) {
    logger.error('Failed to create task', error);
    throw error;
  }
}
```

#### 6. Errors and Exceptions

```tsx
try {
  await riskyOperation();
} catch (error) {
  logger.error('Risky operation failed', error, {
    context: 'user_profile_update',
    userId: user.id,
    attemptCount: 3,
  });

  // Re-throw or handle
  throw error;
}
```

#### 7. Business Events

```tsx
async function purchaseSubscription(plan: string) {
  StructuredLogger.business('subscription_purchased', {
    plan,
    userId: user.id,
    price: getPlanPrice(plan),
    timestamp: Date.now(),
  });

  // Process purchase...
}
```

#### 8. Performance Metrics

```tsx
import { performanceLogger } from '.examples/production/logging/Logger';

async function loadHeavyData() {
  performanceLogger.start('load_heavy_data');

  const data = await fetchLargeDataset();

  performanceLogger.end('load_heavy_data', {
    recordCount: data.length,
    dataSizeBytes: JSON.stringify(data).length,
  });

  return data;
}

// Or use the measure helper
async function processData() {
  return await performanceLogger.measureAsync('process_data', async () => {
    // Heavy processing
    return result;
  });
}
```

### DO NOT Log

#### 1. Sensitive Information

```tsx
// BAD: Logs password in plain text
logger.info('User login', {
  email: 'user@example.com',
  password: 'secret123', // ❌ Never log passwords
});

// GOOD: Omit sensitive data
logger.info('User login', {
  email: 'user@example.com',
});
```

#### 2. Personal Identifiable Information (PII)

```tsx
// BAD: Logs PII without consent
logger.debug('User data', {
  ssn: '123-45-6789', // ❌
  creditCard: '4111-1111-1111-1111', // ❌
  phoneNumber: '+1-555-1234', // ❌
});

// GOOD: Hash or omit PII
logger.debug('User data', {
  userIdHash: hashUserId(userId),
  hasPaymentMethod: true,
});
```

#### 3. Tokens and API Keys

```tsx
// BAD: Logs auth tokens
logger.debug('API request', {
  accessToken: 'eyJhbGciOiJIUzI1NiIs...', // ❌
  apiKey: 'sk_live_abc123...', // ❌
});

// GOOD: Omit tokens
logger.debug('API request', {
  endpoint: '/api/data',
  hasAuth: true,
});
```

#### 4. Large Payloads

```tsx
// BAD: Logs entire large payload
logger.debug('Response received', {
  data: hugeArray, // ❌ Can fill up logs
});

// GOOD: Log summary
logger.debug('Response received', {
  recordCount: hugeArray.length,
  sampleRecord: hugeArray[0],
  dataSizeBytes: JSON.stringify(hugeArray).length,
});
```

#### 5. Redundant Information

```tsx
// BAD: Too verbose, logs every iteration
for (const item of items) {
  logger.debug('Processing item', { item }); // ❌ Spam
}

// GOOD: Log summary
logger.debug('Processing items', {
  totalItems: items.length,
});

// Optionally log progress for long operations
if (items.length > 100) {
  logger.info('Processing progress', {
    processed: processedCount,
    total: items.length,
    percentage: (processedCount / items.length) * 100,
  });
}
```

---

## Log Levels

### Choosing the Right Level

```tsx
// TRACE: Very detailed, typically only enabled in development
logger.trace('Entering function', { params });

// DEBUG: Diagnostic information useful for debugging
logger.debug('Cache hit', { key, value });

// INFO: Important business events and milestones
logger.info('User registered', { userId, email });

// WARN: Potentially harmful situations that aren't errors
logger.warn('API rate limit approaching', {
  current: 950,
  limit: 1000,
});

// ERROR: Errors that don't stop the application
logger.error('Failed to send email', error, {
  recipient: email,
  template: 'welcome',
});

// FATAL: Severe errors that might cause app crash
logger.fatal('Database connection lost', error, {
  connectionString: redacted,
});
```

### Level Guidelines

| Level | When to Use | Examples |
|-------|-------------|----------|
| **TRACE** | Detailed flow tracing | Function entry/exit, variable values |
| **DEBUG** | Debugging information | Cache operations, conditional logic |
| **INFO** | Important events | User actions, business events |
| **WARN** | Potential issues | Deprecations, approaching limits |
| **ERROR** | Recoverable errors | API failures, validation errors |
| **FATAL** | Critical failures | DB connection lost, system crash |

---

## Structured Logging

### Use Structured Data

```tsx
// BAD: Unstructured string
logger.info(`User ${userId} completed task ${taskId} in ${duration}ms`);

// GOOD: Structured object
logger.info('Task completed', {
  userId,
  taskId,
  duration,
  timestamp: Date.now(),
});
```

### Benefits of Structured Logging

1. **Easy Filtering**: Filter logs by specific fields
2. **Better Searching**: Find logs with specific values
3. **Aggregation**: Group and analyze logs
4. **Alerting**: Set up alerts on specific field values

### Consistent Field Names

```tsx
// Define standard fields
const LogFields = {
  USER_ID: 'userId',
  TASK_ID: 'taskId',
  DURATION: 'duration',
  TIMESTAMP: 'timestamp',
  ERROR_CODE: 'errorCode',
  STATUS: 'status',
} as const;

// Use consistently
logger.info('Task created', {
  [LogFields.USER_ID]: user.id,
  [LogFields.TASK_ID]: task.id,
  [LogFields.TIMESTAMP]: Date.now(),
});
```

---

## Performance Logging

### Track Operation Duration

```tsx
import { performanceLogger } from '.examples/production/logging/Logger';

// Method 1: Manual timing
function processData(data: any[]) {
  performanceLogger.start('process_data');

  try {
    // Process data
    const result = transform(data);

    performanceLogger.end('process_data', {
      inputSize: data.length,
      outputSize: result.length,
    });

    return result;
  } catch (error) {
    performanceLogger.end('process_data', {
      error: true,
      errorMessage: error.message,
    });
    throw error;
  }
}

// Method 2: Automatic with measure
async function loadUserData() {
  return await performanceLogger.measureAsync('load_user_data', async () => {
    const data = await fetchUserData();
    return data;
  });
}
```

### Track Render Performance

```tsx
function ExpensiveComponent() {
  useEffect(() => {
    performanceLogger.start('render_expensive_component');

    return () => {
      performanceLogger.end('render_expensive_component');
    };
  }, []);

  return <View>{/* Complex UI */}</View>;
}
```

### Track Network Requests

```tsx
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const startTime = Date.now();

  try {
    const response = await fetch(endpoint, options);
    const duration = Date.now() - startTime;

    logger.info('API request completed', {
      endpoint,
      method: options?.method || 'GET',
      status: response.status,
      duration,
    });

    // Alert on slow requests
    if (duration > 2000) {
      logger.warn('Slow API request', {
        endpoint,
        duration,
      });
    }

    return await response.json();
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('API request failed', error, {
      endpoint,
      duration,
    });

    throw error;
  }
}
```

---

## Log Aggregation

### Integration with Log Services

#### 1. LogRocket

```tsx
import LogRocket from '@logrocket/react-native';

// Initialize LogRocket
LogRocket.init('your-app-id');

// Identify user
LogRocket.identify(user.id, {
  name: user.name,
  email: user.email,
});

// Integrate with logger
const originalLog = logger.info;
logger.info = (message, metadata) => {
  originalLog.call(logger, message, metadata);
  LogRocket.log(message, metadata);
};
```

#### 2. DataDog

```tsx
import { DdLogs } from '@datadog/mobile-react-native';

// Initialize DataDog
DdLogs.init({
  clientToken: 'your-client-token',
  environment: 'production',
  applicationId: 'your-app-id',
  trackInteractions: true,
  trackResources: true,
  trackErrors: true,
});

// Send logs to DataDog
DdLogs.debug('Message', {
  context: metadata,
});
```

#### 3. Sentry Breadcrumbs

```tsx
import * as Sentry from '@sentry/react-native';

// Log as breadcrumb
Sentry.addBreadcrumb({
  category: 'user-action',
  message: 'User completed task',
  level: 'info',
  data: {
    taskId: task.id,
  },
});
```

### Custom Log Backend

```tsx
// Backend endpoint to receive logs
// POST /api/logs
export async function handleLogSubmission(req, res) {
  const { level, message, timestamp, context, metadata } = req.body;

  // Store in database
  await db.logs.create({
    level,
    message,
    timestamp,
    userId: context.userId,
    sessionId: context.sessionId,
    metadata: JSON.stringify(metadata),
  });

  // Index in ElasticSearch for fast querying
  await elasticsearch.index({
    index: 'app-logs',
    body: {
      level,
      message,
      timestamp,
      context,
      metadata,
    },
  });

  res.status(200).json({ success: true });
}
```

### Log Querying

```tsx
// Get recent errors
const recentErrors = await logger.getLogs({
  level: LogLevel.ERROR,
  limit: 100,
});

// Get logs for time range
const logsToday = await logger.getLogs({
  startTime: Date.now() - 24 * 60 * 60 * 1000,
  endTime: Date.now(),
});

// Export all logs
const allLogs = await logger.exportLogs();
```

---

## Privacy and Security

### PII Filtering

```tsx
// Configure automatic PII filtering
const logger = Logger.getInstance({
  filterPII: true, // Automatically redact known PII fields
});

// Custom PII filter
function sanitizeLogs(data: Record<string, any>): Record<string, any> {
  const piiPatterns = {
    email: /[\w.-]+@[\w.-]+\.\w+/g,
    phone: /\d{3}-\d{3}-\d{4}/g,
    ssn: /\d{3}-\d{2}-\d{4}/g,
    creditCard: /\d{4}-\d{4}-\d{4}-\d{4}/g,
  };

  let sanitized = JSON.stringify(data);

  for (const [key, pattern] of Object.entries(piiPatterns)) {
    sanitized = sanitized.replace(pattern, `[REDACTED_${key.toUpperCase()}]`);
  }

  return JSON.parse(sanitized);
}
```

### User Consent

```tsx
// Only enable logging with user consent
function App() {
  const [loggingEnabled, setLoggingEnabled] = useState(false);

  useEffect(() => {
    // Check user preference
    AsyncStorage.getItem('logging_consent').then((consent) => {
      setLoggingEnabled(consent === 'true');
    });
  }, []);

  useEffect(() => {
    if (!loggingEnabled) {
      // Disable remote logging
      logger.config.enableRemote = false;
    }
  }, [loggingEnabled]);

  return <App />;
}
```

### Data Retention

```tsx
// Clear old logs periodically
async function cleanupOldLogs() {
  const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const logs = await logger.getLogs();
  const recentLogs = logs.filter((log) => log.timestamp > oneMonthAgo);

  // Keep only recent logs
  await logger.clearLogs();

  // Re-write recent logs
  for (const log of recentLogs) {
    // Re-log
  }
}
```

---

## Best Practices

### 1. Use Correlation IDs

```tsx
// Generate correlation ID for request tracing
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36)}`;
}

async function handleUserRequest() {
  const correlationId = generateCorrelationId();

  logger.info('Request started', { correlationId });

  try {
    await processRequest();
    logger.info('Request completed', { correlationId });
  } catch (error) {
    logger.error('Request failed', error, { correlationId });
  }
}
```

### 2. Log at Boundaries

```tsx
// Log at system boundaries (API calls, DB operations, external services)
async function fetchUserData(userId: string) {
  logger.debug('Fetching user data', { userId, boundary: 'api' });

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    logger.error('Failed to fetch user data', error, {
      userId,
      boundary: 'api',
    });
    throw error;
  }

  logger.debug('User data fetched', {
    userId,
    boundary: 'api',
    recordSize: JSON.stringify(data).length,
  });

  return data;
}
```

### 3. Context Scoping

```tsx
// Set context for a block of operations
function processUserData(userId: string) {
  logger.setUserId(userId);
  logger.setAction('process_user_data');

  try {
    // All logs in this scope will include userId and action
    logger.info('Processing started');
    performProcessing();
    logger.info('Processing completed');
  } finally {
    logger.clearAction();
  }
}
```

### 4. Sampling in Production

```tsx
// Sample logs to reduce volume in production
const logger = Logger.getInstance({
  // Sample 10% of INFO logs, 100% of errors
  sampleRate: 0.1,
  minLevel: LogLevel.INFO,
});

// Always log errors regardless of sample rate
if (error) {
  logger.error('Error occurred', error); // Always logged
} else {
  logger.info('Operation succeeded'); // 10% sampled
}
```

### 5. Lazy Evaluation

```tsx
// Avoid expensive operations if log won't be written
function expensiveDataExtraction() {
  // Expensive operation
  return JSON.stringify(largeObject);
}

// BAD: Always runs expensive operation
logger.debug('Data', { data: expensiveDataExtraction() });

// GOOD: Only runs if debug logging is enabled
if (logger.config.minLevel <= LogLevel.DEBUG) {
  logger.debug('Data', { data: expensiveDataExtraction() });
}
```

---

## Checklist

### Setup

- [ ] Logger initialized in app entry point
- [ ] Log levels configured per environment
- [ ] User ID set after authentication
- [ ] Screen tracking enabled for navigation
- [ ] Performance logging enabled for key operations

### Content

- [ ] User actions logged
- [ ] API calls logged with timing
- [ ] Navigation events logged
- [ ] Database operations logged
- [ ] Errors logged with context
- [ ] Business events logged

### Privacy

- [ ] PII filtering enabled
- [ ] Sensitive data not logged
- [ ] User consent obtained for analytics
- [ ] Data retention policy implemented
- [ ] Logs sanitized before remote transmission

### Performance

- [ ] Log sampling configured for production
- [ ] Lazy evaluation used for expensive operations
- [ ] Log rotation configured
- [ ] File size limits set
- [ ] Flush interval optimized

### Integration

- [ ] Remote logging service configured
- [ ] Error tracking integrated (Sentry)
- [ ] Log aggregation service setup
- [ ] Alerts configured for critical errors
- [ ] Log export functionality available

---

## Related Documentation

- [Production Operations](../../docs/13-lifecycle/PRODUCTION-OPERATIONS.md)
- [Error Handling](../error-handling/README.md)
- [Monitoring Guide](../monitoring/README.md)
- [Security Best Practices](../../docs/09-security/SECURITY-CHECKLIST.md)
