// src/features/campaigns/screens/CampaignsListScreen.tsx
// Campaigns List Screen - Shows all drip campaigns with stats and filters

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
} from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import {
  SearchBar,
  SimpleFAB,
  ListEmptyState,
  TAB_BAR_SAFE_PADDING,
} from '@/components/ui';
import { SkeletonList, DealCardSkeleton } from '@/components/ui/CardSkeletons';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Megaphone, Search } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/design-tokens';
import { useDebounce } from '@/hooks';

import { useCampaigns, CampaignFilters } from '../hooks/useCampaigns';
import type { DripCampaign } from '../types';

import { CampaignCard } from './CampaignCard';
import { CampaignFiltersSheet } from './CampaignFiltersSheet';
import type { CampaignStatusFilter } from './CampaignFiltersSheet';

// =============================================================================
// Main Screen
// =============================================================================

export function CampaignsListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [activeStatus, setActiveStatus] = useState<CampaignStatusFilter>('all');
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);

  // Build filters
  const filters: CampaignFilters = useMemo(() => ({
    status: activeStatus,
    is_drip_campaign: true,
    search: debouncedSearchQuery || undefined,
  }), [activeStatus, debouncedSearchQuery]);

  const { data: campaigns, isLoading, refetch } = useCampaigns(filters);

  // Count campaigns per status for badges
  const { data: allCampaigns } = useCampaigns({ is_drip_campaign: true });
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allCampaigns?.length || 0 };
    allCampaigns?.forEach((campaign) => {
      counts[campaign.status] = (counts[campaign.status] || 0) + 1;
    });
    return counts;
  }, [allCampaigns]);

  const handleCampaignPress = useCallback((campaign: DripCampaign) => {
    router.push(`/(tabs)/campaigns/${campaign.id}`);
  }, [router]);

  const handleAddCampaign = useCallback(() => {
    router.push('/(tabs)/campaigns/new');
  }, [router]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setActiveStatus('all');
    setShowFiltersSheet(false);
  }, []);

  const ItemSeparator = useCallback(() => <View className="h-3" />, []);

  const renderItem = useCallback(({ item }: { item: DripCampaign }) => (
    <CampaignCard campaign={item} onPress={() => handleCampaignPress(item)} />
  ), [handleCampaignPress]);

  const keyExtractor = useCallback((item: DripCampaign) => item.id, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        {/* Search Bar - in normal document flow */}
        <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.xs }}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search campaigns..."
            size="md"
            glass={true}
            onFilter={() => setShowFiltersSheet(true)}
            hasActiveFilters={searchQuery.trim().length > 0 || activeStatus !== 'all'}
          />
        </View>

        {/* Campaigns List */}
        {isLoading && !(campaigns as DripCampaign[] | undefined)?.length ? (
          <View style={{ paddingHorizontal: SPACING.md }}>
            <SkeletonList count={5} component={DealCardSkeleton} />
          </View>
        ) : (
          <FlatList
            data={campaigns}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={{
              paddingHorizontal: SPACING.md,
              paddingBottom: TAB_BAR_SAFE_PADDING,
            }}
            contentInsetAdjustmentBehavior="automatic"
            ItemSeparatorComponent={ItemSeparator}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            keyboardShouldPersistTaps="handled"
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
                icon={searchQuery ? Search : Megaphone}
                title={searchQuery ? 'No Campaigns Found' : 'No Campaigns Yet'}
                description={
                  searchQuery
                    ? 'No campaigns match your search criteria.'
                    : 'Create your first drip campaign to start nurturing leads automatically.'
                }
                primaryAction={{
                  label: searchQuery ? 'Clear Search' : 'Create Campaign',
                  onPress: searchQuery
                    ? () => setSearchQuery('')
                    : handleAddCampaign,
                }}
              />
            }
          />
        )}

        {/* Floating Action Button */}
        <SimpleFAB onPress={handleAddCampaign} accessibilityLabel="Create new campaign" />

        {/* Filters Sheet */}
        <CampaignFiltersSheet
          visible={showFiltersSheet}
          onClose={() => setShowFiltersSheet(false)}
          activeStatus={activeStatus}
          statusCounts={statusCounts}
          onSelectStatus={setActiveStatus}
          onClearFilters={handleClearFilters}
        />
      </ThemedSafeAreaView>
    </GestureHandlerRootView>
  );
}

export default CampaignsListScreen;
