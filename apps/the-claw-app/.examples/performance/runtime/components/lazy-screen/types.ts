/**
 * LazyScreen Types
 *
 * Type definitions for lazy loading screen components.
 */

import type { ComponentType, ReactElement } from 'react'

/**
 * Options for lazy screen loading
 */
export interface LazyScreenOptions {
  /**
   * Custom loading component
   */
  fallback?: ReactElement

  /**
   * Custom error component
   */
  errorFallback?: ComponentType<ErrorFallbackProps>

  /**
   * Preload screen when certain conditions are met
   */
  preloadWhen?: () => boolean

  /**
   * Retry loading on error
   */
  enableRetry?: boolean
}

/**
 * Props for error fallback components
 */
export interface ErrorFallbackProps {
  error: Error
  retry: () => void
}

/**
 * Props for ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  fallback: ComponentType<ErrorFallbackProps>
  children: React.ReactNode
}

/**
 * State for ErrorBoundary component
 */
export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Import function type for lazy loading
 */
export type LazyImportFn<T extends ComponentType<any>> = () => Promise<{
  [key: string]: T
}>
