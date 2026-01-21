// src/context/FocusModeContext.tsx
// Focus Mode context for Deal OS - syncs preference across all screens
// Zone B: Fix for state desync issue
// Focus Tab: Added focusedProperty and activeMode for dual-mode Focus tab

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const FOCUS_MODE_KEY = 'doughy_deal_focus_mode';
const FOCUSED_PROPERTY_KEY = 'doughy_focused_property';
const FOCUS_TAB_MODE_KEY = 'doughy_focus_tab_mode';
const NUDGE_SETTINGS_KEY = 'doughy_nudge_settings';

// Focus tab mode type
export type FocusTabMode = 'focus' | 'inbox';

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

  // Focus Tab state
  /** Currently focused property (null = no property selected) */
  focusedProperty: FocusedProperty | null;
  /** Set the focused property */
  setFocusedProperty: (property: FocusedProperty | null) => void;
  /** Current Focus tab mode */
  activeMode: FocusTabMode;
  /** Set the active mode */
  setActiveMode: (mode: FocusTabMode) => void;

  // Nudge settings
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

  // Focus Tab state
  const [focusedProperty, setFocusedPropertyState] = useState<FocusedProperty | null>(null);
  const [activeMode, setActiveModeState] = useState<FocusTabMode>('inbox');
  const [nudgeSettings, setNudgeSettingsState] = useState<NudgeSettings>(DEFAULT_NUDGE_SETTINGS);

  // Load saved preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [
          savedFocusMode,
          savedFocusedProperty,
          savedActiveMode,
          savedNudgeSettings,
        ] = await Promise.all([
          AsyncStorage.getItem(FOCUS_MODE_KEY),
          AsyncStorage.getItem(FOCUSED_PROPERTY_KEY),
          AsyncStorage.getItem(FOCUS_TAB_MODE_KEY),
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
          } catch {
            // Invalid JSON, ignore
          }
        }

        // Active mode
        if (savedActiveMode === 'focus' || savedActiveMode === 'inbox') {
          setActiveModeState(savedActiveMode);
        }

        // Nudge settings
        if (savedNudgeSettings) {
          try {
            const parsed = JSON.parse(savedNudgeSettings);
            setNudgeSettingsState({ ...DEFAULT_NUDGE_SETTINGS, ...parsed });
          } catch {
            // Invalid JSON, use defaults
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

  // Save focus mode preference and update state
  const setFocusMode = useCallback(async (value: boolean) => {
    setFocusModeState(value);
    try {
      await AsyncStorage.setItem(FOCUS_MODE_KEY, String(value));
    } catch (err) {
      console.warn('[FocusMode] Failed to save preference:', err);
    }
  }, []);

  // Toggle helper
  const toggleFocusMode = useCallback(() => {
    setFocusMode(!focusMode);
  }, [focusMode, setFocusMode]);

  // Set focused property with persistence
  const setFocusedProperty = useCallback(async (property: FocusedProperty | null) => {
    setFocusedPropertyState(property);
    try {
      if (property) {
        await AsyncStorage.setItem(FOCUSED_PROPERTY_KEY, JSON.stringify(property));
      } else {
        await AsyncStorage.removeItem(FOCUSED_PROPERTY_KEY);
      }
    } catch (err) {
      console.warn('[FocusMode] Failed to save focused property:', err);
    }
  }, []);

  // Set active mode with persistence
  const setActiveMode = useCallback(async (mode: FocusTabMode) => {
    setActiveModeState(mode);
    try {
      await AsyncStorage.setItem(FOCUS_TAB_MODE_KEY, mode);
    } catch (err) {
      console.warn('[FocusMode] Failed to save active mode:', err);
    }
  }, []);

  // Set nudge settings with persistence
  const setNudgeSettings = useCallback(async (settings: NudgeSettings) => {
    setNudgeSettingsState(settings);
    try {
      await AsyncStorage.setItem(NUDGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      console.warn('[FocusMode] Failed to save nudge settings:', err);
    }
  }, []);

  return (
    <FocusModeContext.Provider
      value={{
        focusMode,
        setFocusMode,
        toggleFocusMode,
        isLoaded,
        focusedProperty,
        setFocusedProperty,
        activeMode,
        setActiveMode,
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
