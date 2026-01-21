// src/features/portfolio/screens/PortfolioPropertyDetailScreen.tsx
// Portfolio property detail screen with tabs for Performance, Financials, Debt, Valuations, Docs

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, Briefcase } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/context/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import {
  LoadingSpinner,
  TAB_BAR_SAFE_PADDING,
  Badge,
} from '@/components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { EntityHeader } from '@/components/navigation/EntityHeader';
import { SPACING } from '@/constants/design-tokens';
import { usePortfolioProperty } from '../hooks/usePortfolioProperty';
import { usePortfolioPerformance } from '../hooks/usePortfolioPerformance';
import { PortfolioPerformanceTab } from '../components/tabs/PortfolioPerformanceTab';
import { PortfolioFinancialsTab } from '../components/tabs/PortfolioFinancialsTab';
import { PortfolioDebtTab } from '../components/tabs/PortfolioDebtTab';
import { PortfolioValuationsTab } from '../components/tabs/PortfolioValuationsTab';
import { PortfolioDocsTab } from '../components/tabs/PortfolioDocsTab';
import { PortfolioActionsSheet } from '../components/PortfolioActionsSheet';

type TabValue = 'performance' | 'financials' | 'debt' | 'valuations' | 'docs';

export function PortfolioPropertyDetailScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabValue>('performance');
  const [refreshing, setRefreshing] = useState(false);
  const [showActionsSheet, setShowActionsSheet] = useState(false);

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
  } = usePortfolioProperty(propertyId);

  const {
    performance,
    benchmark,
    refetch: refetchPerformance,
  } = usePortfolioPerformance(portfolioEntryId);

  // Calculate ownership duration
  const ownershipDuration = useMemo(() => {
    if (!entry?.acquisition_date) return null;

    const start = new Date(entry.acquisition_date);
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) {
      return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''} owned`;
    }
    if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''} owned`;
    }
    return `${years}y ${remainingMonths}m owned`;
  }, [entry?.acquisition_date]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchPerformance()]);
    setRefreshing(false);
  }, [refetch, refetchPerformance]);

  const handleTabChange = useCallback((value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(value as TabValue);
  }, []);

  const handleContextChange = useCallback(
    (context: 'deal' | 'property', entityId: string) => {
      if (context === 'deal' && entry?.deal_id) {
        router.push(`/(tabs)/deals/${entry.deal_id}` as any);
      }
    },
    [router, entry?.deal_id]
  );

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleRemove = useCallback(async () => {
    await removeEntry();
    router.back();
  }, [removeEntry, router]);

  if (isLoading && !property) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen text="Loading property..." />
      </ThemedSafeAreaView>
    );
  }

  if (error || !property) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-1 items-center justify-center p-4">
          <Text style={{ color: colors.mutedForeground, textAlign: 'center' }}>
            {error?.message || 'Property not found in portfolio'}
          </Text>
        </View>
      </ThemedSafeAreaView>
    );
  }

  const address = property.address_line_1 || property.address || '';
  const cityStateZip = [property.city, property.state, property.zip].filter(Boolean).join(', ');

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <EntityHeader
        context="property"
        propertyId={propertyId}
        dealId={entry?.deal_id || undefined}
        hasLinkedDeal={!!entry?.deal_id}
        onContextChange={handleContextChange}
        onBack={handleBack}
        onMore={() => setShowActionsSheet(true)}
      />

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
        <View className="px-4 py-3">
          {/* Address */}
          <Text
            style={{ color: colors.foreground, fontSize: 24, fontWeight: '700' }}
            numberOfLines={2}
          >
            {address}
          </Text>
          <Text
            style={{ color: colors.mutedForeground, fontSize: 15, marginTop: 2 }}
            numberOfLines={1}
          >
            {cityStateZip}
          </Text>

          {/* Meta row: Acquisition date + Group */}
          <View className="flex-row items-center mt-3 gap-3">
            {entry?.acquisition_date && (
              <View className="flex-row items-center">
                <Calendar size={14} color={colors.mutedForeground} />
                <Text
                  style={{ color: colors.mutedForeground, fontSize: 13, marginLeft: 4 }}
                >
                  {new Date(entry.acquisition_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            )}

            {ownershipDuration && (
              <Badge variant="secondary" size="sm">
                {ownershipDuration}
              </Badge>
            )}

            {group && (
              <Badge
                variant="outline"
                size="sm"
                style={group.color ? { borderColor: group.color } : undefined}
              >
                <Briefcase size={10} color={group.color || colors.mutedForeground} />
                <Text style={{ marginLeft: 4, color: group.color || colors.mutedForeground }}>
                  {group.name}
                </Text>
              </Badge>
            )}
          </View>

          {/* Quick Stats Row */}
          {performance && (
            <View
              className="flex-row justify-between mt-4 p-3 rounded-xl"
              style={{ backgroundColor: colors.card }}
            >
              <QuickStat
                label="Equity"
                value={formatCurrency(performance.current_equity)}
                trend={performance.current_equity > 0 ? 'up' : undefined}
                colors={colors}
              />
              <QuickStat
                label="Cash Flow"
                value={`${performance.average_monthly_cash_flow >= 0 ? '+' : ''}${formatCurrency(performance.average_monthly_cash_flow)}/mo`}
                trend={performance.average_monthly_cash_flow > 0 ? 'up' : performance.average_monthly_cash_flow < 0 ? 'down' : undefined}
                colors={colors}
              />
              <QuickStat
                label="CoC Return"
                value={`${performance.cash_on_cash_return.toFixed(1)}%`}
                trend={performance.cash_on_cash_return > 8 ? 'up' : undefined}
                colors={colors}
              />
            </View>
          )}
        </View>

        {/* Tab Navigation */}
        <View className="px-4 mt-2">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="performance">
                <Text style={{ color: activeTab === 'performance' ? colors.foreground : colors.mutedForeground, fontSize: 13, fontWeight: '500' }}>
                  Performance
                </Text>
              </TabsTrigger>
              <TabsTrigger value="financials">
                <Text style={{ color: activeTab === 'financials' ? colors.foreground : colors.mutedForeground, fontSize: 13, fontWeight: '500' }}>
                  Financials
                </Text>
              </TabsTrigger>
              <TabsTrigger value="debt">
                <Text style={{ color: activeTab === 'debt' ? colors.foreground : colors.mutedForeground, fontSize: 13, fontWeight: '500' }}>
                  Debt
                </Text>
              </TabsTrigger>
              <TabsTrigger value="valuations">
                <Text style={{ color: activeTab === 'valuations' ? colors.foreground : colors.mutedForeground, fontSize: 13, fontWeight: '500' }}>
                  Values
                </Text>
              </TabsTrigger>
              <TabsTrigger value="docs">
                <Text style={{ color: activeTab === 'docs' ? colors.foreground : colors.mutedForeground, fontSize: 13, fontWeight: '500' }}>
                  Docs
                </Text>
              </TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <TabsContent value="performance">
              <PortfolioPerformanceTab
                portfolioEntryId={portfolioEntryId}
                performance={performance}
                benchmark={benchmark}
              />
            </TabsContent>

            <TabsContent value="financials">
              <PortfolioFinancialsTab
                portfolioEntryId={portfolioEntryId}
                entry={entry}
              />
            </TabsContent>

            <TabsContent value="debt">
              <PortfolioDebtTab
                portfolioEntryId={portfolioEntryId}
              />
            </TabsContent>

            <TabsContent value="valuations">
              <PortfolioValuationsTab
                propertyId={propertyId}
                acquisitionPrice={entry?.acquisition_price}
                acquisitionDate={entry?.acquisition_date}
              />
            </TabsContent>

            <TabsContent value="docs">
              <PortfolioDocsTab
                portfolioEntryId={portfolioEntryId}
                propertyId={propertyId}
              />
            </TabsContent>
          </Tabs>
        </View>
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
  );
}

// Quick stat component for header
function QuickStat({
  label,
  value,
  trend,
  colors,
}: {
  label: string;
  value: string;
  trend?: 'up' | 'down';
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View className="items-center">
      <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '500' }}>
        {label}
      </Text>
      <Text
        style={{
          color: trend === 'up' ? colors.success : trend === 'down' ? colors.destructive : colors.foreground,
          fontSize: 15,
          fontWeight: '600',
          marginTop: 2,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

// Format currency helper
function formatCurrency(amount: number): string {
  if (Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

export default PortfolioPropertyDetailScreen;
