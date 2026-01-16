// src/features/settings/screens/AppearanceScreen.tsx
// Theme and appearance settings

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Sun, Moon, Smartphone, Check } from 'lucide-react-native';
import { useTheme, ThemeMode, useThemeColors } from '@/context/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { ScreenHeader, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ThemeOption {
  value: ThemeMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const themeOptions: ThemeOption[] = [
  {
    value: 'light',
    label: 'Light',
    description: 'Always use light theme',
    icon: <Sun size={24} color="#f59e0b" />, // Intentional: Fixed amber for light theme icon
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Always use dark theme',
    icon: <Moon size={24} color="#6366f1" />, // Intentional: Fixed indigo for dark theme icon
  },
  {
    value: 'system',
    label: 'System',
    description: 'Match device settings',
    icon: <Smartphone size={24} color="#6b7280" />, // Intentional: Fixed gray for system icon
  },
];

export function AppearanceScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { mode, setMode } = useTheme();

  const handleSelectTheme = (theme: ThemeMode) => {
    setMode(theme);
  };

  return (
    <ThemedSafeAreaView className="flex-1">
      {/* Header */}
      <ScreenHeader title="Appearance" backButton bordered />

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}>
        {/* Theme Selection */}
        <Text className="text-sm font-medium mb-3" style={{ color: colors.mutedForeground }}>
          THEME
        </Text>

        <View className="rounded-lg overflow-hidden" style={{ backgroundColor: colors.card }}>
          {themeOptions.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              className="flex-row items-center p-4"
              style={index < themeOptions.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
              onPress={() => handleSelectTheme(option.value)}
            >
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.muted }}>
                {option.icon}
              </View>
              <View className="flex-1 ml-4">
                <Text className="font-medium" style={{ color: colors.foreground }}>{option.label}</Text>
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                  {option.description}
                </Text>
              </View>
              {mode === option.value && (
                <Check size={20} color={colors.success} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview */}
        <View className="mt-8">
          <Text className="text-sm font-medium mb-3" style={{ color: colors.mutedForeground }}>
            PREVIEW
          </Text>

          <View className="rounded-lg p-4" style={{ backgroundColor: colors.card }}>
            <View className="flex-row gap-4">
              {/* Light Preview */}
              {/* Intentional: Static preview colors to show light/dark theme examples */}
              <View className="flex-1 rounded-lg overflow-hidden" style={{ borderWidth: 1, borderColor: colors.border }}>
                <View className="h-20 p-3" style={{ backgroundColor: '#ffffff' }}>
                  <View className="h-2 w-16 rounded mb-2" style={{ backgroundColor: '#e5e7eb' }} />
                  <View className="h-2 w-12 rounded" style={{ backgroundColor: '#d1d5db' }} />
                </View>
                <View className="h-6 items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
                  <Text className="text-xs" style={{ color: '#6b7280' }}>Light</Text>
                </View>
              </View>

              {/* Dark Preview */}
              {/* Intentional: Static preview colors to show light/dark theme examples */}
              <View className="flex-1 rounded-lg overflow-hidden" style={{ borderWidth: 1, borderColor: colors.border }}>
                <View className="h-20 p-3" style={{ backgroundColor: '#111827' }}>
                  <View className="h-2 w-16 rounded mb-2" style={{ backgroundColor: '#374151' }} />
                  <View className="h-2 w-12 rounded" style={{ backgroundColor: '#4b5563' }} />
                </View>
                <View className="h-6 items-center justify-center" style={{ backgroundColor: '#1f2937' }}>
                  <Text className="text-xs" style={{ color: '#9ca3af' }}>Dark</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Info */}
        <Text className="text-sm mt-6 text-center" style={{ color: colors.mutedForeground }}>
          Theme changes will apply immediately across the app.
        </Text>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}
