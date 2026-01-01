// src/features/settings/screens/SettingsScreen.tsx
// Settings screen for mobile app

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  User,
  Shield,
  Bell,
  Moon,
  LogOut,
  ChevronRight,
  Mail,
  Lock,
  Trash2,
} from 'lucide-react-native';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { RootStackParamList } from '@/types';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { user, profile, signOut, isLoading } = useAuth();

  // Local state for settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. Are you sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Coming Soon', 'Account deletion will be available soon.');
          },
        },
      ]
    );
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Profile Section */}
      <View className="p-6 border-b border-border">
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => navigation.navigate('Profile')}
        >
          {/* Avatar */}
          <View className="w-16 h-16 rounded-full bg-primary items-center justify-center">
            <Text className="text-primary-foreground text-xl font-bold">
              {getInitials(profile?.full_name, user?.email)}
            </Text>
          </View>

          {/* User Info */}
          <View className="flex-1 ml-4">
            <Text className="text-lg font-semibold text-foreground">
              {profile?.full_name || 'User'}
            </Text>
            <Text className="text-sm text-muted-foreground">{user?.email}</Text>
            <Text className="text-xs text-primary capitalize mt-1">
              {profile?.role || 'user'} account
            </Text>
          </View>

          <ChevronRight size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Account Settings */}
      <View className="p-4">
        <Text className="text-sm font-medium text-muted-foreground mb-2 px-2">
          ACCOUNT
        </Text>

        <View className="bg-card rounded-lg">
          <SettingsItem
            icon={<User size={20} color="#6b7280" />}
            title="Edit Profile"
            onPress={() => navigation.navigate('Profile')}
          />
          <SettingsItem
            icon={<Mail size={20} color="#6b7280" />}
            title="Email Preferences"
            onPress={() => Alert.alert('Coming Soon', 'Email preferences will be available soon.')}
          />
          <SettingsItem
            icon={<Lock size={20} color="#6b7280" />}
            title="Change Password"
            onPress={() => Alert.alert('Coming Soon', 'Password change will be available soon.')}
            hideBorder
          />
        </View>
      </View>

      {/* Security */}
      <View className="p-4">
        <Text className="text-sm font-medium text-muted-foreground mb-2 px-2">
          SECURITY
        </Text>

        <View className="bg-card rounded-lg">
          <SettingsItem
            icon={<Shield size={20} color="#6b7280" />}
            title="Two-Factor Authentication"
            onPress={() => Alert.alert('Coming Soon', '2FA will be available soon.')}
            hideBorder
          />
        </View>
      </View>

      {/* Preferences */}
      <View className="p-4">
        <Text className="text-sm font-medium text-muted-foreground mb-2 px-2">
          PREFERENCES
        </Text>

        <View className="bg-card rounded-lg">
          <SettingsToggle
            icon={<Bell size={20} color="#6b7280" />}
            title="Push Notifications"
            value={pushNotifications}
            onValueChange={setPushNotifications}
          />
          <SettingsToggle
            icon={<Moon size={20} color="#6b7280" />}
            title="Dark Mode"
            value={darkMode}
            onValueChange={setDarkMode}
            hideBorder
          />
        </View>
      </View>

      {/* Danger Zone */}
      <View className="p-4">
        <Text className="text-sm font-medium text-muted-foreground mb-2 px-2">
          DANGER ZONE
        </Text>

        <View className="bg-card rounded-lg">
          <TouchableOpacity
            className="flex-row items-center p-4 border-b border-border"
            onPress={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut size={20} color="#ef4444" />
            <Text className="flex-1 ml-3 text-destructive font-medium">
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </Text>
            {isSigningOut && <ActivityIndicator size="small" color="#ef4444" />}
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-4"
            onPress={handleDeleteAccount}
          >
            <Trash2 size={20} color="#ef4444" />
            <Text className="flex-1 ml-3 text-destructive font-medium">
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Version Info */}
      <View className="p-4 items-center">
        <Text className="text-xs text-muted-foreground">Doughy AI v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

// Helper components
interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  hideBorder?: boolean;
}

function SettingsItem({ icon, title, subtitle, onPress, hideBorder }: SettingsItemProps) {
  return (
    <TouchableOpacity
      className={`flex-row items-center p-4 ${!hideBorder ? 'border-b border-border' : ''}`}
      onPress={onPress}
    >
      {icon}
      <View className="flex-1 ml-3">
        <Text className="text-foreground">{title}</Text>
        {subtitle && <Text className="text-sm text-muted-foreground">{subtitle}</Text>}
      </View>
      <ChevronRight size={20} color="#6b7280" />
    </TouchableOpacity>
  );
}

interface SettingsToggleProps {
  icon: React.ReactNode;
  title: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  hideBorder?: boolean;
}

function SettingsToggle({ icon, title, value, onValueChange, hideBorder }: SettingsToggleProps) {
  return (
    <View className={`flex-row items-center p-4 ${!hideBorder ? 'border-b border-border' : ''}`}>
      {icon}
      <Text className="flex-1 ml-3 text-foreground">{title}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#767577', true: '#6366f1' }}
        thumbColor={value ? '#ffffff' : '#f4f3f4'}
      />
    </View>
  );
}
