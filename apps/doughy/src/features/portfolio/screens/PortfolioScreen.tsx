// src/features/portfolio/screens/PortfolioScreen.tsx
// Main portfolio screen with property grouping support

import React, { useCallback } from 'react';
import { View, SectionList, RefreshControl } from 'react-native';
import { Briefcase, Search } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { SimpleFAB, SearchBar, TAB_BAR_SAFE_PADDING, ListEmptyState, BottomSheet, BottomSheetSection, Button } from '@/components/ui';
import { PropertyCardSkeleton, SkeletonList } from '@/components/ui/CardSkeletons';
import { SPACING } from '@/constants/design-tokens';
import { AddToPortfolioSheet, CreateGroupSheet } from '../components';
import { PropertyCard } from '@/features/real-estate/components/PropertyCard';
import { SectionHeader, PortfolioListHeader, usePortfolioScreen } from './portfolio-screen';
import type { GroupedSection } from './portfolio-screen';
import type { PortfolioProperty } from '../types';

export function PortfolioScreen() {
  const colors = useThemeColors();

  const {
    properties,
    summary,
    sections,
    filteredProperties,
    isLoading,
    isLoadingAll,
    isAddingManual,
    isCreatingGroup,
    searchQuery,
    setSearchQuery,
    showAddSheet,
    showGroupSheet,
    showFiltersSheet,
    editingGroup,
    collapsedGroups,
    refetch,
    toggleGroupCollapse,
    handlePropertyPress,
    handleAddProperty,
    handleCreateGroup,
    handleEditGroup,
    handleGroupSubmit,
    handleGroupDelete,
    handleSubmitProperty,
    handleCloseAddSheet,
    handleCloseGroupSheet,
    handleOpenFilters,
    handleCloseFilters,
    handleClearSearch,
  } = usePortfolioScreen();

  const renderSectionHeader = useCallback(({ section }: { section: GroupedSection }) => {
    const isCollapsed = collapsedGroups.has(section.id);
    const propertyCount = section.id === 'ungrouped'
      ? filteredProperties.filter((p) => !p.group_id).length
      : section.group?.propertyCount || 0;

    return (
      <SectionHeader
        section={section}
        isCollapsed={isCollapsed}
        propertyCount={propertyCount}
        onToggleCollapse={toggleGroupCollapse}
        onEditGroup={handleEditGroup}
      />
    );
  }, [collapsedGroups, filteredProperties, toggleGroupCollapse, handleEditGroup]);

  const renderPropertyItem = useCallback(({ item }: { item: PortfolioProperty }) => (
    <PropertyCard
      property={item}
      onPress={handlePropertyPress}
    />
  ), [handlePropertyPress]);

  const keyExtractor = useCallback((item: PortfolioProperty) => item.id, []);

  const renderListHeader = useCallback(() => (
    <PortfolioListHeader
      summary={summary}
      propertyCount={properties.length}
      onCreateGroup={handleCreateGroup}
    />
  ), [summary, properties.length, handleCreateGroup]);

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Search Bar - in normal document flow */}
      <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.xs }}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search portfolio..."
          size="md"
          glass={true}
          onFilter={handleOpenFilters}
          hasActiveFilters={searchQuery.trim().length > 0}
        />
      </View>

      {/* Portfolio List */}
      {isLoadingAll ? (
        <View style={{ paddingHorizontal: SPACING.md }}>
          <SkeletonList count={4} component={PropertyCardSkeleton} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderPropertyItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={keyExtractor}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={{
            paddingHorizontal: SPACING.md,
            paddingBottom: TAB_BAR_SAFE_PADDING,
          }}
          contentInsetAdjustmentBehavior="automatic"
          ItemSeparatorComponent={() => <View className="h-3" />}
          SectionSeparatorComponent={() => <View className="h-4" />}
          stickySectionHeadersEnabled={false}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <ListEmptyState
              state={searchQuery ? 'filtered' : 'empty'}
              icon={searchQuery ? Search : Briefcase}
              title={searchQuery ? 'No Results Found' : 'No Properties Yet'}
              description={
                searchQuery
                  ? 'No properties match your search criteria.'
                  : 'Add your first property to start tracking your portfolio.'
              }
              primaryAction={{
                label: searchQuery ? 'Clear Search' : 'Add Property',
                onPress: searchQuery
                  ? () => setSearchQuery('')
                  : handleAddProperty,
              }}
            />
          }
        />
      )}

      {/* Add Property FAB */}
      <SimpleFAB
        onPress={handleAddProperty}
        accessibilityLabel="Add property to portfolio"
      />

      {/* Add Property Sheet */}
      <AddToPortfolioSheet
        visible={showAddSheet}
        onClose={handleCloseAddSheet}
        onSubmit={handleSubmitProperty}
        isLoading={isAddingManual}
      />

      {/* Create/Edit Group Sheet */}
      <CreateGroupSheet
        visible={showGroupSheet}
        onClose={handleCloseGroupSheet}
        existingGroup={editingGroup}
        onSubmit={handleGroupSubmit}
        onDelete={editingGroup ? handleGroupDelete : undefined}
        isLoading={isCreatingGroup}
      />

      {/* Filters Sheet */}
      <BottomSheet
        visible={showFiltersSheet}
        onClose={handleCloseFilters}
        title="Portfolio Filters"
      >
        <BottomSheetSection title="Search">
          <View className="flex-row gap-3 pt-4 pb-6">
            <Button
              variant="outline"
              onPress={handleClearSearch}
              className="flex-1"
            >
              Clear Search
            </Button>
            <Button
              onPress={handleCloseFilters}
              className="flex-1"
            >
              Done
            </Button>
          </View>
        </BottomSheetSection>
      </BottomSheet>
    </ThemedSafeAreaView>
  );
}

export default PortfolioScreen;
