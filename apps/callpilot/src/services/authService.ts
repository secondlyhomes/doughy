/**
 * Auth Service
 *
 * Handles user authentication via Supabase.
 * In dev mode, auto-signs in with dev credentials from env vars.
 */

import type { UserProfile } from '@/types'
import { mockUserProfile } from '@/mocks'
import { supabase, isMockMode } from './supabaseClient'

export async function getCurrentUser(): Promise<UserProfile> {
  if (isMockMode || !supabase) return mockUserProfile

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return mockUserProfile

  const fullName = (user.user_metadata?.['full_name'] as string) || ''
  const parts = fullName.split(' ')

  return {
    ...mockUserProfile,
    id: user.id,
    firstName: parts[0] || mockUserProfile.firstName,
    lastName: parts.slice(1).join(' ') || mockUserProfile.lastName,
  }
}

export async function signIn(email: string, password: string): Promise<void> {
  if (isMockMode || !supabase) return

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
}

export async function signOut(): Promise<void> {
  if (isMockMode || !supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(`Sign out failed: ${error.message}`)
}

/**
 * Dev auto-login: sign in with env var credentials if available.
 * Returns true if signed in (either already or fresh login).
 */
export async function ensureDevAuth(): Promise<boolean> {
  if (isMockMode || !supabase) return false

  // Already signed in?
  const { data: { session } } = await supabase.auth.getSession()
  if (session) return true

  // Try dev credentials
  const email = process.env['EXPO_PUBLIC_DEV_EMAIL']
  const password = process.env['EXPO_PUBLIC_DEV_PASSWORD']
  if (!email || !password) return false

  try {
    await signIn(email, password)
    console.log('[Auth] Dev auto-login successful')
    return true
  } catch (err) {
    console.error('[Auth] Dev auto-login failed:', err)
    return false
  }
}

export function onAuthStateChange(
  callback: (user: UserProfile | null) => void
): () => void {
  if (isMockMode || !supabase) return () => {}

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (session?.user) {
        const fullName = (session.user.user_metadata?.['full_name'] as string) || ''
        const parts = fullName.split(' ')
        callback({
          ...mockUserProfile,
          id: session.user.id,
          firstName: parts[0] || mockUserProfile.firstName,
          lastName: parts.slice(1).join(' ') || mockUserProfile.lastName,
        })
      } else {
        callback(null)
      }
    }
  )

  return () => subscription.unsubscribe()
}
