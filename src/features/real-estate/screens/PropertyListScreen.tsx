// src/features/real-estate/screens/PropertyListScreen.tsx
// Main screen for displaying the list of properties

import React, { useCallback, useState } from 'react';
import { View, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyFiltersSheet } from '../components/PropertyFiltersSheet';
import { PropertySortSheet } from '../components/PropertySortSheet';
import { PropertyListHeader } from '../components/PropertyListHeader';
import { PropertyListEmpty } from '../components/PropertyListEmpty';
import { Property } from '../types';
import { useProperties } from '../hooks/useProperties';
import { usePropertyFilters, PropertyFilters, SortOption } from '../hooks/usePropertyFilters';
import { usePropertyListSearch } from '../hooks/usePropertyListSearch';

export function PropertyListScreen() {
  const router = useRouter();
  const { properties, isLoading, error, refetch } = useProperties();
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

  const filteredProperties = usePropertyListSearch(properties, searchQuery, filters, sortBy);

  const handlePropertyPress = useCallback((property: Property) => {
    setSelectedPropertyId(property.id);
    router.push(`/(tabs)/properties/${property.id}`);
  }, [router]);

  const handleAddProperty = useCallback(() => {
    router.push('/(tabs)/properties/add');
  }, [router]);

  const handleClearAll = useCallback(() => {
    resetFilters();
    setSearchQuery('');
  }, [resetFilters]);

  const renderPropertyItem = useCallback(({ item }: { item: Property }) => (
    <PropertyCard
      property={item}
      isSelected={item.id === selectedPropertyId}
      onPress={handlePropertyPress}
      compact={viewMode === 'grid'}
    />
  ), [selectedPropertyId, handlePropertyPress, viewMode]);

  const keyExtractor = useCallback((item: Property) => item.id, []);

  const ItemSeparator = useCallback(() => (
    <View className={viewMode === 'grid' ? 'w-3' : 'h-3'} />
  ), [viewMode]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <FlatList
        data={filteredProperties}
        renderItem={renderPropertyItem}
        keyExtractor={keyExtractor}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        columnWrapperStyle={viewMode === 'grid' ? { gap: 12 } : undefined}
        ItemSeparatorComponent={viewMode === 'list' ? ItemSeparator : undefined}
        ListHeaderComponent={
          <PropertyListHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onClearSearch={() => setSearchQuery('')}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={activeFilterCount}
            filters={filters}
            sortBy={sortBy}
            onShowFilters={() => setShowFiltersSheet(true)}
            onShowSort={() => setShowSortSheet(true)}
            onResetFilters={resetFilters}
            totalCount={properties.length}
            filteredCount={filteredProperties.length}
          />
        }
        ListEmptyComponent={
          <PropertyListEmpty
            isLoading={isLoading}
            error={error}
            hasFilters={!!searchQuery.trim() || hasActiveFilters}
            onRetry={refetch}
            onAddProperty={handleAddProperty}
            onClearFilters={handleClearAll}
          />
        }
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#6366f1" />
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />

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

      <PropertyFiltersSheet
        visible={showFiltersSheet}
        onClose={() => setShowFiltersSheet(false)}
        filters={filters}
        onApply={(newFilters: PropertyFilters) => setFilters(newFilters)}
        onReset={resetFilters}
      />

      <PropertySortSheet
        visible={showSortSheet}
        onClose={() => setShowSortSheet(false)}
        sortBy={sortBy}
        onSortChange={(newSort: SortOption) => setSortBy(newSort)}
      />
    </SafeAreaView>
  );
}
