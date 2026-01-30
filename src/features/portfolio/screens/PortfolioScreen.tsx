// src/features/portfolio/screens/PortfolioScreen.tsx
// Main portfolio screen with property grouping support

import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, SectionList, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Briefcase, Search, FolderPlus, ChevronDown, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { SimpleFAB, SearchBar, TAB_BAR_SAFE_PADDING, ListEmptyState, BottomSheet, BottomSheetSection, Button } from '@/components/ui';
import { PropertyCardSkeleton, SkeletonList } from '@/components/ui/CardSkeletons';
import { SPACING } from '@/constants/design-tokens';
import { useDebounce } from '@/hooks';
import { haptic } from '@/lib/haptics';
import { usePortfolio } from '../hooks/usePortfolio';
import { usePortfolioGroups } from '../hooks/usePortfolioGroups';
import { AddToPortfolioSheet, CreateGroupSheet, PortfolioSummaryCard } from '../components';
import { PropertyCard } from '@/features/real-estate/components/PropertyCard';
import type { AddToPortfolioInput, PortfolioProperty, CreateGroupInput, PortfolioGroupWithStats, PortfolioGroup } from '../types';
import type { Property } from '@/features/real-estate/types';

interface GroupedSection {
  id: string;
  title: string;
  group: PortfolioGroupWithStats | null;
  data: PortfolioProperty[];
}

interface SectionHeaderProps {
  section: GroupedSection;
  isCollapsed: boolean;
  propertyCount: number;
  onToggleCollapse: (id: string) => void;
  onEditGroup: (group: PortfolioGroup) => void;
}

const SectionHeader = React.memo(function SectionHeader({
  section,
  isCollapsed,
  propertyCount,
  onToggleCollapse,
  onEditGroup,
}: SectionHeaderProps) {
  const colors = useThemeColors();

  // Don't show header for ungrouped when no groups exist
  if (section.id === 'all' || !section.title) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <TouchableOpacity
      onPress={() => onToggleCollapse(section.id)}
      className="flex-row items-center justify-between px-4 py-3 mb-2 rounded-lg"
      style={{ backgroundColor: colors.muted }}
    >
      <View className="flex-row items-center gap-3">
        {/* Group color indicator */}
        {section.group?.color && (
          <View
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: section.group.color }}
          />
        )}
        <View>
          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '600' }}>
            {section.title}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
            {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}
            {section.group && section.group.monthlyCashFlow !== 0 && (
              <Text style={{ color: section.group.monthlyCashFlow >= 0 ? colors.success : colors.destructive }}>
                {' '}• {section.group.monthlyCashFlow >= 0 ? '+' : ''}{formatCurrency(section.group.monthlyCashFlow)}/mo
              </Text>
            )}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        {section.group && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onEditGroup(section.group!);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ color: colors.primary, fontSize: 13 }}>Edit</Text>
          </TouchableOpacity>
        )}
        {isCollapsed ? (
          <ChevronRight size={18} color={colors.mutedForeground} />
        ) : (
          <ChevronDown size={18} color={colors.mutedForeground} />
        )}
      </View>
    </TouchableOpacity>
  );
});

