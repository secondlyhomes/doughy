/**
 * PropertyMap Component - Web Version
 *
 * Web-compatible version that displays properties on a static map.
 * Uses OpenStreetMap static images instead of react-native-maps.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MapPin, Navigation, Layers, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { Property, GeoPoint } from '../types';
import { formatCurrency } from '../utils/formatters';

// Type for properties with valid geo_point
type PropertyWithCoords = Property & { geo_point: GeoPoint };

// Type guard to check if property has valid coordinates
function hasValidCoords(property: Property): property is PropertyWithCoords {
  if (!property.geo_point) return false;
  const { lat, lng } = property.geo_point;
  return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
}

interface PropertyMapProps {
  properties: Property[];
  onPropertyPress?: (property: Property) => void;
  selectedPropertyId?: string | null;
  initialRegion?: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  showUserLocation?: boolean;
  style?: any;
}

export function PropertyMap({
  properties,
  onPropertyPress,
  selectedPropertyId,
  style,
}: PropertyMapProps) {
  const colors = useThemeColors();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter properties with valid coordinates
  const propertiesWithCoords = useMemo(() => {
    return properties.filter(hasValidCoords);
  }, [properties]);

  const handlePropertyPress = useCallback((property: Property) => {
    onPropertyPress?.(property);
  }, [onPropertyPress]);

  const openInMaps = useCallback((property: Property) => {
    if (!property.geo_point) return;
    const { lat, lng } = property.geo_point;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  }, []);

  const getStatusColor = useCallback((status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return colors.success;
      case 'pending': return colors.warning;
      case 'sold': return colors.destructive;
      default: return colors.primary;
    }
  }, [colors]);

  const nextProperty = useCallback(() => {
    setCurrentIndex(i => (i + 1) % propertiesWithCoords.length);
  }, [propertiesWithCoords.length]);

  const prevProperty = useCallback(() => {
    setCurrentIndex(i => (i - 1 + propertiesWithCoords.length) % propertiesWithCoords.length);
  }, [propertiesWithCoords.length]);

  // Generate static map URL for current property cluster
  const mapImageUrl = useMemo(() => {
    if (propertiesWithCoords.length === 0) return null;

    // For web, show a map centered on first property or center of all
    const lats = propertiesWithCoords.map(p => p.geo_point.lat);
    const lngs = propertiesWithCoords.map(p => p.geo_point.lng);
    const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

    // Calculate zoom level based on spread
    const latSpread = Math.max(...lats) - Math.min(...lats);
    const lngSpread = Math.max(...lngs) - Math.min(...lngs);
    const maxSpread = Math.max(latSpread, lngSpread);

    let zoom = 12;
    if (maxSpread > 5) zoom = 5;
    else if (maxSpread > 2) zoom = 7;
    else if (maxSpread > 0.5) zoom = 9;
    else if (maxSpread > 0.1) zoom = 11;
    else zoom = 14;

    // OpenStreetMap static image
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${centerLat},${centerLng}&zoom=${zoom}&size=600x400&maptype=mapnik`;
  }, [propertiesWithCoords]);

  if (propertiesWithCoords.length === 0) {
    return (
      <View className="flex-1 items-center justify-center" style={[style, { backgroundColor: colors.muted }]}>
        <MapPin size={48} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
        <Text className="text-center px-8" style={{ color: colors.mutedForeground }}>
          No properties with location data to display on the map.
        </Text>
        <Text className="text-xs mt-2" style={{ color: colors.mutedForeground }}>
          Add geo coordinates to your properties to see them here.
        </Text>
      </View>
    );
  }

  const currentProperty = propertiesWithCoords[currentIndex];

  return (
    <View className="flex-1" style={style}>
      {/* Map Image */}
      <View className="flex-1 relative">
        {mapImageUrl && (
          <TouchableOpacity
            onPress={() => openInMaps(currentProperty)}
            activeOpacity={0.9}
            style={{ flex: 1 }}
          >
            <img
              src={mapImageUrl}
              alt="Property locations map"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </TouchableOpacity>
        )}

        {/* Property Count Badge */}
        <View className="absolute top-4 left-4 px-3 py-2 rounded-full shadow-md" style={{ backgroundColor: colors.card }}>
          <Text className="font-medium text-sm" style={{ color: colors.foreground }}>
            {propertiesWithCoords.length} {propertiesWithCoords.length === 1 ? 'property' : 'properties'}
          </Text>
        </View>

        {/* Open in Maps Button */}
        <TouchableOpacity
          onPress={() => openInMaps(currentProperty)}
          className="absolute top-4 right-4 px-3 py-2 rounded-full shadow-md flex-row items-center"
          style={{ backgroundColor: colors.card }}
          activeOpacity={0.7}
        >
          <Navigation size={16} color={colors.foreground} />
          <Text className="text-sm ml-2" style={{ color: colors.foreground }}>Open in Maps</Text>
        </TouchableOpacity>
      </View>

      {/* Property Cards Carousel */}
      <View style={{ backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }}>
        <View className="flex-row items-center px-4 py-3">
          {/* Previous Button */}
          <TouchableOpacity
            onPress={prevProperty}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.muted }}
            disabled={propertiesWithCoords.length <= 1}
            activeOpacity={0.7}
          >
            <ChevronLeft
              size={20}
              color={propertiesWithCoords.length <= 1 ? colors.muted : colors.mutedForeground}
            />
          </TouchableOpacity>

          {/* Property Info */}
          <TouchableOpacity
            onPress={() => handlePropertyPress(currentProperty)}
            className="flex-1 mx-3 p-3 rounded-lg"
            style={{
              borderLeftWidth: 4,
              borderLeftColor: getStatusColor(currentProperty.status),
              backgroundColor: selectedPropertyId === currentProperty.id ? colors.accent : colors.muted,
            }}
            activeOpacity={0.7}
          >
            <Text className="font-semibold" style={{ color: colors.foreground }} numberOfLines={1}>
              {currentProperty.address || 'Address not specified'}
            </Text>
            <Text className="text-sm" style={{ color: colors.mutedForeground }} numberOfLines={1}>
              {currentProperty.city}, {currentProperty.state}
            </Text>
            <View className="flex-row items-center justify-between mt-2">
              {currentProperty.arv && (
                <Text className="font-bold" style={{ color: colors.primary }}>
                  {formatCurrency(currentProperty.arv)}
                </Text>
              )}
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                {currentIndex + 1} of {propertiesWithCoords.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Next Button */}
          <TouchableOpacity
            onPress={nextProperty}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.muted }}
            disabled={propertiesWithCoords.length <= 1}
            activeOpacity={0.7}
          >
            <ChevronRight
              size={20}
              color={propertiesWithCoords.length <= 1 ? colors.muted : colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
