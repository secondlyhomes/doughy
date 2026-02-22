// src/features/smart-home/screens/device-detail/DeviceStatusCard.tsx
// Device status card with lock icon, info badges, and lock/unlock controls

import React from 'react';
import { View, Text } from 'react-native';
import {
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  Battery,
  Clock,
} from 'lucide-react-native';
import { Button } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { DEVICE_BRAND_CONFIG } from '../../types';
import type { SmartDevice } from '../../types';
import { ICON_SIZES } from '@/constants/design-tokens';

interface DeviceStatusCardProps {
  device: SmartDevice;
  isOnline: boolean;
  isLocked: boolean;
  isLocking: boolean;
  isUnlocking: boolean;
  onLock: () => void;
  onUnlock: () => void;
}

export function DeviceStatusCard({
  device,
  isOnline,
  isLocked,
  isLocking,
  isUnlocking,
  onLock,
  onUnlock,
}: DeviceStatusCardProps) {
  const colors = useThemeColors();
  const lowBattery = (device.battery_level || 100) < 20;
  const brandConfig = DEVICE_BRAND_CONFIG[device.brand];

  return (
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
            <Lock size={ICON_SIZES['3xl']} color={isOnline ? colors.success : colors.mutedForeground} />
          ) : (
            <Unlock size={ICON_SIZES['3xl']} color={isOnline ? colors.warning : colors.mutedForeground} />
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
            <Wifi size={ICON_SIZES.sm} color={colors.success} />
          ) : (
            <WifiOff size={ICON_SIZES.sm} color={colors.destructive} />
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
              size={ICON_SIZES.sm}
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
            <Clock size={ICON_SIZES.sm} color={colors.mutedForeground} />
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
            onPress={onLock}
            loading={isLocking}
            disabled={isLocking || isLocked}
          >
            <View className="flex-row items-center">
              <Lock size={ICON_SIZES.md} color={isLocked ? colors.mutedForeground : colors.primaryForeground} />
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
            onPress={onUnlock}
            loading={isUnlocking}
            disabled={isUnlocking || !isLocked}
          >
            <View className="flex-row items-center">
              <Unlock size={ICON_SIZES.md} color={!isLocked ? colors.mutedForeground : colors.destructiveForeground} />
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
  );
}
