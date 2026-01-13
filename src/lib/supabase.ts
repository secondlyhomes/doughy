// src/lib/supabase.ts
// Supabase client configured for React Native / Expo
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Database } from '@/integrations/supabase/types';

// Supabase configuration - NEW PROJECT (Dec 2024)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://vpqglbaedcpeprnlnfxd.supabase.co";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_4EljjR3n77Td4W28TF4ptQ_81KxP3xi";

// Warn if using fallback values (development only)
if (__DEV__) {
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
    console.warn('[Supabase] Using fallback URL. Set EXPO_PUBLIC_SUPABASE_URL in your environment.');
  }
  if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('[Supabase] Using fallback anon key. Set EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment.');
  }
}

// Custom storage adapter that uses SecureStore for sensitive auth data
// and AsyncStorage for general storage
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // SecureStore has a 2KB limit, so we use it only for auth tokens
      if (Platform.OS === 'web') {
        // Use localStorage on web
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
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
      } else {
        await SecureStore.setItemAsync(key, value);
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

// Initialize Supabase client for React Native with Database types
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important: disable for mobile
  },
  global: {
    headers: {
      'X-Client-Info': 'doughy-ai-mobile',
    },
  },
});

// Helper functions to access real_estate schema tables
export const realEstateDB = {
  properties: () => supabase.from('re_properties'),
  comps: () => supabase.from('re_comps'),
  // TODO: Add these when table types are defined
  // leadProperties: () => supabase.from('re_lead_properties'),
  // financingScenarios: () => supabase.from('re_financing_scenarios'),
  // repairEstimates: () => supabase.from('re_repair_estimates'),
  // propertyImages: () => supabase.from('re_property_images'),
  // analyses: () => supabase.from('re_property_analyses'),
  // propertyDebt: () => supabase.from('re_property_debt'),
  // propertyMortgages: () => supabase.from('re_property_mortgages'),
};

// Export URL for deep linking configuration
export { SUPABASE_URL };
