/**
 * Supabase Client
 *
 * Configured for The Claw app. Uses the same Supabase instance as Doughy.
 * Hybrid SecureStore/AsyncStorage adapter handles JWTs that exceed
 * SecureStore's 2KB limit.
 */

import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = (
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
)!

if (!supabaseUrl || supabaseUrl === 'undefined') {
  throw new Error('[Supabase] EXPO_PUBLIC_SUPABASE_URL is not set. Check your .env file.')
}

/**
 * Hybrid storage adapter matching Doughy's implementation.
 * SecureStore for values <= 2000 chars, AsyncStorage for larger values (e.g. JWTs).
 * Always cleans up the other storage on write/remove to prevent stale reads.
 */
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') return localStorage.getItem(key)

    // Try SecureStore first (preferred for small values)
    try {
      const secureValue = await SecureStore.getItemAsync(key)
      if (secureValue) return secureValue
    } catch {
      // SecureStore may fail for various reasons, fall through
    }

    // Fall back to AsyncStorage (for large values like JWTs)
    try {
      return await AsyncStorage.getItem(key)
    } catch (err) {
      console.warn('[Storage] Both SecureStore and AsyncStorage failed for key:', key, err)
      return null
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value)
      return
    }

    if (value.length <= 2000) {
      // Small value — store in SecureStore, clean up AsyncStorage
      try {
        await SecureStore.setItemAsync(key, value)
      } catch (secureErr) {
        console.warn('[Storage] SecureStore write failed for key:', key, secureErr)
        try {
          await AsyncStorage.setItem(key, value)
        } catch (asyncErr) {
          console.error('[Storage] Both SecureStore and AsyncStorage write failed for key:', key, asyncErr)
        }
        return
      }
      try { await AsyncStorage.removeItem(key) } catch { /* ignore cleanup */ }
    } else {
      // Large value (JWT) — store in AsyncStorage, clean up SecureStore
      await AsyncStorage.setItem(key, value)
      try { await SecureStore.deleteItemAsync(key) } catch { /* ignore cleanup */ }
    }
  },

  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key)
      return
    }

    // Clean up both storages
    try { await SecureStore.deleteItemAsync(key) } catch (err) { console.warn('[Storage] SecureStore remove failed for key:', key, err) }
    try { await AsyncStorage.removeItem(key) } catch (err) { console.warn('[Storage] AsyncStorage remove failed for key:', key, err) }
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
