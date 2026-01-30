/**
 * PropertyCard Component (React Native)
 *
 * A card component for displaying property information in lists.
 * Optimized for mobile with touch interactions.
 *
 * Note: Uses useThemeColors() for reliable dark mode support.
 * See docs/TROUBLESHOOTING.md for why we use inline styles instead of Tailwind color classes.
 *
 * @deprecated Use `PropertyImageCard` from `@/components/ui` instead.
 * This component is maintained for backwards compatibility.
 * PropertyImageCard provides a unified property card UI across both
 * Investor and Landlord platforms with better maintainability.
 *
 * Migration example:
 * ```tsx
 * import { PropertyImageCard } from '@/components/ui';
 * import { getInvestorPropertyMetrics, getPropertyImageUrl, getPropertyLocation } from '@/lib/property-card-utils';
 *
 * <PropertyImageCard
 *   imageUrl={getPropertyImageUrl(property)}
 *   title={property.address}
 *   subtitle={getPropertyLocation(property)}
 *   metrics={getInvestorPropertyMetrics(property)}
 *   onPress={() => handlePress(property)}
 * />
 * ```
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

  // Get image URL with fallback to primary_image_url when first image URL is unavailable
  const imageUrl = property.images?.[0]?.url || property.primary_image_url;

  // Compact view for grid layouts
  if (compact) {
    const compactContent = (
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
            <Home size={32} color={colors.mutedForeground} />
          </View>
        )}

        {/* Text Content - Glass or solid background */}
        {variant === 'glass' ? (
          <GlassView intensity={glassIntensity} effect="regular" style={{ padding: 12 }}>
            <View className="flex-row justify-between">
              {/* Left column: Address, City/State, Price */}
              <View style={{ flex: 1, marginRight: 8 }}>
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
                      <Bed size={12} color={colors.mutedForeground} />
                      <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                        {property.bedrooms}
                      </Text>
                    </View>
                  )}
                  {property.bathrooms != null && (
                    <View className="flex-row items-center gap-0.5">
                      <Bath size={12} color={colors.mutedForeground} />
                      <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                        {property.bathrooms}
                      </Text>
                    </View>
                  )}
                  {property.square_feet != null && (
                    <View className="flex-row items-center gap-0.5">
                      <Square size={12} color={colors.mutedForeground} />
                      <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                        {property.square_feet.toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </GlassView>
        ) : (
          <View className="p-3">
            <View className="flex-row justify-between">
              {/* Left column: Address, City/State, Price */}
              <View style={{ flex: 1, marginRight: 8 }}>
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
                      <Bed size={12} color={colors.mutedForeground} />
                      <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                        {property.bedrooms}
                      </Text>
                    </View>
                  )}
                  {property.bathrooms != null && (
                    <View className="flex-row items-center gap-0.5">
                      <Bath size={12} color={colors.mutedForeground} />
                      <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                        {property.bathrooms}
                      </Text>
                    </View>
                  )}
                  {property.square_feet != null && (
                    <View className="flex-row items-center gap-0.5">
                      <Square size={12} color={colors.mutedForeground} />
                      <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                        {property.square_feet.toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
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
        accessibilityLabel={`Property at ${property.address || 'unknown address'}, ${property.city || ''}, ${property.state || ''}`}
        accessibilityRole="button"
        accessibilityHint="Tap to view property details"
      >
        {compactContent}
      </TouchableOpacity>
    );
  }

  // Full card view for list layouts
  const fullContent = (
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
      accessibilityLabel={`Property at ${property.address || 'unknown address'}, ${property.city || ''}, ${property.state || ''}. ${property.bedrooms || 0} beds, ${property.bathrooms || 0} baths`}
      accessibilityRole="button"
      accessibilityHint="Tap to view property details"
    >
      {fullContent}
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo
  // Must include onPress to handle callback updates, and images to handle async image loading
  const imagesEqual =
    prevProps.property.images?.length === nextProps.property.images?.length &&
    prevProps.property.images?.[0]?.url === nextProps.property.images?.[0]?.url &&
    prevProps.property.primary_image_url === nextProps.property.primary_image_url;

  return (
    prevProps.property.id === nextProps.property.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.compact === nextProps.compact &&
    prevProps.variant === nextProps.variant &&
    prevProps.glassIntensity === nextProps.glassIntensity &&
    prevProps.property.arv === nextProps.property.arv &&
    prevProps.property.address === nextProps.property.address &&
    prevProps.property.city === nextProps.property.city &&
    prevProps.property.state === nextProps.property.state &&
    prevProps.property.zip === nextProps.property.zip &&
    prevProps.property.status === nextProps.property.status &&
    prevProps.property.propertyType === nextProps.property.propertyType &&
    prevProps.property.bedrooms === nextProps.property.bedrooms &&
    prevProps.property.bathrooms === nextProps.property.bathrooms &&
    prevProps.property.square_feet === nextProps.property.square_feet &&
    prevProps.property.notes === nextProps.property.notes &&
    prevProps.onPress === nextProps.onPress &&
    imagesEqual
  );
});

PropertyCard.displayName = 'PropertyCard';
