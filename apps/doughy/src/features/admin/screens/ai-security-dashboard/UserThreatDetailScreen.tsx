// src/features/admin/screens/ai-security-dashboard/UserThreatDetailScreen.tsx
// Screen showing detailed threat history for a specific user

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { StepUpVerificationSheet } from '@/components/ui';
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useNativeHeader } from '@/hooks';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';

import { UserInfoCard } from './UserInfoCard';
import { ThreatActionButtons } from './ThreatActionButtons';
import { SecurityEventCard } from './SecurityEventCard';
import { useUserThreatData } from './useUserThreatData';

export function UserThreatDetailScreen() {
  const colors = useThemeColors();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const { headerOptions } = useNativeHeader({
    title: 'User Threat Details',
    fallbackRoute: '/(tabs)/admin/ai-security',
  });

  const {
    isLoading,
    isRefreshing,
    actionLoading,
    userScore,
    events,
    userEmail,
    stepUpState,
    handleRefresh,
    handleResetScore,
    handleBlockUser,
    handleStepUpVerify,
    handleStepUpCancel,
  } = useUserThreatData(userId);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </ThemedSafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>
        <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: SPACING.md,
          paddingTop: SPACING.md,
          paddingBottom: TAB_BAR_SAFE_PADDING + SPACING['4xl'] * 2,
        }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {/* User Info Card */}
        <UserInfoCard
          userEmail={userEmail}
          userId={userId!}
          userScore={userScore}
        />

        {/* Actions */}
        <ThreatActionButtons
          actionLoading={actionLoading}
          onResetScore={handleResetScore}
          onBlockUser={handleBlockUser}
        />

        {/* Security Events */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.foreground,
            marginBottom: 12,
          }}
        >
          Security Events ({events.length})
        </Text>

        {events.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: BORDER_RADIUS.lg,
              padding: 24,
              alignItems: 'center',
            }}
          >
            <Ionicons name="shield-checkmark" size={ICON_SIZES['3xl']} color={colors.success} />
            <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>
              No security events recorded
            </Text>
          </View>
        ) : (
          events.map((event) => (
            <SecurityEventCard key={event.id} event={event} />
          ))
        )}
      </ScrollView>

        {/* Step-up verification sheet for MFA on destructive actions */}
        <StepUpVerificationSheet
          visible={stepUpState.isRequired || stepUpState.status === 'mfa_not_configured'}
          onClose={handleStepUpCancel}
          onVerify={handleStepUpVerify}
          state={stepUpState}
        />
      </ThemedSafeAreaView>
    </>
  );
}

export default UserThreatDetailScreen;
