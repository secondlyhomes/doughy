// src/features/smart-home/hooks/useSmartHome.ts
// React Query hooks for smart home / Seam integration

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSmartHomeStore } from '@/stores/smart-home-store';
import { useSeamConfig } from '@/features/integrations/hooks/useIntegrations';
import type { SmartDevice, CreateAccessCodeInput } from '../types';

// Query key factory
export const smartHomeKeys = {
  all: ['smart-home'] as const,
  devices: () => [...smartHomeKeys.all, 'devices'] as const,
  devicesByProperty: (propertyId: string) => [...smartHomeKeys.devices(), propertyId] as const,
  device: (deviceId: string) => [...smartHomeKeys.devices(), 'detail', deviceId] as const,
  accessCodes: () => [...smartHomeKeys.all, 'access-codes'] as const,
  accessCodesByDevice: (deviceId: string) => [...smartHomeKeys.accessCodes(), 'device', deviceId] as const,
  accessCodesByProperty: (propertyId: string) => [...smartHomeKeys.accessCodes(), 'property', propertyId] as const,
};

/**
 * Hook to check if Seam integration is available
 */
export function useSeamIntegration() {
  const { config, isConnected, isLoading } = useSeamConfig();

  return {
    isAvailable: isConnected,
    isLoading,
    config,
    supportedBrands: config.supportedBrands,
  };
}

/**
 * Hook to fetch devices for a property
 */
export function usePropertyDevices(propertyId: string | undefined) {
  const store = useSmartHomeStore();
  const { isAvailable } = useSeamIntegration();

  return useQuery({
    queryKey: smartHomeKeys.devicesByProperty(propertyId || ''),
    queryFn: () => store.fetchDevicesByProperty(propertyId!),
    enabled: !!propertyId && isAvailable,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook to fetch a single device
 */
export function useDevice(deviceId: string | undefined) {
  const store = useSmartHomeStore();

  return useQuery({
    queryKey: smartHomeKeys.device(deviceId || ''),
    queryFn: () => store.fetchDeviceById(deviceId!),
    enabled: !!deviceId,
  });
}

/**
 * Hook to fetch access codes for a device
 */
export function useDeviceAccessCodes(deviceId: string | undefined) {
  const store = useSmartHomeStore();

  return useQuery({
    queryKey: smartHomeKeys.accessCodesByDevice(deviceId || ''),
    queryFn: () => store.fetchAccessCodesByDevice(deviceId!),
    enabled: !!deviceId,
  });
}

/**
 * Hook to fetch access codes for a property
 */
export function usePropertyAccessCodes(propertyId: string | undefined) {
  const store = useSmartHomeStore();

  return useQuery({
    queryKey: smartHomeKeys.accessCodesByProperty(propertyId || ''),
    queryFn: () => store.fetchAccessCodesByProperty(propertyId!),
    enabled: !!propertyId,
  });
}

/**
 * Hook for device actions (lock/unlock)
 */
export function useDeviceActions() {
  const queryClient = useQueryClient();
  const store = useSmartHomeStore();

  const lockMutation = useMutation({
    mutationFn: (deviceId: string) => store.lockDevice(deviceId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: smartHomeKeys.device(result.device_id) });
      }
    },
  });

  const unlockMutation = useMutation({
    mutationFn: (deviceId: string) => store.unlockDevice(deviceId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: smartHomeKeys.device(result.device_id) });
      }
    },
  });

  const refreshMutation = useMutation({
    mutationFn: (deviceId: string) => store.refreshDeviceStatus(deviceId),
    onSuccess: (_, deviceId) => {
      queryClient.invalidateQueries({ queryKey: smartHomeKeys.device(deviceId) });
    },
  });

  const syncMutation = useMutation({
    mutationFn: (propertyId: string) => store.syncDevicesFromSeam(propertyId),
    onSuccess: (_, propertyId) => {
      queryClient.invalidateQueries({ queryKey: smartHomeKeys.devicesByProperty(propertyId) });
    },
  });

  return {
    lock: lockMutation.mutateAsync,
    unlock: unlockMutation.mutateAsync,
    refresh: refreshMutation.mutateAsync,
    sync: syncMutation.mutateAsync,
    isLocking: lockMutation.isPending,
    isUnlocking: unlockMutation.isPending,
    isRefreshing: refreshMutation.isPending,
    isSyncing: syncMutation.isPending,
    isLoading: lockMutation.isPending || unlockMutation.isPending || refreshMutation.isPending || syncMutation.isPending,
  };
}

/**
 * Hook for access code mutations
 */
export function useAccessCodeMutations() {
  const queryClient = useQueryClient();
  const store = useSmartHomeStore();

  const createMutation = useMutation({
    mutationFn: (input: CreateAccessCodeInput) => store.createAccessCode(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: smartHomeKeys.accessCodesByDevice(variables.device_id) });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: ({ accessCodeId, deviceId }: { accessCodeId: string; deviceId: string }) =>
      store.revokeAccessCode(accessCodeId).then(() => deviceId),
    onSuccess: (deviceId) => {
      queryClient.invalidateQueries({ queryKey: smartHomeKeys.accessCodesByDevice(deviceId) });
    },
  });

  return {
    create: createMutation.mutateAsync,
    revoke: revokeMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isRevoking: revokeMutation.isPending,
    isLoading: createMutation.isPending || revokeMutation.isPending,
  };
}

/**
 * Hook to get device counts for hub badge
 */
export function useSmartHomeCount(propertyId: string | undefined) {
  const { data: devices } = usePropertyDevices(propertyId);

  const onlineCount = devices?.filter((d) => d.connection_status === 'online').length || 0;
  const totalCount = devices?.length || 0;

  return {
    count: totalCount,
    onlineCount,
    offlineCount: totalCount - onlineCount,
    statusText: totalCount > 0 ? `${onlineCount}/${totalCount} Online` : 'No devices',
    hasDevices: totalCount > 0,
  };
}
