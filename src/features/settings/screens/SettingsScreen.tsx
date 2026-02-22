// src/features/settings/screens/SettingsScreen.tsx
// Settings screen for mobile app
// Zone B: Added Focus Mode preference (Task B5)

import React, { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { ThemedSafeAreaView, ThemedView } from '@/components';
import { LoadingSpinner, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { PlatformSettingsSection } from '../components/PlatformSettingsSection';
import { DevSeederSection } from '../components/DevSeederSection';
import { useLandlordSettingsStore, selectIsLandlordEnabled } from '@/stores/landlord-settings-store';
import {
  ProfileHeader,
  LandlordAISection,
  IntegrationsVendorsSection,
  AccountSection,
  SecuritySection,
  PreferencesSection,
  DealPreferencesSection,
  CampaignsSection,
  NudgesSection,
  AdminSection,
  AboutSection,
  AccountActionsSection,
} from './settings-screen';
import { View } from 'react-native';

export function SettingsScreen() {
  const { signOut, isLoading } = useAuth();
  const { canViewAdminPanel } = usePermissions();

  const [isSigningOut, setIsSigningOut] = useState(false);

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
        <ProfileHeader />

        {/* Platform Settings - Enable/Switch Landlord Platform */}
        <View className="p-4">
          <PlatformSettingsSection />
        </View>

        {/* Landlord AI Settings - Only visible when landlord platform is enabled */}
        {isLandlordEnabled && <LandlordAISection />}

        {/* Integrations & Vendors - Only visible when landlord platform is enabled */}
        {isLandlordEnabled && <IntegrationsVendorsSection />}

        <AccountSection />
        <SecuritySection />
        <PreferencesSection />
        <DealPreferencesSection />
        <CampaignsSection />
        <NudgesSection />

        {/* Admin Panel - Only visible to admin/support users */}
        {canViewAdminPanel && <AdminSection />}

        {/* Dev Tools - Landlord Data Seeder (DEV only) */}
        <DevSeederSection />

        <AboutSection />

        <AccountActionsSection
          isSigningOut={isSigningOut}
          onSignOut={handleSignOut}
          onDeleteAccount={handleDeleteAccount}
        />
      </ScrollView>
    </ThemedSafeAreaView>
  );
}
