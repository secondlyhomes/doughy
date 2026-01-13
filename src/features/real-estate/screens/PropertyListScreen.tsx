/**
 * PropertyListScreen
 *
 * Main screen for displaying the list of properties with search, filter, and sort capabilities.
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
import { useRouter } from 'expo-router';
import { Search, Plus, Filter, Grid, List, ArrowUpDown, X } from 'lucide-react-native';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyFiltersSheet } from '../components/PropertyFiltersSheet';
import { PropertySortSheet } from '../components/PropertySortSheet';
import { Property } from '../types';
import { useProperties } from '../hooks/useProperties';
import { usePropertyFilters, PropertyFilters, SortOption, SORT_OPTIONS } from '../hooks/usePropertyFilters';

export function PropertyListScreen() {
  const router = useRouter();
  const { properties, isLoading, error, refetch } = useProperties();

  // Filter and sort state
  const {
    filters,
    sortBy,
    activeFilterCount,
    setFilters,
    setSortBy,
    resetFilters,
    hasActiveFilters,
  } = usePropertyFilters();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);

  // Apply all filters (search + advanced filters + sort)
  const filteredAndSortedProperties = useMemo(() => {
    let result = [...properties];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(property =>
        property.address?.toLowerCase().includes(query) ||
        property.city?.toLowerCase().includes(query) ||
        property.state?.toLowerCase().includes(query) ||
        property.zip?.includes(query)
      );
    }

    // Apply status filter
    if (filters.status.length > 0) {
      result = result.filter(property =>
        property.status && filters.status.includes(property.status as any)
      );
    }

    // Apply property type filter
    if (filters.propertyType.length > 0) {
      result = result.filter(property =>
        property.propertyType && filters.propertyType.includes(property.propertyType as any)
      );
    }

    // Apply price range filter
    if (filters.priceMin !== null) {
      result = result.filter(property =>
        property.purchase_price && property.purchase_price >= filters.priceMin!
      );
    }
    if (filters.priceMax !== null) {
      result = result.filter(property =>
        property.purchase_price && property.purchase_price <= filters.priceMax!
      );
    }

    // Apply ARV range filter
    if (filters.arvMin !== null) {
      result = result.filter(property =>
        property.arv && property.arv >= filters.arvMin!
      );
    }
    if (filters.arvMax !== null) {
      result = result.filter(property =>
        property.arv && property.arv <= filters.arvMax!
      );
    }

    // Apply bedrooms filter
    if (filters.bedroomsMin !== null) {
      result = result.filter(property =>
        property.bedrooms && property.bedrooms >= filters.bedroomsMin!
      );
    }
    if (filters.bedroomsMax !== null) {
      result = result.filter(property =>
        property.bedrooms && property.bedrooms <= filters.bedroomsMax!
      );
    }

    // Apply bathrooms filter
    if (filters.bathroomsMin !== null) {
      result = result.filter(property =>
        property.bathrooms && property.bathrooms >= filters.bathroomsMin!
      );
    }
    if (filters.bathroomsMax !== null) {
      result = result.filter(property =>
        property.bathrooms && property.bathrooms <= filters.bathroomsMax!
      );
    }

    // Apply location filters
    if (filters.city.trim()) {
      const cityQuery = filters.city.toLowerCase();
      result = result.filter(property =>
        property.city?.toLowerCase().includes(cityQuery)
      );
    }
    if (filters.state.trim()) {
      const stateQuery = filters.state.toLowerCase();
      result = result.filter(property =>
        property.state?.toLowerCase() === stateQuery
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'created_desc':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'created_asc':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'price_desc':
          return (b.purchase_price || 0) - (a.purchase_price || 0);
        case 'price_asc':
          return (a.purchase_price || 0) - (b.purchase_price || 0);
        case 'arv_desc':
          return (b.arv || 0) - (a.arv || 0);
        case 'arv_asc':
          return (a.arv || 0) - (b.arv || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [properties, searchQuery, filters, sortBy]);

  const handlePropertyPress = useCallback((property: Property) => {
    setSelectedPropertyId(property.id);
    router.push(`/(tabs)/properties/${property.id}`);
  }, [router]);

  const handleAddProperty = useCallback(() => {
    router.push('/(tabs)/properties/add');
  }, [router]);

  const handleApplyFilters = useCallback((newFilters: PropertyFilters) => {
    setFilters(newFilters);
  }, [setFilters]);

  const handleSortChange = useCallback((newSortBy: SortOption) => {
    setSortBy(newSortBy);
  }, [setSortBy]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const getCurrentSortLabel = () => {
    const option = SORT_OPTIONS.find(o => o.value === sortBy);
    return option?.label || 'Newest First';
  };

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

    if (searchQuery.trim() || hasActiveFilters) {
      return (
        <View className="flex-1 items-center justify-center py-20">
          <Search size={48} className="text-muted-foreground mb-4" />
          <Text className="text-lg font-semibold text-foreground mb-2">
            No Results Found
          </Text>
          <Text className="text-muted-foreground text-center mb-6 px-8">
            Try adjusting your search or filters to find what you're looking for.
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity
              onPress={() => {
                resetFilters();
                setSearchQuery('');
              }}
              className="bg-muted px-4 py-2 rounded-lg"
            >
              <Text className="text-foreground font-medium">Clear All Filters</Text>
            </TouchableOpacity>
          )}
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
  }, [isLoading, error, searchQuery, hasActiveFilters, refetch, handleAddProperty, resetFilters]);

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
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} className="p-1">
            <X size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter, Sort, and View Toggle */}
      <View className="flex-row justify-between items-center mt-4">
        <View className="flex-row gap-2">
          {/* Filter Button */}
          <TouchableOpacity
            onPress={() => setShowFiltersSheet(true)}
            className={`flex-row items-center px-3 py-2 rounded-lg ${
              hasActiveFilters ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <Filter size={16} color={hasActiveFilters ? 'white' : '#9CA3AF'} />
            <Text className={`ml-2 font-medium ${
              hasActiveFilters ? 'text-primary-foreground' : 'text-muted-foreground'
            }`}>
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Text>
          </TouchableOpacity>

          {/* Sort Button */}
          <TouchableOpacity
            onPress={() => setShowSortSheet(true)}
            className="flex-row items-center bg-muted px-3 py-2 rounded-lg"
          >
            <ArrowUpDown size={16} className="text-muted-foreground" />
            <Text className="text-muted-foreground ml-2 font-medium">
              {getCurrentSortLabel()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* View Toggle */}
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

      {/* Active Filters Pills */}
      {hasActiveFilters && (
        <View className="flex-row flex-wrap gap-2 mt-3">
          {filters.status.length > 0 && (
            <View className="flex-row items-center bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-primary text-sm font-medium">
                Status: {filters.status.length}
              </Text>
            </View>
          )}
          {filters.propertyType.length > 0 && (
            <View className="flex-row items-center bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-primary text-sm font-medium">
                Type: {filters.propertyType.length}
              </Text>
            </View>
          )}
          {(filters.priceMin !== null || filters.priceMax !== null) && (
            <View className="flex-row items-center bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-primary text-sm font-medium">Price Range</Text>
            </View>
          )}
          {(filters.arvMin !== null || filters.arvMax !== null) && (
            <View className="flex-row items-center bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-primary text-sm font-medium">ARV Range</Text>
            </View>
          )}
          {(filters.city || filters.state) && (
            <View className="flex-row items-center bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-primary text-sm font-medium">Location</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={resetFilters}
            className="flex-row items-center px-3 py-1"
          >
            <X size={14} color="#6366f1" />
            <Text className="text-primary text-sm font-medium ml-1">Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results Count */}
      <Text className="text-muted-foreground text-sm mt-4">
        {filteredAndSortedProperties.length} {filteredAndSortedProperties.length === 1 ? 'property' : 'properties'}
        {(searchQuery || hasActiveFilters) && properties.length !== filteredAndSortedProperties.length
          ? ` of ${properties.length}`
          : ''}
      </Text>
    </View>
  ), [
    searchQuery,
    viewMode,
    filteredAndSortedProperties.length,
    properties.length,
    hasActiveFilters,
    activeFilterCount,
    filters,
    resetFilters,
    clearSearch,
  ]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <FlatList
        data={filteredAndSortedProperties}
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

      {/* Filter Sheet */}
      <PropertyFiltersSheet
        visible={showFiltersSheet}
        onClose={() => setShowFiltersSheet(false)}
        filters={filters}
        onApply={handleApplyFilters}
        onReset={resetFilters}
      />

      {/* Sort Sheet */}
      <PropertySortSheet
        visible={showSortSheet}
        onClose={() => setShowSortSheet(false)}
        sortBy={sortBy}
        onSortChange={handleSortChange}
      />
    </SafeAreaView>
  );
}
