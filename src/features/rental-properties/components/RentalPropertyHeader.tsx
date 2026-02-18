// src/features/rental-properties/components/RentalPropertyHeader.tsx
// Hero section for rental property detail with image and gradient overlays

import React from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, Bed, Bath, Square } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Badge } from '@/components/ui';
import { FONT_SIZES, SPACING } from '@/constants/design-tokens';
import type { RentalProperty, RentalType } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 280;

interface RentalPropertyHeaderProps {
  property: RentalProperty;
}

// Helper to format rental type display
function formatRentalType(type: RentalType): string {
  switch (type) {
    case 'str':
      return 'STR';
    case 'mtr':
      return 'MTR';
    case 'ltr':
      return 'LTR';
    default:
      return String(type).toUpperCase();
  }
}

// Helper to get badge variant based on rental type
function getRentalTypeBadgeVariant(type: RentalType): 'info' | 'warning' | 'success' {
  switch (type) {
    case 'str':
      return 'info';
    case 'mtr':
      return 'warning';
    case 'ltr':
      return 'success';
    default:
      return 'info';
  }
}

// Format number with comma separators
function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function RentalPropertyHeader({ property }: RentalPropertyHeaderProps) {
  const colors = useThemeColors();
  const hasImage = !!property.primary_image_url;

  const cityStateZip = property.city && property.state
    ? `${property.city}, ${property.state} ${property.zip || ''}`.trim()
    : null;

  return (
    <View style={{ position: 'relative' }}>
      {/* Image or Placeholder */}
      {hasImage ? (
        <Image
          source={{ uri: property.primary_image_url! }}
          style={{ width: SCREEN_WIDTH, height: HEADER_HEIGHT }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: SCREEN_WIDTH,
            height: HEADER_HEIGHT,
            backgroundColor: colors.muted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Home size={64} color={colors.mutedForeground} />
          <Text style={{ marginTop: SPACING.sm, color: colors.mutedForeground }}>
            No Image
          </Text>
        </View>
      )}

      {/* Top Gradient Overlay - Property Name & Address */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 100,
          paddingTop: SPACING.md,
          paddingHorizontal: SPACING.md,
        }}
        pointerEvents="none"
      >
        <View>
          <Text
            style={{
              fontSize: FONT_SIZES.xl,
              fontWeight: '700',
              color: 'white',
            }}
            numberOfLines={1}
          >
            {property.name || 'Unnamed Property'}
          </Text>
          {(property.address || cityStateZip) && (
            <Text
              style={{
                fontSize: FONT_SIZES.sm,
                color: 'rgba(255,255,255,0.85)',
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {property.address}
              {cityStateZip && `, ${cityStateZip}`}
            </Text>
          )}
        </View>
      </LinearGradient>

      {/* Bottom Gradient Overlay - Stats & Rental Type Badge */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 100,
          paddingBottom: SPACING.md,
          paddingHorizontal: SPACING.md,
          justifyContent: 'flex-end',
        }}
        pointerEvents="none"
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {/* Quick Stats (bed/bath/sqft) - overlay variant */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {/* Bedrooms */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Bed size={16} color="white" />
              <Text
                style={{
                  fontSize: FONT_SIZES.base,
                  marginLeft: 4,
                  color: 'white',
                  fontWeight: '600',
                }}
              >
                {property.bedrooms ?? '-'}
              </Text>
            </View>

            <Text style={{ color: 'rgba(255,255,255,0.7)' }}>|</Text>

            {/* Bathrooms */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Bath size={16} color="white" />
              <Text
                style={{
                  fontSize: FONT_SIZES.base,
                  marginLeft: 4,
                  color: 'white',
                  fontWeight: '600',
                }}
              >
                {property.bathrooms ?? '-'}
              </Text>
            </View>

            <Text style={{ color: 'rgba(255,255,255,0.7)' }}>|</Text>

            {/* Square Feet */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Square size={16} color="white" />
              <Text
                style={{
                  fontSize: FONT_SIZES.base,
                  marginLeft: 4,
                  color: 'white',
                  fontWeight: '600',
                }}
              >
                {property.square_feet ? formatNumber(property.square_feet) : '-'} sqft
              </Text>
            </View>
          </View>

          {/* Rental Type Badge */}
          <Badge variant={getRentalTypeBadgeVariant(property.rental_type)} size="md">
            {formatRentalType(property.rental_type)}
          </Badge>
        </View>
      </LinearGradient>
    </View>
  );
}

export default RentalPropertyHeader;
