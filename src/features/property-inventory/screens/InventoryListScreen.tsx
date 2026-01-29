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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Package, Plus, ChevronDown, ChevronUp, Search } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import {
  LoadingSpinner,
  SearchBar,
  SimpleFAB,
  TAB_BAR_SAFE_PADDING,
  Badge,
  ListEmptyState,
} from '@/components/ui';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
import {
  usePropertyInventory,
  useInventoryGroupedByCategory,
} from '../hooks/usePropertyInventory';
import { InventoryItemCard } from '../components/InventoryItemCard';
import { AddInventorySheet } from '../components/AddInventorySheet';
import {
  InventoryItem,
  InventoryCategory,
  INVENTORY_CATEGORY_LABELS,
} from '../types';

export function InventoryListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const propertyId = params.id as string;

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddSheet, setShowAddSheet] = useState(false);
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

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query) ||
        item.model?.toLowerCase().includes(query) ||
        item.location?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

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

  // Navigation handlers
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

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
        activeOpacity={0.7}
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
          <ChevronDown size={20} color={colors.mutedForeground} />
        ) : (
          <ChevronUp size={20} color={colors.mutedForeground} />
        )}
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading && items.length === 0) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen text="Loading inventory..." />
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScreenHeader
        title="Inventory"
        backButton
        onBack={handleBack}
        rightAction={
          <Badge variant="default">{items.length} items</Badge>
        }
      />

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
        icon={<Plus size={24} color="white" />}
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
  );
}

export default InventoryListScreen;
