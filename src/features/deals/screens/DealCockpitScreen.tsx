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
  MessageSquare,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { useFocusMode } from '@/context/FocusModeContext';
import { getShadowStyle, withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import {
  Button,
  LoadingSpinner,
  TAB_BAR_SAFE_PADDING,
  FAB_BOTTOM_OFFSET,
  FAB_SIZE,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
} from '@/components/ui';
import { MetricCard, EvidenceTrailModal } from '@/components/deals';
import { useDeal, useUpdateDealStage } from '../hooks/useDeals';
import { useNextAction, getActionButtonText, getActionIcon } from '../hooks/useNextAction';
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
  getRiskScoreColor,
  isDealClosed,
  getNextStages,
} from '../types';
import { DealTimeline } from '../components/DealTimeline';
import { AddDealEventSheet } from '../components/AddDealEventSheet';
import { StageStepper } from '../components/StageStepper';
import { SuggestionList } from '../components/SuggestionCard';
import { getSuggestionsForDeal, AISuggestion } from '../services/aiSuggestions';
import { ConversationsView, ConversationType } from '@/features/conversations/components';
import { useDealConversations } from '@/features/conversations/hooks';
import { SmartBackButton } from '@/components/navigation';
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
  // Handle unknown stages from database
  const config = DEAL_STAGE_CONFIG[stage] || { label: stage || 'Unknown', color: 'bg-gray-500', order: 0 };

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
  const { focusMode, toggleFocusMode } = useFocusMode();

  // Local UI state
  const [showAddEventSheet, setShowAddEventSheet] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [evidenceModal, setEvidenceModal] = useState<{
    visible: boolean;
    field: 'mao' | 'profit' | 'risk' | null;
  }>({ visible: false, field: null });

  // AI Suggestions state - Zone G Week 9
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Fetch AI suggestions when deal changes
  useEffect(() => {
    if (!deal || isDealClosed(deal)) return;

    let mounted = true;
    setLoadingSuggestions(true);

    getSuggestionsForDeal(deal)
      .then((results) => {
        if (mounted) {
          setSuggestions(results);
        }
      })
      .catch((error) => {
        console.error('[DealCockpit] Error fetching suggestions:', error);
      })
      .finally(() => {
        if (mounted) {
          setLoadingSuggestions(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [deal?.id, deal?.stage]);

  // Evidence modal handlers
  const handleEvidencePress = useCallback((field: 'mao' | 'profit' | 'risk') => {
    setEvidenceModal({ visible: true, field });
  }, []);

  const handleCloseEvidenceModal = useCallback(() => {
    setEvidenceModal({ visible: false, field: null });
  }, []);

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
  }, []);

  const handleSuggestionDismiss = useCallback((suggestion: AISuggestion) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
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

  // Navigate to lead detail screen
  const handleLeadPress = useCallback(() => {
    if (!deal?.lead_id) return;
    router.push(`/(tabs)/leads/${deal.lead_id}`);
  }, [deal?.lead_id, router]);

  // Navigate to property detail screen
  const handlePropertyPress = useCallback(() => {
    if (!deal?.property_id) return;
    router.push(`/(tabs)/properties/${deal.property_id}`);
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
      {/* Breadcrumbs - Zone G */}
      <View className="px-4 pt-2">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink onPress={() => router.push('/(tabs)/deals')}>
              Deals
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage>{getDealAddress(deal) || 'Deal'}</BreadcrumbPage>
          </BreadcrumbItem>
        </Breadcrumb>
      </View>

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <SmartBackButton variant="default" />

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

      {/* Stage Stepper - Zone G Week 7 */}
      <View className="px-4 pb-2">
        <StageStepper
          currentStage={deal.stage}
          dealId={deal.id}
          onStagePress={handleStageChange}
          compact
        />
      </View>

      {/* Tabbed Interface - Zone G */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <View className="px-4 pb-2">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="underwrite">Underwrite</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
            <TabsTrigger value="conversations">Convos</TabsTrigger>
            <TabsTrigger value="docs">Docs</TabsTrigger>
          </TabsList>
        </View>

        {/* Overview Tab */}
        <TabsContent value="overview" className="flex-1">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              padding: 16,
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
          >
            {/* Lead & Property Info - Clickable for navigation */}
            <View className="mb-4">
              <TouchableOpacity
                onPress={handleLeadPress}
                className="flex-row items-center mb-1"
                disabled={!deal.lead_id}
                accessibilityLabel={`View ${getDealLeadName(deal)} profile`}
                accessibilityRole="link"
              >
                <User size={14} color={colors.mutedForeground} />
                <Text className="text-lg font-bold ml-2" style={{ color: deal.lead_id ? colors.primary : colors.foreground }}>
                  {getDealLeadName(deal)}
                </Text>
                {deal.lead_id && <ChevronRight size={16} color={colors.primary} style={{ marginLeft: 4 }} />}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePropertyPress}
                className="flex-row items-center"
                disabled={!deal.property_id}
                accessibilityLabel={`View property at ${getDealAddress(deal)}`}
                accessibilityRole="link"
              >
                <MapPin size={14} color={colors.mutedForeground} />
                <Text className="text-sm ml-2" style={{ color: deal.property_id ? colors.primary : colors.mutedForeground }}>
                  {getDealAddress(deal)}
                </Text>
                {deal.property_id && <ChevronRight size={14} color={colors.primary} style={{ marginLeft: 4 }} />}
              </TouchableOpacity>
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

            {/* Action Cards - Collapsed in Focus Mode */}
            {!focusMode && (
              <>
                <Text className="text-sm font-medium mb-2 mt-2" style={{ color: colors.mutedForeground }}>
                  QUICK ACTIONS
                </Text>

                <ActionCard
                  title="Quick Underwrite"
                  subtitle="MAO, profit, and financing scenarios"
                  icon={<Calculator size={20} color={colors.primary} />}
                  onPress={handleUnderwrite}
                />

                <ActionCard
                  title="Walkthrough"
                  subtitle={getWalkthroughStatus.subtitle}
                  icon={<Camera size={20} color={colors.primary} />}
                  onPress={handleWalkthrough}
                  badge={deal.walkthrough ? getWalkthroughStatus.label : undefined}
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
          </ScrollView>
        </TabsContent>

        {/* Underwrite Tab */}
        <TabsContent value="underwrite" className="flex-1">
          <View className="flex-1 items-center justify-center p-4">
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
        </TabsContent>

        {/* Offers Tab */}
        <TabsContent value="offers" className="flex-1">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
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
                      Offer #{index + 1}: ${offer.amount?.toLocaleString() || 'N/A'}
                    </Text>
                    <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                      Status: {offer.status || 'Draft'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </TabsContent>

        {/* Conversations Tab - Zone G Week 8 */}
        <TabsContent value="conversations" className="flex-1">
          <ConversationsView
            items={conversations}
            isLoading={loadingConversations}
            onRefresh={refetchConversations}
            onAddConversation={(type) => {
              // TODO: Open appropriate modal based on type
              Alert.alert('Add Conversation', `Would add ${type}`, [{ text: 'OK' }]);
            }}
            onItemPress={(item) => {
              // TODO: Navigate to conversation detail
              Alert.alert('Conversation', item.content || item.transcript || 'No content', [{ text: 'OK' }]);
            }}
          />
        </TabsContent>

        {/* Docs Tab */}
        <TabsContent value="docs" className="flex-1">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <ActionCard
              title="Documents"
              subtitle="Contracts, disclosures, and files"
              icon={<Folder size={20} color={colors.primary} />}
              onPress={handleDocs}
            />
          </ScrollView>
        </TabsContent>
      </Tabs>

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
