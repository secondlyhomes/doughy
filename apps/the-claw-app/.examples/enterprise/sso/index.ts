/**
 * SSO Module
 *
 * Single Sign-On (SSO) authentication for enterprise applications.
 * Supports SAML 2.0, OAuth 2.0, and OpenID Connect (OIDC).
 *
 * Usage:
 * ```tsx
 * import { SSOProvider, useSSO } from './sso'
 *
 * // Wrap your app
 * function App() {
 *   return (
 *     <SSOProvider>
 *       <LoginScreen />
 *     </SSOProvider>
 *   )
 * }
 *
 * // Use in components
 * function LoginScreen() {
 *   const { signInWithSSO, loading } = useSSO()
 *
 *   const handleLogin = async (email: string) => {
 *     await signInWithSSO(email)
 *   }
 *
 *   return <Button onPress={() => handleLogin('user@company.com')} />
 * }
 * ```
 */

// Context and Provider
export { SSOProvider, SSOContext } from './SSOProvider'

// Consumer Hook
export { useSSO } from './useSSO'

// Types
export type {
  SSOProviderType,
  SAMLSettings,
  OAuthSettings,
  OIDCSettings,
  SSOProvider as SSOProviderConfig,
  SSOUserInfo,
  SSOTokens,
  SSOSession,
  CreateProviderParams,
  SSOContextValue,
} from './types'

// Provider implementations (for advanced use cases)
export {
  signInWithSAML,
  handleSAMLResponse,
  generateSAMLRequest,
} from './providers/saml'

export {
  signInWithOAuth,
  handleOAuthCode,
} from './providers/oauth'

export {
  signInWithOIDC,
  handleOIDCCallback,
  generateCodeVerifier,
  generateCodeChallenge,
} from './providers/oidc'
