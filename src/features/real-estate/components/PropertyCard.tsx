/**
 * PropertyCard Component (React Native)
 *
 * A card component for displaying property information in lists.
 * Optimized for mobile with touch interactions.
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Home, MapPin, Bed, Bath, Square, User, FileText } from 'lucide-react-native';
import { Property } from '../types';
import { formatPropertyType, getPropertyTypeBadgeColor } from '../utils/formatters';

interface PropertyCardProps {
  property: Property;
  isSelected?: boolean;
  onPress: (property: Property) => void;
  compact?: boolean;
}

export const PropertyCard = React.memo<PropertyCardProps>(({
  property,
  isSelected = false,
  onPress,
  compact = false,
}) => {
  const handlePress = useCallback(() => {
    onPress(property);
  }, [onPress, property]);

  const badgeColor = useMemo(() => {
    return getPropertyTypeBadgeColor(property.propertyType);
  }, [property.propertyType]);

  // Compact view for grid layouts
  if (compact) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        className={`bg-card rounded-xl overflow-hidden shadow-sm border ${
          isSelected ? 'border-primary border-2' : 'border-border'
        }`}
        activeOpacity={0.7}
      >
        {/* Property Image */}
        {property.images?.[0]?.url ? (
          <Image
            source={{ uri: property.images[0].url }}
            className="w-full h-32"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-32 bg-muted items-center justify-center">
            <Home size={32} className="text-muted-foreground" />
          </View>
        )}

        <View className="p-3">
          <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
            {property.address || 'Address not specified'}
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
            {property.city}, {property.state}
          </Text>
          {property.arv && (
            <Text className="text-sm font-bold text-primary mt-1">
              ${property.arv.toLocaleString()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Full card view for list layouts
  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`bg-card rounded-xl overflow-hidden shadow-sm border ${
        isSelected ? 'border-primary border-2' : 'border-border'
      }`}
      activeOpacity={0.7}
    >
      {/* Property Image */}
      {property.images?.[0]?.url ? (
        <Image
          source={{ uri: property.images[0].url }}
          className="w-full h-48"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-48 bg-muted items-center justify-center">
          <Home size={48} className="text-muted-foreground" />
          <Text className="text-muted-foreground mt-2">No Image</Text>
        </View>
      )}

      {/* Property Info */}
      <View className="p-4">
        {/* Price and Type */}
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-lg font-bold text-foreground">
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
        <Text className="text-base font-semibold text-foreground mb-1" numberOfLines={1}>
          {property.address || 'Address not specified'}
        </Text>

        {/* Location */}
        <View className="flex-row items-center mb-3">
          <MapPin size={14} className="text-muted-foreground" />
          <Text className="text-sm text-muted-foreground ml-1">
            {property.city && property.state
              ? `${property.city}, ${property.state} ${property.zip || ''}`
              : 'Location not specified'}
          </Text>
        </View>

        {/* Property Stats */}
        <View className="flex-row gap-4">
          <View className="flex-row items-center">
            <Bed size={16} className="text-muted-foreground" />
            <Text className="text-sm text-muted-foreground ml-1">
              {property.bedrooms ?? 'N/A'} beds
            </Text>
          </View>

          <View className="flex-row items-center">
            <Bath size={16} className="text-muted-foreground" />
            <Text className="text-sm text-muted-foreground ml-1">
              {property.bathrooms ?? 'N/A'} baths
            </Text>
          </View>

          <View className="flex-row items-center">
            <Square size={16} className="text-muted-foreground" />
            <Text className="text-sm text-muted-foreground ml-1">
              {property.square_feet
                ? `${property.square_feet.toLocaleString()} sqft`
                : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Notes Preview */}
        {property.notes && (
          <View className="mt-3 pt-3 border-t border-border">
            <View className="flex-row items-center mb-1">
              <FileText size={12} className="text-muted-foreground" />
              <Text className="text-xs text-muted-foreground ml-1">Notes</Text>
            </View>
            <Text className="text-xs text-muted-foreground" numberOfLines={2}>
              {property.notes}
            </Text>
          </View>
        )}
      </View>
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
