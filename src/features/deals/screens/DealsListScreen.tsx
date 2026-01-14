// src/features/deals/screens/DealsListScreen.tsx
// Deals List Screen - Shows all deals with stage filters
// Adapted from LeadsListScreen pattern

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import { SearchBar, ScreenHeader, LoadingSpinner, Badge, SimpleFAB } from '@/components/ui';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SlidersHorizontal, MapPin, Calendar, DollarSign, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';

import {
  Deal,
  DealStage,
  DEAL_STAGE_CONFIG,
  getDealAddress,
  getDealLeadName,
  getDealRiskScore,
  getRiskScoreColor,
} from '../types';
import { useDeals, DealsFilters } from '../hooks/useDeals';
import { useNextAction, getActionIcon } from '../hooks/useNextAction';
import { useDealAnalysis } from '../../real-estate/hooks/useDealAnalysis';
import type { Property } from '../../real-estate/types';

// ============================================
// Stage Filter Tabs
// ============================================

const STAGE_FILTERS: { key: DealStage | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'analyzing', label: 'Analyzing' },
  { key: 'offer_sent', label: 'Offers' },
  { key: 'negotiating', label: 'Negotiating' },
  { key: 'under_contract', label: 'Contract' },
];

// ============================================
// Deal Card Component
// ============================================

interface DealCardProps {
  deal: Deal;
  onPress: () => void;
}

