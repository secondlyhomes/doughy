// src/features/property-inventory/screens/InventoryListScreen.tsx
// List screen for property inventory with category grouping

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Package, Plus, ChevronDown, ChevronUp, Search } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import {
  LoadingSpinner,
  SearchBar,
  SimpleFAB,
  TAB_BAR_SAFE_PADDING,
  Badge,
  ListEmptyState,
  FilterableTabs,
} from '@/components/ui';
import { SPACING, FONT_SIZES, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { useNativeHeader } from '@/hooks';
import {
  usePropertyInventory,
  useInventoryGroupedByCategory,
} from '../hooks/usePropertyInventory';
import { InventoryItemCard } from '../components/InventoryItemCard';
import { AddInventorySheet } from '../components/AddInventorySheet';
import {
  InventoryItem,
  InventoryCategory,
  InventoryType,
  INVENTORY_CATEGORY_LABELS,
  INVENTORY_TYPE_CONFIG,
} from '../types';

export function InventoryListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const propertyId = params.id as string;

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [activeTab, setActiveTab] = useState<InventoryType | 'all'>('all');
  const [collapsedSections, setCollapsedSections] = useState<Set<InventoryCategory>>(
    new Set()
  );

  const {
    data: items = [],
    isLoading,
    isRefetching,
    refetch,
    error,
  } = usePropertyInventory(propertyId);

  // Native header configuration
  const { headerOptions } = useNativeHeader({
    title: 'Inventory',
    fallbackRoute: `/(tabs)/rental-properties/${propertyId}`,
  });

  // Count items by type
  const assetCount = useMemo(
    () => items.filter((item) => item.inventory_type === 'asset' || !item.inventory_type).length,
    [items]
  );
  const supplyCount = useMemo(
    () => items.filter((item) => item.inventory_type === 'supply').length,
    [items]
  );

  // Filter items by search query and inventory type
  const filteredItems = useMemo(() => {
    let result = items;

    // Filter by inventory type
    if (activeTab !== 'all') {
      result = result.filter((item) => {
        // Default to 'asset' if inventory_type is not set
        const itemType = item.inventory_type || 'asset';
        return itemType === activeTab;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.brand?.toLowerCase().includes(query) ||
          item.model?.toLowerCase().includes(query) ||
          item.location?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [items, searchQuery, activeTab]);

  // Group items by category
  const sections = useMemo(() => {
    const grouped: Record<InventoryCategory, InventoryItem[]> = {
      appliance: [],
      hvac: [],
      structure: [],
      plumbing: [],
      furniture: [],
      electronics: [],
      other: [],
    };

    filteredItems.forEach((item) => {
      grouped[item.category].push(item);
    });

    // Convert to SectionList format, excluding empty categories
    return Object.entries(grouped)
      .filter(([_, categoryItems]) => categoryItems.length > 0)
      .map(([category, categoryItems]) => ({
        category: category as InventoryCategory,
        title: INVENTORY_CATEGORY_LABELS[category as InventoryCategory],
        data: collapsedSections.has(category as InventoryCategory)
          ? []
          : categoryItems,
        count: categoryItems.length,
      }));
  }, [filteredItems, collapsedSections]);

  // Toggle section collapse
  const toggleSection = useCallback((category: InventoryCategory) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleItemPress = useCallback(
    (item: InventoryItem) => {
      router.push(
        `/(tabs)/rental-properties/${propertyId}/inventory/${item.id}` as never
      );
    },
    [router, propertyId]
  );

  const handleAddSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  // Render section header
  const renderSectionHeader = ({
    section,
  }: {
    section: { category: InventoryCategory; title: string; count: number };
  }) => {
    const isCollapsed = collapsedSections.has(section.category);

    return (
      <TouchableOpacity
        onPress={() => toggleSection(section.category)}
        className="flex-row items-center justify-between py-3 px-4"
        style={{ backgroundColor: colors.background }}
        activeOpacity={PRESS_OPACITY.DEFAULT}
      >
        <View className="flex-row items-center">
          <Text
            style={{
              color: colors.foreground,
              fontSize: FONT_SIZES.base,
              fontWeight: '600',
            }}
          >
            {section.title}
          </Text>
          <Badge variant="secondary" size="sm" className="ml-2">
            {section.count}
          </Badge>
        </View>
        {isCollapsed ? (
          <ChevronDown size={ICON_SIZES.lg} color={colors.mutedForeground} />
        ) : (
          <ChevronUp size={ICON_SIZES.lg} color={colors.mutedForeground} />
        )}
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading && items.length === 0) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <LoadingSpinner fullScreen text="Loading inventory..." />
        </ThemedSafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>

      {/* Inventory Type Tabs */}
      <View className="px-4 pb-2">
        <FilterableTabs
          tabs={[
            { key: 'all', label: 'All', count: items.length },
            { key: 'asset', label: 'Assets', count: assetCount },
            { key: 'supply', label: 'Supplies', count: supplyCount },
          ]}
          value={activeTab}
          onChange={(key) => setActiveTab(key as InventoryType | 'all')}
          variant="segment"
          size="sm"
        />
      </View>

      {/* Search Bar */}
      <View className="px-4 pb-2">
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search items..."
        />
      </View>

      {/* Content */}
      {items.length === 0 ? (
        <ListEmptyState
          icon={Package}
          title="No Inventory Items"
          description="Start tracking your property's appliances, furniture, and fixtures"
          action={{
            label: 'Add First Item',
            onPress: () => setShowAddSheet(true),
          }}
        />
      ) : sections.length === 0 ? (
        <ListEmptyState
          icon={Search}
          title="No Results"
          description={`No items match "${searchQuery}"`}
          action={{
            label: 'Clear Search',
            onPress: () => setSearchQuery(''),
          }}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="px-4">
              <InventoryItemCard item={item} onPress={() => handleItemPress(item)} />
            </View>
          )}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled
          contentContainerStyle={{
            paddingBottom: TAB_BAR_SAFE_PADDING,
          }}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
          SectionSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        />
      )}

      {/* Add FAB */}
      <SimpleFAB
        icon={<Plus size={ICON_SIZES.xl} color={colors.primaryForeground} />}
        onPress={() => setShowAddSheet(true)}
        accessibilityLabel="Add inventory item"
      />

      {/* Add Item Sheet */}
      <AddInventorySheet
        visible={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        propertyId={propertyId}
        onSuccess={handleAddSuccess}
      />
      </ThemedSafeAreaView>
    </>
  );
}

export default InventoryListScreen;
