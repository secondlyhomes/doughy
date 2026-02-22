// src/features/deals/screens/DealCockpitScreen.tsx
// Deal Cockpit — components extracted to ./cockpit/ for maintainability

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import { ICON_SIZES } from '@/constants/design-tokens';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import {
  Button,
  LoadingSpinner,
  FAB_BOTTOM_OFFSET,
  FAB_SIZE,
} from '@/components/ui';
import { useDeal } from '../hooks/useDeals';
import { isDealClosed } from '../types';
import { DealAssistant } from '@/features/assistant/components';
import {
  useDealCockpitHandlers,
  useCockpitHeader,
  CockpitTabBar,
  DealClosedBanner,
  CockpitModals,
  OverviewTab,
  OffersTab,
  UnderwriteTab,
  DocsTab,
} from './cockpit';
import type { TabKey } from './cockpit';

export function DealCockpitScreen() {
  const params = useLocalSearchParams();
  const dealId = params.dealId as string;
  const colors = useThemeColors();

  const { deal, isLoading, error, refetch } = useDeal(dealId);

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

  // Header configuration
  const { headerOptions } = useCockpitHeader({
    deal,
    dealId,
    handleBack,
    onShowActionsSheet: () => setShowActionsSheet(true),
  });

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
          <CockpitTabBar
            deal={deal}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onStagePress={handleStageChange}
          />

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
              <UnderwriteTab onUnderwrite={handleUnderwrite} />
            )}

            {activeTab === 'offers' && (
              <OffersTab deal={deal} onOfferPress={handleOffer} />
            )}

            {activeTab === 'docs' && (
              <DocsTab onDocsPress={handleDocs} />
            )}
          </View>
        </ScrollView>

        {/* Deal Closed Banner */}
        {isDealClosed(deal) && <DealClosedBanner deal={deal} />}

        {/* AI Assistant */}
        <DealAssistant dealId={deal.id} />

        {/* Modals & Sheets */}
        <CockpitModals
          deal={deal}
          showAddEventSheet={showAddEventSheet}
          onCloseAddEventSheet={() => setShowAddEventSheet(false)}
          showActionsSheet={showActionsSheet}
          onCloseActionsSheet={() => setShowActionsSheet(false)}
          evidenceModal={evidenceModal}
          onCloseEvidenceModal={handleCloseEvidenceModal}
          onRefetch={refetch}
        />
      </ThemedSafeAreaView>
    </>
  );
}

export default DealCockpitScreen;
