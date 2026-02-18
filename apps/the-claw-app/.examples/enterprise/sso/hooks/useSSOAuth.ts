/**
 * useSSOAuth Hook
 *
 * Handles SSO authentication operations and state management.
 */

import { useState, useCallback } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { SSOProvider, SSOSession } from '../types'
import {
  signInWithSAML as samlSignIn,
  handleSAMLResponse,
} from '../providers/saml'
import {
  signInWithOAuth as oauthSignIn,
  handleOAuthCode,
} from '../providers/oauth'
import {
  signInWithOIDC as oidcSignIn,
  handleOIDCCallback,
} from '../providers/oidc'
import { useSSOProviderManagement } from './useSSOProviderManagement'

// ============================================================================
// HOOK
// ============================================================================

export function useSSOAuth() {
  const { signIn } = useAuth()

  const [providers, setProviders] = useState<SSOProvider[]>([])
  const [currentSession, setCurrentSession] = useState<SSOSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // ============================================================================
  // FETCH PROVIDERS
  // ============================================================================

  const fetchProviders = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('sso_providers')
        .select('*')
        .eq('enabled', true)

      if (fetchError) throw fetchError
      setProviders(data)
    } catch (err) {
      console.error('Error fetching SSO providers:', err)
    }
  }, [])

  // ============================================================================
  // DETECT PROVIDER
  // ============================================================================

  const detectProvider = useCallback(async (email: string): Promise<SSOProvider | null> => {
    const domain = email.split('@')[1]
    const provider = providers.find(p => p.domain === domain)

    if (!provider) {
      const { data } = await supabase
        .from('sso_providers')
        .select('*')
        .eq('domain', domain)
        .eq('enabled', true)
        .single()

      return data
    }

    return provider
  }, [providers])

  // ============================================================================
  // CALLBACK HANDLERS
  // ============================================================================

  const handleCallback = useCallback(async (url: string) => {
    const params = new URL(url).searchParams

    if (params.has('SAMLResponse')) {
      const samlResponse = params.get('SAMLResponse')!
      const session = await handleSAMLResponse(samlResponse, providers[0])
      setCurrentSession(session)
    } else if (params.has('code')) {
      const code = params.get('code')!
      const session = await handleOAuthCode(code, providers[0], signIn)
      setCurrentSession(session)
    } else if (params.has('error')) {
      throw new Error(params.get('error_description') || params.get('error')!)
    }
  }, [providers, signIn])

  // ============================================================================
  // SIGN-IN METHODS
  // ============================================================================

  const signInWithSAML = useCallback(async (provider: SSOProvider) => {
    await samlSignIn(provider, handleCallback)
  }, [handleCallback])

  const signInWithOAuth = useCallback(async (provider: SSOProvider) => {
    await oauthSignIn(provider, handleCallback)
  }, [handleCallback])

  const signInWithOIDC = useCallback(async (provider: SSOProvider) => {
    await oidcSignIn(provider, async (url, codeVerifier) => {
      const session = await handleOIDCCallback(url, provider, codeVerifier, signIn)
      setCurrentSession(session)
    })
  }, [signIn])

  const signInWithSSO = useCallback(async (email: string) => {
    setLoading(true)
    setError(null)

    try {
      const provider = await detectProvider(email)

      if (!provider) {
        throw new Error(`No SSO provider configured for domain: ${email.split('@')[1]}`)
      }

      if (provider.type === 'saml') {
        await signInWithSAML(provider)
      } else if (provider.type === 'oauth') {
        await signInWithOAuth(provider)
      } else if (provider.type === 'oidc') {
        await signInWithOIDC(provider)
      }
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [detectProvider, signInWithSAML, signInWithOAuth, signInWithOIDC])

  // Provider management (delegated to separate hook)
  const management = useSSOProviderManagement(providers, fetchProviders, signInWithSSO)

  return {
    providers,
    currentSession,
    loading,
    error,
    detectProvider,
    signInWithSSO,
    signInWithSAML,
    signInWithOAuth,
    signInWithOIDC,
    handleCallback,
    refreshProviders: fetchProviders,
    ...management,
  }
}
