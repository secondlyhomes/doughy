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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  Clock,
  Bot,
  Megaphone,
  Mail,
  Plug,
  Users,
  MessageSquare,
} from 'lucide-react-native';
import { ThemedSafeAreaView, ThemedView } from '@/components';
import { LoadingSpinner, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { useThemeColors } from '@/context/ThemeContext';
import { useFocusMode } from '@/context/FocusModeContext';
import { PlatformSettingsSection } from '../components/PlatformSettingsSection';
import { DevSeederSection } from '../components/DevSeederSection';
import { useLandlordSettingsStore, selectIsLandlordEnabled } from '@/stores/landlord-settings-store';

export function SettingsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user, profile, signOut, isLoading } = useAuth();
  const { canViewAdminPanel } = usePermissions();

  const [isSigningOut, setIsSigningOut] = useState(false);

  // Focus Mode from context (synced across all screens)
  const { focusMode, setFocusMode } = useFocusMode();

  // Check if landlord platform is enabled
  const isLandlordEnabled = useLandlordSettingsStore(selectIsLandlordEnabled);

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
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }} contentInsetAdjustmentBehavior="automatic">
        {/* Profile Section */}
        <View className="px-4 py-2">
          <TouchableOpacity
            className="flex-row items-center rounded-lg p-4"
            style={{ backgroundColor: colors.card }}
            onPress={() => router.push('/(tabs)/settings/profile')}
          >
            {/* Avatar */}
            <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary }}>
              <Text className="text-xl font-bold" style={{ color: colors.primaryForeground }}>
                {getInitials(profile?.full_name, user?.email)}
              </Text>
            </View>

            {/* User Info */}
            <View className="flex-1 ml-4">
              <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
                {profile?.full_name || 'User'}
              </Text>
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>{user?.email}</Text>
              <Text className="text-xs capitalize mt-1" style={{ color: colors.primary }}>
                {profile?.role || 'user'} account
              </Text>
            </View>

            <ChevronRight size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Platform Settings - Enable/Switch Landlord Platform */}
        <View className="p-4">
          <PlatformSettingsSection />
        </View>

        {/* Landlord AI Settings - Only visible when landlord platform is enabled */}
        {isLandlordEnabled && (
          <View className="p-4">
            <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
              LANDLORD AI
            </Text>

            <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
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
            </View>
          </View>
        )}

        {/* Integrations & Vendors - Only visible when landlord platform is enabled */}
        {isLandlordEnabled && (
          <View className="p-4">
            <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
              INTEGRATIONS & VENDORS
            </Text>

            <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
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
            </View>
          </View>
        )}

        {/* Account Settings */}
        <View className="p-4">
          <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
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
          <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
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
          <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
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
          <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
            DEAL PREFERENCES
          </Text>

          <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
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
          </View>
        </View>

        {/* Campaign & Outreach Settings */}
        <View className="p-4">
          <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
            CAMPAIGNS & OUTREACH
          </Text>

          <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
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
          </View>
        </View>

        {/* Nudge Settings */}
        <View className="p-4">
          <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
            NUDGE SETTINGS
          </Text>

          <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
            <SettingsItem
              icon={<Clock size={20} color={colors.mutedForeground} />}
              title="Smart Nudges"
              subtitle="Configure follow-up reminders"
              onPress={() => router.push('/(tabs)/settings/nudges')}
              hideBorder
            />
          </View>
        </View>

        {/* Admin Panel - Only visible to admin/support users */}
        {canViewAdminPanel && (
          <View className="p-4">
            <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
              ADMINISTRATION
            </Text>

            <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
              <SettingsItem
                icon={<Settings size={20} color={colors.info} />}
                title="Admin Dashboard"
                subtitle="System management and developer tools"
                onPress={() => router.push('/(admin)')}
                hideBorder
              />
            </View>
          </View>
        )}

        {/* Dev Tools - Landlord Data Seeder (DEV only) */}
        <DevSeederSection />

        {/* About */}
        <View className="p-4">
          <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
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
          <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
            ACCOUNT ACTIONS
          </Text>

          <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
            <TouchableOpacity
              className="flex-row items-center p-4"
              style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
              onPress={handleSignOut}
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
              onPress={handleDeleteAccount}
            >
              <Trash2 size={20} color={colors.destructive} />
              <Text className="flex-1 ml-3 font-medium" style={{ color: colors.destructive }}>
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
      className="flex-row items-center p-4"
      style={!hideBorder ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
      onPress={onPress}
    >
      {icon}
      <View className="flex-1 ml-3">
        <Text style={{ color: colors.foreground }}>{title}</Text>
        {subtitle && <Text className="text-sm" style={{ color: colors.mutedForeground }}>{subtitle}</Text>}
      </View>
      <ChevronRight size={20} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

