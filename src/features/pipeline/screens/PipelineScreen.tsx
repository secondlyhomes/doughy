// src/features/pipeline/screens/PipelineScreen.tsx
// Unified Pipeline screen for RE Investor platform
// Combines Leads, Deals, and Portfolio into one tabbed view
// Apple-like simplicity with ADHD-friendly focus

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Animated, ListRenderItem, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Users, Briefcase, Building, Search, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { ThemedSafeAreaView } from '@/components';
import { SearchBar, TAB_BAR_SAFE_PADDING, ListEmptyState, SimpleFAB, BottomSheet, BottomSheetSection, Button, FormField } from '@/components/ui';
import { LeadCardSkeleton, DealCardSkeleton, PropertyCardSkeleton, SkeletonList } from '@/components/ui/CardSkeletons';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity, getShadowStyle } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import { useDebounce } from '@/hooks';
import { useRouter } from 'expo-router';

// Import list content from existing features
import { useLeadsWithProperties, useCreateLead } from '@/features/leads/hooks/useLeads';
import { ExpandableLeadCard } from '@/features/leads/components/ExpandableLeadCard';
import type { LeadWithProperties, LeadProperty } from '@/features/leads/types';

import { useDeals, useCreateDeal } from '@/features/deals/hooks/useDeals';
import type { Deal, DealStrategy } from '@/features/deals/types';
import { DEAL_STAGE_CONFIG, getDealAddress, getDealLeadName } from '@/features/deals/types';
import { useNextAction } from '@/features/deals/hooks/useNextAction';
import { useDealAnalysis } from '@/features/real-estate/hooks/useDealAnalysis';
import type { Property } from '@/features/real-estate/types';

import { usePortfolio } from '@/features/portfolio/hooks/usePortfolio';
import { PropertyImageCard } from '@/components/ui';
import { AddToPortfolioSheet } from '@/features/portfolio/components';
import type { PortfolioProperty, AddToPortfolioInput } from '@/features/portfolio/types';
import { getInvestorPropertyMetrics, getPropertyImageUrl, getPropertyLocation } from '@/lib/property-card-utils';
import { formatPropertyType } from '@/features/real-estate/utils/formatters';

// ============================================
// Types
// ============================================

type PipelineSegment = 'leads' | 'deals' | 'portfolio';

// Union type for all pipeline items (used for FlatList typing)
type PipelineItem = LeadWithProperties | Deal | PortfolioProperty;

interface SegmentOption {
  id: PipelineSegment;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
}

const SEGMENTS: SegmentOption[] = [
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'deals', label: 'Deals', icon: Briefcase },
  { id: 'portfolio', label: 'Portfolio', icon: Building },
];

const SEGMENT_CONTROL_HEIGHT = 38; // Inner content height (excludes 3px padding on each side)

// ============================================
// Segment Control Component
// ============================================

interface SegmentControlProps {
  value: PipelineSegment;
  onChange: (segment: PipelineSegment) => void;
  counts: Record<PipelineSegment, number>;
}

