// src/features/deals/screens/OfferBuilderScreen.tsx
// Screen for building and previewing offers

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, Eye, Edit3 } from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { LoadingSpinner } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
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

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-1"
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
              Offer Builder
            </Text>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              {DEAL_STRATEGY_CONFIG[strategy].label}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
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
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
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

      {/* Bottom action bar */}
      <View
        className="absolute bottom-0 left-0 right-0 p-4"
        style={{ backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border }}
      >
        <TouchableOpacity
          onPress={toggleViewMode}
          className="py-3 rounded-lg items-center"
          style={{ backgroundColor: colors.primary }}
          accessibilityLabel={viewMode === 'edit' ? 'Preview scripts' : 'Back to editing'}
          accessibilityRole="button"
        >
          <Text className="text-base font-semibold" style={{ color: colors.primaryForeground }}>
            {viewMode === 'edit' ? 'Preview Scripts & Email' : 'Back to Edit'}
          </Text>
        </TouchableOpacity>
      </View>
    </ThemedSafeAreaView>
  );
}

export default OfferBuilderScreen;
