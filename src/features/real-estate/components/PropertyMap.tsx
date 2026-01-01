/**
 * PropertyMap Component
 *
 * Displays multiple properties on an interactive map.
 * Uses react-native-maps for native map rendering.
 *
 * Required: npx expo install react-native-maps
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Callout, Region, PROVIDER_DEFAULT } from 'react-native-maps';
import { MapPin, Navigation, Layers, X } from 'lucide-react-native';
import { Property } from '../types';
import { formatCurrency } from '../utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PropertyMapProps {
  properties: Property[];
  onPropertyPress?: (property: Property) => void;
  selectedPropertyId?: string | null;
  initialRegion?: Region;
  showUserLocation?: boolean;
  style?: any;
}

// Default region (US centered)
const DEFAULT_REGION: Region = {
  latitude: 39.8283,
  longitude: -98.5795,
  latitudeDelta: 30,
  longitudeDelta: 30,
};

export function PropertyMap({
  properties,
  onPropertyPress,
  selectedPropertyId,
  initialRegion,
  showUserLocation = true,
  style,
}: PropertyMapProps) {
  const mapRef = useRef<MapView>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');

  // Filter properties with valid coordinates
  const propertiesWithCoords = useMemo(() => {
    return properties.filter(property => {
      if (!property.geo_point) return false;
      const { lat, lng } = property.geo_point;
      return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
    });
  }, [properties]);

  // Calculate initial region based on properties
  const calculatedRegion = useMemo(() => {
    if (initialRegion) return initialRegion;

    if (propertiesWithCoords.length === 0) {
      return DEFAULT_REGION;
    }

    if (propertiesWithCoords.length === 1) {
      const property = propertiesWithCoords[0];
      return {
        latitude: property.geo_point.lat,
        longitude: property.geo_point.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    // Calculate bounds for multiple properties
    const lats = propertiesWithCoords.map(p => p.geo_point.lat);
    const lngs = propertiesWithCoords.map(p => p.geo_point.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Add padding to the bounds
    const latDelta = (maxLat - minLat) * 1.5 || 0.01;
    const lngDelta = (maxLng - minLng) * 1.5 || 0.01;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  }, [propertiesWithCoords, initialRegion]);

  const handleMarkerPress = useCallback((property: Property) => {
    onPropertyPress?.(property);
  }, [onPropertyPress]);

  const centerOnProperties = useCallback(() => {
    if (propertiesWithCoords.length > 0) {
      mapRef.current?.animateToRegion(calculatedRegion, 500);
    }
  }, [calculatedRegion, propertiesWithCoords.length]);

  const toggleMapType = useCallback(() => {
    setMapType(current => {
      switch (current) {
        case 'standard': return 'satellite';
        case 'satellite': return 'hybrid';
        case 'hybrid': return 'standard';
      }
    });
  }, []);

  const getMarkerColor = useCallback((property: Property) => {
    if (property.id === selectedPropertyId) {
      return '#6366f1'; // Primary color for selected
    }
    // Color based on property status or type
    switch (property.status?.toLowerCase()) {
      case 'active': return '#22c55e'; // Green
      case 'pending': return '#f59e0b'; // Amber
      case 'sold': return '#ef4444'; // Red
      default: return '#6366f1'; // Primary
    }
  }, [selectedPropertyId]);

  if (propertiesWithCoords.length === 0) {
    return (
      <View className="flex-1 bg-muted items-center justify-center" style={style}>
        <MapPin size={48} className="text-muted-foreground mb-4" />
        <Text className="text-muted-foreground text-center px-8">
          No properties with location data to display on the map.
        </Text>
        <Text className="text-xs text-muted-foreground mt-2">
          Add geo coordinates to your properties to see them here.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={style}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={calculatedRegion}
        mapType={mapType}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        rotateEnabled={true}
        pitchEnabled={true}
      >
        {propertiesWithCoords.map((property) => (
          <Marker
            key={property.id}
            coordinate={{
              latitude: property.geo_point.lat,
              longitude: property.geo_point.lng,
            }}
            pinColor={getMarkerColor(property)}
            onPress={() => handleMarkerPress(property)}
          >
            <Callout tooltip onPress={() => handleMarkerPress(property)}>
              <View className="bg-card rounded-lg p-3 shadow-lg min-w-[200px] max-w-[280px]">
                <Text className="text-foreground font-semibold" numberOfLines={1}>
                  {property.address || 'Address not specified'}
                </Text>
                <Text className="text-muted-foreground text-sm" numberOfLines={1}>
                  {property.city}, {property.state}
                </Text>
                {property.arv && (
                  <Text className="text-primary font-bold mt-1">
                    {formatCurrency(property.arv)}
                  </Text>
                )}
                <View className="flex-row items-center mt-2">
                  {property.bedrooms && (
                    <Text className="text-xs text-muted-foreground mr-3">
                      {property.bedrooms} beds
                    </Text>
                  )}
                  {property.bathrooms && (
                    <Text className="text-xs text-muted-foreground mr-3">
                      {property.bathrooms} baths
                    </Text>
                  )}
                  {property.square_feet && (
                    <Text className="text-xs text-muted-foreground">
                      {property.square_feet.toLocaleString()} sqft
                    </Text>
                  )}
                </View>
                <Text className="text-xs text-primary mt-2">Tap for details →</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Map Controls */}
      <View className="absolute top-4 right-4 gap-2">
        {/* Map Type Toggle */}
        <TouchableOpacity
          onPress={toggleMapType}
          className="bg-card w-10 h-10 rounded-full items-center justify-center shadow-md"
          activeOpacity={0.7}
        >
          <Layers size={20} className="text-foreground" />
        </TouchableOpacity>

        {/* Center on Properties */}
        <TouchableOpacity
          onPress={centerOnProperties}
          className="bg-card w-10 h-10 rounded-full items-center justify-center shadow-md"
          activeOpacity={0.7}
        >
          <Navigation size={20} className="text-foreground" />
        </TouchableOpacity>
      </View>

      {/* Property Count Badge */}
      <View className="absolute top-4 left-4 bg-card px-3 py-2 rounded-full shadow-md">
        <Text className="text-foreground font-medium text-sm">
          {propertiesWithCoords.length} {propertiesWithCoords.length === 1 ? 'property' : 'properties'}
        </Text>
      </View>
    </View>
  );
}
