/**
 * PropertyCardCompact — Compact card content for grid layouts.
 * Extracted from PropertyCard.tsx.
 */

import React from 'react';
import { View, Text, Image } from 'react-native';
import { Home, Bed, Bath, Square } from 'lucide-react-native';
import { formatPropertyType } from '../utils/formatters';
import { GlassView } from '@/components/ui/GlassView';
import { ICON_SIZES, SPACING } from '@/constants/design-tokens';
import { PropertyCardContentProps } from './PropertyCardTypes';

export const PropertyCardCompact: React.FC<PropertyCardContentProps> = ({
  property,
  variant,
  glassIntensity,
  colors,
  imageUrl,
}) => {
  const infoContent = (
    <View className="flex-row justify-between">
      {/* Left column: Address, City/State, Price */}
      <View style={{ flex: 1, marginRight: SPACING.sm }}>
        <Text
          className="text-sm font-semibold"
          style={{ color: colors.foreground }}
          numberOfLines={1}
        >
          {property.address || 'Address not specified'}
        </Text>
        <Text
          className="text-xs mt-0.5"
          style={{ color: colors.mutedForeground }}
          numberOfLines={1}
        >
          {property.city}, {property.state}
        </Text>
        {property.arv && (
          <Text
            className="text-sm font-bold mt-1"
            style={{ color: colors.primary }}
          >
            ${property.arv.toLocaleString()}
          </Text>
        )}
      </View>
      {/* Right column: Status, Type, Stats */}
      <View style={{ alignItems: 'flex-end' }}>
        {property.status && (
          <Text className="text-sm font-semibold" style={{ color: colors.foreground }}>
            {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
          </Text>
        )}
        {property.propertyType && (
          <Text className="text-xs mt-0.5" style={{ color: colors.mutedForeground }}>
            {formatPropertyType(property.propertyType)}
          </Text>
        )}
        <View className="flex-row items-center gap-2 mt-1">
          {property.bedrooms != null && (
            <View className="flex-row items-center gap-0.5">
              <Bed size={ICON_SIZES.xs} color={colors.mutedForeground} />
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                {property.bedrooms}
              </Text>
            </View>
          )}
          {property.bathrooms != null && (
            <View className="flex-row items-center gap-0.5">
              <Bath size={ICON_SIZES.xs} color={colors.mutedForeground} />
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                {property.bathrooms}
              </Text>
            </View>
          )}
          {property.square_feet != null && (
            <View className="flex-row items-center gap-0.5">
              <Square size={ICON_SIZES.xs} color={colors.mutedForeground} />
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                {property.square_feet.toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <>
      {/* Property Image - Outside glass to keep it crisp */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-32"
          resizeMode="cover"
        />
      ) : (
        <View
          className="w-full h-32 items-center justify-center"
          style={{ backgroundColor: colors.muted }}
        >
          <Home size={ICON_SIZES['2xl']} color={colors.mutedForeground} />
        </View>
      )}

      {/* Text Content - Glass or solid background */}
      {variant === 'glass' ? (
        <GlassView intensity={glassIntensity} effect="regular" style={{ padding: SPACING.md }}>
          {infoContent}
        </GlassView>
      ) : (
        <View className="p-3">
          {infoContent}
        </View>
      )}
    </>
  );
};

PropertyCardCompact.displayName = 'PropertyCardCompact';
