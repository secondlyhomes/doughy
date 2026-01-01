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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, List, X, MapPin, Bed, Bath, Square } from 'lucide-react-native';
import { PropertyMap } from '../components/PropertyMap';
import { useProperties } from '../hooks/useProperties';
import { Property } from '../types';
import { formatCurrency, formatPropertyType } from '../utils/formatters';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type RootStackParamList = {
  PropertyList: undefined;
  PropertyDetail: { id: string };
  PropertyMap: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PropertyMap'>;

export function PropertyMapScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { properties, isLoading } = useProperties();

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handlePropertyPress = useCallback((property: Property) => {
    setSelectedProperty(property);
    setShowPropertyModal(true);
  }, []);

  const handleViewDetails = useCallback(() => {
    if (selectedProperty) {
      setShowPropertyModal(false);
      navigation.navigate('PropertyDetail', { id: selectedProperty.id });
    }
  }, [selectedProperty, navigation]);

  const handleCloseModal = useCallback(() => {
    setShowPropertyModal(false);
    setSelectedProperty(null);
  }, []);

  const handleGoToList = useCallback(() => {
    navigation.navigate('PropertyList');
  }, [navigation]);

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="absolute top-0 left-0 right-0 z-10 pt-12 px-4 pb-4">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={handleBack}
            className="bg-card w-10 h-10 rounded-full items-center justify-center shadow-md"
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} className="text-foreground" />
          </TouchableOpacity>

          <View className="bg-card px-4 py-2 rounded-full shadow-md">
            <Text className="text-foreground font-semibold">Property Map</Text>
          </View>

          <TouchableOpacity
            onPress={handleGoToList}
            className="bg-card w-10 h-10 rounded-full items-center justify-center shadow-md"
            activeOpacity={0.7}
          >
            <List size={20} className="text-foreground" />
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
            className="bg-card rounded-t-3xl shadow-lg"
            style={{ maxHeight: SCREEN_HEIGHT * 0.5 }}
          >
            {/* Handle */}
            <View className="items-center py-3">
              <View className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </View>

            {/* Close Button */}
            <TouchableOpacity
              onPress={handleCloseModal}
              className="absolute top-3 right-4 w-8 h-8 bg-muted rounded-full items-center justify-center"
              activeOpacity={0.7}
            >
              <X size={18} className="text-muted-foreground" />
            </TouchableOpacity>

            {selectedProperty && (
              <ScrollView className="px-4 pb-8" showsVerticalScrollIndicator={false}>
                {/* Property Address */}
                <Text className="text-xl font-bold text-foreground mb-1">
                  {selectedProperty.address || 'Address not specified'}
                </Text>
                <View className="flex-row items-center mb-4">
                  <MapPin size={14} className="text-muted-foreground" />
                  <Text className="text-muted-foreground ml-1">
                    {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip}
                  </Text>
                </View>

                {/* Price */}
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-2xl font-bold text-primary">
                    {selectedProperty.arv
                      ? formatCurrency(selectedProperty.arv)
                      : 'Price TBD'}
                  </Text>
                  <View className="bg-primary/10 px-3 py-1 rounded-lg">
                    <Text className="text-primary font-medium">
                      {formatPropertyType(selectedProperty.propertyType)}
                    </Text>
                  </View>
                </View>

                {/* Property Stats */}
                <View className="flex-row justify-around bg-muted rounded-xl p-4 mb-4">
                  <View className="items-center">
                    <Bed size={20} className="text-primary mb-1" />
                    <Text className="text-foreground font-semibold">
                      {selectedProperty.bedrooms ?? 'N/A'}
                    </Text>
                    <Text className="text-xs text-muted-foreground">Beds</Text>
                  </View>
                  <View className="items-center">
                    <Bath size={20} className="text-primary mb-1" />
                    <Text className="text-foreground font-semibold">
                      {selectedProperty.bathrooms ?? 'N/A'}
                    </Text>
                    <Text className="text-xs text-muted-foreground">Baths</Text>
                  </View>
                  <View className="items-center">
                    <Square size={20} className="text-primary mb-1" />
                    <Text className="text-foreground font-semibold">
                      {selectedProperty.square_feet?.toLocaleString() ?? 'N/A'}
                    </Text>
                    <Text className="text-xs text-muted-foreground">Sqft</Text>
                  </View>
                </View>

                {/* Notes Preview */}
                {selectedProperty.notes && (
                  <View className="mb-4">
                    <Text className="text-sm text-muted-foreground" numberOfLines={2}>
                      {selectedProperty.notes}
                    </Text>
                  </View>
                )}

                {/* View Details Button */}
                <TouchableOpacity
                  onPress={handleViewDetails}
                  className="bg-primary py-4 rounded-xl items-center"
                  activeOpacity={0.7}
                >
                  <Text className="text-primary-foreground font-semibold text-base">
                    View Full Details
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
