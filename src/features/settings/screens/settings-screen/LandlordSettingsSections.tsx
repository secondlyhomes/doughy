// src/features/settings/screens/settings-screen/LandlordSettingsSections.tsx
// Landlord AI and Integrations/Vendors sections (visible when landlord platform is enabled)

import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Bot, MessageSquare, Mail, Plug, Users } from 'lucide-react-native';
import { Card } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SettingsItem } from '@/features/settings/components/SettingsItem';

export function LandlordAISection() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View className="p-4">
      <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
        LANDLORD AI
      </Text>

      <Card variant="glass">
        <SettingsItem
          icon={<Bot size={20} color={colors.primary} />}
          title="AI Communication"
          subtitle="Configure how AI handles guest messages"
          onPress={() => router.push('/(tabs)/settings/ai-communication')}
        />
        <SettingsItem
          icon={<MessageSquare size={20} color={colors.mutedForeground} />}
          title="Guest Templates"
          subtitle="Check-in, checkout, and custom message templates"
          onPress={() => router.push('/(tabs)/settings/guest-templates')}
          hideBorder
        />
      </Card>
    </View>
  );
}

export function IntegrationsVendorsSection() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View className="p-4">
      <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
        INTEGRATIONS & VENDORS
      </Text>

      <Card variant="glass">
        <SettingsItem
          icon={<Mail size={20} color={colors.primary} />}
          title="Email Integration"
          subtitle="Connect Gmail to receive platform inquiries"
          onPress={() => router.push('/(tabs)/settings/email-integration')}
        />
        <SettingsItem
          icon={<Plug size={20} color={colors.mutedForeground} />}
          title="Integrations"
          subtitle="Seam (Smart Locks), Tracerfy (Skip Tracing)"
          onPress={() => router.push('/(tabs)/settings/integrations')}
        />
        <SettingsItem
          icon={<Users size={20} color={colors.mutedForeground} />}
          title="My Vendors"
          subtitle="Manage your service providers across all properties"
          onPress={() => router.push('/(tabs)/settings/vendors')}
          hideBorder
        />
      </Card>
    </View>
  );
}
