/**
 * Supabase Client
 *
 * Creates a Supabase client when env vars are present, otherwise
 * falls back to mock mode. Services check `isMockMode` to decide
 * whether to query Supabase or return mock data.
 *
 * Configured for CallPilot with staging Supabase credentials.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const supabaseUrl = process.env['EXPO_PUBLIC_SUPABASE_URL'] ?? ''
const supabaseAnonKey = process.env['EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY']
  ?? process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] ?? ''

const hasCredentials = supabaseUrl.length > 0 && supabaseAnonKey.length > 0

export const isMockMode: boolean = !hasCredentials

if (isMockMode) {
  console.error(
    '[CallPilot] Running in MOCK MODE — Supabase credentials missing. ' +
    'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  )
}

export const supabase: SupabaseClient | null = hasCredentials
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: {
          getItem: (key: string): Promise<string | null> =>
            SecureStore.getItemAsync(key),
          setItem: (key: string, value: string): Promise<void> =>
            SecureStore.setItemAsync(key, value),
          removeItem: (key: string): Promise<void> =>
            SecureStore.deleteItemAsync(key),
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null
