/**
 * ErrorBoundary Component
 *
 * Catches errors in lazy-loaded components and displays fallback UI.
 */

import React from 'react'
import type { ErrorBoundaryProps, ErrorBoundaryState } from '../types'

/**
 * Error boundary for lazy screen components
 *
 * Catches rendering errors and displays a fallback UI with retry option.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyScreen error:', error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback
      return <Fallback error={this.state.error} retry={this.retry} />
    }

    return this.props.children
  }
}
