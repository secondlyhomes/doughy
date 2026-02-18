// src/features/real-estate/components/PropertyHeader.tsx
// Hero section for property detail with image carousel and actions

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Home,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { GlassButton } from '@/components/ui/GlassButton';
import { Property, PropertyImage } from '../types';
import { formatCurrency, formatPropertyType, getPropertyTypeBadgeColor } from '../utils/formatters';
import { PropertyQuickStats } from './PropertyQuickStats';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PropertyHeaderProps {
  property: Property;
  /** Optional favorite handler - if not provided, favorite button is hidden */
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export function PropertyHeader({
  property,
  onFavorite,
  isFavorite = false,
}: PropertyHeaderProps) {
  const colors = useThemeColors();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const images = property.images || [];
  // Fall back to primary_image_url if no images in the joined table
  const fallbackImageUrl = !images.length && property.primary_image_url ? property.primary_image_url : null;
  const hasImages = images.length > 0 || !!fallbackImageUrl;

  // Handle image load failure
  const handleImageError = useCallback((imageKey: string) => {
    setFailedImages(prev => new Set(prev).add(imageKey));
  }, []);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentImageIndex(index);
  }, []);

  const cityStateZip = property.city && property.state
    ? `${property.city}, ${property.state} ${property.zip || ''}`.trim()
    : null;

  return (
    <View>
      {/* Hero Image Section */}
      <View className="relative">
        {images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
          >
            {images.map((image: PropertyImage, index: number) => {
              const imageKey = image.id || image.url;
              const hasFailed = failedImages.has(imageKey);

              if (hasFailed) {
                return (
                  <View
                    key={imageKey}
                    className="items-center justify-center"
                    style={{ width: SCREEN_WIDTH, height: 280, backgroundColor: colors.muted }}
                  >
                    <Home size={48} color={colors.mutedForeground} />
                    <Text className="mt-2 text-sm" style={{ color: colors.mutedForeground }}>
                      Failed to load image
                    </Text>
                  </View>
                );
              }

              return (
                <Image
                  key={imageKey}
                  source={{ uri: image.url }}
                  style={{ width: SCREEN_WIDTH, height: 280 }}
                  resizeMode="cover"
                  onError={() => handleImageError(imageKey)}
                />
              );
            })}
          </ScrollView>
        ) : fallbackImageUrl ? (
          <Image
            source={{ uri: fallbackImageUrl }}
            style={{ width: SCREEN_WIDTH, height: 280 }}
            resizeMode="cover"
            onError={() => setFailedImages(prev => new Set(prev).add('fallback'))}
          />
        ) : (
          <View
            className="items-center justify-center"
            style={{ width: SCREEN_WIDTH, height: 280, backgroundColor: colors.muted }}
          >
            <Home size={64} color={colors.mutedForeground} />
            <Text className="mt-2" style={{ color: colors.mutedForeground }}>No Images</Text>
          </View>
        )}

        {/* Top Gradient Overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 80,
            paddingTop: 8,
          }}
          pointerEvents="box-none"
        >
          <View className="flex-row justify-between items-start px-4" pointerEvents="box-none">
            {/* Top Left: Address */}
            <View className="flex-1 mr-4">
              <Text className="text-lg font-bold text-white" numberOfLines={1}>
                {property.address || 'Address not specified'}
              </Text>
              {cityStateZip && (
                <Text className="text-sm text-white/80" numberOfLines={1}>
                  {cityStateZip}
                </Text>
              )}
            </View>

            {/* Top Right: ARV + Purchase Price + Actions */}
            <View className="items-end">
              <Text className="text-xl font-bold text-white">
                {property.arv ? formatCurrency(property.arv) : 'Price TBD'}
              </Text>
              {property.purchase_price && (
                <Text className="text-sm text-white/80 mt-0.5">
                  Purchase: {formatCurrency(property.purchase_price)}
                </Text>
              )}
              {onFavorite && (
                <View className="mt-1">
                  <GlassButton
                    icon={
                      <Heart
                        size={22}
                        color="white"
                        fill={isFavorite ? colors.destructive : 'transparent'}
                      />
                    }
                    onPress={onFavorite}
                    size={36}
                    effect="clear"
                    accessibilityLabel={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  />
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Bottom Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
          }}
          pointerEvents="none"
        >
          <View className="flex-1 flex-row justify-between items-end px-4 pb-3">
            {/* Bottom Left: Quick Stats (bed/bath/sqft) */}
            <View>
              <PropertyQuickStats property={property} variant="overlay" />
            </View>

            {/* Bottom Right: Property Type Badge */}
            <View className={`px-3 py-1 rounded-lg ${getPropertyTypeBadgeColor(property.propertyType)}`}>
              <Text className="text-white text-sm font-medium">
                {formatPropertyType(property.propertyType)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Image Pagination Dots - centered above bottom gradient content */}
        {hasImages && images.length > 1 && (
          <View
            style={{
              position: 'absolute',
              bottom: 40,
              left: 0,
              right: 0,
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            {images.map((_: PropertyImage, index: number) => (
              <View
                key={index}
                className={`w-2 h-2 rounded-full mx-1 ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
