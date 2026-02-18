/**
 * SSO Types
 *
 * Type definitions for Single Sign-On (SSO) authentication.
 * Supports SAML 2.0, OAuth 2.0, and OpenID Connect (OIDC).
 */

// ============================================================================
// PROVIDER TYPES
// ============================================================================

export type SSOProviderType = 'saml' | 'oauth' | 'oidc'

export interface SAMLSettings {
  ssoUrl: string
  entityId: string
  certificate: string
  signRequests?: boolean
  wantAssertionsSigned?: boolean
}

export interface OAuthSettings {
  authorizationUrl: string
  tokenUrl: string
  clientId: string
  clientSecret?: string
  scope: string
  userInfoUrl?: string
}

export interface OIDCSettings {
  issuer: string
  authorizationUrl: string
  tokenUrl: string
  userInfoUrl: string
  jwksUrl: string
  clientId: string
  clientSecret?: string
  scope: string
}

export interface SSOProvider {
  id: string
  organization_id: string
  type: SSOProviderType
  name: string
  domain: string // e.g., 'company.com'
  enabled: boolean
  settings: SAMLSettings | OAuthSettings | OIDCSettings
  created_at: string
  updated_at: string
}

// ============================================================================
// SESSION TYPES
// ============================================================================

export interface SSOUserInfo {
  email: string
  name: string
  attributes: Record<string, any>
}

export interface SSOTokens {
  access_token: string
  id_token?: string
  refresh_token?: string
}

export interface SSOSession {
  provider: SSOProvider
  user: SSOUserInfo
  assertion?: string
  tokens?: SSOTokens
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface CreateProviderParams {
  type: SSOProviderType
  name: string
  domain: string
  settings: SAMLSettings | OAuthSettings | OIDCSettings
}

export interface SSOContextValue {
  // State
  providers: SSOProvider[]
  currentSession: SSOSession | null
  loading: boolean
  error: Error | null

  // SSO operations
  detectProvider: (email: string) => Promise<SSOProvider | null>
  signInWithSSO: (email: string) => Promise<void>
  signInWithSAML: (provider: SSOProvider) => Promise<void>
  signInWithOAuth: (provider: SSOProvider) => Promise<void>
  signInWithOIDC: (provider: SSOProvider) => Promise<void>
  handleCallback: (url: string) => Promise<void>

  // Provider management (admin only)
  createProvider: (params: CreateProviderParams) => Promise<SSOProvider>
  updateProvider: (id: string, updates: Partial<CreateProviderParams>) => Promise<void>
  deleteProvider: (id: string) => Promise<void>
  testProvider: (id: string) => Promise<boolean>

  // Utilities
  refreshProviders: () => Promise<void>
}
