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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Users, Plus, ChevronDown, ChevronUp, Search, Award } from 'lucide-react-native';
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

  // Navigation handlers
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

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
        activeOpacity={0.7}
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
          <ChevronDown size={20} color={colors.mutedForeground} />
        ) : (
          <ChevronUp size={20} color={colors.mutedForeground} />
        )}
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading && vendors.length === 0) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen text="Loading vendors..." />
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScreenHeader
        title={isGlobal ? 'My Vendors' : 'Vendors'}
        backButton
        onBack={handleBack}
        rightAction={<Badge variant="default">{vendors.length}</Badge>}
      />

      {/* Search Bar */}
      <View className="px-4 pb-2">
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search vendors..."
        />
      </View>

      {/* Content */}
      {vendors.length === 0 ? (
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
  );
}

export default VendorsListScreen;
