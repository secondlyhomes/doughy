// src/contexts/PlatformContext.tsx
// Platform switching context for multi-platform experience (RE Investor vs Landlord)
// Part of Zone 3: UI scaffolding for the Doughy architecture refactor

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// Platform types
export type Platform = 'investor' | 'landlord';

// Platform settings from database (matches user_platform_settings table schema)
export interface UserPlatformSettings {
  id: string;
  user_id: string;
  enabled_platforms: Platform[];
  active_platform: Platform;
  completed_investor_onboarding: boolean | null;
  completed_landlord_onboarding: boolean | null;
  landlord_settings: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

// Context state interface
export interface PlatformContextType {
  // State
  enabledPlatforms: Platform[];
  activePlatform: Platform;
  isLoading: boolean;
  error: string | null;

  // Actions
  switchPlatform: (platform: Platform) => Promise<void>;
  enablePlatform: (platform: Platform) => Promise<void>;
  disablePlatform: (platform: Platform) => Promise<void>;
  refreshSettings: () => Promise<void>;
  clearError: () => void;
}

// Storage key for local persistence
const STORAGE_KEY = 'doughy-platform-settings';

// Create context
const PlatformContext = createContext<PlatformContextType | null>(null);

// Provider props
export interface PlatformProviderProps {
  children: React.ReactNode;
  defaultPlatform?: Platform;
}

export function PlatformProvider({
  children,
  defaultPlatform = 'investor',
}: PlatformProviderProps) {
  const [enabledPlatforms, setEnabledPlatforms] = useState<Platform[]>(['investor']);
  const [activePlatform, setActivePlatform] = useState<Platform>(defaultPlatform);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from local storage first, then sync with database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // First, try to load from local storage for faster startup
        const localSettings = await AsyncStorage.getItem(STORAGE_KEY);
        if (localSettings) {
          const parsed = JSON.parse(localSettings);
          setEnabledPlatforms(parsed.enabledPlatforms || ['investor']);
          setActivePlatform(parsed.activePlatform || defaultPlatform);
        }

        // Then try to sync with database if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          await syncWithDatabase(session.user.id);
        }
      } catch (err) {
        console.error('Error loading platform settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load platform settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [defaultPlatform]);

  // Sync settings from database
  const syncWithDatabase = async (userId: string) => {
    try {
      const { data, error: dbError } = await supabase
        .from('user_platform_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (dbError) {
        // If no settings exist yet, that's okay - we'll create them when needed
        if (dbError.code !== 'PGRST116') {
          console.warn('Error fetching platform settings:', dbError);
        }
        return;
      }

      if (data) {
        const settings = data as UserPlatformSettings;
        const platforms = settings.enabled_platforms || ['investor'];

        setEnabledPlatforms(platforms.length > 0 ? platforms : ['investor']);
        setActivePlatform(settings.active_platform || 'investor');

        // Update local storage
        await saveToLocalStorage(platforms, settings.active_platform);
      }
    } catch (err) {
      console.error('Error syncing platform settings from database:', err);
    }
  };

  // Save settings to local storage
  const saveToLocalStorage = async (platforms: Platform[], active: Platform) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          enabledPlatforms: platforms,
          activePlatform: active,
        })
      );
    } catch (err) {
      console.error('Error saving platform settings to local storage:', err);
    }
  };

  // Save settings to database
  // Returns true on success, throws on error
  const saveToDatabase = async (
    platforms: Platform[],
    active: Platform
  ): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return false; // Not authenticated, skip database sync
    }

    const { error: dbError } = await supabase
      .from('user_platform_settings')
      .upsert({
        user_id: session.user.id,
        enabled_platforms: platforms,
        active_platform: active,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (dbError) {
      throw new Error(`Failed to save platform settings: ${dbError.message}`);
    }

    return true;
  };

  // Switch active platform
  const switchPlatform = useCallback(async (platform: Platform) => {
    if (!enabledPlatforms.includes(platform)) {
      setError(`Platform "${platform}" is not enabled`);
      return;
    }

    const previousPlatform = activePlatform;

    // Optimistic update
    setActivePlatform(platform);

    try {
      // Save to database first to ensure persistence
      await saveToDatabase(enabledPlatforms, platform);
      // Only update local storage after database succeeds
      await saveToLocalStorage(enabledPlatforms, platform);
    } catch (err) {
      // Revert optimistic update on failure
      setActivePlatform(previousPlatform);
      setError(err instanceof Error ? err.message : 'Failed to save platform settings');
    }
  }, [enabledPlatforms, activePlatform]);

  // Enable a platform
  const enablePlatform = useCallback(async (platform: Platform) => {
    if (enabledPlatforms.includes(platform)) {
      return; // Already enabled
    }

    const previousPlatforms = enabledPlatforms;
    const newPlatforms = [...enabledPlatforms, platform];

    // Optimistic update
    setEnabledPlatforms(newPlatforms);

    try {
      // Save to database first to ensure persistence
      await saveToDatabase(newPlatforms, activePlatform);
      // Only update local storage after database succeeds
      await saveToLocalStorage(newPlatforms, activePlatform);
    } catch (err) {
      // Revert optimistic update on failure
      setEnabledPlatforms(previousPlatforms);
      setError(err instanceof Error ? err.message : 'Failed to save platform settings');
    }
  }, [enabledPlatforms, activePlatform]);

  // Disable a platform
  const disablePlatform = useCallback(async (platform: Platform) => {
    // Must have at least one platform enabled
    if (enabledPlatforms.length <= 1) {
      setError('Cannot disable the only enabled platform');
      return;
    }

    const previousPlatforms = enabledPlatforms;
    const previousActive = activePlatform;

    const newPlatforms = enabledPlatforms.filter(p => p !== platform);
    const newActive = platform === activePlatform ? newPlatforms[0] : activePlatform;

    // Optimistic update
    setEnabledPlatforms(newPlatforms);
    if (platform === activePlatform) {
      setActivePlatform(newActive);
    }

    try {
      // Save to database first to ensure persistence
      await saveToDatabase(newPlatforms, newActive);
      // Only update local storage after database succeeds
      await saveToLocalStorage(newPlatforms, newActive);
    } catch (err) {
      // Revert optimistic updates on failure
      setEnabledPlatforms(previousPlatforms);
      setActivePlatform(previousActive);
      setError(err instanceof Error ? err.message : 'Failed to save platform settings');
    }
  }, [enabledPlatforms, activePlatform]);

  // Refresh settings from database
  const refreshSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await syncWithDatabase(session.user.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh platform settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: PlatformContextType = {
    enabledPlatforms,
    activePlatform,
    isLoading,
    error,
    switchPlatform,
    enablePlatform,
    disablePlatform,
    refreshSettings,
    clearError,
  };

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
}

// Hook to use platform context
export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
}

// Hook to check if a specific platform is active
export function useIsPlatformActive(platform: Platform) {
  const { activePlatform } = usePlatform();
  return activePlatform === platform;
}

// Hook to check if a specific platform is enabled
export function useIsPlatformEnabled(platform: Platform) {
  const { enabledPlatforms } = usePlatform();
  return enabledPlatforms.includes(platform);
}

export default PlatformContext;
