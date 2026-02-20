// src/features/deals/screens/DealCockpitScreen.tsx
// Deal Cockpit - The main "Apple screen" for managing a single deal
// Components extracted to ./cockpit/ for maintainability

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { haptic } from '@/lib/haptics';
import { BORDER_RADIUS, ICON_SIZES, SPACING } from '@/constants/design-tokens';
import {
  Calculator,
  Folder,
  AlertCircle,
  Check,
  ChevronRight,
  MoreHorizontal,
  ChevronLeft,
  Handshake,
  Building2,
  Plus,
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
import { ContextSwitcher, type ContextOption } from '@/components/ui/ContextSwitcher';
import { EvidenceTrailModal } from '@/components/deals';
import { useDeal } from '../hooks/useDeals';
import { getDealAddress, isDealClosed } from '../types';
import { formatDate } from '@/lib/formatters';
import {
  DealTimeline,
  AddDealEventSheet,
  StageStepper,
  DealActionsSheet,
} from '../components';

import { DealAssistant } from '@/features/assistant/components';
import { useDealCockpitHandlers, OverviewTab, OffersTab } from './cockpit';

// Tab labels constant
const TAB_LABELS = {
  overview: 'Overview',
  underwrite: 'Underwrite',
  offers: 'Offers',
  docs: 'Docs',
} as const;

type TabKey = keyof typeof TAB_LABELS;

export function DealCockpitScreen() {
  const params = useLocalSearchParams();
  const dealId = params.dealId as string;
  const colors = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { deal, isLoading, error, refetch } = useDeal(dealId);

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
  } = useDealCockpitHandlers({ deal });

  // Local UI state
  const [showAddEventSheet, setShowAddEventSheet] = useState(false);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Build context options for Deal | Property switcher
  const hasLinkedProperty = !!deal?.property_id;
  const contextOptions = useMemo<ContextOption[]>(() => {
    return [
      {
        id: 'deal',
        label: 'Deal',
        icon: <Handshake size={14} color={colors.foreground} />,
      },
      {
        id: 'property',
        label: 'Property',
        icon: <Building2 size={14} color={hasLinkedProperty ? colors.mutedForeground : colors.mutedForeground} />,
        disabled: !hasLinkedProperty,
        disabledReason: 'No property linked',
      },
    ];
  }, [hasLinkedProperty, colors]);

  // Handle context switch to property
  const handleContextSwitch = useCallback(
    (newContextId: string) => {
      if (newContextId === 'deal') return;
      if (newContextId === 'property' && deal?.property_id) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
          pathname: `/(tabs)/deals/property/${deal.property_id}` as any,
          params: { fromDeal: dealId },
        });
      }
    },
    [deal?.property_id, dealId, router]
  );

  // Native header options with context switcher
  const headerOptions = useMemo(() => ({
    headerShown: true,
    headerStyle: { backgroundColor: colors.background },
    headerShadowVisible: false,
    headerStatusBarHeight: insets.top,
    headerTitle: () => (
      <View style={{ alignItems: 'center' }}>
        {hasLinkedProperty ? (
          <ContextSwitcher
            contexts={contextOptions}
            value="deal"
            onChange={handleContextSwitch}
            size="sm"
          />
        ) : (
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Link Property', 'Property linking coming soon!', [{ text: 'OK' }]);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: SPACING.xs,
              paddingHorizontal: SPACING.md,
              borderRadius: 20,
              backgroundColor: colors.muted,
            }}
          >
            <Plus size={14} color={colors.primary} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary, marginLeft: SPACING.xs }}>
              Link Property
            </Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    headerLeft: () => (
      <TouchableOpacity
        onPress={handleBack}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: `${colors.muted}80`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ChevronLeft size={24} color={colors.foreground} />
      </TouchableOpacity>
    ),
    headerRight: () => (
      <TouchableOpacity onPress={() => setShowActionsSheet(true)} style={{ padding: SPACING.sm }}>
        <MoreHorizontal size={ICON_SIZES.lg} color={colors.foreground} />
      </TouchableOpacity>
    ),
  }), [colors, insets.top, hasLinkedProperty, contextOptions, handleContextSwitch, handleBack]);
  const [evidenceModal, setEvidenceModal] = useState<{
    visible: boolean;
    field: 'mao' | 'profit' | 'risk' | null;
  }>({ visible: false, field: null });

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

  // Loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <LoadingSpinner fullScreen text="Loading deal..." />
        </ThemedSafeAreaView>
      </>
    );
  }

  // Error state
  if (error || !deal) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView
          className="flex-1 items-center justify-center px-4"
          edges={[]}
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
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>
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
              onNextAction={handleNextAction}
              onEvidencePress={handleEvidencePress}
              onAddActivity={() => setShowAddEventSheet(true)}
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
                  ? `Closed on ${formatDate(deal.updated_at)}`
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
    </>
  );
}

export default DealCockpitScreen;
