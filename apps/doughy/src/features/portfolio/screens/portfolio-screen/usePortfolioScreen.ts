// src/features/portfolio/screens/portfolio-screen/usePortfolioScreen.ts
// State management, filtering, grouping, and handlers for PortfolioScreen

import { useCallback, useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useDebounce } from '@/hooks';
import { haptic } from '@/lib/haptics';
import { usePortfolio } from '../../hooks/usePortfolio';
import { usePortfolioGroups } from '../../hooks/usePortfolioGroups';
import type { AddToPortfolioInput, PortfolioProperty, CreateGroupInput, PortfolioGroup } from '../../types';
import type { Property } from '@/features/real-estate/types';
import type { GroupedSection } from './portfolio-screen-types';

export function usePortfolioScreen() {
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

  const handleCloseAddSheet = useCallback(() => setShowAddSheet(false), []);
  const handleCloseGroupSheet = useCallback(() => {
    setShowGroupSheet(false);
    setEditingGroup(null);
  }, []);
  const handleOpenFilters = useCallback(() => setShowFiltersSheet(true), []);
  const handleCloseFilters = useCallback(() => setShowFiltersSheet(false), []);
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setShowFiltersSheet(false);
  }, []);

  const isLoadingAll = isLoading && properties.length === 0;

  return {
    // Data
    properties,
    summary,
    sections,
    filteredProperties,
    // Loading states
    isLoading,
    isLoadingAll,
    isAddingManual,
    isCreatingGroup,
    // UI state
    searchQuery,
    setSearchQuery,
    showAddSheet,
    showGroupSheet,
    showFiltersSheet,
    editingGroup,
    collapsedGroups,
    // Handlers
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
  };
}
