/**
 * Test Utilities
 *
 * Shared utilities for testing across the application:
 * - Custom render functions with providers
 * - Mock data generators
 * - Common test helpers
 * - Async utilities
 * - Mock factories
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  TestProviderOptions,
  TestUser,
  TestSession,
  TestTask,
  MockSupabaseResponse,
  RenderWithProvidersOptions,
  MockNavigation,
  MockRoute,
  MockAuthContext,
} from './types'

// ============================================================================
// RENDER UTILITIES
// ============================================================================

export {
  renderWithTheme,
  renderWithProviders,
  renderHookWithProviders,
} from './render-utils'

// Re-export renderWithProviders as 'render' for convenience
export { renderWithProviders as render } from './render-utils'

// ============================================================================
// MOCK UTILITIES
// ============================================================================

export {
  createMockNavigation,
  createMockRoute,
  createMockSupabaseClient,
} from './mock-utils'

// ============================================================================
// ASYNC UTILITIES & ASSERTIONS
// ============================================================================

export {
  waitForNextTick,
  flushPromises,
  wait,
  waitForCondition,
  assertVisible,
  assertHasText,
  assertDisabled,
  assertEnabled,
  assertCalledWithMatch,
} from './async-utils'

// ============================================================================
// TEST FACTORIES
// ============================================================================

export {
  createMockUser,
  createMockSession,
  createMockTask,
  createMockTasks,
  createMockSupabaseResponse,
  createSuccessResponse,
  createErrorResponse,
  measureRenderTime,
  measureAsyncTime,
  createSnapshot,
} from './test-factories'

// ============================================================================
// RE-EXPORTS FROM TESTING LIBRARY
// ============================================================================

export * from '@testing-library/react-native'
