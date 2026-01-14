// src/context/FocusModeContext.tsx
// Focus Mode context for Deal OS - syncs preference across all screens
// Zone B: Fix for state desync issue

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key
const FOCUS_MODE_KEY = 'doughy_deal_focus_mode';

// Context type
export interface FocusModeContextType {
  /** Whether focus mode is enabled */
  focusMode: boolean;
  /** Toggle focus mode on/off */
  setFocusMode: (value: boolean) => void;
  /** Toggle focus mode */
  toggleFocusMode: () => void;
  /** Whether the preference has been loaded */
  isLoaded: boolean;
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

  // Load saved preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const saved = await AsyncStorage.getItem(FOCUS_MODE_KEY);
        if (saved === 'true') {
          setFocusModeState(true);
        } else if (saved === 'false') {
          setFocusModeState(false);
        }
        // If null/undefined, keep defaultValue
      } catch (err) {
        console.warn('[FocusMode] Failed to load preference:', err);
      } finally {
        setIsLoaded(true);
      }
    };
    loadPreference();
  }, []);

  // Save preference and update state
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

  return (
    <FocusModeContext.Provider
      value={{
        focusMode,
        setFocusMode,
        toggleFocusMode,
        isLoaded,
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
