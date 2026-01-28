// Leads List Screen - React Native
// Hierarchical view: Sellers (leads) with their properties
// Part of UI/UX restructure: Unified Leads tab

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import { SearchBar, ListEmptyState, TAB_BAR_SAFE_PADDING, BottomSheet, BottomSheetSection, Button, SimpleFAB, FormField } from '@/components/ui';
import { LeadCardSkeleton, SkeletonList } from '@/components/ui/CardSkeletons';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Plus, Users, Search, Home, AlertCircle, Check } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import { useDebounce } from '@/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LeadWithProperties, LeadProperty, LeadStatus } from '../types';
import { useLeadsWithProperties, useOrphanProperties, useCreateLead } from '../hooks/useLeads';
import { ExpandableLeadCard } from '../components/ExpandableLeadCard';

// ============================================
// Spacing Constants
// ============================================

// Calculate search bar container height based on its padding
const SEARCH_BAR_CONTAINER_HEIGHT =
  SPACING.sm +  // pt-2 (8px top padding)
  40 +          // SearchBar size="md" estimated height
  SPACING.xs;   // pb-1 (4px bottom padding)
  // Total: ~52px

const SEARCH_BAR_TO_CONTENT_GAP = SPACING.lg; // 16px comfortable gap

export interface LeadFilters {
  status: LeadStatus | 'all';
  source: string | 'all';
  starred: boolean | null;
  sortBy: 'name' | 'created_at' | 'score';
  sortOrder: 'asc' | 'desc';
}

const defaultFilters: LeadFilters = {
  status: 'all',
  source: 'all',
  starred: null,
  sortBy: 'created_at',
  sortOrder: 'desc',
};

// ============================================
// Quick Filter Tabs Configuration
// ============================================

const QUICK_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'active', label: 'Active' },
  { key: 'won', label: 'Won' },
  { key: 'starred', label: 'Starred' },
];

// ============================================
// Advanced Filters Options
// ============================================

const STATUS_OPTIONS: { label: string; value: LeadStatus | 'all' }[] = [
  { label: 'All Statuses', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Active', value: 'active' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
  { label: 'Closed', value: 'closed' },
  { label: 'Inactive', value: 'inactive' },
];

const SOURCE_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Sources', value: 'all' },
  { label: 'Website', value: 'website' },
  { label: 'Referral', value: 'referral' },
  { label: 'Social Media', value: 'social_media' },
  { label: 'Cold Call', value: 'cold_call' },
  { label: 'Direct Mail', value: 'direct_mail' },
  { label: 'Paid Ad', value: 'paid_ad' },
  { label: 'Other', value: 'other' },
];

const SORT_OPTIONS: { label: string; value: 'name' | 'created_at' | 'score' }[] = [
  { label: 'Date Added', value: 'created_at' },
  { label: 'Name', value: 'name' },
  { label: 'Lead Score', value: 'score' },
];

