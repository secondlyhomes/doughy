// src/features/deals/screens/DealCockpitScreen.tsx
// Deal Cockpit - The main "Apple screen" for managing a single deal
// Components extracted to ./cockpit/ for maintainability

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from '@/lib/haptics';
import { BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import {
  Calculator,
  Folder,
  AlertCircle,
  Check,
  ChevronRight,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { getShadowStyle, withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import {
  Button,
  LoadingSpinner,
  FAB_BOTTOM_OFFSET,
  FAB_SIZE,
} from '@/components/ui';
import { EvidenceTrailModal } from '@/components/deals';
import { useDeal } from '../hooks/useDeals';
import { getDealAddress, isDealClosed } from '../types';
import {
  DealTimeline,
  AddDealEventSheet,
  StageStepper,
  DealActionsSheet,
} from '../components';
import { getSuggestionsForDeal, AISuggestion } from '../services/aiSuggestions';
import { ConversationsView } from '@/features/conversations/components';
import { useDealConversations } from '@/features/conversations/hooks';
import { EntityHeader } from '@/components/navigation';
import { DealAssistant } from '@/features/assistant/components';
import { useDealCockpitHandlers, OverviewTab, OffersTab } from './cockpit';

// Tab labels constant
const TAB_LABELS = {
  overview: 'Overview',
  underwrite: 'Underwrite',
  offers: 'Offers',
  conversations: 'Convos',
  docs: 'Docs',
} as const;

type TabKey = keyof typeof TAB_LABELS;

export function DealCockpitScreen() {
  const params = useLocalSearchParams();
  const dealId = params.dealId as string;
  const colors = useThemeColors();

  const { deal, isLoading, error, refetch } = useDeal(dealId);

  // Fetch conversations for this deal
  const {
    conversations,
    isLoading: loadingConversations,
    refetch: refetchConversations,
  } = useDealConversations({
    dealId,
    leadId: deal?.lead_id,
  });

  // Focus Mode from context
  const { focusMode } = useFocusMode();

  // Get handlers from custom hook
  const {
    handleBack,
    handleNextAction,
    handleStageChange,
    handleUnderwrite,
    handleOffer,
    handleDocs,
    handleLeadPress,
    handlePropertyPress,
    handleSuggestionAction,
  } = useDealCockpitHandlers({ deal });

  // Local UI state
  const [showAddEventSheet, setShowAddEventSheet] = useState(false);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [evidenceModal, setEvidenceModal] = useState<{
    visible: boolean;
    field: 'mao' | 'profit' | 'risk' | null;
  }>({ visible: false, field: null });

  // AI Suggestions state
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);

  // Fetch AI suggestions when deal changes
  useEffect(() => {
    if (!deal || isDealClosed(deal)) {
      setSuggestions([]);
      return;
    }

    let mounted = true;
    getSuggestionsForDeal(deal)
      .then((results) => {
        if (mounted) setSuggestions(results);
      })
      .catch((err) => {
        console.error('[DealCockpit] Error fetching suggestions:', err);
      });

    return () => {
      mounted = false;
    };
  }, [deal?.id, deal?.stage, deal?.lead_id, deal?.strategy]);

  // Evidence modal handlers
  const handleEvidencePress = useCallback(
    (field: 'mao' | 'profit' | 'risk') => {
      setEvidenceModal({ visible: true, field });
    },
    []
  );

  const handleCloseEvidenceModal = useCallback(() => {
    setEvidenceModal({ visible: false, field: null });
  }, []);

  const handleSuggestionDismiss = useCallback((suggestion: AISuggestion) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
  }, []);

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
      <ThemedSafeAreaView
        className="flex-1 items-center justify-center px-4"
        edges={['top']}
      >
        <AlertCircle size={ICON_SIZES['2xl']} color={colors.destructive} />
        <Text
          className="text-center mt-4 mb-4"
          style={{ color: colors.destructive }}
        >
          {error?.message || 'Deal not found'}
        </Text>
        <Button onPress={handleBack}>Go Back</Button>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Entity Header */}
      <EntityHeader
        context="deal"
        dealId={deal.id}
        propertyId={deal.property_id}
        hasLinkedProperty={!!deal.property_id}
        phoneNumber={deal.lead?.phone}
        onMore={() => setShowActionsSheet(true)}
        onLinkProperty={() => {
          Alert.alert('Link Property', 'Property linking coming soon!', [
            { text: 'OK' },
          ]);
        }}
      />

      {/* Main ScrollView */}
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
        {/* Sticky Header: Tabs + Stage */}
        <View style={{ backgroundColor: colors.background, paddingBottom: 8 }}>
          {/* Tab Bar */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View
                className="flex-row rounded-xl p-1"
                style={{ backgroundColor: colors.muted }}
              >
                {(Object.keys(TAB_LABELS) as TabKey[]).map((tab) => (
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
                      {
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        borderRadius: BORDER_RADIUS.lg,
                      },
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
                        color:
                          activeTab === tab
                            ? colors.foreground
                            : colors.mutedForeground,
                      }}
                    >
                      {TAB_LABELS[tab]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Stage Stepper */}
          <StageStepper
            currentStage={deal.stage}
            dealId={deal.id}
            onStagePress={handleStageChange}
          />
        </View>

        {/* Tab Content */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          {activeTab === 'overview' && (
            <OverviewTab
              deal={deal}
              suggestions={suggestions}
              onNextAction={handleNextAction}
              onEvidencePress={handleEvidencePress}
              onAddActivity={() => setShowAddEventSheet(true)}
              onSuggestionAction={handleSuggestionAction}
              onSuggestionDismiss={handleSuggestionDismiss}
              onLeadPress={handleLeadPress}
              onPropertyPress={handlePropertyPress}
              onRefetch={refetch}
            />
          )}

          {activeTab === 'underwrite' && (
            <View className="flex-1 items-center justify-center p-4 pt-12">
              <Calculator size={ICON_SIZES['2xl']} color={colors.mutedForeground} />
              <Text
                className="text-lg font-semibold mt-4"
                style={{ color: colors.foreground }}
              >
                Quick Underwrite
              </Text>
              <Text
                className="text-sm text-center mt-2"
                style={{ color: colors.mutedForeground }}
              >
                Detailed analysis with MAO, profit projections, and financing
                scenarios
              </Text>
              <Button className="mt-4" onPress={handleUnderwrite}>
                Open Full Analysis
              </Button>
            </View>
          )}

          {activeTab === 'offers' && (
            <OffersTab deal={deal} onOfferPress={handleOffer} />
          )}

          {activeTab === 'conversations' && (
            <ConversationsView
              items={conversations}
              isLoading={loadingConversations}
              onRefresh={refetchConversations}
              onAddConversation={(type) => {
                Alert.alert('Add Conversation', `Would add ${type}`, [
                  { text: 'OK' },
                ]);
              }}
              onItemPress={(item) => {
                Alert.alert(
                  'Conversation',
                  item.content || item.transcript || 'No content',
                  [{ text: 'OK' }]
                );
              }}
            />
          )}

          {activeTab === 'docs' && (
            <TouchableOpacity
              onPress={handleDocs}
              className="rounded-xl p-4 mb-3"
              style={{ backgroundColor: colors.card }}
            >
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{
                    backgroundColor: withOpacity(colors.primary, 'muted'),
                  }}
                >
                  <Folder size={ICON_SIZES.lg} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-base font-semibold"
                    style={{ color: colors.foreground }}
                  >
                    Documents
                  </Text>
                  <Text
                    className="text-sm"
                    style={{ color: colors.mutedForeground }}
                  >
                    Contracts, disclosures, and files
                  </Text>
                </View>
                <ChevronRight size={ICON_SIZES.lg} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Deal Closed Banner */}
      {isDealClosed(deal) && (
        <View
          className="mx-4 mb-4 rounded-xl p-4 flex-row items-center"
          style={{
            backgroundColor:
              deal.stage === 'closed_won'
                ? withOpacity(colors.success, 'light')
                : colors.muted,
          }}
        >
          <Check
            size={ICON_SIZES.xl}
            color={
              deal.stage === 'closed_won' ? colors.success : colors.mutedForeground
            }
          />
          <View className="ml-3">
            <Text
              className="font-semibold"
              style={{
                color:
                  deal.stage === 'closed_won'
                    ? colors.success
                    : colors.mutedForeground,
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

      {/* AI Assistant */}
      <DealAssistant dealId={deal.id} />

      {/* Add Event Sheet */}
      <AddDealEventSheet
        visible={showAddEventSheet}
        dealId={deal.id}
        dealAddress={getDealAddress(deal)}
        onClose={() => setShowAddEventSheet(false)}
        onSaved={refetch}
      />

      {/* Deal Actions Sheet */}
      <DealActionsSheet
        deal={deal}
        isOpen={showActionsSheet}
        onClose={() => setShowActionsSheet(false)}
        onEdit={() => {
          Alert.alert('Edit Deal', 'Edit deal functionality coming soon!', [
            { text: 'OK' },
          ]);
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

      {/* Evidence Trail Modal */}
      <EvidenceTrailModal
        visible={evidenceModal.visible}
        onClose={handleCloseEvidenceModal}
        fieldName={
          evidenceModal.field === 'mao'
            ? 'Maximum Allowable Offer'
            : evidenceModal.field === 'profit'
              ? 'Profit / Cash Flow'
              : evidenceModal.field === 'risk'
                ? 'Risk Score'
                : ''
        }
        currentValue={
          evidenceModal.field === 'mao'
            ? '$0'
            : evidenceModal.field === 'profit'
              ? '$0'
              : '0/5'
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
