/**
 * Supabase Client Setup (Reference Example)
 *
 * Supabase client configured for React Native with secure token storage
 * This is a reference implementation - copy to src/services/ and customize
 */

import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import type { Database } from '@/types/database'

// IMPORTANT: Use environment variables, never hardcode
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables.\n\n' +
    'Add to your .env file:\n' +
    'EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key'
  )
}

/**
 * Custom storage adapter for React Native using expo-secure-store
 *
 * Stores auth tokens securely on device (not in AsyncStorage)
 */
const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key)
    } catch (error) {
      console.error('Error reading from SecureStore:', error)
      return null
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value)
    } catch (error) {
      console.error('Error writing to SecureStore:', error)
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key)
    } catch (error) {
      console.error('Error deleting from SecureStore:', error)
    }
  },
}

/**
 * Supabase Client Instance
 *
 * Configured with:
 * - Type safety (Database types from generated schema)
 * - Secure token storage (expo-secure-store)
 * - Auto token refresh
 * - Persistent auth session
 *
 * @example
 * ```tsx
 * import { supabase } from '@/services/supabase'
 *
 * // Query data
 * const { data, error } = await supabase
 *   .from('tasks')
 *   .select('*')
 *   .eq('user_id', userId)
 *
 * // Listen to auth changes
 * supabase.auth.onAuthStateChange((event, session) => {
 *   console.log('Auth event:', event, session)
 * })
 * ```
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use expo-secure-store for secure token storage
    storage: SecureStoreAdapter,

    // Auto-refresh tokens
    autoRefreshToken: true,

    // Persist session across app restarts
    persistSession: true,

    // Detect session from URL (for magic links, OAuth, etc.)
    detectSessionInUrl: false,
  },
})

/**
 * Helper: Get current user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

/**
 * Helper: Get current session
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

/**
 * Helper: Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Helper: Listen to auth state changes
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   const unsubscribe = onAuthStateChange((event, session) => {
 *     if (event === 'SIGNED_IN') {
 *       console.log('User signed in:', session?.user)
 *     } else if (event === 'SIGNED_OUT') {
 *       console.log('User signed out')
 *     }
 *   })
 *
 *   return unsubscribe
 * }, [])
 * ```
 */
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  return () => subscription.unsubscribe()
}
