// src/features/smart-home/screens/SmartHomeHubScreen.tsx
// Smart home hub screen showing all devices for a property

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Lock, Plus, RefreshCw, Settings, Wifi, WifiOff } from 'lucide-react-native';
import { ThemedSafeAreaView, ThemedView } from '@/components';
import { Button, LoadingSpinner, Badge, FAB } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
import {
  usePropertyDevices,
  useDeviceActions,
  useSeamIntegration,
} from '../hooks/useSmartHome';
import { DeviceCard } from '../components/DeviceCard';

export function SmartHomeHubScreen() {
  const { id: propertyId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();

  const { isAvailable, isLoading: integrationLoading } = useSeamIntegration();
  const { data: devices, isLoading, refetch, isRefetching } = usePropertyDevices(propertyId);
  const { lock, unlock, sync, isLocking, isUnlocking, isSyncing } = useDeviceActions();

  const handleDevicePress = useCallback((deviceId: string) => {
    router.push(`/(tabs)/rental-properties/${propertyId}/smart-home/${deviceId}`);
  }, [router, propertyId]);

  const handleLock = useCallback(async (deviceId: string) => {
    const result = await lock(deviceId);
    if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to lock device');
    }
  }, [lock]);

  const handleUnlock = useCallback(async (deviceId: string) => {
    Alert.alert(
      'Unlock Device',
      'Are you sure you want to unlock this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlock',
          style: 'destructive',
          onPress: async () => {
            const result = await unlock(deviceId);
            if (!result.success) {
              Alert.alert('Error', result.error || 'Failed to unlock device');
            }
          },
        },
      ]
    );
  }, [unlock]);

  const handleSync = useCallback(async () => {
    try {
      await sync(propertyId!);
      Alert.alert('Success', 'Devices synced from Seam');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync devices from Seam');
    }
  }, [sync, propertyId]);

  const onlineCount = devices?.filter((d) => d.connection_status === 'online').length || 0;
  const offlineCount = devices?.filter((d) => d.connection_status === 'offline').length || 0;
  const lockedCount = devices?.filter((d) => d.lock_state === 'locked').length || 0;
  const unlockedCount = devices?.filter((d) => d.lock_state === 'unlocked').length || 0;

  // Not connected state
  if (!integrationLoading && !isAvailable) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['bottom']}>
        <Stack.Screen options={{ title: 'Smart Home' }} />
        <View className="flex-1 items-center justify-center p-8">
          <Lock size={64} color={colors.mutedForeground} />
          <Text
            className="text-xl font-semibold mt-4 text-center"
            style={{ color: colors.foreground }}
          >
            Seam Not Connected
          </Text>
          <Text
            className="text-center mt-2"
            style={{ color: colors.mutedForeground }}
          >
            Connect your Seam account to manage smart locks and access codes.
          </Text>
          <Button
            variant="default"
            className="mt-6"
            onPress={() => router.push('/(tabs)/settings/integrations')}
          >
            <View className="flex-row items-center">
              <Settings size={16} color={colors.primaryForeground} />
              <Text className="ml-2" style={{ color: colors.primaryForeground }}>
                Setup Integration
              </Text>
            </View>
          </Button>
        </View>
      </ThemedSafeAreaView>
    );
  }

  if (isLoading || integrationLoading) {
    return (
      <ThemedView className="flex-1">
        <Stack.Screen options={{ title: 'Smart Home' }} />
        <LoadingSpinner fullScreen />
      </ThemedView>
    );
  }

  const hasDevices = devices && devices.length > 0;

  return (
    <ThemedSafeAreaView className="flex-1" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Smart Home',
          headerRight: () => (
            <Button
              variant="ghost"
              size="sm"
              onPress={handleSync}
              disabled={isSyncing}
            >
              <RefreshCw
                size={20}
                color={colors.primary}
                style={{ opacity: isSyncing ? 0.5 : 1 }}
              />
            </Button>
          ),
        }}
      />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Summary Cards */}
        <View className="flex-row flex-wrap p-4 gap-3">
          <View
            className="flex-1 min-w-[140px] rounded-lg p-4"
            style={{ backgroundColor: colors.card }}
          >
            <View className="flex-row items-center mb-2">
              <Wifi size={16} color={colors.success} />
              <Text className="ml-2 text-sm" style={{ color: colors.mutedForeground }}>
                Online
              </Text>
            </View>
            <Text className="text-2xl font-bold" style={{ color: colors.success }}>
              {onlineCount}
            </Text>
          </View>

          <View
            className="flex-1 min-w-[140px] rounded-lg p-4"
            style={{ backgroundColor: colors.card }}
          >
            <View className="flex-row items-center mb-2">
              <WifiOff size={16} color={colors.destructive} />
              <Text className="ml-2 text-sm" style={{ color: colors.mutedForeground }}>
                Offline
              </Text>
            </View>
            <Text className="text-2xl font-bold" style={{ color: colors.destructive }}>
              {offlineCount}
            </Text>
          </View>

          <View
            className="flex-1 min-w-[140px] rounded-lg p-4"
            style={{ backgroundColor: colors.card }}
          >
            <View className="flex-row items-center mb-2">
              <Lock size={16} color={colors.success} />
              <Text className="ml-2 text-sm" style={{ color: colors.mutedForeground }}>
                Locked
              </Text>
            </View>
            <Text className="text-2xl font-bold" style={{ color: colors.foreground }}>
              {lockedCount}
            </Text>
          </View>
        </View>

        {/* Devices List */}
        {hasDevices ? (
          <View className="px-4">
            <Text
              className="text-sm font-medium mb-3"
              style={{ color: colors.mutedForeground }}
            >
              DEVICES ({devices.length})
            </Text>
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onPress={() => handleDevicePress(device.id)}
                onLock={() => handleLock(device.id)}
                onUnlock={() => handleUnlock(device.id)}
                isLocking={isLocking}
                isUnlocking={isUnlocking}
              />
            ))}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center p-8 mt-8">
            <Lock size={48} color={colors.mutedForeground} />
            <Text
              className="text-lg font-medium mt-4 text-center"
              style={{ color: colors.foreground }}
            >
              No Devices Found
            </Text>
            <Text
              className="text-center mt-2"
              style={{ color: colors.mutedForeground }}
            >
              Sync devices from your Seam account to get started.
            </Text>
            <Button
              variant="outline"
              className="mt-4"
              onPress={handleSync}
              loading={isSyncing}
            >
              Sync from Seam
            </Button>
          </View>
        )}
      </ScrollView>
    </ThemedSafeAreaView>
  );
}