function DealCard({ deal, onPress }: DealCardProps) {
  const colors = useThemeColors();
  const nextAction = useNextAction(deal);
  const stageConfig = DEAL_STAGE_CONFIG[deal.stage];
  const riskScore = getDealRiskScore(deal);
  const riskColor = getRiskScoreColor(riskScore);

  // Create a minimal Property object for analysis
  // Using the same pattern as DealCockpitScreen for consistency
  const propertyForAnalysis: Partial<Property> = {
    id: deal.property?.id || '',
    address: deal.property?.address || '',
    city: deal.property?.city || '',
    state: deal.property?.state || '',
    zip: deal.property?.zip || '',
    propertyType: deal.property?.property_type || 'other',
    square_feet: deal.property?.square_feet || 0,
    bedrooms: deal.property?.bedrooms || 0,
    bathrooms: deal.property?.bathrooms || 0,
    purchase_price: deal.property?.purchase_price || 0,
    repair_cost: deal.property?.repair_cost || 0,
    arv: deal.property?.arv || 0,
  };

  // Use the centralized analysis hook for MAO calculation
  // This ensures consistency with Deal Cockpit and respects buyingCriteria
  const analysis = useDealAnalysis(propertyForAnalysis as Property);
  const mao = analysis.mao > 0 ? analysis.mao : null;

  // Format currency
  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '-';
    return `$${value.toLocaleString()}`;
  };

  // Format date relative
  const formatRelativeDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      className="rounded-xl p-4"
      style={{ backgroundColor: colors.card }}
      onPress={onPress}
      accessibilityLabel={`${getDealLeadName(deal)} deal at ${getDealAddress(deal)}, stage ${stageConfig.label}`}
      accessibilityRole="button"
    >
      {/* Header: Stage Badge + Lead Name */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <View
            className="px-2 py-1 rounded-full mr-2"
            style={{ backgroundColor: `${colors.primary}20` }}
          >
            <Text className="text-xs font-medium" style={{ color: colors.primary }}>
              {stageConfig.label}
            </Text>
          </View>
          <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
            {getDealLeadName(deal)}
          </Text>
        </View>
        <ChevronRight size={20} color={colors.mutedForeground} />
      </View>

      {/* Address */}
      <View className="flex-row items-center mb-3">
        <MapPin size={14} color={colors.mutedForeground} />
        <Text className="text-sm text-muted-foreground ml-1" numberOfLines={1}>
          {getDealAddress(deal)}
        </Text>
      </View>

      {/* Metrics Row: MAO | Profit | Risk */}
      <View className="flex-row items-center gap-4 mb-3">
        <View className="flex-row items-center">
          <DollarSign size={14} color={colors.success} />
          <Text className="text-sm font-medium text-foreground ml-1">
            MAO: {formatCurrency(mao)}
          </Text>
        </View>
        {riskScore !== undefined && (
          <View className="flex-row items-center">
            <Text className="text-sm text-muted-foreground">Risk: </Text>
            <Text className={`text-sm font-medium ${riskColor}`}>
              {riskScore}/5
            </Text>
          </View>
        )}
        {deal.strategy && (
          <View className="bg-muted px-2 py-0.5 rounded">
            <Text className="text-xs text-muted-foreground capitalize">
              {deal.strategy.replace('_', ' ')}
            </Text>
          </View>
        )}
      </View>

      {/* Next Action */}
      {nextAction && (
        <View
          className="rounded-lg p-2 flex-row items-center"
          style={{ backgroundColor: `${colors.primary}10` }}
        >
          <View
            className="w-6 h-6 rounded-full items-center justify-center mr-2"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-xs text-white font-bold">!</Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs text-muted-foreground">Next Action</Text>
            <Text className="text-sm text-foreground" numberOfLines={1}>
              {nextAction.action}
            </Text>
          </View>
          {nextAction.isOverdue && (
            <View className="bg-destructive px-2 py-0.5 rounded">
              <Text className="text-xs text-white font-medium">Overdue</Text>
            </View>
          )}
        </View>
      )}

      {/* Footer: Updated date */}
      <View className="flex-row items-center justify-end mt-2">
        <Calendar size={12} color={colors.mutedForeground} />
        <Text className="text-xs text-muted-foreground ml-1">
          {formatRelativeDate(deal.updated_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// Main Screen
// ============================================

export function DealsListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStage, setActiveStage] = useState<DealStage | 'all'>('all');

  // Build filters
  // Always filter out closed deals from pipeline views (closed deals are "done")
  // Users can view closed deals in a separate archive view if needed
  const filters: DealsFilters = useMemo(() => ({
    stage: activeStage,
    search: searchQuery || undefined,
    activeOnly: true, // Always exclude closed deals from pipeline views
    sortBy: 'updated_at',
    sortDirection: 'desc',
  }), [activeStage, searchQuery]);

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
    // TODO: Navigate to add deal screen
    // For now, just show a console message
    console.log('Add deal pressed');
  }, []);

  const renderItem = useCallback(({ item }: { item: Deal }) => (
    <DealCard deal={item} onPress={() => handleDealPress(item)} />
  ), [handleDealPress]);

  const keyExtractor = useCallback((item: Deal) => item.id, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <ScreenHeader
          title="Deals"
          subtitle="Track your pipeline"
        />

        {/* Search Bar */}
        <View className="px-4 pt-2 pb-2">
          <View className="flex-row items-center gap-2">
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by address or lead..."
              size="md"
              className="flex-1"
            />
          </View>
        </View>

        {/* Stage Filter Tabs */}
        <View className="px-4 pb-2">
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={STAGE_FILTERS}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => {
              const isActive = activeStage === item.key;
              const count = stageCounts[item.key] || 0;
              return (
                <TouchableOpacity
                  className={`mr-2 px-4 py-2 rounded-full flex-row items-center ${
                    isActive ? 'bg-primary' : 'bg-muted'
                  }`}
                  onPress={() => setActiveStage(item.key)}
                  accessibilityLabel={`Filter by ${item.label}, ${count} deals`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {item.label}
                  </Text>
                  {count > 0 && (
                    <View
                      className={`ml-1.5 px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20' : 'bg-primary/20'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          isActive ? 'text-primary-foreground' : 'text-primary'
                        }`}
                      >
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Deals Count */}
        <View className="px-4 pb-2">
          <Text className="text-sm text-muted-foreground">
            {deals?.length || 0} deals
          </Text>
        </View>

        {/* Deals List */}
        {isLoading ? (
          <LoadingSpinner fullScreen />
        ) : (
          <FlatList
            data={deals}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
            ItemSeparatorComponent={() => <View className="h-3" />}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                tintColor={colors.info}
              />
            }
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-20">
                <Text className="text-muted-foreground text-center">
                  {searchQuery ? 'No deals match your search' : 'No deals yet'}
                </Text>
                <TouchableOpacity
                  className="mt-4 bg-primary px-4 py-2 rounded-lg"
                  onPress={handleAddDeal}
                  accessibilityLabel="Create your first deal"
                  accessibilityRole="button"
                >
                  <Text className="text-primary-foreground font-medium">Create First Deal</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}

        {/* Floating Action Button */}
        <SimpleFAB onPress={handleAddDeal} accessibilityLabel="Add new deal" />
      </ThemedSafeAreaView>
    </GestureHandlerRootView>
  );
}

export default DealsListScreen;
