// src/features/settings/screens/AboutScreen.tsx
// About screen with app info

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Shield,
  Mail,
  Star,
  Info,
} from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { ScreenHeader } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
import Constants from 'expo-constants';

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';
const BUILD_NUMBER = Constants.expoConfig?.ios?.buildNumber || '1';

export function AboutScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const handleOpenLink = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const handleRateApp = () => {
    // In a real app, this would open the app store
    Alert.alert('Rate App', 'This would open the App Store for rating.');
  };

  const handleContactSupport = () => {
    handleOpenLink('mailto:support@doughy.ai');
  };

  return (
    <ThemedSafeAreaView className="flex-1">
      {/* Header */}
      <ScreenHeader title="About" backButton bordered />

      <ScrollView className="flex-1 p-4">
        {/* App Logo and Info */}
        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-2xl items-center justify-center mb-4" style={{ backgroundColor: colors.primary }}>
            <Text className="text-3xl font-bold" style={{ color: '#FFFFFF' }}>D</Text>
          </View>
          <Text className="text-2xl font-lobster" style={{ color: colors.foreground }}>Doughy AI</Text>
          <Text className="mt-1" style={{ color: colors.mutedForeground }}>
            Real Estate Investment Platform
          </Text>
          <View className="flex-row items-center mt-2">
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              Version {APP_VERSION} ({BUILD_NUMBER})
            </Text>
          </View>
        </View>

        {/* App Description */}
        <View className="rounded-lg p-4 mb-6" style={{ backgroundColor: colors.card }}>
          <Text className="leading-6" style={{ color: colors.foreground }}>
            Doughy AI helps real estate investors analyze deals, manage leads,
            and make smarter investment decisions with AI-powered insights.
          </Text>
        </View>

        {/* Links */}
        <Text className="text-sm font-medium mb-3" style={{ color: colors.mutedForeground }}>
          RESOURCES
        </Text>

        <View className="rounded-lg mb-6" style={{ backgroundColor: colors.card }}>
          <AboutLink
            icon={<FileText size={20} color={colors.mutedForeground} />}
            title="Terms of Service"
            onPress={() => handleOpenLink('https://doughy.ai/terms')}
          />
          <AboutLink
            icon={<Shield size={20} color={colors.mutedForeground} />}
            title="Privacy Policy"
            onPress={() => handleOpenLink('https://doughy.ai/privacy')}
          />
          <AboutLink
            icon={<Info size={20} color={colors.mutedForeground} />}
            title="Help Center"
            onPress={() => handleOpenLink('https://doughy.ai/help')}
            hideBorder
          />
        </View>

        {/* Support */}
        <Text className="text-sm font-medium mb-3" style={{ color: colors.mutedForeground }}>
          SUPPORT
        </Text>

        <View className="rounded-lg mb-6" style={{ backgroundColor: colors.card }}>
          <AboutLink
            icon={<Mail size={20} color={colors.mutedForeground} />}
            title="Contact Support"
            subtitle="support@doughy.ai"
            onPress={handleContactSupport}
          />
          <AboutLink
            icon={<Star size={20} color={colors.warning} />}
            title="Rate the App"
            subtitle="Help us improve"
            onPress={handleRateApp}
            hideBorder
          />
        </View>

        {/* Credits */}
        <View className="items-center mt-4 mb-8">
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>
            Made with love for real estate investors
          </Text>
          <Text className="text-xs mt-2" style={{ color: colors.mutedForeground }}>
            © {new Date().getFullYear()} Doughy AI. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

interface AboutLinkProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  hideBorder?: boolean;
}

function AboutLink({ icon, title, subtitle, onPress, hideBorder }: AboutLinkProps) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      className="flex-row items-center p-4"
      style={!hideBorder ? { borderBottomWidth: 1, borderColor: colors.border } : undefined}
      onPress={onPress}
    >
      <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.muted }}>
        {icon}
      </View>
      <View className="flex-1 ml-4">
        <Text className="font-medium" style={{ color: colors.foreground }}>{title}</Text>
        {subtitle && (
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>{subtitle}</Text>
        )}
      </View>
      <ExternalLink size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}
