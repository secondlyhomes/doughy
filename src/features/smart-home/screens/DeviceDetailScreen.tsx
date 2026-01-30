// src/features/smart-home/screens/DeviceDetailScreen.tsx
// Detail screen for a single smart device with access code management

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  Battery,
  Key,
  Plus,
  RefreshCw,
  Clock,
} from 'lucide-react-native';
import { ThemedSafeAreaView, ThemedView } from '@/components';
import { Button, LoadingSpinner, Badge } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import {
  useDevice,
  useDeviceAccessCodes,
  useDeviceActions,
  useAccessCodeMutations,
} from '../hooks/useSmartHome';
import { AccessCodeCard } from '../components/AccessCodeCard';
import { GenerateCodeSheet } from '../components/GenerateCodeSheet';
import { DEVICE_BRAND_CONFIG } from '../types';

export function DeviceDetailScreen() {
  const { deviceId } = useLocalSearchParams<{ deviceId: string }>();
  const router = useRouter();
  const colors = useThemeColors();

  const [showGenerateSheet, setShowGenerateSheet] = useState(false);

  const { data: device, isLoading: deviceLoading, refetch: refetchDevice } = useDevice(deviceId);
  const {
    data: accessCodes,
    isLoading: codesLoading,
    refetch: refetchCodes,
    isRefetching,
  } = useDeviceAccessCodes(deviceId);
  const { lock, unlock, refresh, isLocking, isUnlocking, isRefreshing } = useDeviceActions();
  const { revoke, isRevoking } = useAccessCodeMutations();

  const handleLock = useCallback(async () => {
    if (!deviceId) return;
    const result = await lock(deviceId);
    if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to lock device');
    }
  }, [lock, deviceId]);

  const handleUnlock = useCallback(async () => {
    if (!deviceId) return;
    Alert.alert('Unlock Device', 'Are you sure you want to unlock this device?', [
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
    ]);
  }, [unlock, deviceId]);

  const handleRefresh = useCallback(async () => {
    if (!deviceId) return;
    await refresh(deviceId);
    await refetchDevice();
  }, [refresh, refetchDevice, deviceId]);

  const handleRevokeCode = useCallback(
    async (accessCodeId: string) => {
      Alert.alert('Revoke Access Code', 'This code will no longer work. Continue?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await revoke({ accessCodeId, deviceId: deviceId! });
            } catch (error) {
              Alert.alert('Error', 'Failed to revoke access code');
            }
          },
        },
      ]);
    },
    [revoke, deviceId]
  );

  const handleRefreshAll = useCallback(() => {
    refetchDevice();
    refetchCodes();
  }, [refetchDevice, refetchCodes]);

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
          <Lock size={48} color={colors.mutedForeground} />
          <Text className="mt-4" style={{ color: colors.mutedForeground }}>
            Device not found
          </Text>
        </View>
      </ThemedSafeAreaView>
    );
  }

  const isOnline = device.connection_status === 'online';
  const isLocked = device.lock_state === 'locked';
  const lowBattery = (device.battery_level || 100) < 20;
  const brandConfig = DEVICE_BRAND_CONFIG[device.brand];

  const activeAccessCodes = accessCodes?.filter((c) => c.status === 'active') || [];
  const scheduledAccessCodes = accessCodes?.filter((c) => c.status === 'scheduled') || [];
  const expiredAccessCodes = accessCodes?.filter(
    (c) => c.status === 'expired' || c.status === 'revoked'
  ) || [];

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
                size={20}
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
        {/* Device Status Card */}
        <View className="m-4 p-4 rounded-xl" style={{ backgroundColor: colors.card }}>
          {/* Lock Icon and Status */}
          <View className="items-center mb-4">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-3"
              style={{
                backgroundColor: isOnline
                  ? isLocked
                    ? `${colors.success}20`
                    : `${colors.warning}20`
                  : colors.muted,
              }}
            >
              {isLocked ? (
                <Lock size={48} color={isOnline ? colors.success : colors.mutedForeground} />
              ) : (
                <Unlock size={48} color={isOnline ? colors.warning : colors.mutedForeground} />
              )}
            </View>

            <Text className="text-xl font-bold" style={{ color: colors.foreground }}>
              {device.name}
            </Text>
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              {brandConfig.label} {device.model ? `- ${device.model}` : ''}
            </Text>
            {device.location && (
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                {device.location}
              </Text>
            )}
          </View>

          {/* Status Badges */}
          <View className="flex-row justify-center gap-3 mb-4">
            <View className="flex-row items-center">
              {isOnline ? (
                <Wifi size={14} color={colors.success} />
              ) : (
                <WifiOff size={14} color={colors.destructive} />
              )}
              <Text
                className="text-sm ml-1"
                style={{ color: isOnline ? colors.success : colors.destructive }}
              >
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>

            {device.battery_level !== undefined && (
              <View className="flex-row items-center">
                <Battery
                  size={14}
                  color={lowBattery ? colors.warning : colors.mutedForeground}
                />
                <Text
                  className="text-sm ml-1"
                  style={{ color: lowBattery ? colors.warning : colors.mutedForeground }}
                >
                  {device.battery_level}%
                </Text>
              </View>
            )}

            {device.last_seen_at && (
              <View className="flex-row items-center">
                <Clock size={14} color={colors.mutedForeground} />
                <Text className="text-sm ml-1" style={{ color: colors.mutedForeground }}>
                  {new Date(device.last_seen_at).toLocaleTimeString()}
                </Text>
              </View>
            )}
          </View>

          {/* Lock/Unlock Buttons */}
          {isOnline && (
            <View className="flex-row gap-3">
              <Button
                variant={isLocked ? 'outline' : 'default'}
                className="flex-1"
                onPress={handleLock}
                loading={isLocking}
                disabled={isLocking || isLocked}
              >
                <View className="flex-row items-center">
                  <Lock size={16} color={isLocked ? colors.mutedForeground : colors.primaryForeground} />
                  <Text
                    className="ml-2"
                    style={{ color: isLocked ? colors.mutedForeground : colors.primaryForeground }}
                  >
                    Lock
                  </Text>
                </View>
              </Button>
              <Button
                variant={!isLocked ? 'outline' : 'destructive'}
                className="flex-1"
                onPress={handleUnlock}
                loading={isUnlocking}
                disabled={isUnlocking || !isLocked}
              >
                <View className="flex-row items-center">
                  <Unlock size={16} color={!isLocked ? colors.mutedForeground : colors.destructiveForeground} />
                  <Text
                    className="ml-2"
                    style={{ color: !isLocked ? colors.mutedForeground : colors.destructiveForeground }}
                  >
                    Unlock
                  </Text>
                </View>
              </Button>
            </View>
          )}

          {!isOnline && (
            <View
              className="rounded-lg p-3 mt-2"
              style={{ backgroundColor: `${colors.destructive}20` }}
            >
              <Text className="text-sm text-center" style={{ color: colors.destructive }}>
                Device is offline. Lock/unlock actions are unavailable.
              </Text>
            </View>
          )}
        </View>

        {/* Access Codes Section */}
        <View className="px-4 pb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Key size={18} color={colors.foreground} />
              <Text className="font-semibold ml-2" style={{ color: colors.foreground }}>
                Access Codes
              </Text>
              {activeAccessCodes.length > 0 && (
                <View className="ml-2">
                  <Badge variant="success" size="sm">
                    {activeAccessCodes.length} active
                  </Badge>
                </View>
              )}
            </View>

            <Button
              variant="default"
              size="sm"
              onPress={() => setShowGenerateSheet(true)}
            >
              <View className="flex-row items-center">
                <Plus size={14} color={colors.primaryForeground} />
                <Text className="ml-1" style={{ color: colors.primaryForeground }}>
                  Generate
                </Text>
              </View>
            </Button>
          </View>

          {codesLoading ? (
            <View className="py-8">
              <LoadingSpinner />
            </View>
          ) : accessCodes && accessCodes.length > 0 ? (
            <View>
              {/* Active Codes */}
              {activeAccessCodes.length > 0 && (
                <View className="mb-4">
                  <Text
                    className="text-sm font-medium mb-2"
                    style={{ color: colors.mutedForeground }}
                  >
                    ACTIVE
                  </Text>
                  {activeAccessCodes.map((code) => (
                    <AccessCodeCard
                      key={code.id}
                      accessCode={code}
                      onRevoke={() => handleRevokeCode(code.id)}
                      isRevoking={isRevoking}
                    />
                  ))}
                </View>
              )}

              {/* Scheduled Codes */}
              {scheduledAccessCodes.length > 0 && (
                <View className="mb-4">
                  <Text
                    className="text-sm font-medium mb-2"
                    style={{ color: colors.mutedForeground }}
                  >
                    SCHEDULED
                  </Text>
                  {scheduledAccessCodes.map((code) => (
                    <AccessCodeCard
                      key={code.id}
                      accessCode={code}
                      onRevoke={() => handleRevokeCode(code.id)}
                      isRevoking={isRevoking}
                    />
                  ))}
                </View>
              )}

              {/* Expired/Revoked Codes */}
              {expiredAccessCodes.length > 0 && (
                <View>
                  <Text
                    className="text-sm font-medium mb-2"
                    style={{ color: colors.mutedForeground }}
                  >
                    EXPIRED / REVOKED
                  </Text>
                  {expiredAccessCodes.slice(0, 5).map((code) => (
                    <AccessCodeCard key={code.id} accessCode={code} />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View
              className="rounded-lg p-6 items-center"
              style={{ backgroundColor: colors.card }}
            >
              <Key size={32} color={colors.mutedForeground} />
              <Text
                className="mt-2 text-center"
                style={{ color: colors.mutedForeground }}
              >
                No access codes
              </Text>
              <Text
                className="text-sm text-center mt-1"
                style={{ color: colors.mutedForeground }}
              >
                Generate a code for guest access
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Generate Code Sheet */}
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
