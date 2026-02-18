// src/features/pipeline/screens/PipelineScreen.tsx
// Unified Pipeline screen for RE Investor platform
// Combines Leads, Deals, and Portfolio into one tabbed view
// Apple-like simplicity with ADHD-friendly focus

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ListRenderItem, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Users, Briefcase, Building, Search } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { ThemedSafeAreaView } from '@/components';
import { SearchBar, TAB_BAR_SAFE_PADDING, ListEmptyState, SimpleFAB, BottomSheet, BottomSheetSection, Button, FormField } from '@/components/ui';
import { LeadCardSkeleton, DealCardSkeleton, PropertyCardSkeleton, SkeletonList } from '@/components/ui/CardSkeletons';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/design-tokens';
import { useDebounce } from '@/hooks';

// Import list content from existing features
import { useLeadsWithProperties, useCreateLead } from '@/features/leads/hooks/useLeads';
import { ExpandableLeadCard } from '@/features/leads/components/ExpandableLeadCard';
import type { LeadWithProperties, LeadProperty } from '@/features/leads/types';

import { useDeals } from '@/features/deals/hooks/useDeals';
import type { Deal } from '@/features/deals/types';
import { getDealAddress, getDealLeadName } from '@/features/deals/types';
import type { Property } from '@/features/real-estate/types';

import { usePortfolio } from '@/features/portfolio/hooks/usePortfolio';
import { PropertyImageCard } from '@/components/ui';
import { AddToPortfolioSheet } from '@/features/portfolio/components';
import type { PortfolioProperty, AddToPortfolioInput } from '@/features/portfolio/types';
import { getInvestorPropertyMetrics, getPropertyImageUrl, getPropertyLocation } from '@/lib/property-card-utils';
import { formatPropertyType } from '@/features/real-estate/utils/formatters';

// Investor attention system
import { InvestorNeedsAttention } from '../components/InvestorNeedsAttention';
import { useInvestorAttention } from '../hooks/useInvestorAttention';

// Extracted components
import {
  type PipelineSegment,
  type PipelineItem,
  SegmentControl,
  DealCard,
} from './pipeline';

