// src/features/deals/screens/DealCockpitScreen.tsx
// Deal Cockpit - The main "Apple screen" for managing a single deal
// Shows stage, NBA, metrics, and action cards
// Zone B: Added Focus Mode toggle and Timeline (Task B5)
// Zone G: Added tabbed interface, MetricCards, breadcrumbs, and AI suggestions

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from '@/lib/haptics';
import {
  ChevronRight,
  Calculator,
  FileText,
  Folder,
  AlertCircle,
  Check,
  Clock,
  DollarSign,
  TrendingUp,
  Shield,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { useFocusMode } from '@/context/FocusModeContext';
import { getShadowStyle, withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import {
  Button,
  LoadingSpinner,
  FAB_BOTTOM_OFFSET,
  FAB_SIZE,
} from '@/components/ui';
import { MetricCard, EvidenceTrailModal } from '@/components/deals';
import { useDeal, useUpdateDealStage } from '../hooks/useDeals';
import { useNextAction } from '../hooks/useNextAction';
import { useDealAnalysis, DEFAULT_FLIP_CONSTANTS } from '../../real-estate/hooks/useDealAnalysis';
import type { Property } from '../../real-estate/types';
import {
  Deal,
  DealStage,
  DEAL_STAGE_CONFIG,
  DEAL_STRATEGY_CONFIG,
  getDealAddress,
  getDealLeadName,
  getDealRiskScore,
  isDealClosed,
  getNextStages,
} from '../types';
import {
  DealTimeline,
  AddDealEventSheet,
  StageStepper,
  SuggestionList,
  DealActionsSheet,
} from '../components';
import { getSuggestionsForDeal, AISuggestion } from '../services/aiSuggestions';
import { ConversationsView } from '@/features/conversations/components';
import { useDealConversations } from '@/features/conversations/hooks';
import { EntityHeader } from '@/components/navigation';
import { DealAssistant } from '@/features/assistant/components';

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
// Deal Metrics Component (Zone G - Progressive Disclosure)
// ============================================

interface DealMetricsProps {
  deal: Deal;
  onEvidencePress?: (field: 'mao' | 'profit' | 'risk') => void;
}

function DealMetrics({ deal, onEvidencePress }: DealMetricsProps) {
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

  // Calculate confidence based on data completeness
  const getConfidence = (hasData: boolean, hasMultipleSources: boolean): 'high' | 'medium' | 'low' => {
    if (hasData && hasMultipleSources) return 'high';
    if (hasData) return 'medium';
    return 'low';
  };

  const arvPercentage = Math.round(DEFAULT_FLIP_CONSTANTS.maoRulePct * 100);

  // Build MAO breakdown
  const maoBreakdown = {
    formula: `${arvPercentage}% ARV - Repairs - Costs`,
    items: [
      { label: `ARV × ${arvPercentage}%`, value: formatCurrency((analysis.arv || 0) * DEFAULT_FLIP_CONSTANTS.maoRulePct) },
      { label: 'Repairs', value: formatCurrency(analysis.repairCost || 0), isSubtraction: true },
      { label: 'Closing costs', value: formatCurrency((analysis.arv || 0) * 0.03), isSubtraction: true },
    ],
  };

  // Build profit breakdown
  const profitBreakdown = showCashFlow
    ? {
        formula: 'Rent - PITI - Expenses',
        items: [
          { label: 'Monthly rent', value: formatCurrency(analysis.monthlyRent || 0) },
          { label: 'PITI', value: formatCurrency((analysis.monthlyRent || 0) * 0.5), isSubtraction: true },
        ],
      }
    : {
        formula: 'ARV - Purchase - Repairs - Costs',
        items: [
          { label: 'ARV', value: formatCurrency(analysis.arv || 0) },
          { label: 'Purchase price', value: formatCurrency(analysis.purchasePrice || 0), isSubtraction: true },
          { label: 'Repairs', value: formatCurrency(analysis.repairCost || 0), isSubtraction: true },
          { label: 'Holding + Closing', value: formatCurrency((analysis.arv || 0) * 0.08), isSubtraction: true },
        ],
      };

  return (
    <View className="gap-3 mb-4">
      {/* MAO */}
      <MetricCard
        label="MAO"
        value={formatCurrency(analysis.mao)}
        icon={<DollarSign size={16} color={colors.success} />}
        confidence={getConfidence(!!analysis.arv, !!deal.property?.arv)}
        breakdown={maoBreakdown}
        actions={[
          { label: 'Override', onPress: () => onEvidencePress?.('mao'), variant: 'outline' },
          { label: 'View Comps', onPress: () => {}, variant: 'ghost' },
        ]}
        onEvidencePress={() => onEvidencePress?.('mao')}
      />

      {/* Profit / Cash Flow */}
      <MetricCard
        label={profitLabel}
        value={formatCurrency(profitValue)}
        icon={<TrendingUp size={16} color={colors.info} />}
        confidence={getConfidence(!!analysis.arv && !!analysis.repairCost, false)}
        breakdown={profitBreakdown}
        actions={[
          { label: 'Override', onPress: () => onEvidencePress?.('profit'), variant: 'outline' },
          { label: 'Scenarios', onPress: () => {}, variant: 'ghost' },
        ]}
        onEvidencePress={() => onEvidencePress?.('profit')}
      />

      {/* Risk Score */}
      <MetricCard
        label="Risk Score"
        value={riskScore !== undefined ? `${riskScore}/5` : '-'}
        icon={<Shield size={16} color={colors.warning} />}
        confidence={riskScore !== undefined ? (riskScore <= 2 ? 'high' : riskScore <= 3 ? 'medium' : 'low') : 'low'}
        breakdown={{
          formula: 'Data + Market + Structure',
          items: [
            { label: 'Data completeness', value: deal.property?.arv ? 'Good' : 'Missing' },
            { label: 'Market conditions', value: 'Stable' },
            { label: 'Deal structure', value: deal.strategy || 'Not set' },
          ],
        }}
        onEvidencePress={() => onEvidencePress?.('risk')}
      />
    </View>
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

  // Fetch conversations for this deal - Zone G Week 8
  const {
    conversations,
    isLoading: loadingConversations,
    refetch: refetchConversations,
  } = useDealConversations({
    dealId,
    leadId: deal?.lead_id,
  });

  // Get next action at component level (not inside callback - Rules of Hooks)
  const nextActionData = useNextAction(deal || undefined);

  // Focus Mode from context (synced across all screens)
  const { focusMode } = useFocusMode();

  // Local UI state
  const [showAddEventSheet, setShowAddEventSheet] = useState(false);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'underwrite' | 'offers' | 'conversations' | 'docs'>('overview');
  const [evidenceModal, setEvidenceModal] = useState<{
    visible: boolean;
    field: 'mao' | 'profit' | 'risk' | null;
  }>({ visible: false, field: null });

  // AI Suggestions state - Zone G Week 9
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Fetch AI suggestions when deal changes
  // Dependencies include all deal properties that affect suggestions
  useEffect(() => {
    if (!deal || isDealClosed(deal)) {
      setLoadingSuggestions(false);
      setSuggestions([]);
      return;
    }

    let mounted = true;
    setLoadingSuggestions(true);

    getSuggestionsForDeal(deal)
      .then((results) => {
        if (mounted) {
          setSuggestions(results);
        }
      })
      .catch((err) => {
        console.error('[DealCockpit] Error fetching suggestions:', err);
      })
      .finally(() => {
        if (mounted) {
          setLoadingSuggestions(false);
        }
      });

    return () => {
      mounted = false;
    };
    // Include deal properties used by getSuggestionsForDeal for suggestion generation
  }, [deal?.id, deal?.stage, deal?.lead_id, deal?.strategy, deal?.offers?.length, deal?.property?.repair_cost]);

  // Evidence modal handlers
  const handleEvidencePress = useCallback((field: 'mao' | 'profit' | 'risk') => {
    setEvidenceModal({ visible: true, field });
  }, []);

  const handleCloseEvidenceModal = useCallback(() => {
    setEvidenceModal({ visible: false, field: null });
  }, []);

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
    setShowActionsSheet(true);
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

    const nextStageConfig = DEAL_STAGE_CONFIG[nextStages[0]] || { label: nextStages[0] || 'Next', color: 'bg-gray-500', order: 0 };
    Alert.alert(
      'Advance Stage',
      `Move to ${nextStageConfig.label}?`,
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

  // AI Suggestion handlers - Zone G Week 9
  const handleSuggestionAction = useCallback((suggestion: AISuggestion) => {
    // Route to appropriate action based on category
    switch (suggestion.category) {
      case 'contact':
      case 'followup':
        handleCallSeller();
        break;
      case 'walkthrough':
        handleWalkthrough();
        break;
      case 'underwrite':
      case 'analyze':
        handleUnderwrite();
        break;
      case 'offer':
        handleOffer();
        break;
      case 'document':
        handleDocs();
        break;
      default:
        Alert.alert('Action', suggestion.action, [{ text: 'OK' }]);
    }
  }, [handleCallSeller, handleWalkthrough, handleUnderwrite, handleOffer, handleDocs]);

  const handleSuggestionDismiss = useCallback((suggestion: AISuggestion) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
  }, []);

  // Navigate to lead detail screen
  const handleLeadPress = useCallback(() => {
    if (!deal?.lead_id) return;
    router.push(`/(tabs)/leads/${deal.lead_id}`);
  }, [deal?.lead_id, router]);

  // Navigate to property detail screen (within deals stack - NativeTabs can't navigate to hidden tabs)
  const handlePropertyPress = useCallback(() => {
    if (!deal?.property_id) return;
    router.push(`/(tabs)/deals/property/${deal.property_id}`);
  }, [deal?.property_id, router]);

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

  // Tab labels for display
  const TAB_LABELS = {
    overview: 'Overview',
    underwrite: 'Underwrite',
    offers: 'Offers',
    conversations: 'Convos',
    docs: 'Docs',
  } as const;

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Entity Header with Context Switcher */}
      <EntityHeader
        context="deal"
        dealId={deal.id}
        propertyId={deal.property_id}
        hasLinkedProperty={!!deal.property_id}
        phoneNumber={deal.lead?.phone}
        onMore={handleMoreOptions}
        onLinkProperty={() => {
          Alert.alert('Link Property', 'Property linking coming soon!', [{ text: 'OK' }]);
        }}
      />

      {/* Main ScrollView with sticky tabs */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: FAB_BOTTOM_OFFSET + FAB_SIZE + 16,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        {/* Sticky Header Group: Tabs + StageStepper */}
        <View style={{ backgroundColor: colors.background, paddingBottom: 8 }}>
          {/* Tab Bar - Pressable-based matching PropertyDetailScreen */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row rounded-xl p-1" style={{ backgroundColor: colors.muted }}>
                {(['overview', 'underwrite', 'offers', 'conversations', 'docs'] as const).map((tab) => (
                  <Pressable
                    key={tab}
                    onPress={() => {
                      if (activeTab !== tab) {
                        haptic.selection();
                        setActiveTab(tab);
                      }
                    }}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: activeTab === tab }}
                    accessibilityLabel={`${TAB_LABELS[tab]} tab`}
                    style={[
                      { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
                      activeTab === tab && {
                        backgroundColor: colors.background,
                        ...getShadowStyle(colors, { size: 'sm' }),
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '500',
                        color: activeTab === tab ? colors.foreground : colors.mutedForeground,
                      }}
                    >
                      {TAB_LABELS[tab]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Stage Stepper - compact progress pill with stage selector */}
          <StageStepper
            currentStage={deal.stage}
            dealId={deal.id}
            onStagePress={handleStageChange}
          />
        </View>

        {/* Tab Content */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* Breadcrumb: Lead > Property + Strategy badge */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                {/* Lead Name - clickable */}
                <TouchableOpacity
                  onPress={handleLeadPress}
                  disabled={!deal.lead_id}
                  style={{ flexShrink: 0 }}
                  accessibilityLabel={`View ${getDealLeadName(deal)} profile`}
                  accessibilityRole="link"
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: deal.lead_id ? colors.primary : colors.foreground,
                    }}
                    numberOfLines={1}
                  >
                    {getDealLeadName(deal)}
                  </Text>
                </TouchableOpacity>

                {/* Separator */}
                <ChevronRight size={12} color={colors.mutedForeground} style={{ marginHorizontal: 4, flexShrink: 0 }} />

                {/* Property Address - clickable, truncates */}
                <TouchableOpacity
                  onPress={handlePropertyPress}
                  disabled={!deal.property_id}
                  style={{ flex: 1, minWidth: 0 }}
                  accessibilityLabel={`View property at ${getDealAddress(deal)}`}
                  accessibilityRole="link"
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: deal.property_id ? colors.primary : colors.mutedForeground,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {getDealAddress(deal)}
                  </Text>
                </TouchableOpacity>

                {/* Strategy badge */}
                {deal.strategy && (
                  <View
                    style={{
                      marginLeft: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 10,
                      backgroundColor: withOpacity(colors.secondary, 'medium'),
                      flexShrink: 0,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '500', color: colors.secondaryForeground }}>
                      {DEAL_STRATEGY_CONFIG[deal.strategy].label}
                    </Text>
                  </View>
                )}
              </View>

              {/* Next Action Button */}
              <NextActionButton deal={deal} onPress={handleNextAction} />

              {/* AI Suggestions - Zone G Week 9 */}
              {suggestions.length > 0 && !focusMode && (
                <View className="mb-4">
                  <SuggestionList
                    suggestions={suggestions}
                    onAction={handleSuggestionAction}
                    onDismiss={handleSuggestionDismiss}
                    title="AI Suggestions"
                    maxVisible={3}
                  />
                </View>
              )}

              {/* Key Metrics - Zone G Progressive Disclosure */}
              <DealMetrics deal={deal} onEvidencePress={handleEvidencePress} />

              {/* Deal Timeline */}
              <View className="mt-4">
                <DealTimeline
                  dealId={deal.id}
                  keyEventsOnly={focusMode}
                  maxEvents={focusMode ? 3 : undefined}
                  onAddActivity={handleAddActivity}
                />
              </View>
            </>
          )}

          {/* Underwrite Tab Content */}
          {activeTab === 'underwrite' && (
            <View className="flex-1 items-center justify-center p-4 pt-12">
              <Calculator size={48} color={colors.mutedForeground} />
              <Text className="text-lg font-semibold mt-4" style={{ color: colors.foreground }}>
                Quick Underwrite
              </Text>
              <Text className="text-sm text-center mt-2" style={{ color: colors.mutedForeground }}>
                Detailed analysis with MAO, profit projections, and financing scenarios
              </Text>
              <Button className="mt-4" onPress={handleUnderwrite}>
                Open Full Analysis
              </Button>
            </View>
          )}

          {/* Offers Tab Content */}
          {activeTab === 'offers' && (
            <>
              {/* Offer Package Card */}
              <TouchableOpacity
                onPress={handleOffer}
                className="rounded-xl p-4 mb-3"
                style={{ backgroundColor: colors.card }}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}
                  >
                    <FileText size={20} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-base font-semibold" style={{ color: colors.foreground }}>
                        Offer Package
                      </Text>
                      {getOfferStatus.label && (
                        <View
                          className="ml-2 px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: getOfferStatus.color || withOpacity(colors.primary, 'light') }}
                        >
                          <Text
                            className="text-xs font-medium"
                            style={{ color: getOfferStatus.color ? colors.primaryForeground : colors.primary }}
                          >
                            {getOfferStatus.label}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                      {deal.offers?.length
                        ? `${deal.offers.length} offer(s) created`
                        : 'Create and send offers'}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.mutedForeground} />
                </View>
              </TouchableOpacity>

              {/* Offer History */}
              {deal.offers && deal.offers.length > 0 && (
                <View className="mt-4">
                  <Text className="text-sm font-medium mb-2" style={{ color: colors.mutedForeground }}>
                    OFFER HISTORY
                  </Text>
                  {deal.offers.map((offer, index) => (
                    <View
                      key={offer.id || index}
                      className="p-3 rounded-lg mb-2"
                      style={{ backgroundColor: colors.card }}
                    >
                      <Text style={{ color: colors.foreground }}>
                        Offer #{index + 1}: ${offer.offer_amount?.toLocaleString() || 'N/A'}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                        Status: {offer.status || 'Draft'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Conversations Tab Content */}
          {activeTab === 'conversations' && (
            <ConversationsView
              items={conversations}
              isLoading={loadingConversations}
              onRefresh={refetchConversations}
              onAddConversation={(type) => {
                Alert.alert('Add Conversation', `Would add ${type}`, [{ text: 'OK' }]);
              }}
              onItemPress={(item) => {
                Alert.alert('Conversation', item.content || item.transcript || 'No content', [{ text: 'OK' }]);
              }}
            />
          )}

          {/* Docs Tab Content */}
          {activeTab === 'docs' && (
            <TouchableOpacity
              onPress={handleDocs}
              className="rounded-xl p-4 mb-3"
              style={{ backgroundColor: colors.card }}
            >
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}
                >
                  <Folder size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold" style={{ color: colors.foreground }}>
                    Documents
                  </Text>
                  <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                    Contracts, disclosures, and files
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Deal Closed Banner - Fixed at bottom */}
      {isDealClosed(deal) && (
        <View
          className="mx-4 mb-4 rounded-xl p-4 flex-row items-center"
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

      {/* Deal Actions Sheet */}
      <DealActionsSheet
        deal={deal}
        isOpen={showActionsSheet}
        onClose={() => setShowActionsSheet(false)}
        onEdit={() => {
          Alert.alert('Edit Deal', 'Edit deal functionality coming soon!', [{ text: 'OK' }]);
        }}
        onDelete={() => {
          Alert.alert(
            'Delete Deal',
            'Are you sure you want to delete this deal? This action cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  Alert.alert('Delete', 'Delete functionality coming soon!');
                },
              },
            ]
          );
        }}
      />

      {/* Evidence Trail Modal - Zone G */}
      <EvidenceTrailModal
        visible={evidenceModal.visible}
        onClose={handleCloseEvidenceModal}
        fieldName={
          evidenceModal.field === 'mao' ? 'Maximum Allowable Offer' :
          evidenceModal.field === 'profit' ? 'Profit / Cash Flow' :
          evidenceModal.field === 'risk' ? 'Risk Score' : ''
        }
        currentValue={
          evidenceModal.field === 'mao' ? '$0' :
          evidenceModal.field === 'profit' ? '$0' : '0/5'
        }
        confidence="medium"
        sources={[
          {
            id: '1',
            source: 'AI Estimate',
            value: 'Calculated from property data',
            confidence: 'medium',
            timestamp: new Date().toISOString(),
            isActive: true,
          },
        ]}
        onOverride={(value) => {
          Alert.alert('Override', `Would set value to: ${value}`);
          handleCloseEvidenceModal();
        }}
      />
    </ThemedSafeAreaView>
  );
}

export default DealCockpitScreen;
