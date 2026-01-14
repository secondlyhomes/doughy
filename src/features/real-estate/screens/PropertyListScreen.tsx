// src/features/real-estate/screens/PropertyListScreen.tsx
// Main screen for displaying the list of properties

import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import { SearchBar, SimpleFAB, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING } from '@/constants/design-tokens';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyFiltersSheet } from '../components/PropertyFiltersSheet';
import { PropertyListEmpty } from '../components/PropertyListEmpty';
import { Property } from '../types';
import { useProperties } from '../hooks/useProperties';
import { usePropertyFilters, PropertyFilters, SortOption } from '../hooks/usePropertyFilters';
import { usePropertyListSearch } from '../hooks/usePropertyListSearch';

// ============================================
// Spacing Constants
// ============================================

// Calculate search bar container height based on its padding
const SEARCH_BAR_CONTAINER_HEIGHT =
  SPACING.sm +  // pt-2 (8px top padding)
  40 +          // SearchBar size="md" estimated height
  SPACING.xs;   // pb-1 (4px bottom padding)
  // Total: ~52px

const SEARCH_BAR_TO_CONTENT_GAP = SPACING.md; // 12px standard gap

export function PropertyListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
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
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Glass Search Bar - positioned absolutely at top */}
      <View className="absolute top-0 left-0 right-0 z-10" style={{ paddingTop: insets.top }}>
        <View className="px-4 pt-2 pb-1">
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search properties..."
            size="md"
            glass={true}
            onFilter={() => setShowFiltersSheet(true)}
            hasActiveFilters={hasActiveFilters}
          />
        </View>
      </View>

      <FlatList
        data={filteredProperties}
        renderItem={renderPropertyItem}
        keyExtractor={keyExtractor}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        contentContainerStyle={{
          paddingTop: insets.top + SEARCH_BAR_CONTAINER_HEIGHT + SEARCH_BAR_TO_CONTENT_GAP,
          paddingHorizontal: 16,
          paddingBottom: TAB_BAR_SAFE_PADDING
        }}
        columnWrapperStyle={viewMode === 'grid' ? { gap: 12 } : undefined}
        ItemSeparatorComponent={viewMode === 'list' ? ItemSeparator : undefined}
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
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />

      <SimpleFAB onPress={handleAddProperty} accessibilityLabel="Add property" />

      <PropertyFiltersSheet
        visible={showFiltersSheet}
        onClose={() => setShowFiltersSheet(false)}
        filters={filters}
        onApply={(newFilters: PropertyFilters) => setFilters(newFilters)}
        onReset={resetFilters}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </ThemedSafeAreaView>
  );
}
