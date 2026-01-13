// src/features/notifications/screens/NotificationSettingsScreen.tsx
// Notification settings screen for mobile

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Bell,
  Mail,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Smartphone,
} from 'lucide-react-native';
import { SettingsStackParamList } from '@/types';

type NotificationSettingsScreenNavigationProp = NativeStackNavigationProp<
  SettingsStackParamList,
  'NotificationsSettings'
>;

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
}

export function NotificationSettingsScreen() {
  const navigation = useNavigation<NotificationSettingsScreenNavigationProp>();
  const [isSaving, setIsSaving] = useState(false);

  // Notification settings state
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [newLeadAlerts, setNewLeadAlerts] = useState(true);
  const [conversationUpdates, setConversationUpdates] = useState(true);
  const [creditAlerts, setCreditAlerts] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement saving notification preferences to backend
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Notification preferences saved.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-border">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-foreground">Notifications</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Push Notifications Section */}
        <View className="p-4">
          <Text className="text-sm font-medium text-muted-foreground mb-2 px-2">
            PUSH NOTIFICATIONS
          </Text>

          <View className="bg-card rounded-lg">
            <NotificationToggle
              icon={<Smartphone size={20} color="#6b7280" />}
              title="Push Notifications"
              description="Receive push notifications on your device"
              value={pushEnabled}
              onValueChange={setPushEnabled}
            />
            <NotificationToggle
              icon={<Bell size={20} color="#6b7280" />}
              title="New Lead Alerts"
              description="Get notified when you receive a new lead"
              value={newLeadAlerts}
              onValueChange={setNewLeadAlerts}
              disabled={!pushEnabled}
            />
            <NotificationToggle
              icon={<MessageSquare size={20} color="#6b7280" />}
              title="Conversation Updates"
              description="Notifications for new messages and responses"
              value={conversationUpdates}
              onValueChange={setConversationUpdates}
              disabled={!pushEnabled}
            />
            <NotificationToggle
              icon={<AlertCircle size={20} color="#6b7280" />}
              title="Credit Usage Alerts"
              description="Get alerted when credits are running low"
              value={creditAlerts}
              onValueChange={setCreditAlerts}
              disabled={!pushEnabled}
              hideBorder
            />
          </View>
        </View>

        {/* Email Notifications Section */}
        <View className="p-4">
          <Text className="text-sm font-medium text-muted-foreground mb-2 px-2">
            EMAIL NOTIFICATIONS
          </Text>

          <View className="bg-card rounded-lg">
            <NotificationToggle
              icon={<Mail size={20} color="#6b7280" />}
              title="Email Notifications"
              description="Receive important updates via email"
              value={emailEnabled}
              onValueChange={setEmailEnabled}
            />
            <NotificationToggle
              icon={<TrendingUp size={20} color="#6b7280" />}
              title="Weekly Summary"
              description="Get a weekly summary of your activity"
              value={emailEnabled}
              onValueChange={() => {}}
              disabled={!emailEnabled}
            />
            <NotificationToggle
              icon={<Mail size={20} color="#6b7280" />}
              title="Marketing Emails"
              description="Receive tips, updates, and promotions"
              value={marketingEmails}
              onValueChange={setMarketingEmails}
              hideBorder
            />
          </View>
        </View>

        {/* Info */}
        <View className="p-4">
          <View className="bg-primary/10 rounded-lg p-4">
            <Text className="text-sm text-primary font-medium mb-1">
              Need to manage permissions?
            </Text>
            <Text className="text-sm text-muted-foreground">
              To change push notification permissions, go to your device Settings {'>'} Doughy AI {'>'} Notifications.
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <View className="p-4">
          <TouchableOpacity
            className="bg-primary rounded-lg py-4 items-center"
            style={{ opacity: isSaving ? 0.5 : 1 }}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-primary-foreground font-semibold text-base">
                Save Preferences
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// Helper component for notification toggles
interface NotificationToggleProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
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
      className={`flex-row items-center p-4 ${!hideBorder ? 'border-b border-border' : ''}`}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      {icon}
      <View className="flex-1 ml-3">
        <Text className="text-foreground font-medium">{title}</Text>
        <Text className="text-sm text-muted-foreground">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#767577', true: '#6366f1' }}
        thumbColor={value ? '#ffffff' : '#f4f3f4'}
      />
    </View>
  );
}
