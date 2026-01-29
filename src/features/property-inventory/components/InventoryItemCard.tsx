// src/features/property-inventory/components/InventoryItemCard.tsx
// Card component for displaying an inventory item in a list

import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import {
  ChevronRight,
  Package,
  AlertTriangle,
  Calendar,
  MapPin,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SPACING, FONT_SIZES, ICON_SIZES, BORDER_RADIUS } from '@/constants/design-tokens';
import {
  InventoryItem,
  InventoryCondition,
  INVENTORY_CONDITION_CONFIG,
} from '../types';

export interface InventoryItemCardProps {
  item: InventoryItem;
  onPress: () => void;
  showProperty?: boolean;
}

export function InventoryItemCard({
  item,
  onPress,
  showProperty = false,
}: InventoryItemCardProps) {
  const colors = useThemeColors();
  const conditionConfig = INVENTORY_CONDITION_CONFIG[item.condition];

  // Check if warranty is expiring soon or expired
  const warrantyStatus = getWarrantyStatus(item.warranty_expires);

  // Get first photo if available
  const firstPhoto = item.photos?.[0];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card className="mb-2" style={{ overflow: 'hidden' }}>
        <View className="flex-row p-3">
          {/* Photo thumbnail or placeholder */}
          <View
            style={[
              styles.thumbnail,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            {firstPhoto ? (
              <Image
                source={{ uri: firstPhoto.url }}
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
            ) : (
              <Package size={24} color={colors.mutedForeground} />
            )}
          </View>

          {/* Content */}
          <View className="flex-1 ml-3">
            {/* Name and condition */}
            <View className="flex-row items-center justify-between">
              <Text
                style={[styles.name, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Badge variant={conditionConfig.variant} size="sm">
                {conditionConfig.label}
              </Badge>
            </View>

            {/* Brand/Model */}
            {(item.brand || item.model) && (
              <Text
                style={[styles.subtitle, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {[item.brand, item.model].filter(Boolean).join(' ')}
              </Text>
            )}

            {/* Location */}
            {item.location && (
              <View className="flex-row items-center mt-1">
                <MapPin size={12} color={colors.mutedForeground} />
                <Text
                  style={[styles.detail, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {item.location}
                </Text>
              </View>
            )}

            {/* Warranty warning */}
            {warrantyStatus && (
              <View className="flex-row items-center mt-1">
                {warrantyStatus === 'expired' ? (
                  <>
                    <AlertTriangle size={12} color={colors.destructive} />
                    <Text style={[styles.detail, { color: colors.destructive }]}>
                      Warranty expired
                    </Text>
                  </>
                ) : (
                  <>
                    <Calendar size={12} color={colors.warning} />
                    <Text style={[styles.detail, { color: colors.warning }]}>
                      Warranty expires soon
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>

          {/* Chevron */}
          <View className="justify-center ml-2">
            <ChevronRight size={20} color={colors.mutedForeground} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

// Helper to check warranty status
function getWarrantyStatus(
  warrantyExpires: string | null
): 'expired' | 'expiring' | null {
  if (!warrantyExpires) return null;

  const expiryDate = new Date(warrantyExpires);
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  if (expiryDate < now) {
    return 'expired';
  } else if (expiryDate < thirtyDaysFromNow) {
    return 'expiring';
  }

  return null;
}

const styles = StyleSheet.create({
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    flex: 1,
    marginRight: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  detail: {
    fontSize: FONT_SIZES.xs,
    marginLeft: 4,
  },
});

export default InventoryItemCard;
