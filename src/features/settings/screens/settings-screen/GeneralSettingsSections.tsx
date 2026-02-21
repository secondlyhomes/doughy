// src/features/settings/screens/settings-screen/GeneralSettingsSections.tsx
// Account, Security, Preferences, and Deal Preferences sections

import React from 'react';
import { View, Text, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import {
  User,
  Shield,
  Bell,
  Lock,
  Palette,
  BarChart3,
  Focus,
} from 'lucide-react-native';
import { Card } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { SettingsItem } from '@/features/settings/components/SettingsItem';

export function AccountSection() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View className="p-4">
      <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
        ACCOUNT
      </Text>

      <Card variant="glass">
        <SettingsItem
          icon={<User size={20} color={colors.mutedForeground} />}
          title="Edit Profile"
          onPress={() => router.push('/(tabs)/settings/profile')}
        />
        <SettingsItem
          icon={<Lock size={20} color={colors.mutedForeground} />}
          title="Change Password"
          onPress={() => router.push('/(tabs)/settings/change-password')}
          hideBorder
        />
      </Card>
    </View>
  );
}

export function SecuritySection() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View className="p-4">
      <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
        SECURITY
      </Text>

      <Card variant="glass">
        <SettingsItem
          icon={<Shield size={20} color={colors.mutedForeground} />}
          title="Security Settings"
          subtitle="Two-factor authentication"
          onPress={() => router.push('/(tabs)/settings/security')}
          hideBorder
        />
      </Card>
    </View>
  );
}

export function PreferencesSection() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View className="p-4">
      <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
        PREFERENCES
      </Text>

      <Card variant="glass">
        <SettingsItem
          icon={<Bell size={20} color={colors.mutedForeground} />}
          title="Notifications"
          subtitle="Push and email preferences"
          onPress={() => router.push('/(tabs)/settings/notifications')}
        />
        <SettingsItem
          icon={<Palette size={20} color={colors.mutedForeground} />}
          title="Appearance"
          subtitle="Theme settings"
          onPress={() => router.push('/(tabs)/settings/appearance')}
        />
        <SettingsItem
          icon={<BarChart3 size={20} color={colors.mutedForeground} />}
          title="Analytics"
          subtitle="View your performance metrics"
          onPress={() => router.push('/(tabs)/settings/analytics')}
          hideBorder
        />
      </Card>
    </View>
  );
}

export function DealPreferencesSection() {
  const colors = useThemeColors();
  const { focusMode, setFocusMode } = useFocusMode();

  return (
    <View className="p-4">
      <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
        DEAL PREFERENCES
      </Text>

      <Card variant="glass">
        <View className="flex-row items-center p-4">
          <Focus size={20} color={colors.mutedForeground} />
          <View className="flex-1 ml-3">
            <Text style={{ color: colors.foreground }}>Focus Mode Default</Text>
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              Show simplified deal view by default
            </Text>
          </View>
          <Switch
            value={focusMode}
            onValueChange={setFocusMode}
            trackColor={{ false: colors.muted, true: colors.primary }}
            thumbColor={colors.card}
          />
        </View>
      </Card>
    </View>
  );
}
