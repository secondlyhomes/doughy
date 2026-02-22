// src/features/pipeline/screens/PipelineScreen.tsx
// Unified Pipeline screen for RE Investor platform
// Combines Leads, Deals, and Portfolio into one tabbed view
// Apple-like simplicity with ADHD-friendly focus

import React, { useState, useCallback } from 'react';
import { View, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { ThemedSafeAreaView } from '@/components';
import { SearchBar, SimpleFAB } from '@/components/ui';
import { SPACING } from '@/constants/design-tokens';
import { useDebounce } from '@/hooks';

import { AddToPortfolioSheet } from '@/features/portfolio/components';
import type { AddToPortfolioInput } from '@/features/portfolio/types';

// Investor attention system
import { InvestorNeedsAttention } from '../components/InvestorNeedsAttention';
import { useInvestorAttention } from '../hooks/useInvestorAttention';

// Extracted components
import {
  type PipelineSegment,
  SegmentControl,
  AddLeadSheet,
  FiltersSheet,
  PipelineListContent,
  usePipelineData,
} from './pipeline';

export function PipelineScreen() {
  const router = useRouter();

  // Investor attention items
  const { items: attentionItems, isLoading: attentionLoading } = useInvestorAttention();

  // State
  const [activeSegment, setActiveSegment] = useState<PipelineSegment>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);

  // Add Lead Sheet state
  const [showAddLeadSheet, setShowAddLeadSheet] = useState(false);
  const [showAddPortfolioSheet, setShowAddPortfolioSheet] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');

  // Data
  const {
    counts,
    currentData,
    isLoading,
    handleRefresh,
    createLead,
    addManualEntry,
    isAddingManual,
  } = usePipelineData(activeSegment, debouncedSearch);

  // FAB action based on active segment
  const handleFABPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeSegment === 'leads') {
      setShowAddLeadSheet(true);
    } else if (activeSegment === 'deals') {
      router.push('/(tabs)/pipeline/deal/new');
    } else {
      setShowAddPortfolioSheet(true);
    }
  }, [activeSegment, router]);

  // Quick add lead
  const handleQuickAddLead = useCallback(async () => {
    if (!newLeadName.trim()) return;

    try {
      await createLead.mutateAsync({
        name: newLeadName.trim(),
        phone: newLeadPhone.trim() || undefined,
        email: newLeadEmail.trim() || undefined,
        status: 'new',
      });

      setNewLeadName('');
      setNewLeadPhone('');
      setNewLeadEmail('');
      setShowAddLeadSheet(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to create lead:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Failed to Add Lead',
        error instanceof Error ? error.message : 'Unable to create the lead. Please try again.'
      );
    }
  }, [newLeadName, newLeadPhone, newLeadEmail, createLead]);

  // Add to portfolio handler
  const handleAddToPortfolio = useCallback(async (data: AddToPortfolioInput) => {
    try {
      await addManualEntry(data);
      setShowAddPortfolioSheet(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to add to portfolio:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Failed to Add Property',
        error instanceof Error ? error.message : 'Unable to add property to portfolio. Please try again.'
      );
    }
  }, [addManualEntry]);

  const hasActiveFilters = searchQuery.trim().length > 0;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        {/* Needs Attention */}
        {(attentionItems.length > 0 || attentionLoading) && (
          <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm }}>
            <InvestorNeedsAttention items={attentionItems} isLoading={attentionLoading} />
          </View>
        )}

        {/* Header - in normal flow */}
        <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.sm }}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search ${activeSegment}...`}
            size="md"
            glass={true}
            onFilter={() => setShowFiltersSheet(true)}
            hasActiveFilters={hasActiveFilters}
          />
        </View>
        <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
          <SegmentControl value={activeSegment} onChange={setActiveSegment} counts={counts} />
        </View>

        {/* Content */}
        <PipelineListContent
          activeSegment={activeSegment}
          currentData={currentData}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onRefresh={handleRefresh}
          onClearSearch={() => setSearchQuery('')}
          onFABPress={handleFABPress}
        />

        {/* FAB */}
        <SimpleFAB
          onPress={handleFABPress}
          accessibilityLabel={`Add new ${activeSegment.slice(0, -1)}`}
        />

        {/* Add Lead Sheet */}
        <AddLeadSheet
          visible={showAddLeadSheet}
          onClose={() => setShowAddLeadSheet(false)}
          newLeadName={newLeadName}
          onNameChange={setNewLeadName}
          newLeadPhone={newLeadPhone}
          onPhoneChange={setNewLeadPhone}
          newLeadEmail={newLeadEmail}
          onEmailChange={setNewLeadEmail}
          onSubmit={handleQuickAddLead}
          isPending={createLead.isPending}
        />

        {/* Add to Portfolio Sheet */}
        <AddToPortfolioSheet
          visible={showAddPortfolioSheet}
          onClose={() => setShowAddPortfolioSheet(false)}
          onSubmit={handleAddToPortfolio}
          isLoading={isAddingManual}
        />

        {/* Filters Sheet */}
        <FiltersSheet
          visible={showFiltersSheet}
          onClose={() => setShowFiltersSheet(false)}
          onClearSearch={() => setSearchQuery('')}
        />
      </ThemedSafeAreaView>
    </GestureHandlerRootView>
  );
}

export default PipelineScreen;
