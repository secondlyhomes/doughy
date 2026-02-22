// src/context/FocusModeContext.tsx
// Focus Mode context for Deal OS - syncs preference across all screens
// Zone B: Fix for state desync issue
// Provides focused property state and nudge settings

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const FOCUS_MODE_KEY = 'doughy_deal_focus_mode';
const FOCUSED_PROPERTY_KEY = 'doughy_focused_property';
const NUDGE_SETTINGS_KEY = 'doughy_nudge_settings';

// Focused property type
export interface FocusedProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  imageUrl?: string;
  leadName?: string;
  leadId?: string;
}

// Nudge settings type
export interface NudgeSettings {
  staleLeadWarningDays: number;
  staleLeadCriticalDays: number;
  dealStalledDays: number;
  enabled: boolean;
}

// Default nudge settings
export const DEFAULT_NUDGE_SETTINGS: NudgeSettings = {
  staleLeadWarningDays: 5,
  staleLeadCriticalDays: 7,
  dealStalledDays: 7,
  enabled: true,
};

// Context type
export interface FocusModeContextType {
  /** Whether focus mode is enabled (for deal cockpit) */
  focusMode: boolean;
  /** Toggle focus mode on/off */
  setFocusMode: (value: boolean) => void;
  /** Toggle focus mode */
  toggleFocusMode: () => void;
  /** Whether the preference has been loaded */
  isLoaded: boolean;

  // Focus Property state (still used for property-centric features in Leads tab)
  /** Currently focused property (null = no property selected) */
  focusedProperty: FocusedProperty | null;
  /** Set the focused property */
  setFocusedProperty: (property: FocusedProperty | null) => void;

  // Nudge settings (still used for lead reminders)
  /** User's nudge preferences */
  nudgeSettings: NudgeSettings;
  /** Update nudge settings */
  setNudgeSettings: (settings: NudgeSettings) => void;
}

const FocusModeContext = createContext<FocusModeContextType | null>(null);

// Provider props
export interface FocusModeProviderProps {
  children: React.ReactNode;
  /** Default value before AsyncStorage loads */
  defaultValue?: boolean;
}

/**
 * Provider component for Focus Mode state
 * Wrap your app (or deal screens) with this to enable synced focus mode
 */
