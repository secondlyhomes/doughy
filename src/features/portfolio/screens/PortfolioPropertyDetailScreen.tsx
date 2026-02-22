// src/features/portfolio/screens/PortfolioPropertyDetailScreen.tsx
// Portfolio property detail screen with tabs for Performance, Financials, Debt, Valuations, Docs

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Redirect, Stack } from 'expo-router';
import { MoreVertical } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import {
  LoadingSpinner,
  TAB_BAR_SAFE_PADDING,
} from '@/components/ui';
import { useNativeHeader } from '@/hooks';
import { usePortfolioProperty } from '../hooks/usePortfolioProperty';
import { usePortfolioPerformance } from '../hooks/usePortfolioPerformance';
import { PortfolioActionsSheet } from '../components/PortfolioActionsSheet';
import { PropertyInfoHeader } from './portfolio-property-detail/PropertyInfoHeader';
import { PropertyDetailTabs } from './portfolio-property-detail/PropertyDetailTabs';
import { UUID_REGEX } from './portfolio-property-detail/portfolio-property-detail-types';
import type { TabValue } from './portfolio-property-detail/portfolio-property-detail-types';

export function PortfolioPropertyDetailScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const router = useRouter();
  const colors = useThemeColors();

  const [activeTab, setActiveTab] = useState<TabValue>('performance');
  const [refreshing, setRefreshing] = useState(false);
  const [showActionsSheet, setShowActionsSheet] = useState(false);

  // Check if propertyId is a valid UUID (hooks must be called before any returns)
  const isValidUUID = Boolean(propertyId && UUID_REGEX.test(propertyId));

  // Call hooks unconditionally (they should handle invalid IDs gracefully)
  const {
    entry,
    property,
    group,
    portfolioEntryId,
    isLoading,
    error,
    refetch,
    removeEntry,
    isRemoving,
  } = usePortfolioProperty(isValidUUID ? propertyId : '');

  const {
    performance,
    benchmark,
    refetch: refetchPerformance,
  } = usePortfolioPerformance(portfolioEntryId);

  // Native header with actions
  const { headerOptions } = useNativeHeader({
    title: 'Portfolio Property',
    fallbackRoute: '/(tabs)/pipeline',
    rightAction: property ? (
      <TouchableOpacity onPress={() => setShowActionsSheet(true)} style={{ padding: 8 }}>
        <MoreVertical size={24} color={colors.foreground} />
      </TouchableOpacity>
    ) : undefined,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchPerformance()]);
    } catch (error) {
      console.error('[PortfolioPropertyDetailScreen] Refresh failed:', error);
      Alert.alert('Refresh Failed', 'Could not refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refetchPerformance]);

  const handleTabChange = useCallback((value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(value as TabValue);
  }, []);

  const handleRemove = useCallback(async () => {
    try {
      await removeEntry();
      router.back();
    } catch (error) {
      console.error('[PortfolioPropertyDetailScreen] Failed to remove entry:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to remove property: ${message}`);
    }
  }, [removeEntry, router]);

  // Guard against invalid UUIDs (e.g., "add" being captured by this route)
  // Must come AFTER all hook calls to follow React's rules of hooks
  if (!isValidUUID) {
    return <Redirect href="/(tabs)/pipeline" />;
  }

  if (isLoading && !property) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <LoadingSpinner fullScreen text="Loading property..." />
        </ThemedSafeAreaView>
      </>
    );
  }

  if (error || !property) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <View className="flex-1 items-center justify-center p-4">
            <Text style={{ color: colors.mutedForeground, textAlign: 'center' }}>
              {error?.message || 'Property not found in portfolio'}
            </Text>
          </View>
        </ThemedSafeAreaView>
      </>
    );
  }

  const address = property.address_line_1 || property.address || '';
  const cityStateZip = [property.city, property.state, property.zip].filter(Boolean).join(', ');

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
        {/* Property Info Header */}
        <PropertyInfoHeader
          address={address}
          cityStateZip={cityStateZip}
          entry={entry}
          group={group}
          performance={performance}
          colors={colors}
        />

        {/* Tab Navigation */}
        <PropertyDetailTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          portfolioEntryId={portfolioEntryId}
          propertyId={propertyId}
          entry={entry}
          performance={performance}
          benchmark={benchmark}
          colors={colors}
        />
        </ScrollView>

        {/* Actions Sheet */}
        <PortfolioActionsSheet
          isOpen={showActionsSheet}
          onClose={() => setShowActionsSheet(false)}
          onRemove={handleRemove}
          isRemoving={isRemoving}
          propertyAddress={address}
        />
      </ThemedSafeAreaView>
    </>
  );
}

export default PortfolioPropertyDetailScreen;
