/**
 * OAuth 2.0 Authentication Provider
 *
 * Handles OAuth 2.0 authentication flow for SSO.
 */

import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { supabase } from '../../services/supabase'
import type { SSOProvider, OAuthSettings, SSOSession, SSOUserInfo } from '../types'

// ============================================================================
// UTILITIES
// ============================================================================

export function generateState(): string {
  return Math.random().toString(36).substring(7)
}

// ============================================================================
// OAUTH SIGN-IN FLOW
// ============================================================================

export async function signInWithOAuth(
  provider: SSOProvider,
  onCallback: (url: string) => Promise<void>
): Promise<void> {
  const settings = provider.settings as OAuthSettings

  const params = new URLSearchParams({
    client_id: settings.clientId,
    redirect_uri: Linking.createURL('sso/callback'),
    response_type: 'code',
    scope: settings.scope,
    state: generateState(),
  })

  const authUrl = `${settings.authorizationUrl}?${params.toString()}`

  const result = await WebBrowser.openAuthSessionAsync(
    authUrl,
    Linking.createURL('sso/callback')
  )

  if (result.type === 'success' && result.url) {
    await onCallback(result.url)
  }
}

// ============================================================================
// TOKEN EXCHANGE
// ============================================================================

export async function handleOAuthCode(
  code: string,
  provider: SSOProvider,
  signIn: (email: string, token: string) => Promise<void>
): Promise<SSOSession> {
  // Exchange code for tokens (via Edge Function for security)
  const { data: tokens, error: tokenError } = await supabase.functions.invoke(
    'sso-exchange-token',
    { body: { code, provider: 'oauth' } }
  )

  if (tokenError) throw tokenError

  // Get user info
  const userInfo = await fetchOAuthUserInfo(tokens.access_token)

  // Sign in with Supabase
  await signIn(userInfo.email, tokens.access_token)

  return {
    provider,
    user: userInfo,
    tokens,
  }
}

// ============================================================================
// USER INFO
// ============================================================================

export async function fetchOAuthUserInfo(accessToken: string): Promise<SSOUserInfo> {
  // Fetch user info from OAuth provider
  // Implementation depends on provider
  return {
    email: '',
    name: '',
    attributes: {},
  }
}
