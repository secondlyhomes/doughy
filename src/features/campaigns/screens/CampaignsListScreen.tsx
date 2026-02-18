// src/features/campaigns/screens/CampaignsListScreen.tsx
// Campaigns List Screen - Shows all drip campaigns with stats and filters

import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import {
  SearchBar,
  SimpleFAB,
  BottomSheet,
  BottomSheetSection,
  Button,
  ListEmptyState,
  TAB_BAR_SAFE_PADDING,
  Badge,
} from '@/components/ui';
import { getStatusBadgeVariant } from '@/lib/formatters';
import { SkeletonList, DealCardSkeleton } from '@/components/ui/CardSkeletons';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Megaphone,
  ChevronRight,
  Users,
  MessageSquare,
  Target,
  Search,
  Pause,
  Play,
  Calendar,
  Mail,
  Phone,
  Instagram,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING } from '@/constants/design-tokens';
import { useDebounce } from '@/hooks';

import { useCampaigns, CampaignFilters } from '../hooks/useCampaigns';
import type { DripCampaign, DripLeadType } from '../types';
import { LEAD_TYPE_CONFIG, CHANNEL_CONFIG } from '../types';

// Status filters
const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Draft' },
  { key: 'paused', label: 'Paused' },
  { key: 'completed', label: 'Completed' },
] as const;

// =============================================================================
// Campaign Card Component
// =============================================================================

interface CampaignCardProps {
  campaign: DripCampaign;
  onPress: () => void;
}

const CampaignCard = memo(function CampaignCard({ campaign, onPress }: CampaignCardProps) {
  const colors = useThemeColors();

  const leadTypeConfig = campaign.lead_type
    ? LEAD_TYPE_CONFIG[campaign.lead_type]
    : null;

  // Calculate conversion rate
  const conversionRate = campaign.enrolled_count > 0
    ? ((campaign.converted_count / campaign.enrolled_count) * 100).toFixed(1)
    : '0.0';

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
      accessibilityLabel={`${campaign.name} campaign, ${campaign.status}`}
      accessibilityRole="button"
    >
      {/* Header: Status Badge + Name */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <Badge variant={getStatusBadgeVariant(campaign.status)} size="sm" className="mr-2">
            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
          </Badge>
          <Text
            className="text-base font-semibold flex-1 flex-shrink"
            style={{ color: colors.foreground }}
            numberOfLines={1}
          >
            {campaign.name}
          </Text>
        </View>
        <ChevronRight size={20} color={colors.mutedForeground} />
      </View>

      {/* Lead Type Badge */}
      {leadTypeConfig && (
        <View className="flex-row items-center mb-3">
          <Target size={14} color={colors.primary} />
          <Text className="text-sm ml-1" style={{ color: colors.primary }}>
            {leadTypeConfig.label}
          </Text>
        </View>
      )}

      {/* Stats Row */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Users size={14} color={colors.mutedForeground} />
          <Text className="text-sm ml-1" style={{ color: colors.foreground }}>
            {campaign.enrolled_count} enrolled
          </Text>
        </View>

        <View className="flex-row items-center">
          <MessageSquare size={14} color={colors.success} />
          <Text className="text-sm ml-1" style={{ color: colors.foreground }}>
            {campaign.responded_count} responded
          </Text>
        </View>

        <View className="flex-row items-center">
          <Target size={14} color={colors.info} />
          <Text className="text-sm ml-1" style={{ color: colors.foreground }}>
            {conversionRate}% conv
          </Text>
        </View>
      </View>

      {/* Campaign Steps Preview */}
      {campaign.steps && campaign.steps.length > 0 && (
        <View className="flex-row items-center gap-1 mb-2">
          {campaign.steps.slice(0, 5).map((step: { channel: string }, index: number) => {
            const channelConfig = CHANNEL_CONFIG[step.channel as keyof typeof CHANNEL_CONFIG];
            const ChannelIcon = step.channel === 'sms' ? MessageSquare
              : step.channel === 'email' ? Mail
              : step.channel === 'phone_reminder' ? Phone
              : step.channel === 'meta_dm' ? Instagram
              : Mail;

            return (
              <View
                key={index}
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{ backgroundColor: withOpacity(channelConfig?.color || colors.muted, 'light') }}
              >
                <ChannelIcon size={12} color={channelConfig?.color || colors.mutedForeground} />
              </View>
            );
          })}
          {campaign.steps.length > 5 && (
            <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>
              +{campaign.steps.length - 5}
            </Text>
          )}
        </View>
      )}

      {/* Footer: Updated date */}
      <View className="flex-row items-center justify-end">
        <Calendar size={12} color={colors.mutedForeground} />
        <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>
          {formatRelativeDate(campaign.updated_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.campaign.id === nextProps.campaign.id &&
    prevProps.campaign.status === nextProps.campaign.status &&
    prevProps.campaign.enrolled_count === nextProps.campaign.enrolled_count &&
    prevProps.campaign.updated_at === nextProps.campaign.updated_at &&
    prevProps.onPress === nextProps.onPress
  );
});

// =============================================================================
// Main Screen
// =============================================================================

export function CampaignsListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [activeStatus, setActiveStatus] = useState<'all' | 'active' | 'draft' | 'paused' | 'completed'>('all');
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
        <BottomSheet
          visible={showFiltersSheet}
          onClose={() => setShowFiltersSheet(false)}
          title="Campaign Filters"
        >
          <BottomSheetSection title="Status">
            <View className="flex-row flex-wrap gap-2">
              {STATUS_FILTERS.map((status) => {
                const isActive = activeStatus === status.key;
                const count = statusCounts[status.key] || 0;
                return (
                  <TouchableOpacity
                    key={status.key}
                    onPress={() => {
                      setActiveStatus(status.key as typeof activeStatus);
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
                      {status.label} {count > 0 ? `(${count})` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetSection>

          {/* Action buttons */}
          <View className="flex-row gap-3 pt-4 pb-6">
            <Button
              variant="outline"
              onPress={() => {
                setSearchQuery('');
                setActiveStatus('all');
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
      </ThemedSafeAreaView>
    </GestureHandlerRootView>
  );
}

export default CampaignsListScreen;
