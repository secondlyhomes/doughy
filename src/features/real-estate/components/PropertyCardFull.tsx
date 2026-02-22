/**
 * PropertyCardFull — Full card content for list layouts.
 * Extracted from PropertyCard.tsx.
 */

import React from 'react';
import { View, Text, Image } from 'react-native';
import { Home, MapPin, Bed, Bath, Square, FileText } from 'lucide-react-native';
import { formatPropertyType } from '../utils/formatters';
import { GlassView } from '@/components/ui/GlassView';
import { ICON_SIZES, SPACING } from '@/constants/design-tokens';
import { PropertyCardContentProps } from './PropertyCardTypes';

const PropertyCardInfo: React.FC<Pick<PropertyCardContentProps, 'property' | 'colors' | 'badgeColor'>> = ({
  property,
  colors,
  badgeColor,
}) => (
  <>
    {/* Price and Type */}
    <View className="flex-row justify-between items-start mb-2">
      <Text
        className="text-lg font-bold"
        style={{ color: colors.foreground }}
      >
        {property.arv
          ? `$${property.arv.toLocaleString()}`
          : 'Price TBD'}
      </Text>
      <View className={`px-2 py-1 rounded-md ${badgeColor}`}>
        <Text className="text-xs font-medium text-white">
          {formatPropertyType(property.propertyType)}
        </Text>
      </View>
    </View>

    {/* Address */}
    <Text
      className="text-base font-semibold mb-1"
      style={{ color: colors.foreground }}
      numberOfLines={1}
    >
      {property.address || 'Address not specified'}
    </Text>

    {/* Location */}
    <View className="flex-row items-center mb-3">
      <MapPin size={ICON_SIZES.sm} color={colors.mutedForeground} />
      <Text
        className="text-sm ml-1"
        style={{ color: colors.mutedForeground }}
      >
        {property.city && property.state
          ? `${property.city}, ${property.state} ${property.zip || ''}`
          : 'Location not specified'}
      </Text>
    </View>

    {/* Property Stats */}
    <View className="flex-row gap-4">
      <View className="flex-row items-center">
        <Bed size={ICON_SIZES.md} color={colors.mutedForeground} />
        <Text
          className="text-sm ml-1"
          style={{ color: colors.mutedForeground }}
        >
          {property.bedrooms ?? 'N/A'} beds
        </Text>
      </View>

      <View className="flex-row items-center">
        <Bath size={ICON_SIZES.md} color={colors.mutedForeground} />
        <Text
          className="text-sm ml-1"
          style={{ color: colors.mutedForeground }}
        >
          {property.bathrooms ?? 'N/A'} baths
        </Text>
      </View>

      <View className="flex-row items-center">
        <Square size={ICON_SIZES.md} color={colors.mutedForeground} />
        <Text
          className="text-sm ml-1"
          style={{ color: colors.mutedForeground }}
        >
          {property.square_feet
            ? `${property.square_feet.toLocaleString()} sqft`
            : 'N/A'}
        </Text>
      </View>
    </View>

    {/* Notes Preview */}
    {property.notes && (
      <View
        className="mt-3 pt-3"
        style={{ borderTopWidth: 1, borderTopColor: colors.border }}
      >
        <View className="flex-row items-center mb-1">
          <FileText size={ICON_SIZES.xs} color={colors.mutedForeground} />
          <Text
            className="text-xs ml-1"
            style={{ color: colors.mutedForeground }}
          >
            Notes
          </Text>
        </View>
        <Text
          className="text-xs"
          style={{ color: colors.mutedForeground }}
          numberOfLines={2}
        >
          {property.notes}
        </Text>
      </View>
    )}
  </>
);

PropertyCardInfo.displayName = 'PropertyCardInfo';

export const PropertyCardFull: React.FC<PropertyCardContentProps> = ({
  property,
  variant,
  glassIntensity,
  colors,
  badgeColor,
  imageUrl,
}) => {
  return (
    <>
      {/* Property Image - Outside glass to keep it crisp */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-48"
          resizeMode="cover"
        />
      ) : (
        <View
          className="w-full h-48 items-center justify-center"
          style={{ backgroundColor: colors.muted }}
        >
          <Home size={ICON_SIZES['3xl']} color={colors.mutedForeground} />
          <Text className="mt-2" style={{ color: colors.mutedForeground }}>No Image</Text>
        </View>
      )}

      {/* Property Info - Glass or solid background */}
      {variant === 'glass' ? (
        <GlassView intensity={glassIntensity} effect="regular" style={{ padding: SPACING.lg }}>
          <PropertyCardInfo property={property} colors={colors} badgeColor={badgeColor} />
        </GlassView>
      ) : (
        <View className="p-4">
          <PropertyCardInfo property={property} colors={colors} badgeColor={badgeColor} />
        </View>
      )}
    </>
  );
};

PropertyCardFull.displayName = 'PropertyCardFull';