export function FocusModeProvider({
  children,
  defaultValue = false,
}: FocusModeProviderProps) {
  const [focusMode, setFocusModeState] = useState(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Focus Property state (still used for property-centric features)
  const [focusedProperty, setFocusedPropertyState] = useState<FocusedProperty | null>(null);
  const [nudgeSettings, setNudgeSettingsState] = useState<NudgeSettings>(DEFAULT_NUDGE_SETTINGS);

  // Load saved preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [
          savedFocusMode,
          savedFocusedProperty,
          savedNudgeSettings,
        ] = await Promise.all([
          AsyncStorage.getItem(FOCUS_MODE_KEY),
          AsyncStorage.getItem(FOCUSED_PROPERTY_KEY),
          AsyncStorage.getItem(NUDGE_SETTINGS_KEY),
        ]);

        // Focus mode (deal cockpit)
        if (savedFocusMode === 'true') {
          setFocusModeState(true);
        } else if (savedFocusMode === 'false') {
          setFocusModeState(false);
        }

        // Focused property
        if (savedFocusedProperty) {
          try {
            setFocusedPropertyState(JSON.parse(savedFocusedProperty));
          } catch (parseError) {
            console.error('[FocusMode] Failed to parse saved focused property - clearing corrupted data', {
              error: parseError instanceof Error ? parseError.message : String(parseError),
              rawValue: savedFocusedProperty.substring(0, 100), // Log first 100 chars for debugging
            });
            // Clean up corrupted data to prevent repeated failures
            AsyncStorage.removeItem(FOCUSED_PROPERTY_KEY).catch((removeErr) => {
              console.warn('[FocusMode] Failed to remove corrupted focused property key:', removeErr);
            });
          }
        }

        // Nudge settings
        if (savedNudgeSettings) {
          try {
            const parsed = JSON.parse(savedNudgeSettings);
            setNudgeSettingsState({ ...DEFAULT_NUDGE_SETTINGS, ...parsed });
          } catch (parseError) {
            console.error('[FocusMode] Failed to parse saved nudge settings - using defaults', {
              error: parseError instanceof Error ? parseError.message : String(parseError),
              rawValue: savedNudgeSettings.substring(0, 100), // Log first 100 chars for debugging
            });
            // Clean up corrupted data
            AsyncStorage.removeItem(NUDGE_SETTINGS_KEY).catch((removeErr) => {
              console.warn('[FocusMode] Failed to remove corrupted nudge settings key:', removeErr);
            });
          }
        }
      } catch (err) {
        console.warn('[FocusMode] Failed to load preferences:', err);
      } finally {
        setIsLoaded(true);
      }
    };
    loadPreferences();
  }, []);

  // Save focus mode preference and update state (with rollback on failure)
  const setFocusMode = useCallback(async (value: boolean) => {
    const previousValue = focusMode;
    setFocusModeState(value); // Optimistic update
    try {
      await AsyncStorage.setItem(FOCUS_MODE_KEY, String(value));
    } catch (err) {
      console.error('[FocusMode] Failed to save focus mode preference - rolling back', {
        error: err instanceof Error ? err.message : String(err),
        attemptedValue: value,
      });
      // Rollback the UI state since persistence failed
      setFocusModeState(previousValue);
    }
  }, [focusMode]);

  // Toggle helper
  const toggleFocusMode = useCallback(() => {
    setFocusMode(!focusMode);
  }, [focusMode, setFocusMode]);

  // Set focused property with persistence (with rollback on failure)
  const setFocusedProperty = useCallback(async (property: FocusedProperty | null) => {
    const previousProperty = focusedProperty;
    setFocusedPropertyState(property); // Optimistic update
    try {
      if (property) {
        await AsyncStorage.setItem(FOCUSED_PROPERTY_KEY, JSON.stringify(property));
      } else {
        await AsyncStorage.removeItem(FOCUSED_PROPERTY_KEY);
      }
    } catch (err) {
      console.error('[FocusMode] Failed to save focused property - rolling back', {
        error: err instanceof Error ? err.message : String(err),
        attemptedProperty: property?.id,
      });
      // Rollback the UI state since persistence failed
      setFocusedPropertyState(previousProperty);
    }
  }, [focusedProperty]);

  // Set nudge settings with persistence (with rollback on failure)
  const setNudgeSettings = useCallback(async (settings: NudgeSettings) => {
    const previousSettings = nudgeSettings;
    setNudgeSettingsState(settings); // Optimistic update
    try {
      await AsyncStorage.setItem(NUDGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error('[FocusMode] Failed to save nudge settings - rolling back', {
        error: err instanceof Error ? err.message : String(err),
      });
      // Rollback the UI state since persistence failed
      setNudgeSettingsState(previousSettings);
    }
  }, [nudgeSettings]);

  return (
    <FocusModeContext.Provider
      value={{
        focusMode,
        setFocusMode,
        toggleFocusMode,
        isLoaded,
        focusedProperty,
        setFocusedProperty,
        nudgeSettings,
        setNudgeSettings,
      }}
    >
      {children}
    </FocusModeContext.Provider>
  );
}

/**
 * Hook to access focus mode state
 * Must be used within a FocusModeProvider
 */
export function useFocusMode(): FocusModeContextType {
  const context = useContext(FocusModeContext);
  if (!context) {
    throw new Error('useFocusMode must be used within a FocusModeProvider');
  }
  return context;
}

/**
 * Hook that returns just the boolean value (for simpler usage)
 */
export function useFocusModeValue(): boolean {
  const { focusMode } = useFocusMode();
  return focusMode;
}

export default FocusModeContext;
