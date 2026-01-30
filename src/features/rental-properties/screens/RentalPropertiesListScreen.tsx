// src/features/rental-properties/screens/RentalPropertiesListScreen.tsx
// List screen for rental properties with search, filters, and FAB

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import {
  SearchBar,
  ListEmptyState,
  TAB_BAR_SAFE_PADDING,
  SimpleFAB,
} from '@/components/ui';
import { DataCardSkeleton, SkeletonList } from '@/components/ui/CardSkeletons';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Home, Search } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/design-tokens';

import { RentalProperty } from '../types';
import { useRentalPropertiesWithRooms } from '../hooks/useRentalProperties';
import {
  PropertyFiltersSheet,
  PropertyListItem,
  usePropertyListFilters,
  RentalPropertyWithRooms,
} from './rental-properties-list';

// Re-export types for backward compatibility
export type { RentalPropertyFilters } from './rental-properties-list';

export function RentalPropertiesListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);

  const { properties, isLoading, refetch, error } = useRentalPropertiesWithRooms();

  const {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    advancedFilters,
    setAdvancedFilters,
    filteredProperties,
    hasActiveFilters,
    clearAllFilters,
  } = usePropertyListFilters({
    properties: properties as RentalPropertyWithRooms[],
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handlePropertyPress = useCallback(
    (property: RentalProperty) => {
      router.push(`/(tabs)/rental-properties/${property.id}`);
    },
    [router]
  );

  const handleAddProperty = useCallback(() => {
    router.push('/(tabs)/rental-properties/add');
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: RentalPropertyWithRooms }) => (
      <PropertyListItem
        property={item}
        onPress={() => handlePropertyPress(item)}
      />
    ),
    [handlePropertyPress]
  );

  const keyExtractor = useCallback(
    (item: RentalPropertyWithRooms) => item.id,
    []
  );

  const ItemSeparator = useCallback(
    () => <View style={{ height: SPACING.md }} />,
    []
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        {/* Search Bar */}
        <View
          style={{
            paddingHorizontal: SPACING.md,
            paddingTop: SPACING.sm,
            paddingBottom: SPACING.sm,
          }}
        >
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

        {/* Error Banner */}
        {error && (
          <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
            <View
              style={{
                backgroundColor: colors.destructive + '20',
                borderRadius: 8,
                padding: SPACING.sm,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.destructive, flex: 1, fontSize: 14 }}>
                Failed to load properties. Pull down to retry.
              </Text>
            </View>
          </View>
        )}

        {/* Properties List */}
        {isLoading && !properties?.length ? (
          <View style={{ paddingHorizontal: SPACING.md }}>
            <SkeletonList count={5} component={DataCardSkeleton} />
          </View>
        ) : (
          <FlatList
            data={filteredProperties}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={{
              paddingHorizontal: SPACING.md,
              paddingBottom: TAB_BAR_SAFE_PADDING,
            }}
            contentInsetAdjustmentBehavior="automatic"
            ItemSeparatorComponent={ItemSeparator}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
                tintColor={colors.info}
              />
            }
            ListEmptyComponent={
              <ListEmptyState
                state={searchQuery ? 'filtered' : 'empty'}
                icon={searchQuery ? Search : Home}
                title={searchQuery ? 'No Results Found' : 'No Properties Yet'}
                description={
                  searchQuery
                    ? 'No properties match your search criteria.'
                    : 'Add your first rental property to start managing your portfolio.'
                }
                primaryAction={{
                  label: searchQuery ? 'Clear Search' : 'Add First Property',
                  onPress: searchQuery ? () => setSearchQuery('') : handleAddProperty,
                }}
              />
            }
          />
        )}

        {/* Floating Action Button */}
        <SimpleFAB onPress={handleAddProperty} accessibilityLabel="Add new property" />

        {/* Filters Sheet */}
        <PropertyFiltersSheet
          visible={showFiltersSheet}
          onClose={() => setShowFiltersSheet(false)}
          activeFilter={activeFilter}
          onActiveFilterChange={setActiveFilter}
          advancedFilters={advancedFilters}
          onAdvancedFiltersChange={setAdvancedFilters}
          onClearAll={clearAllFilters}
        />
      </ThemedSafeAreaView>
    </GestureHandlerRootView>
  );
}

export default RentalPropertiesListScreen;
