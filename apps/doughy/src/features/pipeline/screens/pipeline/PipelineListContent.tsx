// src/features/pipeline/screens/pipeline/PipelineListContent.tsx
// FlatList content for pipeline screen — render items, skeletons, empty states

import React, { useCallback } from 'react';
import { View, FlatList, RefreshControl, ListRenderItem } from 'react-native';
import { Users, Briefcase, Building, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { SearchBar, TAB_BAR_SAFE_PADDING, ListEmptyState, PropertyImageCard } from '@/components/ui';
import { LeadCardSkeleton, DealCardSkeleton, PropertyCardSkeleton, SkeletonList } from '@/components/ui/CardSkeletons';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/design-tokens';

import { ExpandableLeadCard } from '@/features/leads/components/ExpandableLeadCard';
import type { LeadWithProperties, LeadProperty } from '@/features/leads/types';
import type { Deal } from '@/features/deals/types';
import type { Property } from '@/features/real-estate/types';
import type { PortfolioProperty } from '@/features/portfolio/types';
import { getInvestorPropertyMetrics, getPropertyImageUrl, getPropertyLocation } from '@/lib/property-card-utils';
import { formatPropertyType } from '@/features/real-estate/utils/formatters';

import { DealCard } from './DealCard';
import type { PipelineSegment, PipelineItem } from './types';

export interface PipelineListContentProps {
  activeSegment: PipelineSegment;
  currentData: PipelineItem[] | undefined;
  isLoading: boolean;
  searchQuery: string;
  onRefresh: () => void;
  onClearSearch: () => void;
  onFABPress: () => void;
}

export function PipelineListContent({
  activeSegment,
  currentData,
  isLoading,
  searchQuery,
  onRefresh,
  onClearSearch,
  onFABPress,
}: PipelineListContentProps) {
  const colors = useThemeColors();
  const router = useRouter();

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

  // Segment-specific config
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

  // Loading skeleton
  if (isLoading && !currentData?.length) {
    return (
      <View style={{ paddingHorizontal: SPACING.md }}>
        <SkeletonList count={5} component={SkeletonComponent} />
      </View>
    );
  }

  return (
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
          onRefresh={onRefresh}
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
            onPress: searchQuery ? onClearSearch : onFABPress,
          }}
        />
      }
    />
  );
}
