/**
 * PropertyLocationMap Component - Web Version
 *
 * Web-compatible version that uses an iframe with Google Maps
 * instead of react-native-maps (which is native-only).
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, Navigation, ExternalLink, AlertCircle } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

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
        className="rounded-xl overflow-hidden"
        style={{ height, backgroundColor: colors.muted }}
      >
        <View className="flex-1 items-center justify-center p-4">
          <AlertCircle size={32} color={colors.mutedForeground} style={{ marginBottom: 8 }} />
          <Text className="text-center text-sm" style={{ color: colors.mutedForeground }}>
            Location not available
          </Text>
          <Text className="text-xs text-center mt-1" style={{ color: colors.mutedForeground }}>
            No coordinates found for this address
          </Text>

          {showDirectionsButton && (
            <TouchableOpacity
              onPress={openDirections}
              className="flex-row items-center px-4 py-2 rounded-lg mt-4"
              style={{ backgroundColor: colors.primary }}
              activeOpacity={0.7}
            >
              <Navigation size={16} color={colors.primaryForeground} />
              <Text className="font-medium ml-2" style={{ color: colors.primaryForeground }}>
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
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.muted }}>
          <MapPin size={24} color={colors.mutedForeground} />
          <Text className="text-sm mt-2" style={{ color: colors.mutedForeground }}>Map unavailable</Text>
        </View>
      )}

      {/* Overlay with actions */}
      <View
        className="absolute bottom-0 left-0 right-0 p-3"
        style={{ backgroundColor: withOpacity(colors.background, 'backdrop') }}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-1 mr-2">
            <Text className="font-medium text-sm" style={{ color: '#ffffff' }} numberOfLines={1}>
              {address}
            </Text>
            <Text className="text-xs" style={{ color: withOpacity('#ffffff', 'opaque') }} numberOfLines={1}>
              {city}, {state} {zip}
            </Text>
          </View>

          {showDirectionsButton && (
            <TouchableOpacity
              onPress={openDirections}
              className="px-3 py-2 rounded-lg flex-row items-center"
              style={{ backgroundColor: withOpacity(colors.primary, 'light') }}
              activeOpacity={0.7}
            >
              <Navigation size={14} color="#ffffff" />
              <Text className="text-xs font-medium ml-1" style={{ color: '#ffffff' }}>
                Directions
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tap to open indicator */}
      <TouchableOpacity
        onPress={openInMaps}
        className="absolute top-2 right-2 px-2 py-1 rounded-md flex-row items-center"
        style={{ backgroundColor: withOpacity(colors.card, 'almostOpaque') }}
        activeOpacity={0.7}
      >
        <ExternalLink size={12} color={colors.mutedForeground} />
        <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>Open in Maps</Text>
      </TouchableOpacity>
    </View>
  );
}
