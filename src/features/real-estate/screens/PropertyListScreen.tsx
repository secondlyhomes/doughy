// src/features/real-estate/screens/PropertyListScreen.tsx
// Main screen for displaying the list of properties

import React, { useCallback, useState } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import { SearchBar, SimpleFAB, TAB_BAR_SAFE_PADDING, PropertyImageCard } from '@/components/ui';
import { PropertyCardSkeleton, SkeletonList } from '@/components/ui/CardSkeletons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, GLASS_INTENSITY } from '@/constants/design-tokens';
import { PropertyFiltersSheet } from '../components/PropertyFiltersSheet';
import { PropertyListEmpty } from '../components/PropertyListEmpty';
import { Property } from '../types';
import { useProperties } from '../hooks/useProperties';
import { usePropertyFilters, PropertyFilters, SortOption } from '../hooks/usePropertyFilters';
import { usePropertyListSearch } from '../hooks/usePropertyListSearch';
import { getInvestorPropertyMetrics, getPropertyImageUrl, getPropertyLocation } from '@/lib/property-card-utils';
import { formatPropertyType } from '../utils/formatters';

export function PropertyListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
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
    <PropertyImageCard
      imageUrl={getPropertyImageUrl(item)}
      title={item.address || 'Address not specified'}
      subtitle={getPropertyLocation(item)}
      metrics={getInvestorPropertyMetrics(item)}
      badgeOverlay={item.propertyType ? {
        label: formatPropertyType(item.propertyType),
        variant: 'secondary',
      } : undefined}
      isSelected={item.id === selectedPropertyId}
      onPress={() => handlePropertyPress(item)}
      variant="glass"
      glassIntensity={GLASS_INTENSITY.strong}
    />
  ), [selectedPropertyId, handlePropertyPress]);

  const keyExtractor = useCallback((item: Property) => item.id, []);

  const ItemSeparator = useCallback(() => (
    <View className={viewMode === 'grid' ? 'w-3' : 'h-3'} />
  ), [viewMode]);

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <View style={{ flex: 1 }}>
        {/* Search Bar — floats above content with glass blur */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: SPACING.md, paddingTop: SPACING.sm }}>
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

        {isLoading && !properties?.length ? (
          <View style={{ paddingHorizontal: SPACING.md, paddingTop: 64 + SPACING.md }}>
            <SkeletonList count={5} component={PropertyCardSkeleton} />
          </View>
        ) : (
          <FlatList
          data={filteredProperties}
          renderItem={renderPropertyItem}
          keyExtractor={keyExtractor}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode}
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: SPACING.md,
            paddingTop: 64 + SPACING.md,
            paddingBottom: TAB_BAR_SAFE_PADDING,
          }}
        contentInsetAdjustmentBehavior="automatic"
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
        )}
      </View>

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
