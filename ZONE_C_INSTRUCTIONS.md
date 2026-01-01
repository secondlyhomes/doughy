# ZONE C: Real Estate Features

**Instance 3 Assignment**

## Your Responsibility
You are converting all real estate/property management features. This is the largest feature area.

**Total Files: ~254 files**

## Your Directory (from doughy-ai-web-backup)

| Directory | Files | Priority |
|-----------|-------|----------|
| `src/features/real-estate/` | 254 | ALL |

## Subdirectory Breakdown

Explore `src/features/real-estate/` structure:
- `components/` - UI components specific to properties
- `pages/` - Screen/page components
- `hooks/` - Custom hooks for property data
- `stores/` - Zustand stores
- `types/` - TypeScript types
- `utils/` - Utility functions
- `services/` - API calls

## Priority Order

### Phase 1: Core Property Views
1. **Property List** - Main list of properties (use FlatList)
2. **Property Card** - Individual property card component
3. **Property Detail** - Full property view screen
4. **Property Types** - TypeScript types (copy mostly as-is)

### Phase 2: Property Forms
5. **Add Property** - Create new property form
6. **Edit Property** - Edit existing property
7. **Image Upload** - Use expo-image-picker
8. **Address Autocomplete** - Location input

### Phase 3: Advanced Features
9. **Property Map** - Use react-native-maps
10. **Property Search/Filter** - Search and filter UI
11. **Property Analytics** - Charts and stats

## Key Conversions for Your Zone

### Property List with FlatList
```tsx
// src/features/real-estate/screens/PropertyListScreen.tsx
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useProperties } from '../hooks/useProperties';
import { PropertyCard } from '../components/PropertyCard';
import { Property } from '../types';

export function PropertyListScreen() {
  const navigation = useNavigation();
  const { properties, isLoading, refetch } = useProperties();

  const renderItem = ({ item }: { item: Property }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
    >
      <PropertyCard property={item} />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={properties}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View className="h-4" />}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-muted-foreground">No properties found</Text>
          </View>
        }
      />
    </View>
  );
}
```

### Property Card Component
```tsx
// src/features/real-estate/components/PropertyCard.tsx
import { View, Text, Image } from 'react-native';
import { MapPin, Bed, Bath, Square } from 'lucide-react-native';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <View className="bg-card rounded-xl overflow-hidden shadow-sm">
      {/* Property Image */}
      <Image
        source={{ uri: property.imageUrl || 'https://placeholder.com/400x200' }}
        className="w-full h-48"
        resizeMode="cover"
      />

      {/* Property Info */}
      <View className="p-4">
        <Text className="text-lg font-semibold text-foreground mb-1">
          ${property.price?.toLocaleString()}
        </Text>

        <View className="flex-row items-center mb-2">
          <MapPin size={14} className="text-muted-foreground" />
          <Text className="text-muted-foreground ml-1 text-sm">
            {property.address}
          </Text>
        </View>

        {/* Property Stats */}
        <View className="flex-row gap-4">
          <View className="flex-row items-center">
            <Bed size={14} className="text-muted-foreground" />
            <Text className="text-muted-foreground ml-1 text-sm">
              {property.bedrooms} beds
            </Text>
          </View>

          <View className="flex-row items-center">
            <Bath size={14} className="text-muted-foreground" />
            <Text className="text-muted-foreground ml-1 text-sm">
              {property.bathrooms} baths
            </Text>
          </View>

          <View className="flex-row items-center">
            <Square size={14} className="text-muted-foreground" />
            <Text className="text-muted-foreground ml-1 text-sm">
              {property.sqft?.toLocaleString()} sqft
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
```

### Image Picker for Property Photos
```tsx
// src/features/real-estate/components/PropertyImagePicker.tsx
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus, X } from 'lucide-react-native';

interface PropertyImagePickerProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function PropertyImagePicker({
  images,
  onChange,
  maxImages = 10
}: PropertyImagePickerProps) {

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => asset.uri);
      onChange([...images, ...newImages].slice(0, maxImages));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      onChange([...images, result.assets[0].uri].slice(0, maxImages));
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 p-2">
          {/* Add buttons */}
          <TouchableOpacity
            onPress={pickImage}
            className="w-24 h-24 bg-muted rounded-lg items-center justify-center"
          >
            <ImagePlus size={24} className="text-muted-foreground" />
            <Text className="text-xs text-muted-foreground mt-1">Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={takePhoto}
            className="w-24 h-24 bg-muted rounded-lg items-center justify-center"
          >
            <Camera size={24} className="text-muted-foreground" />
            <Text className="text-xs text-muted-foreground mt-1">Camera</Text>
          </TouchableOpacity>

          {/* Existing images */}
          {images.map((uri, index) => (
            <View key={index} className="relative">
              <Image
                source={{ uri }}
                className="w-24 h-24 rounded-lg"
              />
              <TouchableOpacity
                onPress={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-destructive rounded-full p-1"
              >
                <X size={14} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
      <Text className="text-xs text-muted-foreground mt-2">
        {images.length}/{maxImages} photos
      </Text>
    </View>
  );
}
```

### Map View for Properties
```tsx
// src/features/real-estate/components/PropertyMap.tsx
import { View, Text, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Property } from '../types';

interface PropertyMapProps {
  properties: Property[];
  onMarkerPress?: (property: Property) => void;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

export function PropertyMap({
  properties,
  onMarkerPress,
  initialRegion
}: PropertyMapProps) {
  const defaultRegion = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View className="flex-1">
      <MapView
        style={{ flex: 1 }}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion || defaultRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {properties.map((property) => (
          property.latitude && property.longitude && (
            <Marker
              key={property.id}
              coordinate={{
                latitude: property.latitude,
                longitude: property.longitude,
              }}
              title={property.address}
              description={`$${property.price?.toLocaleString()}`}
              onPress={() => onMarkerPress?.(property)}
            />
          )
        ))}
      </MapView>
    </View>
  );
}
```

## Dependencies on Zone A

You will need from Zone A:
- `Button`, `Input`, `Card` components
- `supabase` client
- Navigation setup
- Utility functions

## Dependencies to Install (Ask Zone A or do yourself)

```bash
npx expo install expo-image-picker react-native-maps lucide-react-native
```

## Files to Create First

1. `src/features/real-estate/types/index.ts` - Property types
2. `src/features/real-estate/hooks/useProperties.ts` - Data fetching hook
3. `src/features/real-estate/components/PropertyCard.tsx`
4. `src/features/real-estate/screens/PropertyListScreen.tsx`
5. `src/features/real-estate/screens/PropertyDetailScreen.tsx`

## Notes

- The web version likely uses `react-leaflet` for maps - replace with `react-native-maps`
- Image handling changes significantly - use `expo-image-picker` and upload to Supabase Storage
- Tables should become `FlatList` components
- Modals should use React Navigation modals or `@gorhom/bottom-sheet`
