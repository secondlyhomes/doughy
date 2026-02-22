# Integration Testing Guide

## Overview

Integration tests verify that multiple parts of your system work together correctly. They test the contracts between your app and external services like Supabase, APIs, and databases.

## Types of Integration Tests

| Type | What it Tests | Speed |
|------|---------------|-------|
| API Integration | Your services + Supabase | Medium |
| Database Integration | RLS policies + queries | Medium |
| Auth Integration | Full auth flow | Slow |
| Edge Function Integration | Function + database | Medium |

## Setup

### Test Database

Use a separate Supabase project for testing, or use local Supabase:

```bash
# Start local Supabase
supabase start

# Run migrations
supabase db reset
```

### Test Configuration

```typescript
// src/__tests__/setup/testConfig.ts
export const TEST_CONFIG = {
  supabaseUrl: process.env.TEST_SUPABASE_URL || 'http://localhost:54321',
  supabaseAnonKey: process.env.TEST_SUPABASE_ANON_KEY || 'local-anon-key',
};

// Create test client
import { createClient } from '@supabase/supabase-js';

export const testSupabase = createClient(
  TEST_CONFIG.supabaseUrl,
  TEST_CONFIG.supabaseAnonKey
);
```

### Test Helpers

```typescript
// src/__tests__/setup/testHelpers.ts
import { testSupabase } from './testConfig';

export async function createTestUser(email = `test-${Date.now()}@example.com`) {
  const { data, error } = await testSupabase.auth.signUp({
    email,
    password: 'test-password-123',
  });
  if (error) throw error;
  return data.user;
}

export async function cleanupTestUser(userId: string) {
  await testSupabase.auth.admin.deleteUser(userId);
}

export async function cleanupTestData(tableName: string, userId: string) {
  await testSupabase
    .from(tableName)
    .delete()
    .eq('user_id', userId);
}
```

## Testing Patterns

### Service Integration Tests

```typescript
// src/services/__tests__/taskService.integration.test.ts
import { createTask, getTasks, updateTask, deleteTask } from '../taskService';
import { createTestUser, cleanupTestUser, cleanupTestData } from '@tests/setup/testHelpers';
import { testSupabase } from '@tests/setup/testConfig';

describe('TaskService Integration', () => {
  let testUser: any;
  let createdTaskIds: string[] = [];

  beforeAll(async () => {
    testUser = await createTestUser();
    // Login as test user
    await testSupabase.auth.signInWithPassword({
      email: testUser.email,
      password: 'test-password-123',
    });
  });

  afterAll(async () => {
    // Cleanup created tasks
    for (const id of createdTaskIds) {
      await deleteTask(id);
    }
    await cleanupTestUser(testUser.id);
  });

  describe('createTask', () => {
    it('creates task in database with correct user_id', async () => {
      const task = await createTask({
        title: 'Integration Test Task',
        description: 'Testing database integration',
      });

      createdTaskIds.push(task.id);

      expect(task.id).toBeDefined();
      expect(task.title).toBe('Integration Test Task');
      expect(task.user_id).toBe(testUser.id);
    });

    it('applies RLS - user can only see their own tasks', async () => {
      // Create task as test user
      const task = await createTask({ title: 'User A Task' });
      createdTaskIds.push(task.id);

      // Create another user
      const otherUser = await createTestUser();
      await testSupabase.auth.signInWithPassword({
        email: otherUser.email,
        password: 'test-password-123',
      });

      // Try to read first user's task
      const tasks = await getTasks();
      const foundTask = tasks.find(t => t.id === task.id);

      expect(foundTask).toBeUndefined();

      // Cleanup
      await cleanupTestUser(otherUser.id);
    });
  });

  describe('getTasks', () => {
    it('returns all tasks for current user', async () => {
      // Create multiple tasks
      const task1 = await createTask({ title: 'Task 1' });
      const task2 = await createTask({ title: 'Task 2' });
      createdTaskIds.push(task1.id, task2.id);

      const tasks = await getTasks();

      expect(tasks.length).toBeGreaterThanOrEqual(2);
      expect(tasks.some(t => t.id === task1.id)).toBe(true);
      expect(tasks.some(t => t.id === task2.id)).toBe(true);
    });

    it('orders tasks by created_at desc', async () => {
      const tasks = await getTasks();

      for (let i = 1; i < tasks.length; i++) {
        const prevDate = new Date(tasks[i - 1].created_at);
        const currDate = new Date(tasks[i].created_at);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });
  });

  describe('updateTask', () => {
    it('updates task fields', async () => {
      const task = await createTask({ title: 'Original Title' });
      createdTaskIds.push(task.id);

      const updated = await updateTask(task.id, {
        title: 'Updated Title',
        status: 'completed',
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.status).toBe('completed');
    });

    it('prevents updating other users tasks', async () => {
      const task = await createTask({ title: 'Protected Task' });
      createdTaskIds.push(task.id);

      // Switch to another user
      const otherUser = await createTestUser();
      await testSupabase.auth.signInWithPassword({
        email: otherUser.email,
        password: 'test-password-123',
      });

      // Try to update
      await expect(
        updateTask(task.id, { title: 'Hacked!' })
      ).rejects.toThrow();

      // Cleanup
      await cleanupTestUser(otherUser.id);
    });
  });
});
```

