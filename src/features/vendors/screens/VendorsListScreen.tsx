// src/features/vendors/screens/VendorsListScreen.tsx
// List screen for vendors with category grouping

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Users, Plus, ChevronDown, ChevronUp, Search, Award } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import {
  SearchBar,
  SimpleFAB,
  TAB_BAR_SAFE_PADDING,
  Badge,
  ListEmptyState,
} from '@/components/ui';
import { SkeletonList, ListItemSkeleton } from '@/components/ui/CardSkeletons';
import { SPACING, FONT_SIZES, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { useNativeHeader } from '@/hooks';
import {
  useVendorsGroupedByCategory,
} from '../hooks/useVendors';
import { VendorCard } from '../components/VendorCard';
import { AddVendorSheet } from '../components/AddVendorSheet';
import { Vendor, VendorCategory, VENDOR_CATEGORY_CONFIG } from '../types';

interface VendorsListScreenProps {
  /** If true, this is the global vendors screen (from settings) */
  isGlobal?: boolean;
}

export function VendorsListScreen({ isGlobal = false }: VendorsListScreenProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const propertyId = isGlobal ? undefined : (params.id as string);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<VendorCategory>>(
    new Set()
  );

  const {
    grouped,
    nonEmptyGroups,
    data: vendors = [],
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useVendorsGroupedByCategory(propertyId);

  // Native header configuration
  const { headerOptions } = useNativeHeader({
    title: isGlobal ? 'My Vendors' : 'Vendors',
    fallbackRoute: isGlobal ? '/(tabs)/settings' : `/(tabs)/rental-properties/${propertyId}`,
  });

  // Filter vendors by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return nonEmptyGroups;

    const query = searchQuery.toLowerCase();
    return nonEmptyGroups
      .map(([category, categoryVendors]) => {
        const filtered = categoryVendors.filter(
          (vendor) =>
            vendor.name.toLowerCase().includes(query) ||
            vendor.company_name?.toLowerCase().includes(query) ||
            vendor.phone?.includes(query) ||
            vendor.email?.toLowerCase().includes(query)
        );
        return [category, filtered] as [VendorCategory, Vendor[]];
      })
      .filter(([_, vendors]) => vendors.length > 0);
  }, [nonEmptyGroups, searchQuery]);

  // Convert to SectionList format
  const sections = useMemo(() => {
    return filteredGroups.map(([category, categoryVendors]) => ({
      category,
      title: VENDOR_CATEGORY_CONFIG[category].label,
      emoji: VENDOR_CATEGORY_CONFIG[category].emoji,
      data: collapsedSections.has(category) ? [] : categoryVendors,
      count: categoryVendors.length,
      hasPrimary: categoryVendors.some((v) => v.is_primary),
    }));
  }, [filteredGroups, collapsedSections]);

  // Toggle section collapse
  const toggleSection = useCallback((category: VendorCategory) => {
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

  const handleVendorPress = useCallback(
    (vendor: Vendor) => {
      if (isGlobal) {
        router.push(`/(tabs)/settings/vendors/${vendor.id}` as never);
      } else {
        router.push(
          `/(tabs)/rental-properties/${propertyId}/vendors/${vendor.id}` as never
        );
      }
    },
    [router, propertyId, isGlobal]
  );

  const handleAddSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  // Render section header
  const renderSectionHeader = ({
    section,
  }: {
    section: {
      category: VendorCategory;
      title: string;
      emoji: string;
      count: number;
      hasPrimary: boolean;
    };
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
          <Text style={{ fontSize: 18, marginRight: 8 }}>{section.emoji}</Text>
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
          {section.hasPrimary && (
            <Award size={14} color={colors.primary} style={{ marginLeft: 8 }} />
          )}
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
  if (isLoading && vendors.length === 0) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <View style={{ padding: SPACING.md }}>
            <SkeletonList count={6} component={ListItemSkeleton} />
          </View>
        </ThemedSafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>

      {/* Search Bar */}
      <View className="px-4 pb-2">
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search vendors..."
          glass
        />
      </View>

      {/* Error Banner */}
      {error && (
        <View className="px-4 pb-2">
          <View
            style={{
              backgroundColor: colors.destructive + '20',
              borderRadius: 8,
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.destructive, flex: 1, fontSize: 14 }}>
              Failed to load vendors. Pull down to retry.
            </Text>
          </View>
        </View>
      )}

      {/* Content */}
      {!error && vendors.length === 0 ? (
        <ListEmptyState
          icon={Users}
          title="No Vendors"
          description="Add your service providers (plumbers, cleaners, etc.)"
          action={{
            label: 'Add Vendor',
            onPress: () => setShowAddSheet(true),
          }}
        />
      ) : sections.length === 0 ? (
        <ListEmptyState
          icon={Search}
          title="No Results"
          description={`No vendors match "${searchQuery}"`}
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
              <VendorCard vendor={item} onPress={() => handleVendorPress(item)} />
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
        accessibilityLabel="Add vendor"
      />

      {/* Add Vendor Sheet */}
      <AddVendorSheet
        visible={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        propertyId={propertyId}
        onSuccess={handleAddSuccess}
      />
      </ThemedSafeAreaView>
    </>
  );
}

export default VendorsListScreen;