export function PortfolioScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  // Portfolio data
  const {
    properties,
    summary,
    isLoading,
    error,
    refetch,
    addManualEntry,
    isAddingManual,
  } = usePortfolio();

  // Groups data
  const {
    groups,
    isLoading: isLoadingGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    isCreating: isCreatingGroup,
  } = usePortfolioGroups();

  // UI State
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showGroupSheet, setShowGroupSheet] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PortfolioGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Filter properties based on debounced search query
  const filteredProperties = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return properties;
    const query = debouncedSearchQuery.toLowerCase();
    return properties.filter((property) => {
      const address = property.address?.toLowerCase() || '';
      const city = property.city?.toLowerCase() || '';
      const state = property.state?.toLowerCase() || '';
      return address.includes(query) || city.includes(query) || state.includes(query);
    });
  }, [properties, debouncedSearchQuery]);

  // Group properties into sections
  const sections = useMemo((): GroupedSection[] => {
    const result: GroupedSection[] = [];

    // Create sections for each group
    for (const group of groups) {
      const groupProperties = filteredProperties.filter((p) => p.group_id === group.id);
      if (groupProperties.length > 0 || !searchQuery) {
        result.push({
          id: group.id,
          title: group.name,
          group,
          data: collapsedGroups.has(group.id) ? [] : groupProperties,
        });
      }
    }

    // Add ungrouped properties section
    const ungroupedProperties = filteredProperties.filter((p) => !p.group_id);
    if (ungroupedProperties.length > 0 || (!searchQuery && groups.length > 0)) {
      result.push({
        id: 'ungrouped',
        title: 'Ungrouped',
        group: null,
        data: collapsedGroups.has('ungrouped') ? [] : ungroupedProperties,
      });
    }

    // If no groups, just show all properties without sections
    if (groups.length === 0 && ungroupedProperties.length > 0) {
      return [{
        id: 'all',
        title: '',
        group: null,
        data: filteredProperties,
      }];
    }

    return result;
  }, [filteredProperties, groups, collapsedGroups, searchQuery]);

  const toggleGroupCollapse = useCallback((groupId: string) => {
    haptic.selection();
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const handlePropertyPress = useCallback((property: Property) => {
    router.push(`/(tabs)/portfolio/${property.id}` as any);
  }, [router]);

  const handleAddProperty = useCallback(() => {
    haptic.light();
    setShowAddSheet(true);
  }, []);

  const handleCreateGroup = useCallback(() => {
    haptic.light();
    setEditingGroup(null);
    setShowGroupSheet(true);
  }, []);

  const handleEditGroup = useCallback((group: PortfolioGroup) => {
    setEditingGroup(group);
    setShowGroupSheet(true);
  }, []);

  const handleGroupSubmit = useCallback(async (data: CreateGroupInput) => {
    try {
      if (editingGroup) {
        await updateGroup({ id: editingGroup.id, ...data });
      } else {
        await createGroup(data);
      }
      setShowGroupSheet(false);
      setEditingGroup(null);
    } catch (error) {
      console.error('[PortfolioScreen] Failed to save group:', error);
      Alert.alert(
        'Failed to Save Group',
        error instanceof Error ? error.message : 'Unable to save the group. Please try again.'
      );
    }
  }, [editingGroup, createGroup, updateGroup]);

  const handleGroupDelete = useCallback(async () => {
    if (editingGroup) {
      try {
        await deleteGroup(editingGroup.id);
        setShowGroupSheet(false);
        setEditingGroup(null);
      } catch (error) {
        console.error('[PortfolioScreen] Failed to delete group:', error);
        Alert.alert(
          'Failed to Delete Group',
          error instanceof Error ? error.message : 'Unable to delete the group. Please try again.'
        );
      }
    }
  }, [editingGroup, deleteGroup]);

  const handleSubmitProperty = useCallback(async (data: AddToPortfolioInput) => {
    await addManualEntry(data);
  }, [addManualEntry]);

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
    <View className="mb-4">
      {/* Summary Card */}
      {summary && properties.length > 0 && (
        <PortfolioSummaryCard summary={summary} />
      )}

      {/* Create Group Button (if properties exist) */}
      {properties.length > 0 && (
        <TouchableOpacity
          onPress={handleCreateGroup}
          className="flex-row items-center justify-center gap-2 py-3 mt-3 rounded-lg border border-dashed"
          style={{ borderColor: colors.border }}
        >
          <FolderPlus size={18} color={colors.primary} />
          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '500' }}>
            Create Group
          </Text>
        </TouchableOpacity>
      )}
    </View>
  ), [summary, properties.length, handleCreateGroup, colors]);

  const isLoadingAll = isLoading && properties.length === 0;

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
          onFilter={() => setShowFiltersSheet(true)}
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
        onClose={() => setShowAddSheet(false)}
        onSubmit={handleSubmitProperty}
        isLoading={isAddingManual}
      />

      {/* Create/Edit Group Sheet */}
      <CreateGroupSheet
        visible={showGroupSheet}
        onClose={() => {
          setShowGroupSheet(false);
          setEditingGroup(null);
        }}
        existingGroup={editingGroup}
        onSubmit={handleGroupSubmit}
        onDelete={editingGroup ? handleGroupDelete : undefined}
        isLoading={isCreatingGroup}
      />

      {/* Filters Sheet */}
      <BottomSheet
        visible={showFiltersSheet}
        onClose={() => setShowFiltersSheet(false)}
        title="Portfolio Filters"
      >
        <BottomSheetSection title="Search">
          <View className="flex-row gap-3 pt-4 pb-6">
            <Button
              variant="outline"
              onPress={() => {
                setSearchQuery('');
                setShowFiltersSheet(false);
              }}
              className="flex-1"
            >
              Clear Search
            </Button>
            <Button
              onPress={() => setShowFiltersSheet(false)}
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
