/**
 * Test Utilities - Factory Functions
 *
 * Factory functions for creating test data, mock entities, and fixtures.
 */

import { TestUser, TestSession, TestTask, MockSupabaseResponse } from './types'

// ============================================================================
// USER & SESSION FACTORIES
// ============================================================================

/**
 * Create mock user
 */
export function createMockUser(overrides?: Partial<TestUser>): TestUser {
  return {
    id: `user-${Math.random().toString(36).substr(2, 9)}`,
    email: `test-${Math.random().toString(36).substr(2, 5)}@example.com`,
    first_name: 'Test',
    last_name: 'User',
    avatar_url: 'https://example.com/avatar.jpg',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create mock session
 */
export function createMockSession(overrides?: Partial<TestSession>): TestSession {
  const user = overrides?.user || createMockUser()

  return {
    access_token: `token-${Math.random().toString(36).substr(2, 20)}`,
    refresh_token: `refresh-${Math.random().toString(36).substr(2, 20)}`,
    expires_at: Date.now() + 3600000, // 1 hour from now
    user,
    ...overrides,
  }
}

// ============================================================================
// TASK FACTORIES
// ============================================================================

/**
 * Create mock task
 */
export function createMockTask(overrides?: Partial<TestTask>): TestTask {
  return {
    id: `task-${Math.random().toString(36).substr(2, 9)}`,
    title: `Test Task ${Math.random().toString(36).substr(2, 5)}`,
    description: 'This is a test task description',
    completed: false,
    user_id: `user-${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create multiple mock tasks
 */
export function createMockTasks(count: number, overrides?: Partial<TestTask>): TestTask[] {
  return Array.from({ length: count }, (_, index) =>
    createMockTask({
      title: `Task ${index + 1}`,
      ...overrides,
    })
  )
}

// ============================================================================
// SUPABASE RESPONSE FACTORIES
// ============================================================================

/**
 * Create mock Supabase response
 */
export function createMockSupabaseResponse<T>(
  data: T | null,
  error: { message: string } | null = null
): MockSupabaseResponse<T> {
  return {
    data,
    error,
    count: null,
    status: error ? 400 : 200,
    statusText: error ? 'Bad Request' : 'OK',
  }
}

/**
 * Create successful Supabase response
 */
export function createSuccessResponse<T>(data: T): MockSupabaseResponse<T> {
  return createMockSupabaseResponse(data, null)
}

/**
 * Create error Supabase response
 */
export function createErrorResponse<T>(message: string): MockSupabaseResponse<T> {
  return createMockSupabaseResponse<T>(null, { message })
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Measure render time
 */
export async function measureRenderTime(
  renderFn: () => void
): Promise<{ duration: number; result: any }> {
  const startTime = performance.now()
  const result = renderFn()
  const endTime = performance.now()

  return {
    duration: endTime - startTime,
    result,
  }
}

/**
 * Measure async operation time
 */
export async function measureAsyncTime<T>(
  fn: () => Promise<T>
): Promise<{ duration: number; result: T }> {
  const startTime = performance.now()
  const result = await fn()
  const endTime = performance.now()

  return {
    duration: endTime - startTime,
    result,
  }
}

// ============================================================================
// SNAPSHOT UTILITIES
// ============================================================================

/**
 * Create snapshot with custom serializer
 */
export function createSnapshot(component: any, options?: { removeProps?: string[] }) {
  const { removeProps = [] } = options || {}

  const json = JSON.parse(JSON.stringify(component))

  // Remove specified props recursively
  function removePropsRecursive(obj: any) {
    if (typeof obj !== 'object' || obj === null) return

    removeProps.forEach((prop) => {
      delete obj[prop]
    })

    if (obj.children) {
      if (Array.isArray(obj.children)) {
        obj.children.forEach(removePropsRecursive)
      } else {
        removePropsRecursive(obj.children)
      }
    }

    if (obj.props?.children) {
      removePropsRecursive(obj.props.children)
    }
  }

  removePropsRecursive(json)
  return json
}
