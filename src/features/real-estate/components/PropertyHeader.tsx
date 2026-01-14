// src/features/real-estate/components/PropertyHeader.tsx
// Hero section for property detail with image carousel and actions

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {
  ArrowLeft,
  Share2,
  Heart,
  MoreVertical,
  Home,
  MapPin,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { Property, PropertyImage } from '../types';
import { formatCurrency, formatPropertyType, getPropertyTypeBadgeColor } from '../utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PropertyHeaderProps {
  property: Property;
  onBack: () => void;
  onShare: () => void;
  onFavorite: () => void;
  onMore: () => void;
  isFavorite?: boolean;
}

export function PropertyHeader({
  property,
  onBack,
  onShare,
  onFavorite,
  onMore,
  isFavorite = false,
}: PropertyHeaderProps) {
  const colors = useThemeColors();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = property.images || [];
  const hasImages = images.length > 0;

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentImageIndex(index);
  }, []);

  return (
    <View>
      {/* Hero Image Section */}
      <View className="relative">
        {hasImages ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
          >
            {images.map((image: PropertyImage, index: number) => (
              <Image
                key={image.id || index}
                source={{ uri: image.url }}
                style={{ width: SCREEN_WIDTH, height: 280 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <View
            className="items-center justify-center"
            style={{ width: SCREEN_WIDTH, height: 280, backgroundColor: colors.muted }}
          >
            <Home size={64} color={colors.mutedForeground} />
            <Text className="mt-2" style={{ color: colors.mutedForeground }}>No Images</Text>
          </View>
        )}

        {/* Image Pagination Dots */}
        {hasImages && images.length > 1 && (
          <View className="absolute bottom-4 left-0 right-0 flex-row justify-center">
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

        {/* Header Overlay */}
        <View className="absolute top-0 left-0 right-0 flex-row justify-between items-start p-4 pt-12">
          <TouchableOpacity
            onPress={onBack}
            className="bg-black/30 rounded-full p-2"
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onFavorite}
              className="bg-black/30 rounded-full p-2"
            >
              <Heart
                size={24}
                color="white"
                fill={isFavorite ? colors.destructive : 'transparent'}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={onShare} className="bg-black/30 rounded-full p-2">
              <Share2 size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onMore} className="bg-black/30 rounded-full p-2">
              <MoreVertical size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Property Info */}
      <View className="p-4 pb-0">
        {/* Price and Type */}
        <View className="flex-row justify-between items-start mb-3">
          <View>
            <Text className="text-2xl font-bold" style={{ color: colors.foreground }}>
              {property.arv ? formatCurrency(property.arv) : 'Price TBD'}
            </Text>
            {property.purchase_price && (
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                Purchase: {formatCurrency(property.purchase_price)}
              </Text>
            )}
          </View>
          <View className={`px-3 py-1.5 rounded-lg ${getPropertyTypeBadgeColor(property.propertyType)}`}>
            <Text className="text-white font-medium">
              {formatPropertyType(property.propertyType)}
            </Text>
          </View>
        </View>

        {/* Address */}
        <View className="mb-2">
          <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
            {property.address || 'Address not specified'}
          </Text>
          <View className="flex-row items-center mt-1">
            <MapPin size={16} color={colors.mutedForeground} />
            <Text className="ml-1" style={{ color: colors.mutedForeground }}>
              {property.city && property.state
                ? `${property.city}, ${property.state} ${property.zip || ''}`
                : 'Location not specified'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