### Database Policy Tests

```typescript
// src/__tests__/integration/rls.test.ts
import { testSupabase } from '@tests/setup/testConfig';
import { createTestUser, cleanupTestUser } from '@tests/setup/testHelpers';

describe('RLS Policies', () => {
  describe('tasks table', () => {
    it('INSERT requires authentication', async () => {
      // Sign out
      await testSupabase.auth.signOut();

      const { error } = await testSupabase
        .from('tasks')
        .insert({ title: 'Unauthorized Task' });

      expect(error).toBeTruthy();
      expect(error?.code).toBe('42501'); // RLS violation
    });

    it('SELECT returns only user owned rows', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();

      // User 1 creates task
      await testSupabase.auth.signInWithPassword({
        email: user1.email,
        password: 'test-password-123',
      });
      await testSupabase.from('tasks').insert({ title: 'User 1 Task' });

      // User 2 queries
      await testSupabase.auth.signInWithPassword({
        email: user2.email,
        password: 'test-password-123',
      });
      const { data } = await testSupabase.from('tasks').select('*');

      // Should not see User 1's task
      expect(data?.find(t => t.title === 'User 1 Task')).toBeUndefined();

      // Cleanup
      await cleanupTestUser(user1.id);
      await cleanupTestUser(user2.id);
    });

    it('UPDATE only affects owned rows', async () => {
      const user = await createTestUser();
      await testSupabase.auth.signInWithPassword({
        email: user.email,
        password: 'test-password-123',
      });

      // Create task
      const { data: task } = await testSupabase
        .from('tasks')
        .insert({ title: 'My Task' })
        .select()
        .single();

      // Update own task - should work
      const { error } = await testSupabase
        .from('tasks')
        .update({ title: 'Updated' })
        .eq('id', task.id);

      expect(error).toBeNull();

      // Cleanup
      await cleanupTestUser(user.id);
    });
  });
});
```

### Edge Function Tests

```typescript
// src/__tests__/integration/edgeFunctions.test.ts
import { testSupabase } from '@tests/setup/testConfig';

describe('Edge Functions', () => {
  describe('process-task', () => {
    it('processes task with AI', async () => {
      const { data, error } = await testSupabase.functions.invoke('process-task', {
        body: { text: 'Buy groceries tomorrow' },
      });

      expect(error).toBeNull();
      expect(data).toMatchObject({
        title: expect.any(String),
        dueDate: expect.any(String),
      });
    });

    it('returns 401 without auth', async () => {
      await testSupabase.auth.signOut();

      const { error } = await testSupabase.functions.invoke('process-task', {
        body: { text: 'Test' },
      });

      expect(error?.message).toContain('401');
    });

    it('respects rate limits', async () => {
      const requests = Array(15).fill(null).map(() =>
        testSupabase.functions.invoke('process-task', {
          body: { text: 'Rate limit test' },
        })
      );

      const results = await Promise.all(requests);
      const rateLimited = results.filter(r =>
        r.error?.message?.includes('429')
      );

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
```

