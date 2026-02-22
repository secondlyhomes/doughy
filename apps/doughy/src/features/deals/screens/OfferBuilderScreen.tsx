// src/features/deals/screens/OfferBuilderScreen.tsx
// Screen for building and previewing offers

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Save, Eye, Edit3 } from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { LoadingSpinner, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { FAB_BOTTOM_OFFSET, FAB_SIZE } from '@/components/ui/FloatingGlassTabBar';
import { FloatingActionButton, FABAction } from '@/features/layout/components/FloatingActionButton';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useNativeHeader } from '@/hooks';
import { DealStrategy, OfferTerms, DEAL_STRATEGY_CONFIG } from '../types';
import { getEmptyOfferTerms } from '../data/mockOffers';
import { StrategySelector } from '../components/StrategySelector';
import { OfferTermsForm } from '../components/OfferTermsForm';
import { OfferPreview } from '../components/OfferPreview';

type ViewMode = 'edit' | 'preview';

interface OfferBuilderScreenProps {
  dealId?: string;
}

export function OfferBuilderScreen({ dealId }: OfferBuilderScreenProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{ dealId: string }>();
  const colors = useThemeColors();
  const effectiveDealId = dealId || params.dealId || 'demo';

  // State
  const [strategy, setStrategy] = useState<DealStrategy>('cash');
  const [terms, setTerms] = useState<OfferTerms>(getEmptyOfferTerms('cash'));
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [isSaving, setIsSaving] = useState(false);

  // Handle strategy change
  const handleStrategyChange = useCallback((newStrategy: DealStrategy) => {
    setStrategy(newStrategy);
    setTerms(getEmptyOfferTerms(newStrategy));
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log('Saving offer:', { strategy, terms, dealId: effectiveDealId });

    setIsSaving(false);
    Alert.alert('Saved', 'Your offer has been saved as a draft.');
  }, [strategy, terms, effectiveDealId]);

  // Toggle view mode
  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === 'edit' ? 'preview' : 'edit'));
  }, []);

  const { headerOptions } = useNativeHeader({
    title: 'Offer Builder',
    subtitle: DEAL_STRATEGY_CONFIG[strategy].label,
    fallbackRoute: effectiveDealId !== 'demo' ? `/(tabs)/deals/${effectiveDealId}` : '/(tabs)/deals',
    rightAction: (
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          onPress={toggleViewMode}
          className="p-2"
          accessibilityLabel={viewMode === 'edit' ? 'Preview offer' : 'Edit offer'}
          accessibilityRole="button"
        >
          {viewMode === 'edit' ? (
            <Eye size={22} color={colors.primary} />
          ) : (
            <Edit3 size={22} color={colors.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          className="p-2"
          accessibilityLabel="Save offer"
          accessibilityRole="button"
        >
          {isSaving ? (
            <LoadingSpinner size="small" />
          ) : (
            <Save size={22} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>
    ),
  });

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>
        <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: FAB_BOTTOM_OFFSET + FAB_SIZE + 32,  // Clear the FAB
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Strategy selector */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>
            Offer Type
          </Text>
          <StrategySelector
            value={strategy}
            onChange={handleStrategyChange}
            disabled={viewMode === 'preview'}
          />
        </View>

        {/* Strategy description */}
        <View
          className="p-3 rounded-lg mb-4"
          style={{ backgroundColor: colors.muted }}
        >
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>
            {DEAL_STRATEGY_CONFIG[strategy].description}
          </Text>
        </View>

        {/* Edit mode: Show form */}
        {viewMode === 'edit' && (
          <OfferTermsForm
            strategy={strategy}
            terms={terms}
            onChange={setTerms}
          />
        )}

        {/* Preview mode: Show scripts */}
        {viewMode === 'preview' && (
          <OfferPreview
            strategy={strategy}
            terms={terms}
            sellerName="John Smith"
            yourName="Your Name"
            yourPhone="(555) 123-4567"
          />
        )}
      </ScrollView>

        {/* Floating Action Button with expandable options */}
        <FloatingActionButton
          actions={[
            {
              icon: viewMode === 'edit' ? <Eye size={20} color="white" /> : <Edit3 size={20} color="white" />,
              label: viewMode === 'edit' ? 'Preview Scripts & Email' : 'Back to Edit',
              onPress: toggleViewMode,
              color: colors.primary,
            },
            {
              icon: <Save size={20} color="white" />,
              label: 'Save Draft',
              onPress: handleSave,
              color: colors.success,
            },
          ]}
        />
      </ThemedSafeAreaView>
    </>
  );
}

export default OfferBuilderScreen;
