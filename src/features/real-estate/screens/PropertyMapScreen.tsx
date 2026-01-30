/**
 * PropertyMapScreen
 *
 * Full-screen map view showing all properties.
 * Allows switching between map and list views.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, List, X, MapPin, Bed, Bath, Square } from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { PropertyMap } from '../components/PropertyMap';
import { useProperties } from '../hooks/useProperties';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { Property } from '../types';
import { formatCurrency, formatPropertyType } from '../utils/formatters';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function PropertyMapScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { properties, isLoading } = useProperties();

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handlePropertyPress = useCallback((property: Property) => {
    setSelectedProperty(property);
    setShowPropertyModal(true);
  }, []);

  const handleViewDetails = useCallback(() => {
    if (selectedProperty) {
      setShowPropertyModal(false);
      router.push(`/(tabs)/properties/${selectedProperty.id}`);
    }
  }, [selectedProperty, router]);

  const handleCloseModal = useCallback(() => {
    setShowPropertyModal(false);
    setSelectedProperty(null);
  }, []);

  const handleGoToList = useCallback(() => {
    router.push('/(tabs)/properties');
  }, [router]);

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View className="absolute top-0 left-0 right-0 z-10 px-4 pb-4">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 rounded-full items-center justify-center shadow-md"
            style={{ backgroundColor: colors.card }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.foreground} />
          </TouchableOpacity>

          <View className="px-4 py-2 rounded-full shadow-md" style={{ backgroundColor: colors.card }}>
            <Text className="font-semibold" style={{ color: colors.foreground }}>Property Map</Text>
          </View>

          <TouchableOpacity
            onPress={handleGoToList}
            className="w-10 h-10 rounded-full items-center justify-center shadow-md"
            style={{ backgroundColor: colors.card }}
            activeOpacity={0.7}
          >
            <List size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map */}
      <PropertyMap
        properties={properties}
        onPropertyPress={handlePropertyPress}
        selectedPropertyId={selectedProperty?.id}
        showUserLocation={true}
      />

      {/* Property Detail Modal */}
      <Modal
        visible={showPropertyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View className="flex-1 justify-end">
          {/* Backdrop */}
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={handleCloseModal}
          />

          {/* Modal Content */}
          <View
            className="rounded-t-3xl shadow-lg"
            style={{ maxHeight: SCREEN_HEIGHT * 0.5, backgroundColor: colors.card }}
          >
            {/* Handle */}
            <View className="items-center py-3">
              <View className="w-10 h-1 rounded-full" style={{ backgroundColor: withOpacity(colors.mutedForeground, 'strong') }} />
            </View>

            {/* Close Button */}
            <TouchableOpacity
              onPress={handleCloseModal}
              className="absolute top-3 right-4 w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.muted }}
              activeOpacity={0.7}
            >
              <X size={18} color={colors.mutedForeground} />
            </TouchableOpacity>

            {selectedProperty && (
              <ScrollView className="px-4 pb-8" showsVerticalScrollIndicator={false}>
                {/* Property Address */}
                <Text className="text-xl font-bold mb-1" style={{ color: colors.foreground }}>
                  {selectedProperty.address || 'Address not specified'}
                </Text>
                <View className="flex-row items-center mb-4">
                  <MapPin size={14} color={colors.mutedForeground} />
                  <Text className="ml-1" style={{ color: colors.mutedForeground }}>
                    {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip}
                  </Text>
                </View>

                {/* Price */}
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                    {selectedProperty.arv
                      ? formatCurrency(selectedProperty.arv)
                      : 'Price TBD'}
                  </Text>
                  <View className="px-3 py-1 rounded-lg" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
                    <Text className="font-medium" style={{ color: colors.primary }}>
                      {formatPropertyType(selectedProperty.propertyType)}
                    </Text>
                  </View>
                </View>

                {/* Property Stats */}
                <View className="flex-row justify-around rounded-xl p-4 mb-4" style={{ backgroundColor: colors.muted }}>
                  <View className="items-center">
                    <Bed size={20} color={colors.primary} style={{ marginBottom: 4 }} />
                    <Text className="font-semibold" style={{ color: colors.foreground }}>
                      {selectedProperty.bedrooms ?? 'N/A'}
                    </Text>
                    <Text className="text-xs" style={{ color: colors.mutedForeground }}>Beds</Text>
                  </View>
                  <View className="items-center">
                    <Bath size={20} color={colors.primary} style={{ marginBottom: 4 }} />
                    <Text className="font-semibold" style={{ color: colors.foreground }}>
                      {selectedProperty.bathrooms ?? 'N/A'}
                    </Text>
                    <Text className="text-xs" style={{ color: colors.mutedForeground }}>Baths</Text>
                  </View>
                  <View className="items-center">
                    <Square size={20} color={colors.primary} style={{ marginBottom: 4 }} />
                    <Text className="font-semibold" style={{ color: colors.foreground }}>
                      {selectedProperty.square_feet?.toLocaleString() ?? 'N/A'}
                    </Text>
                    <Text className="text-xs" style={{ color: colors.mutedForeground }}>Sqft</Text>
                  </View>
                </View>

                {/* Notes Preview */}
                {selectedProperty.notes && (
                  <View className="mb-4">
                    <Text className="text-sm" numberOfLines={2} style={{ color: colors.mutedForeground }}>
                      {selectedProperty.notes}
                    </Text>
                  </View>
                )}

                {/* View Details Button */}
                <TouchableOpacity
                  onPress={handleViewDetails}
                  className="py-4 rounded-xl items-center"
                  style={{ backgroundColor: colors.primary }}
                  activeOpacity={0.7}
                >
                  <Text className="font-semibold text-base" style={{ color: colors.primaryForeground }}>
                    View Full Details
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ThemedSafeAreaView>
  );
}
