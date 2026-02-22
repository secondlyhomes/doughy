// src/features/smart-home/screens/device-detail/useDeviceDetailActions.ts
// Callback handlers for device lock/unlock/refresh and access code revocation

import { useCallback } from 'react';
import { Alert } from 'react-native';
import {
  useDevice,
  useDeviceAccessCodes,
  useDeviceActions,
  useAccessCodeMutations,
} from '../../hooks/useSmartHome';

export function useDeviceDetailActions(deviceId: string | undefined) {
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

  return {
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
  };
}
