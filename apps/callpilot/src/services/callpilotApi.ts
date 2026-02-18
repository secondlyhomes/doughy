/**
 * CallPilot API Client
 *
 * Authenticated fetch wrappers for openclaw-server endpoints.
 * `serverFetch` — generic wrapper for any /api/* path.
 * `callsFetch` — convenience wrapper for /api/calls/* paths.
 * Falls back to mock mode when Supabase credentials are missing.
 */

import { supabase, isMockMode } from './supabaseClient'

const API_URL = process.env['EXPO_PUBLIC_CALLPILOT_API_URL'] || 'https://openclaw.doughy.app/api/calls'

/** Base server URL — strip /api/calls suffix from API_URL */
const SERVER_BASE_URL = API_URL.replace(/\/api\/calls\/?$/, '') || 'https://openclaw.doughy.app'

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
 * Make an authenticated request to any openclaw-server endpoint.
 * Retries once on 401 by refreshing the session.
 *
 * @param path — absolute path starting with / (e.g. '/api/messages/send')
 */
export async function serverFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (isMockMode) throw new Error('API not available in mock mode')

  const token = await getAuthToken()
  const makeRequest = (authToken: string) =>
    fetch(`${SERVER_BASE_URL}${path}`, {
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
    const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError || !session?.access_token) {
      throw new Error(refreshError?.message || 'Session expired. Please sign in again.')
    }
    response = await makeRequest(session.access_token)
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`CallPilot API error: ${response.status} - ${text}`)
  }

  try {
    return await response.json()
  } catch {
    throw new Error(`Invalid JSON response from ${path}`)
  }
}

/**
 * Make an authenticated request to /api/calls/* endpoints.
 * Convenience wrapper around serverFetch.
 */
export async function callsFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  return serverFetch<T>('/api/calls' + path, options)
}

export { isMockMode }
