// src/features/deals/screens/DealCockpitScreen.tsx
// Deal Cockpit - The main "Apple screen" for managing a single deal
// Shows stage, NBA, metrics, and action cards
// Zone B: Added Focus Mode toggle and Timeline (Task B5)

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MoreHorizontal,
  Phone,
  ChevronRight,
  MapPin,
  User,
  Calculator,
  FileText,
  Camera,
  Folder,
  Share2,
  AlertCircle,
  Check,
  Clock,
  DollarSign,
  TrendingUp,
  Shield,
  Focus,
  Layers,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { useFocusMode } from '@/context/FocusModeContext';
import { getShadowStyle, withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import { Button, LoadingSpinner, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useDeal, useUpdateDealStage } from '../hooks/useDeals';
import { useNextAction, getActionButtonText, getActionIcon } from '../hooks/useNextAction';
import { useDealAnalysis } from '../../real-estate/hooks/useDealAnalysis';
import type { Property } from '../../real-estate/types';
import {
  Deal,
  DealStage,
  DEAL_STAGE_CONFIG,
  DEAL_STRATEGY_CONFIG,
  getDealAddress,
  getDealLeadName,
  getDealRiskScore,
  getRiskScoreColor,
  isDealClosed,
  getNextStages,
} from '../types';
import { DealTimeline } from '../components/DealTimeline';
import { AddDealEventSheet } from '../components/AddDealEventSheet';
import { DealAssistant } from '@/features/assistant/components';

// ============================================
// Stage Badge Component
// ============================================

interface StageBadgeProps {
  stage: DealStage;
  onPress?: () => void;
}

function StageBadge({ stage, onPress }: StageBadgeProps) {
  const colors = useThemeColors();
  const config = DEAL_STAGE_CONFIG[stage];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center px-3 py-1.5 rounded-full"
      style={{ backgroundColor: withOpacity(colors.primary, 'light') }}
      accessibilityLabel={`Stage: ${config.label}`}
      accessibilityRole="button"
    >
      <View
        className="w-2 h-2 rounded-full mr-2"
        style={{ backgroundColor: colors.primary }}
      />
      <Text className="text-sm font-medium" style={{ color: colors.primary }}>
        {config.label}
      </Text>
      {onPress && <ChevronRight size={14} color={colors.primary} style={{ marginLeft: 4 }} />}
    </TouchableOpacity>
  );
}

// ============================================
// Next Action Button Component
// ============================================

interface NextActionButtonProps {
  deal: Deal;
  onPress: () => void;
}