### Auth Flow Tests

```typescript
// src/__tests__/integration/auth.test.ts
import { testSupabase } from '@tests/setup/testConfig';

describe('Auth Integration', () => {
  const testEmail = `auth-test-${Date.now()}@example.com`;
  const testPassword = 'secure-password-123';

  describe('signup flow', () => {
    it('creates user account', async () => {
      const { data, error } = await testSupabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      expect(error).toBeNull();
      expect(data.user).toBeTruthy();
      expect(data.user?.email).toBe(testEmail);
    });

    it('rejects weak passwords', async () => {
      const { error } = await testSupabase.auth.signUp({
        email: 'weak@example.com',
        password: '123',
      });

      expect(error).toBeTruthy();
    });

    it('rejects duplicate emails', async () => {
      const { error } = await testSupabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      expect(error?.message).toContain('already registered');
    });
  });

  describe('login flow', () => {
    it('logs in with valid credentials', async () => {
      const { data, error } = await testSupabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      expect(error).toBeNull();
      expect(data.session).toBeTruthy();
    });

    it('rejects invalid credentials', async () => {
      const { error } = await testSupabase.auth.signInWithPassword({
        email: testEmail,
        password: 'wrong-password',
      });

      expect(error).toBeTruthy();
    });
  });

  describe('session management', () => {
    it('refreshes session', async () => {
      const { data, error } = await testSupabase.auth.refreshSession();

      expect(error).toBeNull();
      expect(data.session).toBeTruthy();
    });

    it('signs out successfully', async () => {
      await testSupabase.auth.signOut();

      const { data } = await testSupabase.auth.getSession();
      expect(data.session).toBeNull();
    });
  });
});
```

## Running Integration Tests

```bash
# Start local Supabase first
supabase start

# Run integration tests
npm test -- --testPathPattern=integration

# With coverage
npm test -- --testPathPattern=integration --coverage

# Specific test file
npm test -- taskService.integration.test.ts
```

## CI Configuration

```yaml
# .github/workflows/integration.yml
name: Integration Tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  integration:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: supabase/postgres:15.1.0.55
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Start Supabase
        run: supabase start

      - name: Run migrations
        run: supabase db reset

      - name: Run integration tests
        run: npm test -- --testPathPattern=integration
        env:
          TEST_SUPABASE_URL: http://localhost:54321
          TEST_SUPABASE_ANON_KEY: ${{ secrets.TEST_ANON_KEY }}
```

## Best Practices

### 1. Isolate Test Data

```typescript
// Each test creates its own data
beforeEach(async () => {
  testUser = await createTestUser();
});

afterEach(async () => {
  await cleanupTestData('tasks', testUser.id);
  await cleanupTestUser(testUser.id);
});
```

### 2. Test Real Behavior

```typescript
// GOOD - Test actual database behavior
const { data } = await supabase.from('tasks').select('*');
expect(data).toHaveLength(2);

// BAD - Mock everything
jest.mock('@supabase/supabase-js');
```

### 3. Handle Async Properly

```typescript
// Use proper async/await
it('creates task', async () => {
  const task = await createTask({ title: 'Test' });
  expect(task.id).toBeDefined();
});
```

### 4. Clean Up After Tests

```typescript
afterAll(async () => {
  // Always clean up test data
  await testSupabase.from('tasks').delete().eq('user_id', testUser.id);
  await cleanupTestUser(testUser.id);
  await testSupabase.auth.signOut();
});
```

## Checklist

- [ ] Separate test database/project configured
- [ ] Test helpers for user creation/cleanup
- [ ] Service integration tests cover CRUD
- [ ] RLS policies tested for each table
- [ ] Edge functions tested with auth
- [ ] Auth flows tested (signup, login, refresh)
- [ ] CI runs integration tests
- [ ] Test data cleaned up after each run
