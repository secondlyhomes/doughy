// src/features/smart-home/components/DeviceCard.tsx
// Card component for displaying a smart device (lock)

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Lock, Unlock, Wifi, WifiOff, Battery, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { Badge } from '@/components/ui';
import type { SmartDevice } from '../types';
import { DEVICE_CONNECTION_STATUS_CONFIG, LOCK_STATE_CONFIG, DEVICE_BRAND_CONFIG } from '../types';

interface DeviceCardProps {
  device: SmartDevice;
  onPress?: () => void;
  onLock?: () => void;
  onUnlock?: () => void;
  isLocking?: boolean;
  isUnlocking?: boolean;
}

export function DeviceCard({
  device,
  onPress,
  onLock,
  onUnlock,
  isLocking,
  isUnlocking,
}: DeviceCardProps) {
  const colors = useThemeColors();
  const connectionConfig = DEVICE_CONNECTION_STATUS_CONFIG[device.connection_status];
  const lockConfig = device.lock_state ? LOCK_STATE_CONFIG[device.lock_state] : null;
  const brandConfig = DEVICE_BRAND_CONFIG[device.brand];

  const isOnline = device.connection_status === 'online';
  const isLocked = device.lock_state === 'locked';
  const lowBattery = (device.battery_level || 100) < 20;

  return (
    <TouchableOpacity
      className="rounded-lg p-4 mb-3"
      style={{ backgroundColor: colors.card }}
      onPress={onPress}
      disabled={!onPress}
    >
      <View className="flex-row items-start">
        {/* Left: Lock icon with status */}
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{
            backgroundColor: isOnline
              ? isLocked
                ? `${colors.success}20`
                : `${colors.warning}20`
              : colors.muted,
          }}
        >
          {isLocked ? (
            <Lock size={24} color={isOnline ? colors.success : colors.mutedForeground} />
          ) : (
            <Unlock size={24} color={isOnline ? colors.warning : colors.mutedForeground} />
          )}
        </View>

        {/* Middle: Device info */}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Text className="font-semibold" style={{ color: colors.foreground }}>
              {device.name}
            </Text>
            {!isOnline && (
              <View className="ml-2">
                <Badge variant="destructive" size="sm">Offline</Badge>
              </View>
            )}
          </View>

          <Text className="text-sm" style={{ color: colors.mutedForeground }}>
            {brandConfig.label} {device.model ? `- ${device.model}` : ''}
          </Text>

          {device.location && (
            <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
              {device.location}
            </Text>
          )}

          {/* Status row */}
          <View className="flex-row items-center mt-2 gap-3">
            {/* Connection status */}
            <View className="flex-row items-center">
              {isOnline ? (
                <Wifi size={12} color={colors.success} />
              ) : (
                <WifiOff size={12} color={colors.destructive} />
              )}
              <Text
                className="text-xs ml-1"
                style={{
                  color: isOnline ? colors.success : colors.destructive,
                }}
              >
                {connectionConfig.label}
              </Text>
            </View>

            {/* Battery */}
            {device.battery_level !== undefined && (
              <View className="flex-row items-center">
                <Battery
                  size={12}
                  color={lowBattery ? colors.warning : colors.mutedForeground}
                />
                <Text
                  className="text-xs ml-1"
                  style={{
                    color: lowBattery ? colors.warning : colors.mutedForeground,
                  }}
                >
                  {device.battery_level}%
                </Text>
              </View>
            )}

            {/* Lock state */}
            {lockConfig && (
              <View className="flex-row items-center">
                <View
                  className="w-2 h-2 rounded-full mr-1"
                  style={{
                    backgroundColor:
                      lockConfig.color === 'success'
                        ? colors.success
                        : lockConfig.color === 'warning'
                        ? colors.warning
                        : colors.muted,
                  }}
                />
                <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                  {lockConfig.label}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Right: Action buttons or chevron */}
        <View className="items-end">
          {isOnline && (onLock || onUnlock) ? (
            <View className="flex-row gap-2">
              {!isLocked && onLock && (
                <TouchableOpacity
                  className="px-3 py-2 rounded-lg"
                  style={{ backgroundColor: colors.success }}
                  onPress={onLock}
                  disabled={isLocking}
                >
                  <Text className="text-sm font-medium" style={{ color: colors.card }}>
                    {isLocking ? '...' : 'Lock'}
                  </Text>
                </TouchableOpacity>
              )}
              {isLocked && onUnlock && (
                <TouchableOpacity
                  className="px-3 py-2 rounded-lg"
                  style={{ backgroundColor: colors.warning }}
                  onPress={onUnlock}
                  disabled={isUnlocking}
                >
                  <Text className="text-sm font-medium" style={{ color: colors.card }}>
                    {isUnlocking ? '...' : 'Unlock'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : onPress ? (
            <ChevronRight size={20} color={colors.mutedForeground} />
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}
