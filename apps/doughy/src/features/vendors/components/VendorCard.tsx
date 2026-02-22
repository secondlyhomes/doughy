// src/features/vendors/components/VendorCard.tsx
// Card component for displaying a vendor in a list
// Migrated to use DataCard pattern for consistency (January 2026)

import React from 'react';
import { View, Text, Linking } from 'react-native';
import {
  ChevronRight,
  Phone,
  Mail,
  Star,
  Award,
  Briefcase,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { DataCard, DataCardField, DataCardAction } from '@/components/ui';
import { Vendor, VENDOR_CATEGORY_CONFIG } from '../types';

export interface VendorCardProps {
  vendor: Vendor;
  onPress: () => void;
  compact?: boolean;
  /** Card variant: 'default' for solid, 'glass' for glass effect */
  variant?: 'default' | 'glass';
  /** Blur intensity for glass variant (0-100). Default: 55 */
  glassIntensity?: number;
}

export function VendorCard({
  vendor,
  onPress,
  compact = false,
  variant = 'default',
  glassIntensity = 55,
}: VendorCardProps) {
  const colors = useThemeColors();
  const categoryConfig = VENDOR_CATEGORY_CONFIG[vendor.category];

  // Build fields array (only shown in non-compact mode)
  const fields: DataCardField[] = compact
    ? []
    : [
        // Rating
        ...(vendor.rating
          ? [
              {
                icon: Star,
                value: vendor.rating.toFixed(1),
                iconColor: colors.warning,
                valueColor: colors.foreground,
              },
            ]
          : []),
        // Total Jobs
        ...(vendor.total_jobs > 0
          ? [
              {
                value: `${vendor.total_jobs} job${vendor.total_jobs !== 1 ? 's' : ''}`,
              },
            ]
          : []),
        // Hourly Rate
        ...(vendor.hourly_rate
          ? [
              {
                value: `$${vendor.hourly_rate}/hr`,
                valueColor: colors.success,
              },
            ]
          : []),
      ];

  // Build actions array (only shown in non-compact mode)
  const actions: DataCardAction[] =
    compact || (!vendor.phone && !vendor.email)
      ? []
      : [
          ...(vendor.phone
            ? [
                {
                  icon: Phone,
                  label: 'Call',
                  onPress: () => Linking.openURL(`tel:${vendor.phone}`),
                },
              ]
            : []),
          ...(vendor.email
            ? [
                {
                  icon: Mail,
                  label: 'Email',
                  onPress: () => Linking.openURL(`mailto:${vendor.email}`),
                },
              ]
            : []),
        ];

  return (
    <DataCard
      onPress={onPress}
      variant={variant}
      glassIntensity={glassIntensity}
      title={vendor.name}
      subtitle={vendor.company_name || undefined}
      headerIcon={Briefcase}
      headerBadge={{
        label: `${categoryConfig.emoji} ${categoryConfig.label}`,
        variant: 'secondary',
        size: 'sm',
      }}
      headerRight={<ChevronRight size={20} color={colors.mutedForeground} />}
      fields={fields}
      actions={actions}
      footerContent={
        vendor.is_primary ? (
          <View className="flex-row items-center gap-1 mb-2">
            <Award size={14} color={colors.primary} />
            <Text className="text-xs font-medium" style={{ color: colors.primary }}>
              Primary Vendor
            </Text>
          </View>
        ) : undefined
      }
      style={
        vendor.is_primary
          ? {
              borderLeftWidth: 4,
              borderLeftColor: colors.primary,
            }
          : undefined
      }
      className="mb-2"
    />
  );
}

export default VendorCard;
