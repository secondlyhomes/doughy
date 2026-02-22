// Leads List Screen - React Native
// Hierarchical view: Sellers (leads) with their properties
// Part of UI/UX restructure: Unified Leads tab

import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
} from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import { SearchBar, ListEmptyState, TAB_BAR_SAFE_PADDING, SimpleFAB } from '@/components/ui';
import { LeadCardSkeleton, SkeletonList } from '@/components/ui/CardSkeletons';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Users, Search } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/design-tokens';

import { LeadWithProperties } from '../types';
import { ExpandableLeadCard } from '../components/ExpandableLeadCard';

// Extracted components, hooks, and constants
import {
  type LeadFilters,
  defaultFilters,
  UnknownSellerCard,
  LeadFiltersSheet,
  AddLeadSheet,
  useLeadsListData,
  useLeadsListNavigation,
} from './leads-list';

export function LeadsListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<LeadFilters>(defaultFilters);
  const [propertyViewMode, setPropertyViewMode] = useState<'list' | 'card'>('card');
  const [showAddLeadSheet, setShowAddLeadSheet] = useState(false);

  const { filteredData, isLoading, orphansLoading, leads, hasActiveFilters, handleRefresh } =
    useLeadsListData({ searchQuery, activeFilter, advancedFilters });

  const { handleLeadPress, handlePropertyPress, handleStartDeal } = useLeadsListNavigation();

  const handleClearAllFilters = useCallback(() => {
    setActiveFilter('all');
    setAdvancedFilters(defaultFilters);
    setSearchQuery('');
  }, []);

  const renderItem = useCallback(({ item }: { item: LeadWithProperties }) => (
    <ExpandableLeadCard
      lead={item}
      onLeadPress={() => handleLeadPress(item)}
      onPropertyPress={handlePropertyPress}
      onStartDeal={handleStartDeal}
      propertyViewMode={propertyViewMode}
    />
  ), [handleLeadPress, handlePropertyPress, handleStartDeal, propertyViewMode]);

  const keyExtractor = useCallback((item: LeadWithProperties) => item.id, []);
  const ItemSeparator = useCallback(() => <View style={{ height: SPACING.md }} />, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <View style={{ flex: 1 }}>
          {/* Search Bar — floats above content with glass blur */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: SPACING.md, paddingTop: SPACING.sm }}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search sellers or properties..."
              size="md"
              glass={true}
              onFilter={() => setShowFiltersSheet(true)}
              hasActiveFilters={hasActiveFilters}
              onViewToggle={() => setPropertyViewMode(prev => prev === 'card' ? 'list' : 'card')}
              viewMode={propertyViewMode}
            />
          </View>

          {/* Leads List */}
          {(isLoading || orphansLoading) && !leads?.length ? (
            <View style={{ paddingHorizontal: SPACING.md, paddingTop: 64 + SPACING.md }}>
              <SkeletonList count={5} component={LeadCardSkeleton} />
            </View>
          ) : (
            <FlatList
              data={filteredData.leads}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1, paddingHorizontal: SPACING.md, paddingTop: 64 + SPACING.md, paddingBottom: TAB_BAR_SAFE_PADDING }}
            contentInsetAdjustmentBehavior="automatic"
            ItemSeparatorComponent={ItemSeparator}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={isLoading || orphansLoading} onRefresh={handleRefresh} tintColor={colors.info} />
            }
            ListHeaderComponent={
              filteredData.orphanProperties.length > 0 ? (
                <View style={{ marginBottom: SPACING.md }}>
                  <UnknownSellerCard
                    properties={filteredData.orphanProperties}
                    onPropertyPress={handlePropertyPress}
                    onStartDeal={(propertyId) => handleStartDeal(undefined, propertyId)}
                  />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <ListEmptyState
                state={searchQuery ? 'filtered' : 'empty'}
                icon={searchQuery ? Search : Users}
                title={searchQuery ? 'No Results Found' : 'No Leads Yet'}
                description={searchQuery ? 'No sellers or properties match your search.' : 'Add your first lead to start building your pipeline.'}
                primaryAction={{
                  label: searchQuery ? 'Clear Search' : 'Add First Lead',
                  onPress: searchQuery ? () => setSearchQuery('') : () => router.push('/(tabs)/leads/add'),
                }}
              />
            }
          />
        )}
        </View>

        {/* FAB */}
        <SimpleFAB onPress={() => setShowAddLeadSheet(true)} accessibilityLabel="Add new lead" />

        {/* Filters Sheet */}
        <LeadFiltersSheet
          visible={showFiltersSheet}
          onClose={() => setShowFiltersSheet(false)}
          activeFilter={activeFilter}
          onActiveFilterChange={setActiveFilter}
          advancedFilters={advancedFilters}
          onAdvancedFiltersChange={setAdvancedFilters}
          onClearAll={handleClearAllFilters}
        />

        {/* Add Lead Sheet */}
        <AddLeadSheet
          visible={showAddLeadSheet}
          onClose={() => setShowAddLeadSheet(false)}
        />
      </ThemedSafeAreaView>
    </GestureHandlerRootView>
  );
}

export default LeadsListScreen;
