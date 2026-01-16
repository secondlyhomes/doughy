/**
 * PropertyCard Component (React Native)
 *
 * A card component for displaying property information in lists.
 * Optimized for mobile with touch interactions.
 *
 * Note: Uses useThemeColors() for reliable dark mode support.
 * See docs/TROUBLESHOOTING.md for why we use inline styles instead of Tailwind color classes.
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Home, MapPin, Bed, Bath, Square, FileText } from 'lucide-react-native';
import { Property } from '../types';
import { formatPropertyType, getPropertyTypeBadgeColor } from '../utils/formatters';
import { useThemeColors } from '@/context/ThemeContext';
import { GlassView } from '@/components/ui/GlassView';

interface PropertyCardProps {
  property: Property;
  isSelected?: boolean;
  onPress: (property: Property) => void;
  compact?: boolean;
  /** Use glass effect instead of solid background */
  variant?: 'default' | 'glass';
  /** Blur intensity for glass variant (0-100). Default: 65 */
  glassIntensity?: number;
}

export const PropertyCard = React.memo<PropertyCardProps>(({
  property,
  isSelected = false,
  onPress,
  compact = false,
  variant = 'default',
  glassIntensity = 65,
}) => {
  const colors = useThemeColors();

  const handlePress = useCallback(() => {
    onPress(property);
  }, [onPress, property]);

  const badgeColor = useMemo(() => {
    return getPropertyTypeBadgeColor(property.propertyType);
  }, [property.propertyType]);

  // Compact view for grid layouts
  if (compact) {
    const compactContent = (
      <>
        {/* Property Image - Outside glass to keep it crisp */}
        {property.images?.[0]?.url ? (
          <Image
            source={{ uri: property.images[0].url }}
            className="w-full h-32"
            resizeMode="cover"
          />
        ) : (
          <View
            className="w-full h-32 items-center justify-center"
            style={{ backgroundColor: colors.muted }}
          >
            <Home size={32} color={colors.mutedForeground} />
          </View>
        )}

        {/* Text Content - Glass or solid background */}
        {variant === 'glass' ? (
          <GlassView intensity={glassIntensity} effect="regular" style={{ padding: 12 }}>
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
          </GlassView>
        ) : (
          <View className="p-3">
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
        )}
      </>
    );

    return (
      <TouchableOpacity
        onPress={handlePress}
        className="rounded-xl overflow-hidden shadow-sm"
        style={{
          backgroundColor: variant === 'glass' ? 'transparent' : colors.card,
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? colors.primary : colors.border,
        }}
        activeOpacity={0.7}
      >
        {compactContent}
      </TouchableOpacity>
    );
  }

  // Full card view for list layouts
  const fullContent = (
    <>
      {/* Property Image - Outside glass to keep it crisp */}
      {property.images?.[0]?.url ? (
        <Image
          source={{ uri: property.images[0].url }}
          className="w-full h-48"
          resizeMode="cover"
        />
      ) : (
        <View
          className="w-full h-48 items-center justify-center"
          style={{ backgroundColor: colors.muted }}
        >
          <Home size={48} color={colors.mutedForeground} />
          <Text className="mt-2" style={{ color: colors.mutedForeground }}>No Image</Text>
        </View>
      )}

      {/* Property Info - Glass or solid background */}
      {variant === 'glass' ? (
        <GlassView intensity={glassIntensity} effect="regular" style={{ padding: 16 }}>
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
            <MapPin size={14} color={colors.mutedForeground} />
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
              <Bed size={16} color={colors.mutedForeground} />
              <Text
                className="text-sm ml-1"
                style={{ color: colors.mutedForeground }}
              >
                {property.bedrooms ?? 'N/A'} beds
              </Text>
            </View>

            <View className="flex-row items-center">
              <Bath size={16} color={colors.mutedForeground} />
              <Text
                className="text-sm ml-1"
                style={{ color: colors.mutedForeground }}
              >
                {property.bathrooms ?? 'N/A'} baths
              </Text>
            </View>

            <View className="flex-row items-center">
              <Square size={16} color={colors.mutedForeground} />
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
                <FileText size={12} color={colors.mutedForeground} />
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
        </GlassView>
      ) : (
        <View className="p-4">
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
            <MapPin size={14} color={colors.mutedForeground} />
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
              <Bed size={16} color={colors.mutedForeground} />
              <Text
                className="text-sm ml-1"
                style={{ color: colors.mutedForeground }}
              >
                {property.bedrooms ?? 'N/A'} beds
              </Text>
            </View>

            <View className="flex-row items-center">
              <Bath size={16} color={colors.mutedForeground} />
              <Text
                className="text-sm ml-1"
                style={{ color: colors.mutedForeground }}
              >
                {property.bathrooms ?? 'N/A'} baths
              </Text>
            </View>

            <View className="flex-row items-center">
              <Square size={16} color={colors.mutedForeground} />
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
                <FileText size={12} color={colors.mutedForeground} />
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
        </View>
      )}
    </>
  );

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="rounded-xl overflow-hidden shadow-sm"
      style={{
        backgroundColor: variant === 'glass' ? 'transparent' : colors.card,
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? colors.primary : colors.border,
      }}
      activeOpacity={0.7}
    >
      {fullContent}
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo
  return (
    prevProps.property.id === nextProps.property.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.compact === nextProps.compact &&
    prevProps.property.arv === nextProps.property.arv &&
    prevProps.property.address === nextProps.property.address
  );
});

PropertyCard.displayName = 'PropertyCard';
