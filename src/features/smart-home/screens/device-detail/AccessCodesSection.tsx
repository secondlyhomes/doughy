// src/features/smart-home/screens/device-detail/AccessCodesSection.tsx
// Access codes list section with active, scheduled, and expired/revoked groups

import React from 'react';
import { View, Text } from 'react-native';
import { Key, Plus } from 'lucide-react-native';
import { Button, LoadingSpinner, Badge } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { AccessCodeCard } from '../../components/AccessCodeCard';
import type { AccessCodeWithRelations } from '../../types';
import { ICON_SIZES } from '@/constants/design-tokens';

interface AccessCodesSectionProps {
  accessCodes: AccessCodeWithRelations[] | undefined;
  codesLoading: boolean;
  isRevoking: boolean;
  onRevokeCode: (accessCodeId: string) => void;
  onGeneratePress: () => void;
}

export function AccessCodesSection({
  accessCodes,
  codesLoading,
  isRevoking,
  onRevokeCode,
  onGeneratePress,
}: AccessCodesSectionProps) {
  const colors = useThemeColors();

  const activeAccessCodes = accessCodes?.filter((c) => c.status === 'active') || [];
  const scheduledAccessCodes = accessCodes?.filter((c) => c.status === 'scheduled') || [];
  const expiredAccessCodes = accessCodes?.filter(
    (c) => c.status === 'expired' || c.status === 'revoked'
  ) || [];

  return (
    <View className="px-4 pb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Key size={ICON_SIZES.ml} color={colors.foreground} />
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
          onPress={onGeneratePress}
        >
          <View className="flex-row items-center">
            <Plus size={ICON_SIZES.sm} color={colors.primaryForeground} />
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
                  onRevoke={() => onRevokeCode(code.id)}
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
                  onRevoke={() => onRevokeCode(code.id)}
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
          <Key size={ICON_SIZES['2xl']} color={colors.mutedForeground} />
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
  );
}
