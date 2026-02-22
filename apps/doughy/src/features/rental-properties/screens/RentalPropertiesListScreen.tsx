// src/features/rental-properties/screens/RentalPropertiesListScreen.tsx
// Landlord hub screen - ADHD-friendly with "Needs Attention" at top
// Shows urgent items first, then property list with search and filters

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
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';

import { RentalProperty } from '../types';
import { useRentalPropertiesWithRooms } from '../hooks/useRentalProperties';
import { useLandlordAttention } from '../hooks/useLandlordAttention';
import { LandlordNeedsAttention } from '../components/LandlordNeedsAttention';
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
  const { items: attentionItems, isLoading: attentionLoading } = useLandlordAttention();

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

  // Header component with Error Banner + Needs Attention + Portfolio Stats
  const ListHeader = useCallback(() => (
    <View>
      {/* Error Banner */}
      {error && (
        <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
          <View
            style={{
              backgroundColor: withOpacity(colors.destructive, 'light'),
              borderRadius: BORDER_RADIUS.md,
              padding: SPACING.sm,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.destructive, flex: 1, fontSize: FONT_SIZES.sm }}>
              Failed to load properties. Pull down to retry.
            </Text>
          </View>
        </View>
      )}

      {/* Needs Attention Section */}
      <LandlordNeedsAttention
        items={attentionItems}
        isLoading={attentionLoading}
      />

      {/* Portfolio Summary */}
      {properties && properties.length > 0 && !searchQuery && (
        <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.md }}>
          <View
            style={{
              flexDirection: 'row',
              gap: SPACING.sm,
            }}
          >
            <StatPill label="Properties" value={properties.length} color={colors.primary} bgColor={colors.card} borderColor={colors.border} />
            <StatPill
              label="Active"
              value={properties.filter((p: RentalPropertyWithRooms) => p.status === 'active').length}
              color={colors.success}
              bgColor={colors.card}
              borderColor={colors.border}
            />
          </View>
        </View>
      )}

      {/* Section Header */}
      <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
        <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: '600', color: colors.foreground }}>
          {searchQuery ? 'Search Results' : 'Your Properties'}
        </Text>
      </View>
    </View>
  ), [error, attentionItems, attentionLoading, properties, searchQuery, colors]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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

          {/* Properties List with Needs Attention Header */}
          {isLoading && !properties?.length ? (
            <View style={{ paddingHorizontal: SPACING.md, paddingTop: 64 + SPACING.md }}>
              <SkeletonList count={5} component={DataCardSkeleton} />
            </View>
        ) : (
          <FlatList
            data={filteredProperties}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListHeaderComponent={ListHeader}
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: SPACING.md,
              paddingTop: 64 + SPACING.md,
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
        </View>

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

// Small stat pill for portfolio summary
function StatPill({ label, value, color, bgColor, borderColor }: {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: bgColor,
        borderRadius: 12,
        borderWidth: 1,
        borderColor,
        padding: SPACING.md,
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: FONT_SIZES['2xl'], fontWeight: '700', color }}>
        {value}
      </Text>
      <Text style={{ fontSize: FONT_SIZES.xs, color: withOpacity(color, 'opaque'), marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

export default RentalPropertiesListScreen;
