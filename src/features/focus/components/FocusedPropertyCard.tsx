// src/features/focus/components/FocusedPropertyCard.tsx
// Compact property summary card for Focus mode

import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, User, ChevronRight, X } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, ICON_SIZES, FONT_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { getShadowStyle, withOpacity } from '@/lib/design-utils';
import { FocusedProperty } from '@/contexts/FocusModeContext';

interface FocusedPropertyCardProps {
  property: FocusedProperty;
  onClear?: () => void;
  onPress?: () => void;
}

export function FocusedPropertyCard({ property, onClear, onPress }: FocusedPropertyCardProps) {
  const colors = useThemeColors();
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/(tabs)/properties/${property.id}`);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={PRESS_OPACITY.DEFAULT}
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        ...getShadowStyle(colors, { size: 'sm' }),
      }}
    >
      {/* Property image */}
      {property.imageUrl ? (
        <Image
          source={{ uri: property.imageUrl }}
          style={{
            width: 56,
            height: 56,
            borderRadius: BORDER_RADIUS.md,
          }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: withOpacity(colors.primary, 'light'),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MapPin size={ICON_SIZES.lg} color={colors.primary} />
        </View>
      )}

      {/* Property details */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: FONT_SIZES.sm,
            fontWeight: '600',
            color: colors.foreground,
          }}
          numberOfLines={1}
        >
          {property.address}
        </Text>
        <Text
          style={{
            fontSize: FONT_SIZES.sm,
            color: colors.mutedForeground,
            marginTop: SPACING.xxs,
          }}
          numberOfLines={1}
        >
          {property.city}, {property.state}
        </Text>
        {property.leadName && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xs, gap: SPACING.xs }}>
            <User size={12} color={colors.mutedForeground} />
            <Text style={{ fontSize: FONT_SIZES.xs, color: colors.mutedForeground }}>
              {property.leadName}
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
        {onClear && (
          <TouchableOpacity
            onPress={onClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              padding: SPACING.xs,
              backgroundColor: colors.muted,
              borderRadius: BORDER_RADIUS.full,
            }}
          >
            <X size={ICON_SIZES.md} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
        <ChevronRight size={ICON_SIZES.sm} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

export default FocusedPropertyCard;
