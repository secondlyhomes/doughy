// src/features/smart-home/components/AccessCodeCard.tsx
// Card component for displaying an access code

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Key, Calendar, User, Trash2 } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Badge } from '@/components/ui';
import type { AccessCodeWithRelations } from '../types';

interface AccessCodeCardProps {
  accessCode: AccessCodeWithRelations;
  onRevoke?: () => void;
  isRevoking?: boolean;
  showDevice?: boolean;
}

export function AccessCodeCard({
  accessCode,
  onRevoke,
  isRevoking,
  showDevice = false,
}: AccessCodeCardProps) {
  const colors = useThemeColors();

  const isActive = accessCode.status === 'active';
  const isScheduled = accessCode.status === 'scheduled';
  const isExpired = accessCode.status === 'expired';
  const isRevoked = accessCode.status === 'revoked';

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusVariant = () => {
    if (isActive) return 'success';
    if (isScheduled) return 'warning';
    if (isExpired || isRevoked) return 'default';
    return 'default';
  };

  const getGuestName = () => {
    if (!accessCode.booking?.contact) return null;
    const { first_name, last_name } = accessCode.booking.contact;
    return `${first_name} ${last_name}`;
  };

  return (
    <View
      className="rounded-lg p-4 mb-3"
      style={{
        backgroundColor: colors.card,
        opacity: isRevoked || isExpired ? 0.6 : 1,
      }}
    >
      <View className="flex-row items-start justify-between">
        {/* Left: Code info */}
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <Key size={16} color={isActive ? colors.primary : colors.mutedForeground} />
            <Text
              className="font-mono text-lg font-bold ml-2"
              style={{ color: colors.foreground }}
            >
              {accessCode.code}
            </Text>
            <View className="ml-2">
              <Badge variant={getStatusVariant()} size="sm">
                {accessCode.status.charAt(0).toUpperCase() + accessCode.status.slice(1)}
              </Badge>
            </View>
          </View>

          <Text className="font-medium" style={{ color: colors.foreground }}>
            {accessCode.name}
          </Text>

          {/* Guest info */}
          {getGuestName() && (
            <View className="flex-row items-center mt-1">
              <User size={12} color={colors.mutedForeground} />
              <Text className="text-sm ml-1" style={{ color: colors.mutedForeground }}>
                {getGuestName()}
              </Text>
            </View>
          )}

          {/* Date range */}
          {(accessCode.starts_at || accessCode.ends_at) && (
            <View className="flex-row items-center mt-1">
              <Calendar size={12} color={colors.mutedForeground} />
              <Text className="text-sm ml-1" style={{ color: colors.mutedForeground }}>
                {formatDate(accessCode.starts_at) || 'Now'} -{' '}
                {formatDate(accessCode.ends_at) || 'No expiry'}
              </Text>
            </View>
          )}

          {/* Device info */}
          {showDevice && accessCode.device && (
            <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
              Device: {accessCode.device.name}
            </Text>
          )}
        </View>

        {/* Right: Revoke button */}
        {onRevoke && isActive && (
          <TouchableOpacity
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${colors.destructive}20` }}
            onPress={onRevoke}
            disabled={isRevoking}
          >
            <Trash2 size={18} color={colors.destructive} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
