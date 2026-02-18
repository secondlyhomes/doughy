/**
 * SAML Authentication Provider
 *
 * Handles SAML 2.0 authentication flow for enterprise SSO.
 */

import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { supabase } from '../../services/supabase'
import type { SSOProvider, SAMLSettings, SSOSession, SSOUserInfo } from '../types'

// ============================================================================
// SAML REQUEST GENERATION
// ============================================================================

interface SAMLRequestParams {
  issuer: string
  destination: string
  assertionConsumerServiceUrl: string
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function generateSAMLRequest(params: SAMLRequestParams): string {
  // Simplified SAML request generation
  // Use a proper SAML library in production (e.g., passport-saml)
  return `
    <samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                        ID="_${generateId()}"
                        Version="2.0"
                        IssueInstant="${new Date().toISOString()}"
                        Destination="${params.destination}"
                        AssertionConsumerServiceURL="${params.assertionConsumerServiceUrl}">
      <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${params.issuer}</saml:Issuer>
    </samlp:AuthnRequest>
  `.trim()
}

// ============================================================================
// SAML RESPONSE HANDLING
// ============================================================================

export function decodeSAMLResponse(samlResponse: string): any {
  // Decode base64 and parse XML
  // Use a SAML library in production
  const decoded = atob(samlResponse)
  return { decoded }
}

export function extractSAMLAttributes(assertion: any): SSOUserInfo {
  // Extract user attributes from SAML assertion
  return {
    email: assertion.email || '',
    name: assertion.name || '',
    attributes: assertion,
  }
}

// ============================================================================
// SAML SIGN-IN FLOW
// ============================================================================

export async function signInWithSAML(
  provider: SSOProvider,
  onCallback: (url: string) => Promise<void>
): Promise<void> {
  const settings = provider.settings as SAMLSettings

  const samlRequest = generateSAMLRequest({
    issuer: Linking.createURL(''),
    destination: settings.ssoUrl,
    assertionConsumerServiceUrl: Linking.createURL('sso/callback'),
  })

  const encodedRequest = encodeURIComponent(btoa(samlRequest))

  const result = await WebBrowser.openAuthSessionAsync(
    `${settings.ssoUrl}?SAMLRequest=${encodedRequest}`,
    Linking.createURL('sso/callback')
  )

  if (result.type === 'success' && result.url) {
    await onCallback(result.url)
  }
}

// ============================================================================
// SAML RESPONSE HANDLER
// ============================================================================

export async function handleSAMLResponse(
  samlResponse: string,
  provider: SSOProvider
): Promise<SSOSession> {
  const assertion = decodeSAMLResponse(samlResponse)
  const userInfo = extractSAMLAttributes(assertion)

  // Sign in with Supabase (using SSO provider)
  const { error: authError } = await supabase.auth.signInWithSSO({
    provider: 'saml',
    options: {
      assertion: samlResponse,
    },
  })

  if (authError) throw authError

  // JIT provisioning (create/update user)
  await provisionUser(userInfo)

  return {
    provider,
    user: userInfo,
    assertion: samlResponse,
  }
}

// ============================================================================
// JIT PROVISIONING
// ============================================================================

async function provisionUser(userInfo: SSOUserInfo): Promise<void> {
  const { error } = await supabase.from('users').upsert({
    email: userInfo.email,
    full_name: userInfo.name,
    sso_attributes: userInfo.attributes,
  })

  if (error) console.error('JIT provisioning error:', error)
}