export function PipelineScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  // Investor attention items
  const { items: attentionItems, isLoading: attentionLoading } = useInvestorAttention();

  // State
  const [activeSegment, setActiveSegment] = useState<PipelineSegment>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);

  // Add Lead Sheet state
  const [showAddLeadSheet, setShowAddLeadSheet] = useState(false);
  const [showAddPortfolioSheet, setShowAddPortfolioSheet] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');

  // Data hooks
  const { leads, isLoading: leadsLoading, refetch: refetchLeads } = useLeadsWithProperties();
  const createLead = useCreateLead();
  const { deals, isLoading: dealsLoading, refetch: refetchDeals } = useDeals({ activeOnly: true });
  const { properties: portfolioProperties, isLoading: portfolioLoading, refetch: refetchPortfolio, addManualEntry, isAddingManual } = usePortfolio();

  // Counts for segment badges
  const counts: Record<PipelineSegment, number> = useMemo(() => ({
    leads: leads?.length || 0,
    deals: deals?.length || 0,
    portfolio: portfolioProperties?.length || 0,
  }), [leads, deals, portfolioProperties]);

  // Filtered data based on search
  const filteredLeads = useMemo(() => {
    if (!debouncedSearch) return leads;
    const query = debouncedSearch.toLowerCase();
    return leads.filter(lead =>
      lead.name?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query) ||
      lead.phone?.includes(query) ||
      lead.properties.some(p =>
        p.address_line_1?.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query)
      )
    );
  }, [leads, debouncedSearch]);

  const filteredDeals = useMemo(() => {
    if (!debouncedSearch) return deals;
    const query = debouncedSearch.toLowerCase();
    return deals?.filter((deal: Deal) =>
      getDealLeadName(deal).toLowerCase().includes(query) ||
      getDealAddress(deal).toLowerCase().includes(query)
    ) || [];
  }, [deals, debouncedSearch]);

  const filteredPortfolio = useMemo(() => {
    if (!debouncedSearch) return portfolioProperties;
    const query = debouncedSearch.toLowerCase();
    return portfolioProperties.filter(property =>
      property.address?.toLowerCase().includes(query) ||
      property.city?.toLowerCase().includes(query)
    );
  }, [portfolioProperties, debouncedSearch]);

  // Loading and refresh
  const isLoading = activeSegment === 'leads' ? leadsLoading :
                    activeSegment === 'deals' ? dealsLoading : portfolioLoading;

  const handleRefresh = useCallback(() => {
    if (activeSegment === 'leads') refetchLeads();
    else if (activeSegment === 'deals') refetchDeals();
    else refetchPortfolio();
  }, [activeSegment, refetchLeads, refetchDeals, refetchPortfolio]);

  // Navigation handlers
  const handleLeadPress = useCallback((lead: LeadWithProperties) => {
    router.push(`/(tabs)/pipeline/lead/${lead.id}` as never);
  }, [router]);

  const handlePropertyPress = useCallback((property: LeadProperty) => {
    router.push(`/(tabs)/pipeline/property/${property.id}` as never);
  }, [router]);

  const handleStartDeal = useCallback((leadId: string | undefined, propertyId?: string) => {
    const params = new URLSearchParams();
    if (leadId) params.set('lead_id', leadId);
    if (propertyId) params.set('property_id', propertyId);
    router.push(`/(tabs)/pipeline/deal/new?${params.toString()}` as never);
  }, [router]);

  const handleDealPress = useCallback((deal: Deal) => {
    router.push(`/(tabs)/pipeline/deal/${deal.id}` as never);
  }, [router]);

  const handlePortfolioPropertyPress = useCallback((property: Property) => {
    router.push(`/(tabs)/pipeline/portfolio/${property.id}` as never);
  }, [router]);

  // FAB action based on active segment
  const handleFABPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeSegment === 'leads') {
      setShowAddLeadSheet(true);
    } else if (activeSegment === 'deals') {
      router.push('/(tabs)/pipeline/deal/new');
    } else {
      setShowAddPortfolioSheet(true);
    }
  }, [activeSegment, router]);

  // Quick add lead
  const handleQuickAddLead = useCallback(async () => {
    if (!newLeadName.trim()) return;

    try {
      await createLead.mutateAsync({
        name: newLeadName.trim(),
        phone: newLeadPhone.trim() || undefined,
        email: newLeadEmail.trim() || undefined,
        status: 'new',
      });

      setNewLeadName('');
      setNewLeadPhone('');
      setNewLeadEmail('');
      setShowAddLeadSheet(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to create lead:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Failed to Add Lead',
        error instanceof Error ? error.message : 'Unable to create the lead. Please try again.'
      );
    }
  }, [newLeadName, newLeadPhone, newLeadEmail, createLead]);

  // Add to portfolio handler
  const handleAddToPortfolio = useCallback(async (data: AddToPortfolioInput) => {
    try {
      await addManualEntry(data);
      setShowAddPortfolioSheet(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to add to portfolio:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Failed to Add Property',
        error instanceof Error ? error.message : 'Unable to add property to portfolio. Please try again.'
      );
    }
  }, [addManualEntry]);

  // Render items
  const renderLeadItem = useCallback(({ item }: { item: LeadWithProperties }) => (
    <ExpandableLeadCard
      lead={item}
      onLeadPress={() => handleLeadPress(item)}
      onPropertyPress={handlePropertyPress}
      onStartDeal={handleStartDeal}
      propertyViewMode="card"
    />
  ), [handleLeadPress, handlePropertyPress, handleStartDeal]);

  const renderDealItem = useCallback(({ item }: { item: Deal }) => (
    <DealCard deal={item} onPress={() => handleDealPress(item)} />
  ), [handleDealPress]);

  const renderPortfolioItem = useCallback(({ item }: { item: PortfolioProperty }) => (
    <PropertyImageCard
      imageUrl={getPropertyImageUrl(item)}
      title={item.address || 'Address not specified'}
      subtitle={getPropertyLocation(item)}
      metrics={getInvestorPropertyMetrics(item)}
      badgeOverlay={item.propertyType ? {
        label: formatPropertyType(item.propertyType),
        variant: 'secondary',
      } : undefined}
      onPress={() => handlePortfolioPropertyPress(item)}
      variant="glass"
    />
  ), [handlePortfolioPropertyPress]);

  const keyExtractor = useCallback((item: { id: string }) => item.id, []);
  const ItemSeparator = useCallback(() => <View style={{ height: SPACING.md }} />, []);

  // Get current data and render function
  const currentData = activeSegment === 'leads' ? filteredLeads :
                      activeSegment === 'deals' ? filteredDeals : filteredPortfolio;

  const renderItem = activeSegment === 'leads' ? renderLeadItem :
                     activeSegment === 'deals' ? renderDealItem : renderPortfolioItem;

  const SkeletonComponent = activeSegment === 'leads' ? LeadCardSkeleton :
                            activeSegment === 'deals' ? DealCardSkeleton : PropertyCardSkeleton;

  const emptyIcon = activeSegment === 'leads' ? Users :
                    activeSegment === 'deals' ? Briefcase : Building;

  const emptyTitle = searchQuery ? 'No Results Found' :
                     activeSegment === 'leads' ? 'No Leads Yet' :
                     activeSegment === 'deals' ? 'No Deals Yet' : 'No Properties Yet';

  const emptyDescription = searchQuery ? `No ${activeSegment} match your search.` :
                           activeSegment === 'leads' ? 'Add your first lead to start building your pipeline.' :
                           activeSegment === 'deals' ? 'Create your first deal to start tracking investments.' :
                           'Add properties to your portfolio.';

  const emptyActionLabel = searchQuery ? 'Clear Search' :
                           activeSegment === 'leads' ? 'Add Lead' :
                           activeSegment === 'deals' ? 'Create Deal' : 'Add Property';

  const hasActiveFilters = searchQuery.trim().length > 0;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        {/* Needs Attention */}
        {(attentionItems.length > 0 || attentionLoading) && (
          <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm }}>
            <InvestorNeedsAttention items={attentionItems} isLoading={attentionLoading} />
          </View>
        )}

        {/* Header - in normal flow */}
        <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.sm }}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search ${activeSegment}...`}
            size="md"
            glass={true}
            onFilter={() => setShowFiltersSheet(true)}
            hasActiveFilters={hasActiveFilters}
          />
        </View>
        <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
          <SegmentControl value={activeSegment} onChange={setActiveSegment} counts={counts} />
        </View>

        {/* Content */}
        {isLoading && !currentData?.length ? (
          <View style={{ paddingHorizontal: SPACING.md }}>
            <SkeletonList count={5} component={SkeletonComponent} />
          </View>
        ) : (
          <FlatList<PipelineItem>
            data={currentData}
            renderItem={renderItem as ListRenderItem<PipelineItem>}
            keyExtractor={keyExtractor}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{
              paddingHorizontal: SPACING.md,
              paddingBottom: TAB_BAR_SAFE_PADDING,
            }}
            ItemSeparatorComponent={ItemSeparator}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <ListEmptyState
                state={searchQuery ? 'filtered' : 'empty'}
                icon={searchQuery ? Search : emptyIcon}
                title={emptyTitle}
                description={emptyDescription}
                primaryAction={{
                  label: emptyActionLabel,
                  onPress: searchQuery ? () => setSearchQuery('') : handleFABPress,
                }}
              />
            }
          />
        )}

        {/* FAB */}
        <SimpleFAB
          onPress={handleFABPress}
          accessibilityLabel={`Add new ${activeSegment.slice(0, -1)}`}
        />

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
              router.push('/(tabs)/pipeline/lead/add');
            }}
            style={{ paddingBottom: 16 }}
          >
            <Text style={{ color: colors.primary, textAlign: 'center' }}>
              Need more options? Use full form
            </Text>
          </TouchableOpacity>
        </BottomSheet>

        {/* Add to Portfolio Sheet */}
        <AddToPortfolioSheet
          visible={showAddPortfolioSheet}
          onClose={() => setShowAddPortfolioSheet(false)}
          onSubmit={handleAddToPortfolio}
          isLoading={isAddingManual}
        />

        {/* Filters Sheet */}
        <BottomSheet
          visible={showFiltersSheet}
          onClose={() => setShowFiltersSheet(false)}
          title="Filters"
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
              <Button onPress={() => setShowFiltersSheet(false)} className="flex-1">
                Done
              </Button>
            </View>
          </BottomSheetSection>
        </BottomSheet>
      </ThemedSafeAreaView>
    </GestureHandlerRootView>
  );
}

export default PipelineScreen;
