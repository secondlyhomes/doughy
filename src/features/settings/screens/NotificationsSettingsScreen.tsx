// src/features/settings/screens/NotificationsSettingsScreen.tsx
// Push notification settings

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, MessageCircle, TrendingUp, AlertTriangle, Settings } from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { ScreenHeader } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPermissionsAsync, requestPermissionsAsync } from '@/utils/notifications';

const NOTIFICATIONS_STORAGE_KEY = '@doughy_notifications';

interface NotificationSettings {
  pushEnabled: boolean;
  newLeads: boolean;
  leadUpdates: boolean;
  propertyAlerts: boolean;
  dealAnalysis: boolean;
  teamUpdates: boolean;
  marketingEmails: boolean;
}

const defaultSettings: NotificationSettings = {
  pushEnabled: true,
  newLeads: true,
  leadUpdates: true,
  propertyAlerts: true,
  dealAnalysis: true,
  teamUpdates: true,
  marketingEmails: false,
};

export function NotificationsSettingsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Check notification permission status
  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await getPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    checkPermission();
  }, []);

  // Load saved settings
  useEffect(() => {
    const loadSettings = async () => {
      const saved = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (saved) {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      }
    };
    loadSettings();
  }, []);

  const saveSettings = useCallback(async (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(newSettings));
  }, []);

  const handleToggle = useCallback(
    (key: keyof NotificationSettings) => {
      const newSettings = { ...settings, [key]: !settings[key] };
      saveSettings(newSettings);
    },
    [settings, saveSettings]
  );

  const handleRequestPermission = useCallback(async () => {
    const { status } = await requestPermissionsAsync();
    setHasPermission(status === 'granted');

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings to receive alerts.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );
    }
  }, []);

  return (
    <ThemedSafeAreaView className="flex-1">
      {/* Header */}
      <ScreenHeader title="Notifications" backButton bordered />

      <ScrollView className="flex-1 p-4">
        {/* Permission Banner */}
        {hasPermission === false && (
          <TouchableOpacity
            className="rounded-lg p-4 mb-6 flex-row items-center"
            style={{ backgroundColor: `${colors.warning}15`, borderWidth: 1, borderColor: `${colors.warning}50` }}
            onPress={handleRequestPermission}
          >
            <AlertTriangle size={24} color={colors.warning} />
            <View className="flex-1 ml-3">
              <Text className="font-medium" style={{ color: colors.warning }}>
                Notifications Disabled
              </Text>
              <Text className="text-sm" style={{ color: `${colors.warning}cc` }}>
                Tap to enable push notifications
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Push Notifications Master Toggle */}
        <Text className="text-sm font-medium mb-3" style={{ color: colors.mutedForeground }}>
          PUSH NOTIFICATIONS
        </Text>

        <View className="rounded-lg mb-6" style={{ backgroundColor: colors.card }}>
          <View className="flex-row items-center p-4">
            <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: `${colors.primary}15` }}>
              <Bell size={20} color={colors.info} />
            </View>
            <View className="flex-1 ml-4">
              <Text className="font-medium" style={{ color: colors.foreground }}>Push Notifications</Text>
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                Receive alerts on your device
              </Text>
            </View>
            <Switch
              value={settings.pushEnabled}
              onValueChange={() => handleToggle('pushEnabled')}
              trackColor={{ false: colors.muted, true: colors.info }}
              thumbColor={colors.background}
            />
          </View>
        </View>

        {/* Notification Types */}
        <Text className="text-sm font-medium mb-3" style={{ color: colors.mutedForeground }}>
          NOTIFICATION TYPES
        </Text>

        <View className="rounded-lg mb-6" style={{ backgroundColor: colors.card }}>
          <NotificationToggle
            icon={<MessageCircle size={20} color={colors.success} />}
            title="New Leads"
            description="When new leads are assigned to you"
            value={settings.newLeads}
            onValueChange={() => handleToggle('newLeads')}
            disabled={!settings.pushEnabled}
          />
          <NotificationToggle
            icon={<Bell size={20} color={colors.info} />}
            title="Lead Updates"
            description="Status changes and activity on your leads"
            value={settings.leadUpdates}
            onValueChange={() => handleToggle('leadUpdates')}
            disabled={!settings.pushEnabled}
          />
          <NotificationToggle
            icon={<TrendingUp size={20} color={colors.primary} />}
            title="Property Alerts"
            description="Price changes and new listings"
            value={settings.propertyAlerts}
            onValueChange={() => handleToggle('propertyAlerts')}
            disabled={!settings.pushEnabled}
          />
          <NotificationToggle
            icon={<TrendingUp size={20} color={colors.warning} />}
            title="Deal Analysis"
            description="AI insights and recommendations"
            value={settings.dealAnalysis}
            onValueChange={() => handleToggle('dealAnalysis')}
            disabled={!settings.pushEnabled}
            hideBorder
          />
        </View>

        {/* Team & Email */}
        <Text className="text-sm font-medium mb-3" style={{ color: colors.mutedForeground }}>
          OTHER
        </Text>

        <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
          <NotificationToggle
            icon={<MessageCircle size={20} color={colors.mutedForeground} />}
            title="Team Updates"
            description="Messages from team members"
            value={settings.teamUpdates}
            onValueChange={() => handleToggle('teamUpdates')}
            disabled={!settings.pushEnabled}
          />
          <NotificationToggle
            icon={<Settings size={20} color={colors.mutedForeground} />}
            title="Marketing Emails"
            description="Tips, updates, and promotions"
            value={settings.marketingEmails}
            onValueChange={() => handleToggle('marketingEmails')}
            hideBorder
          />
        </View>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

interface NotificationToggleProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: boolean;
  onValueChange: () => void;
  disabled?: boolean;
  hideBorder?: boolean;
}

function NotificationToggle({
  icon,
  title,
  description,
  value,
  onValueChange,
  disabled = false,
  hideBorder = false,
}: NotificationToggleProps) {
  const colors = useThemeColors();
  return (
    <View
      className="flex-row items-center p-4"
      style={[
        !hideBorder ? { borderBottomWidth: 1, borderBottomColor: colors.border } : {},
        disabled ? { opacity: 0.5 } : {},
      ]}
    >
      <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.muted }}>
        {icon}
      </View>
      <View className="flex-1 ml-4">
        <Text className="font-medium" style={{ color: colors.foreground }}>{title}</Text>
        <Text className="text-sm" style={{ color: colors.mutedForeground }}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.muted, true: colors.info }}
        thumbColor={value ? colors.card : colors.mutedForeground}
      />
    </View>
  );
}
