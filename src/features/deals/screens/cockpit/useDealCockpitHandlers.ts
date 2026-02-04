// src/features/deals/screens/cockpit/useDealCockpitHandlers.ts
// Custom hook for Deal Cockpit navigation and action handlers

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import type { Deal } from '../../types';
import { getNextStages, DEAL_STAGE_CONFIG } from '../../types';
import { useUpdateDealStage } from '../../hooks/useDeals';
import { useNextAction, type NextAction } from '../../hooks/useNextAction';
import type { AISuggestion } from '../../services/ai-suggestions';

interface UseDealCockpitHandlersProps {
  deal: Deal | null | undefined;
}

export function useDealCockpitHandlers({ deal }: UseDealCockpitHandlersProps) {
  const router = useRouter();
  const { mutate: updateStage } = useUpdateDealStage();
  const nextActionData = useNextAction(deal || undefined);

  // Navigation handlers
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleNextAction = useCallback(() => {
    if (!deal) return;
    Alert.alert(
      'Action',
      `Would execute: ${nextActionData?.action || 'No action'}`,
      [{ text: 'OK' }]
    );
  }, [deal, nextActionData]);

  const handleStageChange = useCallback(() => {
    if (!deal) return;
    const nextStages = getNextStages(deal.stage);
    if (nextStages.length === 0) {
      Alert.alert('Stage', 'This deal is at the final stage.', [{ text: 'OK' }]);
      return;
    }

    const nextStageConfig = DEAL_STAGE_CONFIG[nextStages[0]] || {
      label: nextStages[0] || 'Next',
      color: 'bg-gray-500',
      order: 0,
    };
    Alert.alert('Advance Stage', `Move to ${nextStageConfig.label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Advance',
        onPress: () => updateStage({ id: deal.id, stage: nextStages[0] }),
      },
    ]);
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
      Alert.alert('No Phone', 'No phone number available for this lead.', [
        { text: 'OK' },
      ]);
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
    router.push(`/(tabs)/deals/property/${deal.property_id}`);
  }, [deal?.property_id, router]);

  // AI Suggestion handlers
  const handleSuggestionAction = useCallback(
    (suggestion: AISuggestion) => {
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
    },
    [handleCallSeller, handleWalkthrough, handleUnderwrite, handleOffer, handleDocs]
  );

  return {
    nextActionData,
    handleBack,
    handleNextAction,
    handleStageChange,
    handleUnderwrite,
    handleOffer,
    handleWalkthrough,
    handleDocs,
    handleSellerReport,
    handleCallSeller,
    handleLeadPress,
    handlePropertyPress,
    handleSuggestionAction,
  };
}
