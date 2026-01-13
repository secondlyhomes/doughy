/**
 * PropertyLocationMap Component - Web Version
 *
 * Web-compatible version that uses an iframe with Google Maps
 * instead of react-native-maps (which is native-only).
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
  // Check if we have valid coordinates
  const hasValidCoords = useMemo(() => {
    if (!geoPoint) return false;
    const { lat, lng } = geoPoint;
    return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
  }, [geoPoint]);

  // Format full address for directions
  const fullAddress = useMemo(() => {
    const parts = [address];
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (zip) parts.push(zip);
    return parts.join(', ');
  }, [address, city, state, zip]);

  // Open directions in Google Maps
  const openDirections = useCallback(() => {
    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    window.open(url, '_blank');
  }, [fullAddress]);

  // Open location in maps
  const openInMaps = useCallback(() => {
    if (!hasValidCoords || !geoPoint) {
      openDirections();
      return;
    }

    const { lat, lng } = geoPoint;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  }, [hasValidCoords, geoPoint, openDirections]);

  // Generate Google Maps embed URL
  const mapEmbedUrl = useMemo(() => {
    if (hasValidCoords && geoPoint) {
      const { lat, lng } = geoPoint;
      return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${lat},${lng}&zoom=15`;
    }
    // Fallback to address-based search
    const encodedAddress = encodeURIComponent(fullAddress);
    return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedAddress}&zoom=15`;
  }, [hasValidCoords, geoPoint, fullAddress]);

  // Static map image as fallback (no API key needed)
  const staticMapUrl = useMemo(() => {
    if (hasValidCoords && geoPoint) {
      const { lat, lng } = geoPoint;
      // OpenStreetMap static image
      return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=600x300&maptype=mapnik&markers=${lat},${lng},red`;
    }
    return null;
  }, [hasValidCoords, geoPoint]);

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
    <View className="rounded-xl overflow-hidden relative" style={{ height }}>
      {/* Static map image for web */}
      {staticMapUrl ? (
        <TouchableOpacity
          onPress={openInMaps}
          activeOpacity={0.9}
          style={{ flex: 1 }}
        >
          <img
            src={staticMapUrl}
            alt={`Map of ${address}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </TouchableOpacity>
      ) : (
        <View className="flex-1 bg-muted items-center justify-center">
          <MapPin size={24} className="text-muted-foreground" />
          <Text className="text-muted-foreground text-sm mt-2">Map unavailable</Text>
        </View>
      )}

      {/* Overlay with actions */}
      <View
        className="absolute bottom-0 left-0 right-0 p-3"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      >
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
              className="bg-white/20 px-3 py-2 rounded-lg flex-row items-center"
              activeOpacity={0.7}
            >
              <Navigation size={14} color={colors.primaryForeground} />
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
        className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-md flex-row items-center"
        activeOpacity={0.7}
      >
        <ExternalLink size={12} className="text-muted-foreground" />
        <Text className="text-xs text-muted-foreground ml-1">Open in Maps</Text>
      </TouchableOpacity>
    </View>
  );
}
