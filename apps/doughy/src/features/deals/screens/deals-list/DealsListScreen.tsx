// src/features/deals/screens/deals-list/DealsListScreen.tsx
// Deals List Screen - Shows all deals with stage filters

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
import { SearchBar, Button, ListEmptyState, TAB_BAR_SAFE_PADDING, Input, Select, BottomSheet, BottomSheetSection, SimpleFAB } from '@/components/ui';
import { DealCardSkeleton, SkeletonList } from '@/components/ui/CardSkeletons';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Briefcase, Search } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/design-tokens';
import { useDebounce } from '@/hooks';

import {
  Deal,
  DealStage,
  DealStrategy,
} from '../../types';
import { useDeals, DealsFilters, useCreateDeal, CreateDealInput } from '../../hooks/useDeals';
import { useLeads } from '../../../leads/hooks/useLeads';
import { useProperties } from '../../../real-estate/hooks/useProperties';

import { DealCard } from './DealCard';
import { STAGE_FILTERS } from './constants';

export function DealsListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [activeStage, setActiveStage] = useState<DealStage | 'all'>('all');
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [showCreateDealSheet, setShowCreateDealSheet] = useState(false);

  // Create Deal Form State
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedStrategy, setSelectedStrategy] = useState<DealStrategy>('wholesale');
  const [nextAction, setNextAction] = useState('');

  // Data hooks
  const { leads } = useLeads();
  const { properties } = useProperties();
  const createDeal = useCreateDeal();

  // Build filters - use debounced search query
  const filters: DealsFilters = useMemo(() => ({
    stage: activeStage,
    search: debouncedSearchQuery || undefined,
    activeOnly: true,
    sortBy: 'updated_at',
    sortDirection: 'desc',
  }), [activeStage, debouncedSearchQuery]);

  // Stable item separator reference for FlatList optimization
  const ItemSeparator = useCallback(() => <View className="h-3" />, []);

  const { deals, isLoading, refetch } = useDeals(filters);

  // Count deals per stage for badges
  const { deals: allDeals } = useDeals({ activeOnly: true });
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allDeals?.length || 0 };
    allDeals?.forEach((deal: Deal) => {
      counts[deal.stage] = (counts[deal.stage] || 0) + 1;
    });
    return counts;
  }, [allDeals]);

  const handleDealPress = useCallback((deal: Deal) => {
    router.push(`/(tabs)/deals/${deal.id}`);
  }, [router]);

  const handleAddDeal = useCallback(() => {
    setShowCreateDealSheet(true);
  }, []);

  const handleCreateDeal = useCallback(() => {
    const dealData: CreateDealInput = {
      lead_id: selectedLeadId || undefined,
      property_id: selectedPropertyId || undefined,
      stage: 'new',
      strategy: selectedStrategy,
      next_action: nextAction || undefined,
    };

    createDeal.mutate(dealData, {
      onSuccess: (newDeal) => {
        // Reset form
        setSelectedLeadId('');
        setSelectedPropertyId('');
        setSelectedStrategy('wholesale');
        setNextAction('');
        setShowCreateDealSheet(false);

        // Navigate to the new deal
        router.push(`/(tabs)/deals/${newDeal.id}`);
      },
      onError: (error) => {
        console.error('Failed to create deal:', error);
        Alert.alert(
          'Failed to Create Deal',
          'Unable to create the deal. Please check your connection and try again.'
        );
      },
    });
  }, [selectedLeadId, selectedPropertyId, selectedStrategy, nextAction, createDeal, router]);

  const renderItem = useCallback(({ item }: { item: Deal }) => (
    <DealCard deal={item} onPress={() => handleDealPress(item)} />
  ), [handleDealPress]);

  const keyExtractor = useCallback((item: Deal) => item.id, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <View style={{ flex: 1 }}>
          {/* Search Bar — floats above content with glass blur */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: SPACING.md, paddingTop: SPACING.sm }}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by address or lead..."
              size="md"
              glass={true}
              onFilter={() => setShowFiltersSheet(true)}
              hasActiveFilters={searchQuery.trim().length > 0 || activeStage !== 'all'}
            />
          </View>

          {/* Deals List */}
          {isLoading && !deals?.length ? (
            <View style={{ paddingHorizontal: SPACING.md, paddingTop: 64 + SPACING.md }}>
              <SkeletonList count={5} component={DealCardSkeleton} />
            </View>
          ) : (
            <FlatList
              data={deals}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              style={{ flex: 1 }}
              contentContainerStyle={{
                flexGrow: 1,
                paddingHorizontal: SPACING.md,
                paddingTop: 64 + SPACING.md,
                paddingBottom: TAB_BAR_SAFE_PADDING,
              }}
            contentInsetAdjustmentBehavior="automatic"
            ItemSeparatorComponent={ItemSeparator}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                tintColor={colors.info}
              />
            }
            ListEmptyComponent={
              <ListEmptyState
                state={searchQuery ? 'filtered' : 'empty'}
                icon={searchQuery ? Search : Briefcase}
                title={searchQuery ? 'No Results Found' : 'No Deals Yet'}
                description={
                  searchQuery
                    ? 'No deals match your search criteria.'
                    : 'Create your first deal to start tracking potential investments.'
                }
                primaryAction={{
                  label: searchQuery ? 'Clear Search' : 'Create First Deal',
                  onPress: searchQuery
                    ? () => setSearchQuery('')
                    : handleAddDeal,
                }}
              />
            }
          />
        )}
        </View>

        {/* Floating Action Button */}
        <SimpleFAB onPress={handleAddDeal} accessibilityLabel="Add new deal" />

        {/* Filters Sheet */}
        <BottomSheet
          visible={showFiltersSheet}
          onClose={() => setShowFiltersSheet(false)}
          title="Deal Filters"
        >
          <BottomSheetSection title="Deal Stage">
            <View className="flex-row flex-wrap gap-2">
              {STAGE_FILTERS.map(stage => {
                const isActive = activeStage === stage.key;
                const count = stageCounts[stage.key] || 0;
                return (
                  <TouchableOpacity
                    key={stage.key}
                    onPress={() => {
                      setActiveStage(stage.key);
                      setShowFiltersSheet(false);
                    }}
                    className="px-4 py-2 rounded-full border"
                    style={{
                      backgroundColor: isActive ? colors.primary : colors.muted,
                      borderColor: isActive ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{
                        color: isActive ? colors.primaryForeground : colors.foreground,
                      }}
                    >
                      {stage.label} {count > 0 ? `(${count})` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetSection>

          <View className="flex-row gap-3 pt-4 pb-6">
            <Button
              variant="outline"
              onPress={() => {
                setSearchQuery('');
                setActiveStage('all');
                setShowFiltersSheet(false);
              }}
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

        {/* Create Deal Sheet */}
        <BottomSheet
          visible={showCreateDealSheet}
          onClose={() => setShowCreateDealSheet(false)}
          title="Create Deal"
        >
          <BottomSheetSection title="Deal Information">
            <Select
              label="Lead (Optional)"
              placeholder="Select a lead or leave empty"
              value={selectedLeadId}
              onValueChange={setSelectedLeadId}
              options={[
                { label: 'None', value: '' },
                ...leads.map(lead => ({
                  label: lead.name,
                  value: lead.id,
                })),
              ]}
              className="mb-4"
            />

            <Select
              label="Property (Optional)"
              placeholder="Select a property or leave empty"
              value={selectedPropertyId}
              onValueChange={setSelectedPropertyId}
              options={[
                { label: 'None', value: '' },
                ...properties.map(property => ({
                  label: `${property.address}, ${property.city}`,
                  value: property.id,
                })),
              ]}
              className="mb-4"
            />

            <Select
              label="Investment Strategy"
              value={selectedStrategy}
              onValueChange={(val) => setSelectedStrategy(val as DealStrategy)}
              options={[
                { label: 'Wholesale', value: 'wholesale' },
                { label: 'Fix & Flip', value: 'fix_and_flip' },
                { label: 'BRRRR', value: 'brrrr' },
                { label: 'Buy & Hold', value: 'buy_and_hold' },
                { label: 'Seller Finance', value: 'seller_finance' },
              ]}
              className="mb-4"
            />

            <Input
              label="Next Action (Optional)"
              placeholder="e.g., Schedule property walkthrough"
              value={nextAction}
              onChangeText={setNextAction}
              multiline
              style={{ color: colors.foreground, backgroundColor: colors.input }}
            />
          </BottomSheetSection>

          <View className="flex-row gap-3 pt-4 pb-6">
            <Button
              variant="outline"
              onPress={() => setShowCreateDealSheet(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onPress={handleCreateDeal}
              className="flex-1"
              disabled={createDeal.isPending}
            >
              {createDeal.isPending ? 'Creating...' : 'Create Deal'}
            </Button>
          </View>
        </BottomSheet>
      </ThemedSafeAreaView>
    </GestureHandlerRootView>
  );
}

export default DealsListScreen;