function SegmentControl({ value, onChange, counts }: SegmentControlProps) {
  const colors = useThemeColors();
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const [segmentWidths, setSegmentWidths] = React.useState<number[]>([]);

  const activeIndex = SEGMENTS.findIndex((s) => s.id === value);

  React.useEffect(() => {
    if (segmentWidths.length === SEGMENTS.length && activeIndex >= 0) {
      const targetX = segmentWidths.slice(0, activeIndex).reduce((sum, w) => sum + w, 0);
      Animated.spring(slideAnim, {
        toValue: targetX,
        useNativeDriver: true,
        tension: 300,
        friction: 30,
      }).start();
    }
  }, [activeIndex, segmentWidths, slideAnim]);

  const handleSegmentLayout = useCallback((index: number, width: number) => {
    setSegmentWidths((prev) => {
      const newWidths = [...prev];
      newWidths[index] = width;
      return newWidths;
    });
  }, []);

  const handlePress = useCallback(
    (segment: PipelineSegment) => {
      if (segment !== value) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onChange(segment);
      }
    },
    [value, onChange]
  );

  const activePillWidth = segmentWidths[activeIndex] || 0;

  return (
    <View
      style={{
        flexDirection: 'row',
        borderRadius: BORDER_RADIUS.full,
        padding: 3,
        backgroundColor: withOpacity(colors.muted, 'strong'),
      }}
    >
      {/* Animated pill indicator */}
      {segmentWidths.length === SEGMENTS.length && activeIndex >= 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 3,
            left: 3,
            width: activePillWidth,
            height: SEGMENT_CONTROL_HEIGHT,
            borderRadius: BORDER_RADIUS.full,
            backgroundColor: colors.background,
            ...getShadowStyle(colors, { size: 'sm' }),
            transform: [{ translateX: slideAnim }],
          }}
        />
      )}

      {/* Segments */}
      {SEGMENTS.map((segment, index) => {
        const isActive = segment.id === value;
        const IconComponent = segment.icon;
        const count = counts[segment.id] || 0;

        return (
          <TouchableOpacity
            key={segment.id}
            onLayout={(e) => handleSegmentLayout(index, e.nativeEvent.layout.width)}
            onPress={() => handlePress(segment.id)}
            accessibilityLabel={`${segment.label} (${count})`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              height: SEGMENT_CONTROL_HEIGHT,
              gap: SPACING.xs,
            }}
          >
            <IconComponent
              size={16}
              color={isActive ? colors.foreground : colors.mutedForeground}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: isActive ? colors.foreground : colors.mutedForeground,
              }}
            >
              {segment.label}
            </Text>
            {count > 0 && (
              <View
                style={{
                  backgroundColor: isActive
                    ? withOpacity(colors.primary, 'light')
                    : withOpacity(colors.muted, 'strong'),
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: BORDER_RADIUS.full,
                  minWidth: 20,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: isActive ? colors.primary : colors.mutedForeground,
                  }}
                >
                  {count > 99 ? '99+' : count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ============================================
// Deal Card Component (simplified inline)
// ============================================

interface DealCardProps {
  deal: Deal;
  onPress: () => void;
}

function DealCard({ deal, onPress }: DealCardProps) {
  const colors = useThemeColors();
  const nextAction = useNextAction(deal);
  const stageConfig = DEAL_STAGE_CONFIG[deal.stage] || { label: deal.stage || 'Unknown', color: 'bg-gray-500', order: 0 };

  const propertyForAnalysis: Partial<Property> = {
    id: deal.property?.id || '',
    address: deal.property?.address || '',
    purchase_price: deal.property?.purchase_price || 0,
    repair_cost: deal.property?.repair_cost || 0,
    arv: deal.property?.arv || 0,
  };

  const analysis = useDealAnalysis(propertyForAnalysis as Property);
  const mao = analysis.mao > 0 ? analysis.mao : null;

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '-';
    return `$${value.toLocaleString()}`;
  };

  return (
    <TouchableOpacity
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
      }}
      onPress={onPress}
      accessibilityLabel={`${getDealLeadName(deal)} deal at ${getDealAddress(deal)}`}
      accessibilityRole="button"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: BORDER_RADIUS.full,
              backgroundColor: withOpacity(colors.primary, 'light'),
              marginRight: SPACING.sm,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>
              {stageConfig.label}
            </Text>
          </View>
          <Text
            style={{ fontSize: 15, fontWeight: '600', color: colors.foreground, flex: 1 }}
            numberOfLines={1}
          >
            {getDealLeadName(deal)}
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 13, color: colors.mutedForeground, marginBottom: SPACING.xs }} numberOfLines={1}>
        {getDealAddress(deal)}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
        <Text style={{ fontSize: 13, color: colors.foreground }}>
          MAO: <Text style={{ fontWeight: '600', color: colors.success }}>{formatCurrency(mao)}</Text>
        </Text>
        {deal.strategy && (
          <View style={{ backgroundColor: colors.muted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm }}>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, textTransform: 'capitalize' }}>
              {deal.strategy.replace('_', ' ')}
            </Text>
          </View>
        )}
      </View>

      {nextAction && (
        <View
          style={{
            marginTop: SPACING.sm,
            padding: SPACING.sm,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: withOpacity(colors.primary, 'muted'),
          }}
        >
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Next Action</Text>
          <Text style={{ fontSize: 13, color: colors.foreground }} numberOfLines={1}>
            {nextAction.action}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ============================================
// Main Pipeline Screen
// ============================================

export function PipelineScreen() {
  const router = useRouter();
  const colors = useThemeColors();

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
    router.push(`/(tabs)/pipeline/lead/${lead.id}` as any);
  }, [router]);

  const handlePropertyPress = useCallback((property: LeadProperty) => {
    router.push(`/(tabs)/pipeline/property/${property.id}` as any);
  }, [router]);

  const handleStartDeal = useCallback((leadId: string | undefined, propertyId?: string) => {
    const params = new URLSearchParams();
    if (leadId) params.set('lead_id', leadId);
    if (propertyId) params.set('property_id', propertyId);
    router.push(`/(tabs)/pipeline/deal/new?${params.toString()}` as any);
  }, [router]);

  const handleDealPress = useCallback((deal: Deal) => {
    router.push(`/(tabs)/pipeline/deal/${deal.id}` as any);
  }, [router]);

  const handlePortfolioPropertyPress = useCallback((property: Property) => {
    router.push(`/(tabs)/pipeline/portfolio/${property.id}` as any);
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
            // Safe cast: activeSegment controls both currentData and renderItem
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