function NextActionButton({ deal, onPress }: NextActionButtonProps) {
  const colors = useThemeColors();
  const nextAction = useNextAction(deal);

  if (!nextAction) return null;

  const isHighPriority = nextAction.priority === 'high';
  const buttonBg = isHighPriority ? colors.primary : colors.card;
  const buttonText = isHighPriority ? colors.primaryForeground : colors.foreground;

  return (
    <TouchableOpacity
      className="rounded-xl p-4 mb-4"
      style={{
        backgroundColor: buttonBg,
        ...getShadowStyle(colors, { size: 'md' }),
      }}
      onPress={onPress}
      accessibilityLabel={`Next action: ${nextAction.action}`}
      accessibilityRole="button"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text
            className="text-xs font-medium mb-1"
            style={{ color: isHighPriority ? `${buttonText}90` : colors.mutedForeground }}
          >
            {nextAction.isOverdue ? 'OVERDUE' : 'NEXT ACTION'}
          </Text>
          <Text
            className="text-base font-semibold"
            style={{ color: buttonText }}
            numberOfLines={2}
          >
            {nextAction.action}
          </Text>
        </View>
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: isHighPriority ? withOpacity(colors.card, 'light') : withOpacity(colors.primary, 'light') }}
        >
          <ChevronRight size={20} color={isHighPriority ? buttonText : colors.primary} />
        </View>
      </View>
      {nextAction.dueDate && (
        <View className="flex-row items-center mt-2">
          <Clock size={12} color={isHighPriority ? `${buttonText}80` : colors.mutedForeground} />
          <Text
            className="text-xs ml-1"
            style={{ color: isHighPriority ? `${buttonText}80` : colors.mutedForeground }}
          >
            Due: {new Date(nextAction.dueDate).toLocaleDateString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ============================================
// Deal Metrics Component
// ============================================

interface DealMetricsProps {
  deal: Deal;
}

function DealMetrics({ deal }: DealMetricsProps) {
  const colors = useThemeColors();

  // Create a properly typed Property object for analysis
  // This ensures type safety while handling missing property data
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

  const analysis = useDealAnalysis(propertyForAnalysis as Property);
  const riskScore = getDealRiskScore(deal);

  // Determine which profit metric to show based on strategy
  const showCashFlow = deal.strategy === 'seller_finance' || deal.strategy === 'subject_to';
  const profitValue = showCashFlow
    ? analysis.monthlyCashFlow
    : analysis.netProfit;
  const profitLabel = showCashFlow ? 'Monthly CF' : 'Net Profit';

  const formatCurrency = (value: number) => {
    if (!value || value === 0) return '-';
    const prefix = value < 0 ? '-' : '';
    return `${prefix}$${Math.abs(value).toLocaleString()}`;
  };

  return (
    <View className="flex-row gap-2 mb-4">
      {/* MAO */}
      <View
        className="flex-1 rounded-xl p-3"
        style={{ backgroundColor: colors.card }}
      >
        <View className="flex-row items-center mb-1">
          <DollarSign size={14} color={colors.success} />
          <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>MAO</Text>
        </View>
        <Text className="text-lg font-bold" style={{ color: colors.foreground }}>
          {formatCurrency(analysis.mao)}
        </Text>
      </View>

      {/* Profit / Cash Flow */}
      <View
        className="flex-1 rounded-xl p-3"
        style={{ backgroundColor: colors.card }}
      >
        <View className="flex-row items-center mb-1">
          <TrendingUp size={14} color={colors.info} />
          <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>{profitLabel}</Text>
        </View>
        <Text
          className="text-lg font-bold"
          style={{ color: profitValue >= 0 ? colors.success : colors.destructive }}
        >
          {formatCurrency(profitValue)}
        </Text>
      </View>

      {/* Risk Score */}
      <View
        className="flex-1 rounded-xl p-3"
        style={{ backgroundColor: colors.card }}
      >
        <View className="flex-row items-center mb-1">
          <Shield size={14} color={colors.warning} />
          <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>Risk</Text>
        </View>
        <Text className="text-lg font-bold" style={{ color: riskScore !== undefined ? (riskScore <= 2 ? colors.success : riskScore <= 3 ? colors.warning : colors.destructive) : colors.mutedForeground }}>
          {riskScore !== undefined ? `${riskScore}/5` : '-'}
        </Text>
      </View>
    </View>
  );
}

// ============================================
// Action Card Component
// ============================================

interface ActionCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: () => void;
  badge?: string;
  badgeColor?: string;
  disabled?: boolean;
}

function ActionCard({
  title,
  subtitle,
  icon,
  onPress,
  badge,
  badgeColor,
  disabled = false,
}: ActionCardProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      className="rounded-xl p-4 mb-3"
      style={{
        backgroundColor: colors.card,
        opacity: disabled ? 0.5 : 1,
      }}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={`${title}: ${subtitle}`}
      accessibilityRole="button"
    >
      <View className="flex-row items-center">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}
        >
          {icon}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-base font-semibold" style={{ color: colors.foreground }}>{title}</Text>
            {badge && (
              <View
                className="ml-2 px-2 py-0.5 rounded-full"
                style={{ backgroundColor: badgeColor || withOpacity(colors.primary, 'light') }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: badgeColor ? colors.primaryForeground : colors.primary }}
                >
                  {badge}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-sm" style={{ color: colors.mutedForeground }} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <ChevronRight size={20} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// Main Screen
// ============================================

export function DealCockpitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const dealId = params.dealId as string;
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const { deal, isLoading, error, refetch } = useDeal(dealId);
  const { mutate: updateStage } = useUpdateDealStage();

  // Get next action at component level (not inside callback - Rules of Hooks)
  const nextActionData = useNextAction(deal || undefined);

  // Focus Mode from context (synced across all screens)
  const { focusMode, toggleFocusMode } = useFocusMode();

  // Local UI state
  const [showAddEventSheet, setShowAddEventSheet] = useState(false);

  // Add event handlers
  const handleAddActivity = useCallback(() => {
    setShowAddEventSheet(true);
  }, []);

  const handleCloseAddEventSheet = useCallback(() => {
    setShowAddEventSheet(false);
  }, []);

  // Navigation handlers
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleMoreOptions = useCallback(() => {
    if (!deal) return;
    // TODO: Show action sheet with options (edit, delete, change stage)
    Alert.alert('Options', 'More options coming soon!', [{ text: 'OK' }]);
  }, [deal]);

  const handleNextAction = useCallback(() => {
    if (!deal) return;
    // Use the hook data from component level (not inside callback)
    Alert.alert('Action', `Would execute: ${nextActionData?.action || 'No action'}`, [{ text: 'OK' }]);
  }, [deal, nextActionData]);

  const handleStageChange = useCallback(() => {
    if (!deal) return;
    const nextStages = getNextStages(deal.stage);
    if (nextStages.length === 0) {
      Alert.alert('Stage', 'This deal is at the final stage.', [{ text: 'OK' }]);
      return;
    }

    Alert.alert(
      'Advance Stage',
      `Move to ${DEAL_STAGE_CONFIG[nextStages[0]].label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Advance',
          onPress: () => updateStage({ id: deal.id, stage: nextStages[0] }),
        },
      ]
    );
  }, [deal, updateStage]);

  const handleUnderwrite = useCallback(() => {
    if (!deal) return;
    router.push(`/(tabs)/deals/${deal.id}/underwrite`);
  }, [deal, router]);

  const handleOffer = useCallback(() => {
    if (!deal) return;
    router.push(`/(tabs)/deals/${deal.id}/offer`);
  }, [deal, router]);

  const handleWalkthrough = useCallback(() => {
    if (!deal) return;
    router.push(`/(tabs)/deals/${deal.id}/field-mode`);
  }, [deal, router]);

  const handleDocs = useCallback(() => {
    if (!deal) return;
    router.push(`/(tabs)/deals/${deal.id}/docs`);
  }, [deal, router]);

  const handleSellerReport = useCallback(() => {
    if (!deal) return;
    router.push(`/(tabs)/deals/${deal.id}/seller-report`);
  }, [deal, router]);

  const handleCallSeller = useCallback(() => {
    if (!deal?.lead?.phone) {
      Alert.alert('No Phone', 'No phone number available for this lead.', [{ text: 'OK' }]);
      return;
    }
    // TODO: Open phone dialer
    Alert.alert('Call', `Would call: ${deal.lead.phone}`, [{ text: 'OK' }]);
  }, [deal]);

  // Get offer status for badge
  const getOfferStatus = useMemo(() => {
    if (!deal?.offers || deal.offers.length === 0) return { label: 'Create', color: undefined };
    const latestOffer = deal.offers[0];
    switch (latestOffer.status) {
      case 'sent':
        return { label: 'Sent', color: colors.info };
      case 'countered':
        return { label: 'Countered', color: colors.warning };
      case 'accepted':
        return { label: 'Accepted', color: colors.success };
      case 'rejected':
        return { label: 'Rejected', color: colors.destructive };
      default:
        return { label: 'Draft', color: undefined };
    }
  }, [deal?.offers, colors]);

  // Get walkthrough status
  const getWalkthroughStatus = useMemo(() => {
    if (!deal?.walkthrough) return { label: 'Start', subtitle: 'Capture photos & notes' };
    switch (deal.walkthrough.status) {
      case 'in_progress':
        return { label: 'In Progress', subtitle: `${deal.walkthrough.items?.length || 0} items captured` };
      case 'completed':
        return { label: 'Complete', subtitle: 'Ready to organize with AI' };
      case 'organized':
        return { label: 'Organized', subtitle: 'View AI summary' };
      default:
        return { label: 'Start', subtitle: 'Capture photos & notes' };
    }
  }, [deal?.walkthrough]);

  // Loading state
  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen text="Loading deal..." />
      </ThemedSafeAreaView>
    );
  }

  // Error state
  if (error || !deal) {
    return (
      <ThemedSafeAreaView className="flex-1 items-center justify-center px-4" edges={['top']}>
        <AlertCircle size={48} color={colors.destructive} />
        <Text className="text-center mt-4 mb-4" style={{ color: colors.destructive }}>
          {error?.message || 'Deal not found'}
        </Text>
        <Button onPress={handleBack}>Go Back</Button>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          onPress={handleBack}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          className="p-2 -ml-2"
        >
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>

        <StageBadge stage={deal.stage} onPress={handleStageChange} />

        <View className="flex-row items-center">
          {/* Focus Mode Toggle */}
          <TouchableOpacity
            onPress={toggleFocusMode}
            accessibilityLabel={focusMode ? 'Show all details' : 'Enable focus mode'}
            accessibilityRole="button"
            className="p-2"
          >
            {focusMode ? (
              <Layers size={22} color={colors.primary} />
            ) : (
              <Focus size={22} color={colors.mutedForeground} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCallSeller}
            accessibilityLabel="Call seller"
            accessibilityRole="button"
            className="p-2"
          >
            <Phone size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleMoreOptions}
            accessibilityLabel="More options"
            accessibilityRole="button"
            className="p-2"
          >
            <MoreHorizontal size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SAFE_PADDING + insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Lead & Property Info */}
        <View className="mb-4">
          <View className="flex-row items-center mb-1">
            <User size={14} color={colors.mutedForeground} />
            <Text className="text-lg font-bold ml-2" style={{ color: colors.foreground }}>
              {getDealLeadName(deal)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <MapPin size={14} color={colors.mutedForeground} />
            <Text className="text-sm ml-2" style={{ color: colors.mutedForeground }}>
              {getDealAddress(deal)}
            </Text>
          </View>
          {deal.strategy && (
            <View className="flex-row items-center mt-2">
              <View
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: withOpacity(colors.secondary, 'medium') }}
              >
                <Text className="text-xs font-medium" style={{ color: colors.secondaryForeground }}>
                  {DEAL_STRATEGY_CONFIG[deal.strategy].label}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Next Action Button */}
        <NextActionButton deal={deal} onPress={handleNextAction} />

        {/* Key Metrics */}
        <DealMetrics deal={deal} />

        {/* Action Cards - Collapsed in Focus Mode */}
        {!focusMode && (
          <>
            <Text className="text-sm font-medium mb-2 mt-2" style={{ color: colors.mutedForeground }}>
              ACTIONS
            </Text>

            <ActionCard
              title="Quick Underwrite"
              subtitle="MAO, profit, and financing scenarios"
              icon={<Calculator size={20} color={colors.primary} />}
              onPress={handleUnderwrite}
            />

            <ActionCard
              title="Offer Package"
              subtitle={
                deal.offers?.length
                  ? `${deal.offers.length} offer(s) created`
                  : 'Create and send offers'
              }
              icon={<FileText size={20} color={colors.primary} />}
              onPress={handleOffer}
              badge={getOfferStatus.label}
              badgeColor={getOfferStatus.color}
            />

            <ActionCard
              title="Walkthrough"
              subtitle={getWalkthroughStatus.subtitle}
              icon={<Camera size={20} color={colors.primary} />}
              onPress={handleWalkthrough}
              badge={deal.walkthrough ? getWalkthroughStatus.label : undefined}
            />

            <ActionCard
              title="Documents"
              subtitle="Contracts, disclosures, and files"
              icon={<Folder size={20} color={colors.primary} />}
              onPress={handleDocs}
            />

            <ActionCard
              title="Seller Report"
              subtitle="Generate transparent options for seller"
              icon={<Share2 size={20} color={colors.primary} />}
              onPress={handleSellerReport}
              badge={deal.seller_report ? 'Generated' : undefined}
              badgeColor={deal.seller_report ? colors.success : undefined}
            />
          </>
        )}

        {/* Deal Timeline */}
        <View className="mt-4">
          <DealTimeline
            dealId={deal.id}
            keyEventsOnly={focusMode}
            maxEvents={focusMode ? 3 : undefined}
            onAddActivity={handleAddActivity}
          />
        </View>

        {/* Deal Closed Banner */}
        {isDealClosed(deal) && (
          <View
            className="rounded-xl p-4 mt-4 flex-row items-center"
            style={{
              backgroundColor:
                deal.stage === 'closed_won'
                  ? withOpacity(colors.success, 'light')
                  : `${colors.muted}`,
            }}
          >
            <Check
              size={24}
              color={deal.stage === 'closed_won' ? colors.success : colors.mutedForeground}
            />
            <View className="ml-3">
              <Text
                className="font-semibold"
                style={{
                  color: deal.stage === 'closed_won' ? colors.success : colors.mutedForeground,
                }}
              >
                {deal.stage === 'closed_won' ? 'Deal Closed - Won!' : 'Deal Closed'}
              </Text>
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                {deal.updated_at
                  ? `Closed on ${new Date(deal.updated_at).toLocaleDateString()}`
                  : 'Deal has been finalized'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* AI Assistant (Zone A) */}
      <DealAssistant dealId={deal.id} />

      {/* Add Event Sheet */}
      <AddDealEventSheet
        visible={showAddEventSheet}
        dealId={deal.id}
        dealAddress={getDealAddress(deal)}
        onClose={handleCloseAddEventSheet}
        onSaved={refetch}
      />
    </ThemedSafeAreaView>
  );
}

export default DealCockpitScreen;
