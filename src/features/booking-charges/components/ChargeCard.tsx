// src/features/booking-charges/components/ChargeCard.tsx
// Card component for displaying a single booking charge

import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { ChevronRight, Link2 } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { Badge } from '@/components/ui';
import { formatCurrency } from '@/utils/format';
import type { BookingChargeWithRelations } from '../types';
import { CHARGE_TYPE_CONFIG, CHARGE_STATUS_CONFIG } from '../types';

interface ChargeCardProps {
  charge: BookingChargeWithRelations;
  onPress?: () => void;
  showLinkedMaintenance?: boolean;
}

export function ChargeCard({ charge, onPress, showLinkedMaintenance = true }: ChargeCardProps) {
  const colors = useThemeColors();
  const typeConfig = CHARGE_TYPE_CONFIG[charge.type];
  const statusConfig = CHARGE_STATUS_CONFIG[charge.status];

  return (
    <TouchableOpacity
      className="rounded-lg p-4 mb-3"
      style={{ backgroundColor: colors.card }}
      onPress={onPress}
      disabled={!onPress}
    >
      <View className="flex-row items-start justify-between">
        {/* Left: Type icon and info */}
        <View className="flex-row flex-1">
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: colors.muted }}
          >
            <Text className="text-lg">{typeConfig.emoji}</Text>
          </View>

          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="font-semibold" style={{ color: colors.foreground }}>
                {typeConfig.label}
              </Text>
              <View className="ml-2">
                <Badge variant={statusConfig.variant} size="sm">
                  {statusConfig.label}
                </Badge>
              </View>
            </View>

            <Text
              className="text-sm mb-2"
              style={{ color: colors.mutedForeground }}
              numberOfLines={2}
            >
              {charge.description}
            </Text>

            {/* Linked maintenance */}
            {showLinkedMaintenance && charge.maintenance && (
              <View className="flex-row items-center mt-1">
                <Link2 size={12} color={colors.primary} />
                <Text className="text-xs ml-1" style={{ color: colors.primary }}>
                  {charge.maintenance.work_order_number}
                </Text>
              </View>
            )}

            {/* Photos preview */}
            {charge.photos && charge.photos.length > 0 && (
              <View className="flex-row mt-2">
                {charge.photos.slice(0, 3).map((photo, index) => (
                  <Image
                    key={index}
                    source={{ uri: photo.url }}
                    className="w-12 h-12 rounded mr-1"
                    style={{ backgroundColor: colors.muted }}
                  />
                ))}
                {charge.photos.length > 3 && (
                  <View
                    className="w-12 h-12 rounded items-center justify-center"
                    style={{ backgroundColor: colors.muted }}
                  >
                    <Text className="text-xs font-medium" style={{ color: colors.mutedForeground }}>
                      +{charge.photos.length - 3}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Right: Amount and chevron */}
        <View className="items-end">
          <Text className="font-bold text-lg" style={{ color: colors.foreground }}>
            {formatCurrency(charge.amount)}
          </Text>
          {onPress && (
            <ChevronRight size={20} color={colors.mutedForeground} className="mt-2" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
