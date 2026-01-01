/**
 * PropertyDetailScreen
 *
 * Detailed view of a single property with all its information.
 * Uses ScrollView with sections for different property aspects.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  MapPin,
  Bed,
  Bath,
  Square,
  Calendar,
  DollarSign,
  FileText,
  Home,
  Share2,
  Heart,
  MoreVertical,
} from 'lucide-react-native';
import { useProperty, usePropertyMutations } from '../hooks/useProperties';
import { formatCurrency, formatNumber, formatPropertyType, getPropertyTypeBadgeColor } from '../utils/formatters';

type RootStackParamList = {
  PropertyList: undefined;
  PropertyDetail: { id: string };
  EditProperty: { id: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PropertyDetail'>;
type PropertyDetailRouteProp = RouteProp<RootStackParamList, 'PropertyDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PropertyDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PropertyDetailRouteProp>();
  const { id: propertyId } = route.params;

  const { property, isLoading, error, refetch } = useProperty(propertyId);
  const { deleteProperty, isLoading: isDeleting } = usePropertyMutations();

  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleEdit = useCallback(() => {
    navigation.navigate('EditProperty', { id: propertyId });
  }, [navigation, propertyId]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this property? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteProperty(propertyId);
            if (success) {
              navigation.goBack();
            } else {
              Alert.alert('Error', 'Failed to delete property. Please try again.');
            }
          },
        },
      ]
    );
  }, [deleteProperty, propertyId, navigation]);

  const handleShare = useCallback(() => {
    // TODO: Implement share functionality
    Alert.alert('Share', 'Share functionality coming soon!');
  }, []);

  const toggleFavorite = useCallback(() => {
    setIsFavorite(prev => !prev);
    // TODO: Persist favorite status
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" className="text-primary" />
        <Text className="text-muted-foreground mt-4">Loading property...</Text>
      </View>
    );
  }

  if (error || !property) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-4">
        <Text className="text-destructive text-center mb-4">
          {error?.message || 'Property not found'}
        </Text>
        <TouchableOpacity onPress={handleBack} className="bg-primary px-4 py-2 rounded-lg">
          <Text className="text-primary-foreground font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = property.images || [];
  const hasImages = images.length > 0;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#6366f1" />
        }
      >
        {/* Hero Image Section */}
        <View className="relative">
          {hasImages ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setCurrentImageIndex(index);
              }}
            >
              {images.map((image, index) => (
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
              className="bg-muted items-center justify-center"
              style={{ width: SCREEN_WIDTH, height: 280 }}
            >
              <Home size={64} className="text-muted-foreground" />
              <Text className="text-muted-foreground mt-2">No Images</Text>
            </View>
          )}

          {/* Image Pagination Dots */}
          {hasImages && images.length > 1 && (
            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center">
              {images.map((_, index) => (
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
              onPress={handleBack}
              className="bg-black/30 rounded-full p-2"
            >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={toggleFavorite}
                className="bg-black/30 rounded-full p-2"
              >
                <Heart
                  size={24}
                  color="white"
                  fill={isFavorite ? '#ef4444' : 'transparent'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} className="bg-black/30 rounded-full p-2">
                <Share2 size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity className="bg-black/30 rounded-full p-2">
                <MoreVertical size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Property Info */}
        <View className="p-4">
          {/* Price and Type */}
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-2xl font-bold text-foreground">
                {property.arv ? formatCurrency(property.arv) : 'Price TBD'}
              </Text>
              {property.purchase_price && (
                <Text className="text-sm text-muted-foreground">
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
          <View className="mb-4">
            <Text className="text-lg font-semibold text-foreground">
              {property.address || 'Address not specified'}
            </Text>
            <View className="flex-row items-center mt-1">
              <MapPin size={16} className="text-muted-foreground" />
              <Text className="text-muted-foreground ml-1">
                {property.city && property.state
                  ? `${property.city}, ${property.state} ${property.zip || ''}`
                  : 'Location not specified'}
              </Text>
            </View>
          </View>

          {/* Property Stats */}
          <View className="flex-row justify-around bg-muted rounded-xl p-4 mb-4">
            <View className="items-center">
              <Bed size={24} className="text-primary mb-1" />
              <Text className="text-lg font-semibold text-foreground">
                {property.bedrooms ?? 'N/A'}
              </Text>
              <Text className="text-xs text-muted-foreground">Beds</Text>
            </View>
            <View className="items-center">
              <Bath size={24} className="text-primary mb-1" />
              <Text className="text-lg font-semibold text-foreground">
                {property.bathrooms ?? 'N/A'}
              </Text>
              <Text className="text-xs text-muted-foreground">Baths</Text>
            </View>
            <View className="items-center">
              <Square size={24} className="text-primary mb-1" />
              <Text className="text-lg font-semibold text-foreground">
                {property.square_feet ? formatNumber(property.square_feet) : 'N/A'}
              </Text>
              <Text className="text-xs text-muted-foreground">Sqft</Text>
            </View>
            <View className="items-center">
              <Calendar size={24} className="text-primary mb-1" />
              <Text className="text-lg font-semibold text-foreground">
                {property.year_built ?? 'N/A'}
              </Text>
              <Text className="text-xs text-muted-foreground">Built</Text>
            </View>
          </View>

          {/* Additional Details */}
          <View className="bg-card rounded-xl p-4 mb-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-3">
              Property Details
            </Text>

            <View className="gap-3">
              {property.lot_size && (
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Lot Size</Text>
                  <Text className="text-foreground font-medium">
                    {formatNumber(property.lot_size)} sqft
                  </Text>
                </View>
              )}
              {property.county && (
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">County</Text>
                  <Text className="text-foreground font-medium">{property.county}</Text>
                </View>
              )}
              {property.status && (
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Status</Text>
                  <Text className="text-foreground font-medium">{property.status}</Text>
                </View>
              )}
              {property.mls_id && (
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">MLS ID</Text>
                  <Text className="text-foreground font-medium">{property.mls_id}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Notes */}
          {property.notes && (
            <View className="bg-card rounded-xl p-4 mb-4 border border-border">
              <View className="flex-row items-center mb-2">
                <FileText size={18} className="text-primary" />
                <Text className="text-lg font-semibold text-foreground ml-2">Notes</Text>
              </View>
              <Text className="text-foreground leading-6">{property.notes}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="flex-row gap-3 p-4 bg-background border-t border-border">
        <TouchableOpacity
          onPress={handleEdit}
          className="flex-1 bg-primary py-3 rounded-xl flex-row items-center justify-center"
        >
          <Edit2 size={20} color="white" />
          <Text className="text-primary-foreground font-semibold ml-2">Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          disabled={isDeleting}
          className="bg-destructive py-3 px-4 rounded-xl"
        >
          {isDeleting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Trash2 size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
