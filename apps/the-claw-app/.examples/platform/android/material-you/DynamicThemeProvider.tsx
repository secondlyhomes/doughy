/**
 * DynamicThemeProvider.tsx
 *
 * Material You Dynamic Color provider component
 *
 * Features:
 * - Extract colors from wallpaper (Android 12+)
 * - Monet color system
 * - Adaptive color schemes
 * - Light/Dark mode support
 * - Fallback for older Android versions
 *
 * Requirements:
 * - Android 12+ (API 31+) for dynamic colors
 * - Material 3 theme configuration
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useColorScheme, Platform, NativeModules } from 'react-native';
import type { MaterialYouColors, DynamicThemeConfig } from './types';
import { DynamicThemeContext } from './hooks/useDynamicTheme';
import { getFallbackColors } from './utils/theme-generation';

const { MaterialYouModule } = NativeModules;

interface DynamicThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Dynamic Theme Provider
 */
export function DynamicThemeProvider({ children }: DynamicThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [dynamicColors, setDynamicColors] = useState<MaterialYouColors | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    checkDynamicColorsAvailability();
    loadDynamicColors();

    // Listen for wallpaper changes (requires native implementation)
    const subscription = MaterialYouModule?.addListener?.(
      'onDynamicColorsChanged',
      loadDynamicColors
    );

    return () => {
      subscription?.remove?.();
    };
  }, [systemColorScheme]);

  const checkDynamicColorsAvailability = async () => {
    if (Platform.OS !== 'android' || Platform.Version < 31) {
      setIsAvailable(false);
      return;
    }

    try {
      const available = await MaterialYouModule?.isDynamicColorAvailable();
      setIsAvailable(available);
    } catch (error) {
      console.error('Failed to check dynamic color availability:', error);
      setIsAvailable(false);
    }
  };

  const loadDynamicColors = async () => {
    if (!isAvailable) {
      setDynamicColors(null);
      return;
    }

    try {
      const colors = await MaterialYouModule?.getDynamicColors(systemColorScheme);
      setDynamicColors(colors);
    } catch (error) {
      console.error('Failed to load dynamic colors:', error);
      setDynamicColors(null);
    }
  };

  const themeConfig: DynamicThemeConfig = useMemo(() => {
    const colorScheme = systemColorScheme || 'light';
    const fallbackColors = getFallbackColors(colorScheme);

    return {
      colors: dynamicColors || fallbackColors,
      isDynamic: !!dynamicColors,
      isAvailable,
      colorScheme,
    };
  }, [dynamicColors, isAvailable, systemColorScheme]);

  return (
    <DynamicThemeContext.Provider value={themeConfig}>
      {children}
    </DynamicThemeContext.Provider>
  );
}
