/**
 * PropertyListScreen
 *
 * Main screen for displaying the list of properties.
 * Uses FlatList for performant scrolling of large lists.
 */

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, Plus, Filter, Grid, List } from 'lucide-react-native';
import { PropertyCard } from '../components/PropertyCard';
import { Property } from '../types';
import { useProperties } from '../hooks/useProperties';

type RootStackParamList = {
  PropertyList: undefined;
  PropertyDetail: { id: string };
  AddProperty: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PropertyList'>;

export function PropertyListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { properties, isLoading, error, refetch } = useProperties();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Filter properties based on search query
  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) return properties;

    const query = searchQuery.toLowerCase();
    return properties.filter(property =>
      property.address?.toLowerCase().includes(query) ||
      property.city?.toLowerCase().includes(query) ||
      property.state?.toLowerCase().includes(query) ||
      property.zip?.includes(query)
    );
  }, [properties, searchQuery]);

  const handlePropertyPress = useCallback((property: Property) => {
    setSelectedPropertyId(property.id);
    navigation.navigate('PropertyDetail', { id: property.id });
  }, [navigation]);

  const handleAddProperty = useCallback(() => {
    navigation.navigate('AddProperty');
  }, [navigation]);

  const renderPropertyItem = useCallback(({ item }: { item: Property }) => (
    <PropertyCard
      property={item}
      isSelected={item.id === selectedPropertyId}
      onPress={handlePropertyPress}
      compact={viewMode === 'grid'}
    />
  ), [selectedPropertyId, handlePropertyPress, viewMode]);

  const keyExtractor = useCallback((item: Property) => item.id, []);

  const ItemSeparatorComponent = useCallback(() => (
    <View className={viewMode === 'grid' ? 'w-3' : 'h-3'} />
  ), [viewMode]);

  const ListEmptyComponent = useCallback(() => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" className="text-primary" />
          <Text className="text-muted-foreground mt-4">Loading properties...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="flex-1 items-center justify-center py-20 px-4">
          <Text className="text-destructive text-center mb-4">
            Error loading properties
          </Text>
          <TouchableOpacity
            onPress={refetch}
            className="bg-primary px-4 py-2 rounded-lg"
          >
            <Text className="text-primary-foreground font-medium">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (searchQuery.trim()) {
      return (
        <View className="flex-1 items-center justify-center py-20">
          <Search size={48} className="text-muted-foreground mb-4" />
          <Text className="text-muted-foreground text-center">
            No properties found matching "{searchQuery}"
          </Text>
        </View>
      );
    }

    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-xl font-semibold text-foreground mb-2">
          No Properties Yet
        </Text>
        <Text className="text-muted-foreground text-center mb-6 px-8">
          Add your first property to get started tracking your real estate investments.
        </Text>
        <TouchableOpacity
          onPress={handleAddProperty}
          className="bg-primary px-6 py-3 rounded-lg flex-row items-center"
        >
          <Plus size={20} color="white" />
          <Text className="text-primary-foreground font-semibold ml-2">
            Add Property
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [isLoading, error, searchQuery, refetch, handleAddProperty]);

  const ListHeaderComponent = useCallback(() => (
    <View className="mb-4">
      {/* Search Bar */}
      <View className="flex-row items-center bg-muted rounded-xl px-4 py-2">
        <Search size={20} className="text-muted-foreground" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search properties..."
          placeholderTextColor="#9CA3AF"
          className="flex-1 ml-2 text-foreground text-base"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Filter and View Toggle */}
      <View className="flex-row justify-between items-center mt-4">
        <TouchableOpacity className="flex-row items-center bg-muted px-3 py-2 rounded-lg">
          <Filter size={16} className="text-muted-foreground" />
          <Text className="text-muted-foreground ml-2">Filters</Text>
        </TouchableOpacity>

        <View className="flex-row bg-muted rounded-lg">
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            className={`px-3 py-2 rounded-lg ${viewMode === 'list' ? 'bg-primary' : ''}`}
          >
            <List
              size={18}
              color={viewMode === 'list' ? 'white' : '#9CA3AF'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('grid')}
            className={`px-3 py-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary' : ''}`}
          >
            <Grid
              size={18}
              color={viewMode === 'grid' ? 'white' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Results Count */}
      <Text className="text-muted-foreground text-sm mt-4">
        {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'}
      </Text>
    </View>
  ), [searchQuery, viewMode, filteredProperties.length]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <FlatList
        data={filteredProperties}
        renderItem={renderPropertyItem}
        keyExtractor={keyExtractor}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when switching view modes
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100, // Extra padding for FAB
        }}
        columnWrapperStyle={viewMode === 'grid' ? { gap: 12 } : undefined}
        ItemSeparatorComponent={viewMode === 'list' ? ItemSeparatorComponent : undefined}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#6366f1"
          />
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={handleAddProperty}
        className="absolute bottom-6 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{
          shadowColor: '#6366f1',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Plus size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
