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
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';
const BUILD_NUMBER = Constants.expoConfig?.ios?.buildNumber || '1';

export function AboutScreen() {
  const router = useRouter();

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
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-foreground ml-2">
          About
        </Text>
      </View>

      <ScrollView className="flex-1 p-6">
        {/* App Logo and Info */}
        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-2xl bg-primary items-center justify-center mb-4">
            <Text className="text-white text-3xl font-bold">D</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground">Doughy AI</Text>
          <Text className="text-muted-foreground mt-1">
            Real Estate Investment Platform
          </Text>
          <View className="flex-row items-center mt-2">
            <Text className="text-sm text-muted-foreground">
              Version {APP_VERSION} ({BUILD_NUMBER})
            </Text>
          </View>
        </View>

        {/* App Description */}
        <View className="bg-card rounded-lg p-4 mb-6">
          <Text className="text-foreground leading-6">
            Doughy AI helps real estate investors analyze deals, manage leads,
            and make smarter investment decisions with AI-powered insights.
          </Text>
        </View>

        {/* Links */}
        <Text className="text-sm font-medium text-muted-foreground mb-3">
          RESOURCES
        </Text>

        <View className="bg-card rounded-lg mb-6">
          <AboutLink
            icon={<FileText size={20} color="#6b7280" />}
            title="Terms of Service"
            onPress={() => handleOpenLink('https://doughy.ai/terms')}
          />
          <AboutLink
            icon={<Shield size={20} color="#6b7280" />}
            title="Privacy Policy"
            onPress={() => handleOpenLink('https://doughy.ai/privacy')}
          />
          <AboutLink
            icon={<Info size={20} color="#6b7280" />}
            title="Help Center"
            onPress={() => handleOpenLink('https://doughy.ai/help')}
            hideBorder
          />
        </View>

        {/* Support */}
        <Text className="text-sm font-medium text-muted-foreground mb-3">
          SUPPORT
        </Text>

        <View className="bg-card rounded-lg mb-6">
          <AboutLink
            icon={<Mail size={20} color="#6b7280" />}
            title="Contact Support"
            subtitle="support@doughy.ai"
            onPress={handleContactSupport}
          />
          <AboutLink
            icon={<Star size={20} color="#f59e0b" />}
            title="Rate the App"
            subtitle="Help us improve"
            onPress={handleRateApp}
            hideBorder
          />
        </View>

        {/* Credits */}
        <View className="items-center mt-4 mb-8">
          <Text className="text-sm text-muted-foreground">
            Made with love for real estate investors
          </Text>
          <Text className="text-xs text-muted-foreground mt-2">
            © {new Date().getFullYear()} Doughy AI. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  return (
    <TouchableOpacity
      className={`flex-row items-center p-4 ${
        !hideBorder ? 'border-b border-border' : ''
      }`}
      onPress={onPress}
    >
      <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
        {icon}
      </View>
      <View className="flex-1 ml-4">
        <Text className="text-foreground font-medium">{title}</Text>
        {subtitle && (
          <Text className="text-sm text-muted-foreground">{subtitle}</Text>
        )}
      </View>
      <ExternalLink size={18} color="#6b7280" />
    </TouchableOpacity>
  );
}
