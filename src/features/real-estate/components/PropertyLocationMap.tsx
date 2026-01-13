/**
 * PropertyLocationMap Component
 *
 * Displays a single property location on a map.
 * Used in property detail views.
 *
 * Required: npx expo install react-native-maps
 */

import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { MapPin, Navigation, ExternalLink, AlertCircle } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';

interface PropertyLocationMapProps {
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  geoPoint?: { lat: number; lng: number } | null;
  height?: number;
  showDirectionsButton?: boolean;
}

export function PropertyLocationMap({
  address,
  city,
  state,
  zip,
  geoPoint,
  height = 200,
  showDirectionsButton = true,
}: PropertyLocationMapProps) {
  const colors = useThemeColors();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we have valid coordinates
  const hasValidCoords = useMemo(() => {
    if (!geoPoint) return false;
    const { lat, lng } = geoPoint;
    return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
  }, [geoPoint]);

  // Calculate map region
  const region: Region | null = useMemo(() => {
    if (!hasValidCoords || !geoPoint) return null;

    return {
      latitude: geoPoint.lat,
      longitude: geoPoint.lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
  }, [hasValidCoords, geoPoint]);

  // Format full address for directions
  const fullAddress = useMemo(() => {
    const parts = [address];
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (zip) parts.push(zip);
    return parts.join(', ');
  }, [address, city, state, zip]);

  // Open directions in native maps app
  const openDirections = useCallback(() => {
    const encodedAddress = encodeURIComponent(fullAddress);

    let url: string;
    if (Platform.OS === 'ios') {
      // Apple Maps
      url = `maps://maps.apple.com/?daddr=${encodedAddress}`;
    } else {
      // Google Maps
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback to Google Maps web
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`);
        }
      })
      .catch((err) => {
        console.error('Error opening maps:', err);
      });
  }, [fullAddress]);

  // Open location in maps app
  const openInMaps = useCallback(() => {
    if (!hasValidCoords || !geoPoint) {
      openDirections();
      return;
    }

    const { lat, lng } = geoPoint;
    let url: string;

    if (Platform.OS === 'ios') {
      url = `maps://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(address)}`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
        }
      })
      .catch((err) => {
        console.error('Error opening maps:', err);
      });
  }, [hasValidCoords, geoPoint, address, openDirections]);

  // No coordinates available
  if (!hasValidCoords) {
    return (
      <View
        className="bg-muted rounded-xl overflow-hidden"
        style={{ height }}
      >
        <View className="flex-1 items-center justify-center p-4">
          <AlertCircle size={32} className="text-muted-foreground mb-2" />
          <Text className="text-muted-foreground text-center text-sm">
            Location not available
          </Text>
          <Text className="text-xs text-muted-foreground text-center mt-1">
            No coordinates found for this address
          </Text>

          {showDirectionsButton && (
            <TouchableOpacity
              onPress={openDirections}
              className="flex-row items-center bg-primary px-4 py-2 rounded-lg mt-4"
              activeOpacity={0.7}
            >
              <Navigation size={16} color={colors.primaryForeground} />
              <Text className="text-primary-foreground font-medium ml-2">
                Get Directions
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className="rounded-xl overflow-hidden" style={{ height }}>
      <MapView
        style={{ flex: 1 }}
        provider={PROVIDER_DEFAULT}
        initialRegion={region!}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        onPress={openInMaps}
      >
        <Marker
          coordinate={{
            latitude: geoPoint!.lat,
            longitude: geoPoint!.lng,
          }}
          title={address}
          description={`${city}, ${state} ${zip}`}
        />
      </MapView>

      {/* Overlay with actions */}
      <View className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
        <View className="flex-row justify-between items-center">
          <View className="flex-1 mr-2">
            <Text className="text-white font-medium text-sm" numberOfLines={1}>
              {address}
            </Text>
            <Text className="text-white/80 text-xs" numberOfLines={1}>
              {city}, {state} {zip}
            </Text>
          </View>

          {showDirectionsButton && (
            <TouchableOpacity
              onPress={openDirections}
              className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg flex-row items-center"
              activeOpacity={0.7}
            >
              <Navigation size={14} color="white" />
              <Text className="text-white text-xs font-medium ml-1">
                Directions
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tap to open indicator */}
      <TouchableOpacity
        onPress={openInMaps}
        className="absolute top-2 right-2 bg-card/90 px-2 py-1 rounded-md flex-row items-center"
        activeOpacity={0.7}
      >
        <ExternalLink size={12} className="text-muted-foreground" />
        <Text className="text-xs text-muted-foreground ml-1">Open in Maps</Text>
      </TouchableOpacity>
    </View>
  );
}
