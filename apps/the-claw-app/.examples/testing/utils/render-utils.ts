/**
 * Test Utilities - Render Helpers
 *
 * Custom render functions with providers for testing React Native components.
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react-native'
import { ThemeProvider } from '@/theme/ThemeContext'
import {
  TestProviderOptions,
  RenderWithProvidersOptions,
  MockAuthContext,
} from './types'
import { createMockUser, createMockSession } from './test-factories'

// ============================================================================
// RENDER WITH THEME
// ============================================================================

/**
 * Render component with ThemeProvider
 */
export function renderWithTheme(
  ui: ReactElement,
  options?: Omit<TestProviderOptions, 'authenticated' | 'user' | 'session'>
) {
  const { theme = 'light', providerProps = {} } = options || {}

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider initialTheme={theme} {...providerProps}>
        {children}
      </ThemeProvider>
    )
  }

  return render(ui, { wrapper: Wrapper })
}

// ============================================================================
// RENDER WITH ALL PROVIDERS
// ============================================================================

/**
 * Render component with all providers (Theme, Auth, Navigation)
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderWithProvidersOptions
) {
  const {
    theme = 'light',
    authenticated = false,
    user = null,
    session = null,
    initialRoute = '/',
    providerProps = {},
    ...renderOptions
  } = options || {}

  // Create mock auth context value
  const authContextValue: MockAuthContext = {
    user: authenticated ? user || createMockUser() : null,
    session: authenticated ? session || createMockSession() : null,
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    updateProfile: jest.fn(),
  }

  function AllProviders({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider initialTheme={theme}>
        {/* Add AuthProvider when available */}
        {/* <AuthProvider value={authContextValue}> */}
        {children}
        {/* </AuthProvider> */}
      </ThemeProvider>
    )
  }

  return render(ui, { wrapper: AllProviders, ...renderOptions })
}

// ============================================================================
// RENDER HOOK WITH PROVIDERS
// ============================================================================

/**
 * Render hook with providers
 */
export function renderHookWithProviders<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options?: TestProviderOptions
) {
  const { renderHook } = require('@testing-library/react-native')

  const {
    theme = 'light',
    authenticated = false,
    user = null,
    session = null,
  } = options || {}

  const authContextValue: MockAuthContext = {
    user: authenticated ? user || createMockUser() : null,
    session: authenticated ? session || createMockSession() : null,
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    updateProfile: jest.fn(),
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
  }

  return renderHook(hook, { wrapper: Wrapper })
}
