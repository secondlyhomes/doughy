/**
 * SSOProvider.tsx
 *
 * Single Sign-On (SSO) context provider for enterprise authentication.
 * Supports SAML 2.0, OAuth 2.0, and OpenID Connect (OIDC).
 *
 * Features:
 * - SAML authentication (Okta, Azure AD, OneLogin)
 * - OAuth 2.0 (Google Workspace, GitHub)
 * - OIDC (Auth0, Keycloak)
 * - Just-In-Time (JIT) user provisioning
 * - Domain-based provider detection
 *
 * Usage:
 * ```tsx
 * import { SSOProvider, useSSO } from './sso'
 *
 * // Wrap your app
 * <SSOProvider>
 *   <App />
 * </SSOProvider>
 *
 * // Use in components
 * const { signInWithSSO } = useSSO()
 * await signInWithSSO('user@company.com')
 * ```
 */

import React, { createContext } from 'react'
import type { SSOContextValue } from './types'
import { useSSOAuth } from './hooks/useSSOAuth'

// ============================================================================
// CONTEXT
// ============================================================================

export const SSOContext = createContext<SSOContextValue | undefined>(undefined)

// ============================================================================
// PROVIDER
// ============================================================================

interface SSOProviderProps {
  children: React.ReactNode
}

export function SSOProvider({ children }: SSOProviderProps) {
  const ssoAuth = useSSOAuth()

  return (
    <SSOContext.Provider value={ssoAuth}>
      {children}
    </SSOContext.Provider>
  )
}
