// src/features/vendors/screens/vendor-detail/VendorHeaderCard.tsx
// Header card component displaying vendor name, company, and stats

import React from 'react';
import { View, Text } from 'react-native';
import { Star } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Badge } from '@/components/ui';
import { FONT_SIZES, BORDER_RADIUS, SPACING } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { VENDOR_CATEGORY_CONFIG } from '../../types';
import type { Database } from '@/integrations/supabase/types';

type Vendor = Database['public']['Tables']['vendors']['Row'];

export interface VendorHeaderCardProps {
  vendor: Vendor;
}

export function VendorHeaderCard({ vendor }: VendorHeaderCardProps) {
  const colors = useThemeColors();
  const categoryConfig = VENDOR_CATEGORY_CONFIG[vendor.category];

  return (
    <View className="p-4 rounded-xl my-4" style={{ backgroundColor: colors.card }}>
      <View className="flex-row items-center">
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: BORDER_RADIUS.lg,
            backgroundColor: withOpacity(colors.primary, 'subtle'),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 28 }}>{categoryConfig.emoji}</Text>
        </View>

        <View className="flex-1 ml-4">
          <Text
            style={{
              color: colors.foreground,
              fontSize: FONT_SIZES.xl,
              fontWeight: '700',
            }}
          >
            {vendor.name}
          </Text>
          {vendor.company_name && (
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: FONT_SIZES.base,
                marginTop: SPACING.xxs,
              }}
            >
              {vendor.company_name}
            </Text>
          )}
          <Badge variant="secondary" size="sm" className="mt-2 self-start">
            {categoryConfig.label}
          </Badge>
        </View>
      </View>

      {/* Rating and Stats */}
      <View className="flex-row items-center mt-4 gap-4">
        {vendor.rating && (
          <View className="flex-row items-center">
            <Star size={16} color={colors.warning} fill={colors.warning} />
            <Text
              style={{
                color: colors.foreground,
                fontSize: FONT_SIZES.base,
                fontWeight: '600',
                marginLeft: SPACING.xs,
              }}
            >
              {vendor.rating.toFixed(1)}
            </Text>
          </View>
        )}
        <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm }}>
          {vendor.total_jobs} job{vendor.total_jobs !== 1 ? 's' : ''} completed
        </Text>
      </View>
    </View>
  );
}