// Unknown Seller card for orphan properties
function UnknownSellerCard({
  properties,
  onPropertyPress,
  onStartDeal,
}: {
  properties: LeadProperty[];
  onPropertyPress: (property: LeadProperty) => void;
  onStartDeal?: (propertyId: string) => void;
}) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);

  if (properties.length === 0) return null;

  return (
    <View
      style={{
        backgroundColor: withOpacity(colors.warning, 'light'),
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: withOpacity(colors.warning, 'medium'),
      }}
    >
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: SPACING.md,
        }}
      >
        <AlertCircle size={20} color={colors.warning} style={{ marginRight: SPACING.sm }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
            Unknown Seller
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
            Properties needing skip trace
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Home size={14} color={colors.warning} />
          <Text style={{ fontSize: 14, fontWeight: '500', color: colors.warning }}>
            {properties.length}
          </Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={{ paddingHorizontal: SPACING.sm, paddingBottom: SPACING.md }}>
          {properties.map((property) => (
            <TouchableOpacity
              key={property.id}
              onPress={() => onPropertyPress(property)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: SPACING.sm,
                backgroundColor: colors.card,
                borderRadius: BORDER_RADIUS.md,
                marginTop: SPACING.xs,
              }}
            >
              <Home size={16} color={colors.mutedForeground} style={{ marginRight: SPACING.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }} numberOfLines={1}>
                  {property.address_line_1}
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                  {property.city}, {property.state}
                </Text>
              </View>
              {onStartDeal && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onStartDeal(property.id);
                  }}
                  style={{
                    padding: SPACING.xs,
                    backgroundColor: withOpacity(colors.primary, 'light'),
                    borderRadius: BORDER_RADIUS.sm,
                  }}
                >
                  <Plus size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export function LeadsListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<LeadFilters>(defaultFilters);
  const [propertyViewMode, setPropertyViewMode] = useState<'list' | 'card'>('card');

  // Add Lead Sheet state
  const [showAddLeadSheet, setShowAddLeadSheet] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');

  const { leads, isLoading, refetch } = useLeadsWithProperties();
  const createLead = useCreateLead();
  const { properties: orphanProperties, isLoading: orphansLoading, refetch: refetchOrphans } = useOrphanProperties();

  const handleRefresh = useCallback(() => {
    refetch();
    refetchOrphans();
  }, [refetch, refetchOrphans]);

  // Filter leads and properties by search query
  const filteredData = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase();

    // Filter leads
    let filteredLeads = leads.filter(lead => {
      // Search filter (matches lead name, email, phone, or any property address)
      const matchesSearch = !query ||
        lead.name?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.includes(query) ||
        lead.properties.some(p =>
          p.address_line_1?.toLowerCase().includes(query) ||
          p.city?.toLowerCase().includes(query)
        );

      // Quick status filter (tabs)
      const matchesQuickFilter = activeFilter === 'all' ||
        lead.status === activeFilter ||
        (activeFilter === 'starred' && lead.starred);

      // Advanced filters
      const matchesAdvancedStatus = advancedFilters.status === 'all' ||
        lead.status === advancedFilters.status;
      const matchesSource = advancedFilters.source === 'all' ||
        lead.source === advancedFilters.source;
      const matchesStarred = advancedFilters.starred === null ||
        lead.starred === advancedFilters.starred;

      return matchesSearch && matchesQuickFilter && matchesAdvancedStatus && matchesSource && matchesStarred;
    });

    // Sort leads (use spread to avoid mutating original array)
    const { sortBy, sortOrder } = advancedFilters;
    const sortedLeads = [...filteredLeads].sort((a, b) => {
      if (sortBy === 'created_at') {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      } else if (sortBy === 'name') {
        const comparison = (a.name || '').localeCompare(b.name || '');
        return sortOrder === 'asc' ? comparison : -comparison;
      } else if (sortBy === 'score') {
        const comparison = (a.score || 0) - (b.score || 0);
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      return 0;
    });

    // Filter orphan properties
    const filteredOrphans = orphanProperties.filter(p => {
      if (!query) return true;
      return p.address_line_1?.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query);
    });

    return { leads: sortedLeads, orphanProperties: filteredOrphans };
  }, [leads, orphanProperties, debouncedSearchQuery, activeFilter, advancedFilters]);

  const activeFiltersCount = [
    advancedFilters.status !== 'all',
    advancedFilters.source !== 'all',
    advancedFilters.starred !== null,
  ].filter(Boolean).length;

  // Check if any filters are active (quick filter or advanced filters)
  const hasActiveFilters = activeFilter !== 'all' || activeFiltersCount > 0;

  const handleLeadPress = useCallback((lead: LeadWithProperties) => {
    router.push(`/(tabs)/leads/${lead.id}`);
  }, [router]);

  const handlePropertyPress = useCallback((property: LeadProperty) => {
    // Navigate within the leads stack (not cross-tab to hidden properties tab)
    // NativeTabs doesn't support navigation to hidden tabs from other tabs
    router.push(`/(tabs)/leads/property/${property.id}`);
  }, [router]);

  const handleStartDeal = useCallback((leadId: string | undefined, propertyId?: string) => {
    // Navigate to deal creation with pre-populated lead/property
    const params = new URLSearchParams();
    if (leadId) params.set('lead_id', leadId);
    if (propertyId) params.set('property_id', propertyId);
    router.push(`/(tabs)/deals/new?${params.toString()}`);
  }, [router]);

  const handleClearAllFilters = useCallback(() => {
    setActiveFilter('all');
    setAdvancedFilters(defaultFilters);
    setSearchQuery('');
  }, []);

  const resetAddLeadForm = useCallback(() => {
    setNewLeadName('');
    setNewLeadPhone('');
    setNewLeadEmail('');
  }, []);

  const handleQuickAddLead = useCallback(async () => {
    if (!newLeadName.trim()) return;

    try {
      await createLead.mutateAsync({
        name: newLeadName.trim(),
        phone: newLeadPhone.trim() || undefined,
        email: newLeadEmail.trim() || undefined,
        status: 'new',
      });

      resetAddLeadForm();
      setShowAddLeadSheet(false);
    } catch (error) {
      console.error('Failed to create lead:', error);
      Alert.alert(
        'Failed to Add Lead',
        'Unable to create the lead. Please check your connection and try again.'
      );
    }
  }, [newLeadName, newLeadPhone, newLeadEmail, createLead, resetAddLeadForm]);

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
        {/* Glass Search Bar - positioned absolutely at top */}
        <View className="absolute top-0 left-0 right-0 z-10" style={{ paddingTop: insets.top }}>
          <View className="px-4 pt-2 pb-1">
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
        </View>

        {/* Leads List */}
        {(isLoading || orphansLoading) && !leads?.length ? (
          <View style={{ paddingTop: SEARCH_BAR_CONTAINER_HEIGHT + SEARCH_BAR_TO_CONTENT_GAP, paddingHorizontal: 16 }}>
            <SkeletonList count={5} component={LeadCardSkeleton} />
          </View>
        ) : (
          <FlatList
            data={filteredData.leads}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={{
              paddingTop: SEARCH_BAR_CONTAINER_HEIGHT + SEARCH_BAR_TO_CONTENT_GAP,
              paddingHorizontal: 16,
              paddingBottom: TAB_BAR_SAFE_PADDING,
            }}
            ItemSeparatorComponent={ItemSeparator}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            refreshControl={
              <RefreshControl
                refreshing={isLoading || orphansLoading}
                onRefresh={handleRefresh}
                tintColor={colors.info}
              />
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
                description={
                  searchQuery
                    ? 'No sellers or properties match your search.'
                    : 'Add your first lead to start building your pipeline.'
                }
                primaryAction={{
                  label: searchQuery ? 'Clear Search' : 'Add First Lead',
                  onPress: searchQuery
                    ? () => setSearchQuery('')
                    : () => router.push('/(tabs)/leads/add'),
                }}
              />
            }
          />
        )}

        {/* Floating Action Button */}
        <SimpleFAB
          onPress={() => setShowAddLeadSheet(true)}
          accessibilityLabel="Add new lead"
        />

        {/* Filters Sheet */}
        <BottomSheet
          visible={showFiltersSheet}
          onClose={() => setShowFiltersSheet(false)}
          title="Lead Filters"
        >
          {/* Quick Filter Pills */}
          <BottomSheetSection title="Quick Filter">
            <View className="flex-row flex-wrap gap-2">
              {QUICK_FILTERS.map(filter => {
                const isActive = activeFilter === filter.key;
                return (
                  <TouchableOpacity
                    key={filter.key}
                    onPress={() => setActiveFilter(filter.key)}
                    className="px-4 py-2 rounded-full border"
                    style={{
                      backgroundColor: isActive ? colors.primary : colors.muted,
                      borderColor: isActive ? colors.primary : colors.border,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${filter.label}${isActive ? ', selected' : ''}`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{ color: isActive ? colors.primaryForeground : colors.foreground }}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetSection>

          {/* Status Filter */}
          <BottomSheetSection title="Status">
            <View className="flex-row flex-wrap gap-2">
              {STATUS_OPTIONS.map(option => {
                const isActive = advancedFilters.status === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setAdvancedFilters(prev => ({ ...prev, status: option.value }))}
                    className="px-3 py-2 rounded-lg flex-row items-center gap-1"
                    style={{
                      backgroundColor: isActive ? withOpacity(colors.primary, 'muted') : colors.muted,
                      borderWidth: isActive ? 1 : 0,
                      borderColor: isActive ? colors.primary : 'transparent',
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Status: ${option.label}${isActive ? ', selected' : ''}`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      className="text-sm"
                      style={{ color: isActive ? colors.primary : colors.foreground }}
                    >
                      {option.label}
                    </Text>
                    {isActive && <Check size={14} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetSection>

          {/* Source Filter */}
          <BottomSheetSection title="Source">
            <View className="flex-row flex-wrap gap-2">
              {SOURCE_OPTIONS.map(option => {
                const isActive = advancedFilters.source === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setAdvancedFilters(prev => ({ ...prev, source: option.value }))}
                    className="px-3 py-2 rounded-lg flex-row items-center gap-1"
                    style={{
                      backgroundColor: isActive ? withOpacity(colors.primary, 'muted') : colors.muted,
                      borderWidth: isActive ? 1 : 0,
                      borderColor: isActive ? colors.primary : 'transparent',
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Source: ${option.label}${isActive ? ', selected' : ''}`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      className="text-sm"
                      style={{ color: isActive ? colors.primary : colors.foreground }}
                    >
                      {option.label}
                    </Text>
                    {isActive && <Check size={14} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetSection>

          {/* Sort By */}
          <BottomSheetSection title="Sort By">
            <View className="flex-row flex-wrap gap-2">
              {SORT_OPTIONS.map(option => {
                const isActive = advancedFilters.sortBy === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setAdvancedFilters(prev => ({ ...prev, sortBy: option.value }))}
                    className="px-3 py-2 rounded-lg flex-row items-center gap-1"
                    style={{
                      backgroundColor: isActive ? withOpacity(colors.primary, 'muted') : colors.muted,
                      borderWidth: isActive ? 1 : 0,
                      borderColor: isActive ? colors.primary : 'transparent',
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Sort by ${option.label}${isActive ? ', selected' : ''}`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      className="text-sm"
                      style={{ color: isActive ? colors.primary : colors.foreground }}
                    >
                      {option.label}
                    </Text>
                    {isActive && <Check size={14} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetSection>

          {/* Sort Order */}
          <BottomSheetSection title="Sort Order">
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg items-center"
                style={{
                  backgroundColor: advancedFilters.sortOrder === 'desc' ? colors.primary : colors.muted,
                }}
                onPress={() => setAdvancedFilters(prev => ({ ...prev, sortOrder: 'desc' }))}
                accessibilityRole="button"
                accessibilityLabel={`Newest first${advancedFilters.sortOrder === 'desc' ? ', selected' : ''}`}
                accessibilityState={{ selected: advancedFilters.sortOrder === 'desc' }}
              >
                <Text
                  className="font-medium"
                  style={{
                    color: advancedFilters.sortOrder === 'desc' ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  Newest First
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg items-center"
                style={{
                  backgroundColor: advancedFilters.sortOrder === 'asc' ? colors.primary : colors.muted,
                }}
                onPress={() => setAdvancedFilters(prev => ({ ...prev, sortOrder: 'asc' }))}
                accessibilityRole="button"
                accessibilityLabel={`Oldest first${advancedFilters.sortOrder === 'asc' ? ', selected' : ''}`}
                accessibilityState={{ selected: advancedFilters.sortOrder === 'asc' }}
              >
                <Text
                  className="font-medium"
                  style={{
                    color: advancedFilters.sortOrder === 'asc' ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  Oldest First
                </Text>
              </TouchableOpacity>
            </View>
          </BottomSheetSection>

          {/* Action buttons */}
          <View className="flex-row gap-3 pt-4 pb-6">
            <Button
              variant="outline"
              onPress={handleClearAllFilters}
              className="flex-1"
            >
              Clear Filters
            </Button>
            <Button
              onPress={() => setShowFiltersSheet(false)}
              className="flex-1"
            >
              Done
            </Button>
          </View>
        </BottomSheet>

        {/* Add Lead Sheet */}
        <BottomSheet
          visible={showAddLeadSheet}
          onClose={() => setShowAddLeadSheet(false)}
          title="Add Lead"
        >
          <BottomSheetSection>
            <FormField
              label="Name"
              required
              value={newLeadName}
              onChangeText={setNewLeadName}
              placeholder="Contact name"
            />
            <FormField
              label="Phone"
              value={newLeadPhone}
              onChangeText={setNewLeadPhone}
              placeholder="(555) 123-4567"
              keyboardType="phone-pad"
            />
            <FormField
              label="Email"
              value={newLeadEmail}
              onChangeText={setNewLeadEmail}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </BottomSheetSection>

          <View className="flex-row gap-3 pt-4 pb-6">
            <Button variant="outline" onPress={() => setShowAddLeadSheet(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onPress={handleQuickAddLead}
              className="flex-1"
              disabled={!newLeadName.trim() || createLead.isPending}
            >
              {createLead.isPending ? 'Adding...' : 'Add Lead'}
            </Button>
          </View>

          <TouchableOpacity
            onPress={() => {
              setShowAddLeadSheet(false);
              router.push('/(tabs)/leads/add');
            }}
            style={{ paddingBottom: 16 }}
          >
            <Text style={{ color: colors.primary, textAlign: 'center' }}>
              Need more options? Use full form →
            </Text>
          </TouchableOpacity>
        </BottomSheet>
      </ThemedSafeAreaView>
    </GestureHandlerRootView>
  );
}

export default LeadsListScreen;
