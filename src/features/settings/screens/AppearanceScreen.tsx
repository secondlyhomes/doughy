// src/features/settings/screens/AppearanceScreen.tsx
// Theme and appearance settings

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Sun, Moon, Smartphone, Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = '@doughy_theme';

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
  const navigation = useNavigation();
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>('system');

  // Load saved theme on mount
  React.useEffect(() => {
    const loadTheme = async () => {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        setSelectedTheme(saved as ThemeMode);
      }
    };
    loadTheme();
  }, []);

  const handleSelectTheme = useCallback(async (theme: ThemeMode) => {
    setSelectedTheme(theme);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
    // In a real app, this would update the theme context/provider
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <ArrowLeft size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-foreground ml-2">
          Appearance
        </Text>
      </View>

      <ScrollView className="flex-1 p-6">
        {/* Theme Selection */}
        <Text className="text-sm font-medium text-muted-foreground mb-3">
          THEME
        </Text>

        <View className="bg-card rounded-lg overflow-hidden">
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
              {selectedTheme === option.value && (
                <Check size={20} color="#22c55e" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview */}
        <View className="mt-8">
          <Text className="text-sm font-medium text-muted-foreground mb-3">
            PREVIEW
          </Text>

          <View className="bg-card rounded-lg p-4">
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
    </SafeAreaView>
  );
}
