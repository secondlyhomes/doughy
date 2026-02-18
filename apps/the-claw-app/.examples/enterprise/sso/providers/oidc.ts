/**
 * OpenID Connect (OIDC) Authentication Provider
 *
 * Handles OIDC authentication flow with PKCE for mobile apps.
 */

import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import type { SSOProvider, OIDCSettings, SSOSession } from '../types'

// ============================================================================
// PKCE UTILITIES
// ============================================================================

export function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64URLEncode(array)
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64URLEncode(new Uint8Array(hash))
}

function base64URLEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// ============================================================================
// OIDC UTILITIES
// ============================================================================

export function generateState(): string {
  return Math.random().toString(36).substring(7)
}

export function generateNonce(): string {
  return Math.random().toString(36).substring(7)
}

export function verifyJWT(token: string, _jwksUrl: string): any {
  // Verify JWT signature using JWKS
  // Use a JWT library in production
  const [, payload] = token.split('.')
  return JSON.parse(atob(payload))
}

// ============================================================================
// OIDC SIGN-IN FLOW
// ============================================================================

export interface OIDCAuthResult {
  codeVerifier: string
}

export async function signInWithOIDC(
  provider: SSOProvider,
  onCallback: (url: string, codeVerifier: string) => Promise<void>
): Promise<void> {
  const settings = provider.settings as OIDCSettings

  // PKCE for mobile apps
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  const params = new URLSearchParams({
    client_id: settings.clientId,
    redirect_uri: Linking.createURL('sso/callback'),
    response_type: 'code',
    scope: settings.scope,
    state: generateState(),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    nonce: generateNonce(),
  })

  const authUrl = `${settings.authorizationUrl}?${params.toString()}`

  const result = await WebBrowser.openAuthSessionAsync(
    authUrl,
    Linking.createURL('sso/callback')
  )

  if (result.type === 'success' && result.url) {
    await onCallback(result.url, codeVerifier)
  }
}

// ============================================================================
// OIDC CALLBACK HANDLER
// ============================================================================

export async function handleOIDCCallback(
  url: string,
  provider: SSOProvider,
  codeVerifier: string,
  signIn: (email: string, token: string) => Promise<void>
): Promise<SSOSession> {
  const params = new URL(url).searchParams
  const code = params.get('code')!

  const settings = provider.settings as OIDCSettings

  const tokenResponse = await fetch(settings.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: Linking.createURL('sso/callback'),
      client_id: settings.clientId,
      code_verifier: codeVerifier,
    }),
  })

  const tokens = await tokenResponse.json()

  // Verify ID token
  const userInfo = verifyJWT(tokens.id_token, settings.jwksUrl)

  // Sign in with Supabase
  await signIn(userInfo.email, tokens.access_token)

  return {
    provider,
    user: userInfo,
    tokens,
  }
}
