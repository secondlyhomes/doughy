// src/features/property-inventory/screens/inventory-detail/InventoryDetailHeader.tsx
// Photo gallery, category/condition badges, and warranty warning banner

import React from 'react';
import { View, Text } from 'react-native';
import { MapPin, AlertTriangle } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Badge, PhotoGallery } from '@/components/ui';
import { FONT_SIZES } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import {
  INVENTORY_CATEGORY_LABELS,
  INVENTORY_CONDITION_CONFIG,
} from '../../types';
import type { InventoryItem } from '../../types';
import { formatDate, getWarrantyStatus } from './utils';
import type { WarrantyStatus } from './utils';

export interface InventoryDetailHeaderProps {
  item: InventoryItem;
  conditionConfig: (typeof INVENTORY_CONDITION_CONFIG)[keyof typeof INVENTORY_CONDITION_CONFIG] | null;
  warrantyStatus: WarrantyStatus;
}

export function InventoryDetailHeader({
  item,
  conditionConfig,
  warrantyStatus,
}: InventoryDetailHeaderProps) {
  const colors = useThemeColors();
  const categoryLabel = INVENTORY_CATEGORY_LABELS[item.category];

  return (
    <>
      {/* Photo Gallery */}
      <View className="my-4">
        <PhotoGallery
          photos={(item.photos || []).map((p, i) => ({
            id: `photo-${i}`,
            url: p.url,
            caption: p.caption,
          }))}
          editable={false}
          size="large"
          emptyText="No photos"
        />
      </View>

      {/* Category & Condition Badges */}
      <View className="flex-row items-center mb-4 flex-wrap gap-2">
        {conditionConfig && (
          <Badge variant={conditionConfig.variant} size="lg">
            {conditionConfig.label}
          </Badge>
        )}
        <Badge variant="secondary" size="lg">
          {categoryLabel}
        </Badge>
        {item.location && (
          <View className="flex-row items-center ml-3">
            <MapPin size={14} color={colors.mutedForeground} />
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: FONT_SIZES.sm,
                marginLeft: 4,
              }}
            >
              {item.location}
            </Text>
          </View>
        )}
      </View>

      {/* Warranty Warning */}
      {warrantyStatus && warrantyStatus !== 'valid' && (
        <View
          className="p-3 rounded-xl mb-4 flex-row items-center"
          style={{
            backgroundColor:
              warrantyStatus === 'expired'
                ? withOpacity(colors.destructive, 'light')
                : withOpacity(colors.warning, 'light'),
          }}
        >
          <AlertTriangle
            size={20}
            color={warrantyStatus === 'expired' ? colors.destructive : colors.warning}
          />
          <Text
            style={{
              color: warrantyStatus === 'expired' ? colors.destructive : colors.warning,
              fontSize: FONT_SIZES.sm,
              fontWeight: '500',
              marginLeft: 8,
            }}
          >
            {warrantyStatus === 'expired'
              ? `Warranty expired on ${formatDate(item.warranty_expires)}`
              : `Warranty expires on ${formatDate(item.warranty_expires)}`}
          </Text>
        </View>
      )}
    </>
  );
}
