// src/features/settings/screens/SettingsScreen.tsx
// Settings screen for mobile app
// Zone B: Added Focus Mode preference (Task B5)

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
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
  Focus,
} from 'lucide-react-native';
import { ThemedSafeAreaView, ThemedView } from '@/components';
import { ScreenHeader, LoadingSpinner, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useThemeColors } from '@/context/ThemeContext';
import { useFocusMode } from '@/context/FocusModeContext';

export function SettingsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { user, profile, signOut, isLoading } = useAuth();

  const [isSigningOut, setIsSigningOut] = useState(false);

  // Focus Mode from context (synced across all screens)
  const { focusMode, setFocusMode } = useFocusMode();

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
      <ThemedView className="flex-1">
        <LoadingSpinner fullScreen />
      </ThemedView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}>
        {/* Header */}
        <ScreenHeader title="Settings" subtitle="Customize your experience" />

        {/* Profile Section */}
        <View className="px-4 py-2">
          <TouchableOpacity
            className="flex-row items-center rounded-lg p-4"
            style={{ backgroundColor: colors.card }}
            onPress={() => router.push('/(tabs)/settings/profile')}
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

            <ChevronRight size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Account Settings */}
        <View className="p-4">
          <Text className="text-sm font-medium text-muted-foreground mb-2 px-2">
            ACCOUNT
          </Text>

          <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
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
          </View>
        </View>

        {/* Security */}
        <View className="p-4">
          <Text className="text-sm font-medium text-muted-foreground mb-2 px-2">
            SECURITY
          </Text>

          <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
            <SettingsItem
              icon={<Shield size={20} color={colors.mutedForeground} />}
              title="Security Settings"
              subtitle="Two-factor authentication"
              onPress={() => router.push('/(tabs)/settings/security')}
              hideBorder
            />
          </View>
        </View>

        {/* Preferences */}
        <View className="p-4">
          <Text className="text-sm font-medium text-muted-foreground mb-2 px-2">
            PREFERENCES
          </Text>

          <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
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
          </View>
        </View>

        {/* Deal Preferences - Zone B */}
        <View className="p-4">
          <Text className="text-sm font-medium text-muted-foreground mb-2 px-2">
            DEAL PREFERENCES
          </Text>

          <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
            <View className="flex-row items-center p-4">
              <Focus size={20} color={colors.mutedForeground} />
              <View className="flex-1 ml-3">
                <Text className="text-foreground">Focus Mode Default</Text>
                <Text className="text-sm text-muted-foreground">
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
          </View>
        </View>

        {/* About */}
        <View className="p-4">
          <Text className="text-sm font-medium text-muted-foreground mb-2 px-2">
            ABOUT
          </Text>

          <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
            <SettingsItem
              icon={<Info size={20} color={colors.mutedForeground} />}
              title="About Doughy AI"
              subtitle="Version, terms, privacy"
              onPress={() => router.push('/(tabs)/settings/about')}
              hideBorder
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View className="p-4">
          <Text className="text-sm font-medium text-muted-foreground mb-2 px-2">
            ACCOUNT ACTIONS
          </Text>

          <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
            <TouchableOpacity
              className="flex-row items-center p-4 border-b border-border"
              onPress={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOut size={20} color={colors.destructive} />
              <Text className="flex-1 ml-3 text-destructive font-medium">
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </Text>
              {isSigningOut && <LoadingSpinner size="small" color={colors.destructive} />}
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center p-4"
              onPress={handleDeleteAccount}
            >
              <Trash2 size={20} color={colors.destructive} />
              <Text className="flex-1 ml-3 text-destructive font-medium">
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </ThemedSafeAreaView>
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
  const colors = useThemeColors();
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
      <ChevronRight size={20} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

