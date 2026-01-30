// src/features/vendors/components/VendorCard.tsx
// Card component for displaying a vendor in a list

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import {
  ChevronRight,
  Phone,
  Mail,
  Star,
  Award,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SPACING, FONT_SIZES, ICON_SIZES, BORDER_RADIUS } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { Vendor, VENDOR_CATEGORY_CONFIG } from '../types';

export interface VendorCardProps {
  vendor: Vendor;
  onPress: () => void;
  compact?: boolean;
}

export function VendorCard({ vendor, onPress, compact = false }: VendorCardProps) {
  const colors = useThemeColors();
  const categoryConfig = VENDOR_CATEGORY_CONFIG[vendor.category];

  const handleCall = (e: any) => {
    e.stopPropagation?.();
    if (vendor.phone) {
      Linking.openURL(`tel:${vendor.phone}`);
    }
  };

  const handleEmail = (e: any) => {
    e.stopPropagation?.();
    if (vendor.email) {
      Linking.openURL(`mailto:${vendor.email}`);
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card
        className="mb-2"
        style={[
          { overflow: 'hidden' },
          vendor.is_primary && {
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
          },
        ]}
      >
        <View className={compact ? 'p-3' : 'p-4'}>
          {/* Header Row */}
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-row items-center flex-1">
              {/* Category Emoji */}
              <View
                style={[
                  styles.emojiContainer,
                  { backgroundColor: withOpacity(colors.primary, 'subtle') },
                ]}
              >
                <Text style={styles.emoji}>{categoryConfig.emoji}</Text>
              </View>

              {/* Name and Company */}
              <View className="flex-1 ml-3">
                <View className="flex-row items-center">
                  <Text
                    style={[styles.name, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {vendor.name}
                  </Text>
                  {vendor.is_primary && (
                    <Award size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                  )}
                </View>
                {vendor.company_name && (
                  <Text
                    style={[styles.company, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {vendor.company_name}
                  </Text>
                )}
              </View>
            </View>

            {/* Category Badge */}
            <Badge variant="secondary" size="sm">
              {categoryConfig.label}
            </Badge>
          </View>

          {/* Info Row */}
          {!compact && (
            <View className="flex-row items-center gap-4 mt-2">
              {/* Rating */}
              {vendor.rating && (
                <View className="flex-row items-center">
                  <Star
                    size={14}
                    color={colors.warning}
                    fill={colors.warning}
                  />
                  <Text
                    style={[styles.infoText, { color: colors.foreground }]}
                  >
                    {vendor.rating.toFixed(1)}
                  </Text>
                </View>
              )}

              {/* Total Jobs */}
              {vendor.total_jobs > 0 && (
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  {vendor.total_jobs} job{vendor.total_jobs !== 1 ? 's' : ''}
                </Text>
              )}

              {/* Hourly Rate */}
              {vendor.hourly_rate && (
                <Text style={[styles.infoText, { color: colors.success }]}>
                  ${vendor.hourly_rate}/hr
                </Text>
              )}
            </View>
          )}

          {/* Contact Actions */}
          {!compact && (vendor.phone || vendor.email) && (
            <View className="flex-row items-center gap-2 mt-3">
              {vendor.phone && (
                <TouchableOpacity
                  onPress={handleCall}
                  style={[styles.contactButton, { backgroundColor: colors.muted }]}
                  activeOpacity={0.7}
                >
                  <Phone size={16} color={colors.primary} />
                  <Text
                    style={[styles.contactText, { color: colors.primary }]}
                    numberOfLines={1}
                  >
                    Call
                  </Text>
                </TouchableOpacity>
              )}

              {vendor.email && (
                <TouchableOpacity
                  onPress={handleEmail}
                  style={[styles.contactButton, { backgroundColor: colors.muted }]}
                  activeOpacity={0.7}
                >
                  <Mail size={16} color={colors.primary} />
                  <Text
                    style={[styles.contactText, { color: colors.primary }]}
                    numberOfLines={1}
                  >
                    Email
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Chevron */}
          <View
            style={{
              position: 'absolute',
              right: SPACING.md,
              top: '50%',
              transform: [{ translateY: -10 }],
            }}
          >
            <ChevronRight size={20} color={colors.mutedForeground} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  emojiContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  name: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  company: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    marginLeft: 4,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  contactText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
});

export default VendorCard;
