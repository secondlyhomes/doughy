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
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Check notification permission status
  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await Notifications.getPermissionsAsync();
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
    const { status } = await Notifications.requestPermissionsAsync();
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
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-foreground ml-2">
          Notifications
        </Text>
      </View>

      <ScrollView className="flex-1 p-6">
        {/* Permission Banner */}
        {hasPermission === false && (
          <TouchableOpacity
            className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex-row items-center"
            onPress={handleRequestPermission}
          >
            <AlertTriangle size={24} color="#f59e0b" />
            <View className="flex-1 ml-3">
              <Text className="text-amber-800 font-medium">
                Notifications Disabled
              </Text>
              <Text className="text-amber-700 text-sm">
                Tap to enable push notifications
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Push Notifications Master Toggle */}
        <Text className="text-sm font-medium text-muted-foreground mb-3">
          PUSH NOTIFICATIONS
        </Text>

        <View className="bg-card rounded-lg mb-6">
          <View className="flex-row items-center p-4">
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <Bell size={20} color="#3b82f6" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-foreground font-medium">Push Notifications</Text>
              <Text className="text-sm text-muted-foreground">
                Receive alerts on your device
              </Text>
            </View>
            <Switch
              value={settings.pushEnabled}
              onValueChange={() => handleToggle('pushEnabled')}
              trackColor={{ false: '#767577', true: '#3b82f6' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Notification Types */}
        <Text className="text-sm font-medium text-muted-foreground mb-3">
          NOTIFICATION TYPES
        </Text>

        <View className="bg-card rounded-lg mb-6">
          <NotificationToggle
            icon={<MessageCircle size={20} color="#22c55e" />}
            title="New Leads"
            description="When new leads are assigned to you"
            value={settings.newLeads}
            onValueChange={() => handleToggle('newLeads')}
            disabled={!settings.pushEnabled}
          />
          <NotificationToggle
            icon={<Bell size={20} color="#3b82f6" />}
            title="Lead Updates"
            description="Status changes and activity on your leads"
            value={settings.leadUpdates}
            onValueChange={() => handleToggle('leadUpdates')}
            disabled={!settings.pushEnabled}
          />
          <NotificationToggle
            icon={<TrendingUp size={20} color="#8b5cf6" />}
            title="Property Alerts"
            description="Price changes and new listings"
            value={settings.propertyAlerts}
            onValueChange={() => handleToggle('propertyAlerts')}
            disabled={!settings.pushEnabled}
          />
          <NotificationToggle
            icon={<TrendingUp size={20} color="#f59e0b" />}
            title="Deal Analysis"
            description="AI insights and recommendations"
            value={settings.dealAnalysis}
            onValueChange={() => handleToggle('dealAnalysis')}
            disabled={!settings.pushEnabled}
            hideBorder
          />
        </View>

        {/* Team & Email */}
        <Text className="text-sm font-medium text-muted-foreground mb-3">
          OTHER
        </Text>

        <View className="bg-card rounded-lg">
          <NotificationToggle
            icon={<MessageCircle size={20} color="#6b7280" />}
            title="Team Updates"
            description="Messages from team members"
            value={settings.teamUpdates}
            onValueChange={() => handleToggle('teamUpdates')}
            disabled={!settings.pushEnabled}
          />
          <NotificationToggle
            icon={<Settings size={20} color="#6b7280" />}
            title="Marketing Emails"
            description="Tips, updates, and promotions"
            value={settings.marketingEmails}
            onValueChange={() => handleToggle('marketingEmails')}
            hideBorder
          />
        </View>
      </ScrollView>
    </SafeAreaView>
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
  return (
    <View
      className={`flex-row items-center p-4 ${
        !hideBorder ? 'border-b border-border' : ''
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
        {icon}
      </View>
      <View className="flex-1 ml-4">
        <Text className="text-foreground font-medium">{title}</Text>
        <Text className="text-sm text-muted-foreground">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#767577', true: '#3b82f6' }}
        thumbColor="#ffffff"
      />
    </View>
  );
}
