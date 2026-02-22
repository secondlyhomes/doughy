// src/features/smart-home/screens/DeviceDetailScreen.tsx
// Detail screen for a single smart device with access code management

import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Lock, RefreshCw } from 'lucide-react-native';
import { Stack } from 'expo-router';
import { ThemedSafeAreaView, ThemedView } from '@/components';
import { Button, LoadingSpinner } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { GenerateCodeSheet } from '../components/GenerateCodeSheet';
import { ICON_SIZES } from '@/constants/design-tokens';
import {
  useDeviceDetailActions,
  DeviceStatusCard,
  AccessCodesSection,
} from './device-detail';

export function DeviceDetailScreen() {
  const { deviceId } = useLocalSearchParams<{ deviceId: string }>();
  const colors = useThemeColors();

  const [showGenerateSheet, setShowGenerateSheet] = useState(false);

  const {
    device,
    deviceLoading,
    accessCodes,
    codesLoading,
    isRefetching,
    isLocking,
    isUnlocking,
    isRefreshing,
    isRevoking,
    handleLock,
    handleUnlock,
    handleRefresh,
    handleRevokeCode,
    handleRefreshAll,
  } = useDeviceDetailActions(deviceId);

  if (deviceLoading) {
    return (
      <ThemedView className="flex-1">
        <Stack.Screen options={{ title: 'Device' }} />
        <LoadingSpinner fullScreen />
      </ThemedView>
    );
  }

  if (!device) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['bottom']}>
        <Stack.Screen options={{ title: 'Device' }} />
        <View className="flex-1 items-center justify-center p-8">
          <Lock size={ICON_SIZES['3xl']} color={colors.mutedForeground} />
          <Text className="mt-4" style={{ color: colors.mutedForeground }}>
            Device not found
          </Text>
        </View>
      </ThemedSafeAreaView>
    );
  }

  const isOnline = device.connection_status === 'online';
  const isLocked = device.lock_state === 'locked';

  return (
    <ThemedSafeAreaView className="flex-1" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: device.name,
          headerRight: () => (
            <Button
              variant="ghost"
              size="sm"
              onPress={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                size={ICON_SIZES.lg}
                color={colors.primary}
                style={{ opacity: isRefreshing ? 0.5 : 1 }}
              />
            </Button>
          ),
        }}
      />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefreshAll} />
        }
      >
        <DeviceStatusCard
          device={device}
          isOnline={isOnline}
          isLocked={isLocked}
          isLocking={isLocking}
          isUnlocking={isUnlocking}
          onLock={handleLock}
          onUnlock={handleUnlock}
        />

        <AccessCodesSection
          accessCodes={accessCodes}
          codesLoading={codesLoading}
          isRevoking={isRevoking}
          onRevokeCode={handleRevokeCode}
          onGeneratePress={() => setShowGenerateSheet(true)}
        />
      </ScrollView>

      {device && (
        <GenerateCodeSheet
          isOpen={showGenerateSheet}
          onClose={() => setShowGenerateSheet(false)}
          device={device}
        />
      )}
    </ThemedSafeAreaView>
  );
}
