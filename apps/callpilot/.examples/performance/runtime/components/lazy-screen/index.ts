/**
 * LazyScreen Module
 *
 * Exports for lazy loading screen components.
 *
 * @example
 * ```tsx
 * import {
 *   lazyScreen,
 *   preloadScreen,
 *   usePreloadScreen,
 *   usePreloadScreenOnVisible,
 *   LoadingFallback,
 *   ErrorFallback,
 * } from './lazy-screen'
 *
 * const ProfileScreen = lazyScreen(() => import('./screens/profile-screen'))
 * ```
 */

// Main exports
export { lazyScreen, preloadScreen } from './LazyScreen'

// Hooks
export { usePreloadScreen, usePreloadScreenOnVisible } from './hooks/useLazyScreen'

// Components
export { LoadingFallback } from './components/LoadingFallback'
export { ErrorFallback } from './components/ErrorFallback'
export { ErrorBoundary } from './components/ErrorBoundary'

// Types
export type {
  LazyScreenOptions,
  ErrorFallbackProps,
  ErrorBoundaryProps,
  ErrorBoundaryState,
  LazyImportFn,
} from './types'
