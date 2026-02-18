/**
 * CallPilot API Client
 *
 * Authenticated fetch wrapper for openclaw-server's /api/calls/* endpoints.
 * Falls back to mock mode when Supabase credentials are missing.
 */

import { supabase, isMockMode } from './supabaseClient'

const API_URL = process.env['EXPO_PUBLIC_CALLPILOT_API_URL'] || 'https://openclaw.doughy.app/api/calls'

/**
 * Get current session token for API calls
 */
async function getAuthToken(): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  return session.access_token
}

/**
 * Make an authenticated request to the CallPilot API.
 * Retries once on 401 by refreshing the session.
 */
export async function callsFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (isMockMode) throw new Error('API not available in mock mode')

  const token = await getAuthToken()
  const makeRequest = (authToken: string) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        ...options.headers,
      },
    })

  let response = await makeRequest(token)

  // On 401, try refreshing the session once
  if (response.status === 401 && supabase) {
    const { data: { session } } = await supabase.auth.refreshSession()
    if (!session?.access_token) {
      throw new Error('Session expired. Please sign in again.')
    }
    response = await makeRequest(session.access_token)
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`CallPilot API error: ${response.status} - ${text}`)
  }

  return response.json()
}

export { isMockMode }
