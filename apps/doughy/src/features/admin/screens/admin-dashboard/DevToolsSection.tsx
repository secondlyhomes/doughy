// src/features/admin/screens/admin-dashboard/DevToolsSection.tsx
// Developer tools section (dev mode only)

import React from 'react';
import { View, Text } from 'react-native';
import { AlertTriangle, UserPlus, UserMinus } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { LoadingSpinner, Button } from '@/components/ui';
import { withOpacity } from '@/lib/design-utils';
import type { DevToolsSectionProps } from './types';

export function DevToolsSection({
  isSeeding,
  isClearing,
  onSeedTestUsers,
  onClearTestUsers,
}: DevToolsSectionProps) {
  const colors = useThemeColors();

  return (
    <View className="p-4">
      <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>
        Developer Tools
      </Text>
      <View className="rounded-lg p-4" style={{ backgroundColor: colors.card }}>
        {/* Warning Banner */}
        <View
          className="flex-row items-center mb-4 p-3 rounded"
          style={{ backgroundColor: withOpacity(colors.warning, 'muted') }}
        >
          <AlertTriangle size={16} color={colors.warning} />
          <Text className="ml-2 text-xs font-medium" style={{ color: colors.warning }}>
            DEV MODE ONLY - These actions affect your real database
          </Text>
        </View>

        {/* Seed Test Users Button */}
        <View className="mb-3">
          <Button
            onPress={onSeedTestUsers}
            disabled={isSeeding || isClearing}
            variant="default"
            className="flex-row items-center justify-center"
          >
            {isSeeding ? (
              <LoadingSpinner size="small" color={colors.primaryForeground} />
            ) : (
              <UserPlus size={18} color={colors.primaryForeground} />
            )}
            <Text className="ml-2 font-semibold" style={{ color: colors.primaryForeground }}>
              {isSeeding ? 'Creating Test Users...' : 'Create Test Users'}
            </Text>
          </Button>
          <Text className="text-xs mt-2 text-center" style={{ color: colors.mutedForeground }}>
            Creates 40 test users with @example.com emails
          </Text>
        </View>

        {/* Clear Test Users Button */}
        <View>
          <Button
            onPress={onClearTestUsers}
            disabled={isSeeding || isClearing}
            variant="destructive"
            className="flex-row items-center justify-center"
          >
            {isClearing ? (
              <LoadingSpinner size="small" color={colors.destructiveForeground} />
            ) : (
              <UserMinus size={18} color={colors.destructiveForeground} />
            )}
            <Text className="ml-2 font-semibold" style={{ color: colors.destructiveForeground }}>
              {isClearing ? 'Removing Test Users...' : 'Remove Test Users'}
            </Text>
          </Button>
          <Text className="text-xs mt-2 text-center" style={{ color: colors.mutedForeground }}>
            Deletes all users with @example.com emails
          </Text>
        </View>
      </View>
    </View>
  );
}
