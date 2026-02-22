// src/features/settings/screens/settings-screen/BottomSettingsSections.tsx
// Campaigns, Nudges, Admin, About, and Account Actions sections

import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  LogOut,
  Trash2,
  Info,
  Settings,
  Clock,
  Megaphone,
  Mail,
} from 'lucide-react-native';
import { LoadingSpinner, Card } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SettingsItem } from '@/features/settings/components/SettingsItem';

export function CampaignsSection() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View className="p-4">
      <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
        CAMPAIGNS & OUTREACH
      </Text>

      <Card variant="glass">
        <SettingsItem
          icon={<Megaphone size={20} color={colors.primary} />}
          title="Drip Campaigns"
          subtitle="Manage automated follow-up sequences"
          onPress={() => router.push('/(tabs)/campaigns')}
        />
        <SettingsItem
          icon={<Mail size={20} color={colors.mutedForeground} />}
          title="Mail & Integrations"
          subtitle="Direct mail credits, Facebook/Instagram"
          onPress={() => router.push('/(tabs)/settings/campaign-settings')}
          hideBorder
        />
      </Card>
    </View>
  );
}

export function NudgesSection() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View className="p-4">
      <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
        NUDGE SETTINGS
      </Text>

      <Card variant="glass">
        <SettingsItem
          icon={<Clock size={20} color={colors.mutedForeground} />}
          title="Smart Nudges"
          subtitle="Configure follow-up reminders"
          onPress={() => router.push('/(tabs)/settings/nudges')}
          hideBorder
        />
      </Card>
    </View>
  );
}

export function AdminSection() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View className="p-4">
      <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
        ADMINISTRATION
      </Text>

      <Card variant="glass">
        <SettingsItem
          icon={<Settings size={20} color={colors.info} />}
          title="Admin Dashboard"
          subtitle="System management and developer tools"
          onPress={() => router.push('/(admin)')}
          hideBorder
        />
      </Card>
    </View>
  );
}

export function AboutSection() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View className="p-4">
      <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
        ABOUT
      </Text>

      <Card variant="glass">
        <SettingsItem
          icon={<Info size={20} color={colors.mutedForeground} />}
          title="About Doughy AI"
          subtitle="Version, terms, privacy"
          onPress={() => router.push('/(tabs)/settings/about')}
          hideBorder
        />
      </Card>
    </View>
  );
}

interface AccountActionsSectionProps {
  isSigningOut: boolean;
  onSignOut: () => void;
  onDeleteAccount: () => void;
}

export function AccountActionsSection({ isSigningOut, onSignOut, onDeleteAccount }: AccountActionsSectionProps) {
  const colors = useThemeColors();

  return (
    <View className="p-4">
      <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
        ACCOUNT ACTIONS
      </Text>

      <Card variant="glass">
        <TouchableOpacity
          className="flex-row items-center p-4"
          style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
          onPress={onSignOut}
          disabled={isSigningOut}
        >
          <LogOut size={20} color={colors.destructive} />
          <Text className="flex-1 ml-3 font-medium" style={{ color: colors.destructive }}>
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </Text>
          {isSigningOut && <LoadingSpinner size="small" color={colors.destructive} />}
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center p-4"
          onPress={onDeleteAccount}
        >
          <Trash2 size={20} color={colors.destructive} />
          <Text className="flex-1 ml-3 font-medium" style={{ color: colors.destructive }}>
            Delete Account
          </Text>
        </TouchableOpacity>
      </Card>
    </View>
  );
}
