// src/features/deals/screens/QuickUnderwriteScreen.tsx
// Quick Underwrite Screen - Simplified 3-number header wrapping existing PropertyAnalysisTab

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calculator, MapPin, User } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import { Button, LoadingSpinner, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { SmartBackButton } from '@/components/navigation';
import { useDeal } from '../hooks/useDeals';
import {
  useDealAnalysis,
  DEFAULT_FLIP_CONSTANTS,
} from '../../real-estate/hooks/useDealAnalysis';
import { PropertyAnalysisTab } from '../../real-estate/components/PropertyAnalysisTab';
import {
  getDealAddress,
  getDealLeadName,
  getDealRiskScore,
  DEAL_STRATEGY_CONFIG,
} from '../types';
import { Property } from '../../real-estate/types/property';
import {
  KeyMetricsHeader,
  EvidenceDrawer,
  StickyMetricsHeader,
} from './quick-underwrite';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const STICKY_THRESHOLD = 180;

export function QuickUnderwriteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const dealId = params.dealId as string;
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const { deal, isLoading, error, refetch } = useDeal(dealId);
  const [expandedField, setExpandedField] = useState<string | null>(null);

  // Scroll tracking for sticky header
  const scrollY = useSharedValue(0);
  const [showStickyHeader, setShowStickyHeader] = useState(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Update sticky header visibility based on scroll position
  React.useEffect(() => {
    const interval = setInterval(() => {
      setShowStickyHeader(scrollY.value > STICKY_THRESHOLD);
    }, 100);
    return () => clearInterval(interval);
  }, [scrollY]);

  // Get property for analysis
  const property: Property = useMemo(() => {
    return (deal?.property || {
      id: '',
      purchase_price: 0,
      repair_cost: 0,
      arv: 0,
    }) as Property;
  }, [deal?.property]);

  const metrics = useDealAnalysis(property);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleEvidencePress = useCallback((field: string) => {
    setExpandedField((prev) => (prev === field ? null : field));
  }, []);

  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen text="Loading analysis..." />
      </ThemedSafeAreaView>
    );
  }

  if (error || !deal) {
    return (
      <ThemedSafeAreaView
        className="flex-1 items-center justify-center px-4"
        edges={['top']}
      >
        <Calculator size={48} color={colors.destructive} />
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

  const riskScore = getDealRiskScore(deal);

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <SmartBackButton variant="default" />
        <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
          Quick Underwrite
        </Text>
        <View className="w-10" />
      </View>

      {/* Sticky Header - Zone G */}
      <StickyMetricsHeader
        metrics={metrics}
        riskScore={riskScore}
        visible={showStickyHeader}
        topOffset={insets.top}
      />

      <AnimatedScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Deal Context */}
        <View className="px-4 mb-4">
          <View className="flex-row items-center mb-1">
            <User size={14} color={colors.mutedForeground} />
            <Text className="text-sm ml-2" style={{ color: colors.mutedForeground }}>
              {getDealLeadName(deal)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <MapPin size={14} color={colors.mutedForeground} />
            <Text className="text-sm ml-2" style={{ color: colors.mutedForeground }}>
              {getDealAddress(deal)}
            </Text>
          </View>
          {deal.strategy && (
            <View className="flex-row items-center mt-2">
              <View
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: withOpacity(colors.secondary, 'medium') }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: colors.secondaryForeground }}
                >
                  {DEAL_STRATEGY_CONFIG[deal.strategy].label}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Key Metrics Header */}
        <KeyMetricsHeader
          deal={deal}
          metrics={metrics}
          onEvidencePress={handleEvidencePress}
        />

        {/* Evidence Drawer */}
        {expandedField && (
          <EvidenceDrawer
            field={expandedField}
            deal={deal}
            metrics={metrics}
            isExpanded={true}
            onToggle={() => setExpandedField(null)}
          />
        )}

        {/* Detailed Analysis */}
        <View className="px-4">
          <Text
            className="text-sm font-medium mb-3 uppercase"
            style={{ color: colors.mutedForeground }}
          >
            Detailed Analysis
          </Text>
          <PropertyAnalysisTab property={property} />
        </View>

        {/* Quick Tips */}
        <View
          className="mx-4 mt-6 p-4 rounded-xl"
          style={{ backgroundColor: withOpacity(colors.info, 'muted') }}
        >
          <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>
            Underwriting Tips
          </Text>
          <View className="gap-2">
            <View className="flex-row items-start">
              <Text className="mr-2" style={{ color: colors.info }}>•</Text>
              <Text
                className="text-sm flex-1"
                style={{ color: colors.mutedForeground }}
              >
                Tap any metric for calculation details and evidence
              </Text>
            </View>
            <View className="flex-row items-start">
              <Text className="mr-2" style={{ color: colors.info }}>•</Text>
              <Text
                className="text-sm flex-1"
                style={{ color: colors.mutedForeground }}
              >
                Toggle between Flip and Rental modes for different strategies
              </Text>
            </View>
            <View className="flex-row items-start">
              <Text className="mr-2" style={{ color: colors.info }}>•</Text>
              <Text
                className="text-sm flex-1"
                style={{ color: colors.mutedForeground }}
              >
                MAO uses {Math.round(DEFAULT_FLIP_CONSTANTS.maoRulePct * 100)}% rule -
                adjust based on local market conditions
              </Text>
            </View>
          </View>
        </View>
      </AnimatedScrollView>
    </ThemedSafeAreaView>
  );
}

export default QuickUnderwriteScreen;
