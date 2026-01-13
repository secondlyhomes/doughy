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
import { ScreenHeader } from '@/components/ui';

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
    icon: <Sun size={24} color="#f59e0b" />,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Always use dark theme',
    icon: <Moon size={24} color="#6366f1" />,
  },
  {
    value: 'system',
    label: 'System',
    description: 'Match device settings',
    icon: <Smartphone size={24} color="#6b7280" />,
  },
];

export function AppearanceScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { mode, setMode } = useTheme();

  const handleSelectTheme = (theme: ThemeMode) => {
    setMode(theme);
  };

  return (
    <ThemedSafeAreaView className="flex-1">
      {/* Header */}
      <ScreenHeader title="Appearance" backButton bordered />

      <ScrollView className="flex-1 p-4">
        {/* Theme Selection */}
        <Text className="text-sm font-medium text-muted-foreground mb-3">
          THEME
        </Text>

        <View className="rounded-lg overflow-hidden" style={{ backgroundColor: colors.card }}>
          {themeOptions.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              className={`flex-row items-center p-4 ${
                index < themeOptions.length - 1 ? 'border-b border-border' : ''
              }`}
              onPress={() => handleSelectTheme(option.value)}
            >
              <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
                {option.icon}
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-foreground font-medium">{option.label}</Text>
                <Text className="text-sm text-muted-foreground">
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
          <Text className="text-sm font-medium text-muted-foreground mb-3">
            PREVIEW
          </Text>

          <View className="rounded-lg p-4" style={{ backgroundColor: colors.card }}>
            <View className="flex-row gap-4">
              {/* Light Preview */}
              <View className="flex-1 rounded-lg overflow-hidden border border-border">
                <View className="h-20 bg-white p-3">
                  <View className="h-2 w-16 bg-gray-200 rounded mb-2" />
                  <View className="h-2 w-12 bg-gray-300 rounded" />
                </View>
                <View className="h-6 bg-gray-100 items-center justify-center">
                  <Text className="text-xs text-gray-500">Light</Text>
                </View>
              </View>

              {/* Dark Preview */}
              <View className="flex-1 rounded-lg overflow-hidden border border-border">
                <View className="h-20 bg-gray-900 p-3">
                  <View className="h-2 w-16 bg-gray-700 rounded mb-2" />
                  <View className="h-2 w-12 bg-gray-600 rounded" />
                </View>
                <View className="h-6 bg-gray-800 items-center justify-center">
                  <Text className="text-xs text-gray-400">Dark</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Info */}
        <Text className="text-sm text-muted-foreground mt-6 text-center">
          Theme changes will apply immediately across the app.
        </Text>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}
