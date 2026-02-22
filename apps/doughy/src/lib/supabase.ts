// src/lib/supabase.ts
// Supabase client configured for React Native / Expo
// Supports mock data mode for local development (EXPO_PUBLIC_USE_MOCK_DATA=true)

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Database } from '@/integrations/supabase/types';
import { DEV_MODE_CONFIG } from '@/config/devMode';

// Supabase configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Check if we're in mock data mode
const USE_MOCK_DATA = DEV_MODE_CONFIG.useMockData;

// Validate required environment variables (skip in mock mode)
if (!USE_MOCK_DATA && (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY)) {
  throw new Error(
    '[Supabase] Missing required environment variables. ' +
    'Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your .env file. ' +
    'Or set EXPO_PUBLIC_USE_MOCK_DATA=true to use mock data.'
  );
}

// Log mode on startup
if (__DEV__) {
  if (USE_MOCK_DATA) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔶 [Supabase] MOCK DATA MODE');
    console.log('🔶 No database connection - using in-memory data');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } else {
    // Detect environment from URL
    const isProd = SUPABASE_URL?.includes('vpqglbaedcpeprnlnfxd');
    const envName = isProd ? 'PRODUCTION' : 'DEV/STAGE';

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [Supabase] CONNECTED TO REAL DATABASE');
    console.log(`✅ Project: ${SUPABASE_URL}`);
    console.log(`✅ Environment: ${envName}`);
    console.log(`✅ All queries will hit ${envName} Supabase`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

// Custom storage adapter that uses SecureStore for sensitive auth data
// and AsyncStorage for general storage
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      // Try SecureStore first (for values ≤2KB)
      const secureValue = await SecureStore.getItemAsync(key);
      if (secureValue !== null) return secureValue;
      // Fall back to AsyncStorage (for values >2KB that setItem stored there)
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn('SecureStore getItem error, falling back to AsyncStorage:', error);
      return await AsyncStorage.getItem(key);
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      // SecureStore has a 2KB limit
      if (value.length > 2000) {
        await AsyncStorage.setItem(key, value);
        // Clean up SecureStore to prevent stale reads
        await SecureStore.deleteItemAsync(key).catch((e) => {
          console.warn(`[Storage] SecureStore cleanup failed for "${key}":`, e);
        });
      } else {
        await SecureStore.setItemAsync(key, value);
        // Clean up AsyncStorage to prevent stale reads
        await AsyncStorage.removeItem(key).catch((e) => {
          console.warn(`[Storage] AsyncStorage cleanup failed for "${key}":`, e);
        });
      }
    } catch (error) {
      console.warn('SecureStore setItem error, falling back to AsyncStorage:', error);
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
      await AsyncStorage.removeItem(key); // Clean up both storages
    } catch (error) {
      console.warn('SecureStore removeItem error:', error);
      await AsyncStorage.removeItem(key);
    }
  },
};

// Initialize real Supabase client for React Native with Database types
// Only create if we have valid credentials (not in mock mode with placeholders)
const realSupabase = (!USE_MOCK_DATA && SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY)
  ? createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Important: disable for mobile
      },
      global: {
        headers: {
          'X-Client-Info': 'doughy-app',
        },
      },
    })
  : null;

// Import mock client lazily to avoid circular dependencies
let mockClientInstance: ReturnType<typeof import('./mockData').createMockClient> | null = null;

function getMockClient() {
  if (!mockClientInstance) {
    // Dynamic import to avoid circular dependency
    const { createMockClient } = require('./mockData');
    mockClientInstance = createMockClient();
  }
  return mockClientInstance;
}

/**
 * Main Supabase client export
 *
 * In mock mode: Uses in-memory mock data (fast, no network)
 * In normal mode: Uses real Supabase connection
 *
 * Usage is identical - call supabase.from('table').select() etc.
 */
// Type assertion to maintain compatibility - mock client implements same interface
export const supabase = (USE_MOCK_DATA
  ? getMockClient()
  : realSupabase!) as ReturnType<typeof createClient<Database>>;

// Export URL for deep linking configuration
export { SUPABASE_URL };

// Export mock mode status for conditional logic elsewhere
export { USE_MOCK_DATA };
