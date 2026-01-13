// src/features/settings/screens/SettingsScreen.tsx
// Settings screen for mobile app

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  User,
  Shield,
  Bell,
  LogOut,
  ChevronRight,
  Lock,
  Trash2,
  Info,
  Palette,
  BarChart3,
  Settings,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { SettingsStackParamList, RootStackParamList } from '@/routes/types';
import { CompositeNavigationProp } from '@react-navigation/native';

type SettingsScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { user, profile, signOut, isLoading } = useAuth();

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
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-bold text-foreground">Settings</Text>
        </View>

        {/* Profile Section */}
        <View className="px-4 py-2">
          <TouchableOpacity
            className="flex-row items-center bg-card rounded-lg p-4"
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
              icon={<Lock size={20} color="#6b7280" />}
              title="Change Password"
              onPress={() => navigation.navigate('ChangePassword')}
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
              title="Security Settings"
              subtitle="Two-factor authentication"
              onPress={() => navigation.navigate('Security')}
              hideBorder
            />
          </View>
        </View>

        {/* Admin Section - Only visible to admin/support users */}
        {(profile?.role === 'admin' || profile?.role === 'support') && (
          <View className="p-4">
            <Text className="text-sm font-medium text-muted-foreground mb-2 px-2">
              ADMINISTRATION
            </Text>

            <View className="bg-card rounded-lg">
              <SettingsItem
                icon={<Settings size={20} color="#8b5cf6" />}
                title="Admin Dashboard"
                subtitle="Manage users, integrations, and logs"
                onPress={() => navigation.navigate('Admin')}
                hideBorder
              />
            </View>
          </View>
        )}

        {/* Preferences */}
        <View className="p-4">
          <Text className="text-sm font-medium text-muted-foreground mb-2 px-2">
            PREFERENCES
          </Text>

          <View className="bg-card rounded-lg">
            <SettingsItem
              icon={<Bell size={20} color="#6b7280" />}
              title="Notifications"
              subtitle="Push and email preferences"
              onPress={() => navigation.navigate('NotificationsSettings')}
            />
            <SettingsItem
              icon={<Palette size={20} color="#6b7280" />}
              title="Appearance"
              subtitle="Theme settings"
              onPress={() => navigation.navigate('Appearance')}
            />
            <SettingsItem
              icon={<BarChart3 size={20} color="#6b7280" />}
              title="Analytics"
              subtitle="View your performance metrics"
              onPress={() => navigation.navigate('Analytics')}
              hideBorder
            />
          </View>
        </View>

        {/* About */}
        <View className="p-4">
          <Text className="text-sm font-medium text-muted-foreground mb-2 px-2">
            ABOUT
          </Text>

          <View className="bg-card rounded-lg">
            <SettingsItem
              icon={<Info size={20} color="#6b7280" />}
              title="About Doughy AI"
              subtitle="Version, terms, privacy"
              onPress={() => navigation.navigate('About')}
              hideBorder
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View className="p-4">
          <Text className="text-sm font-medium text-muted-foreground mb-2 px-2">
            ACCOUNT ACTIONS
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

        {/* Bottom padding */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
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

