// src/features/deals/screens/QuickUnderwriteScreen.tsx
// Quick Underwrite Screen - Simplified 3-number header wrapping existing PropertyAnalysisTab
// Reuses existing proprietary components for deal analysis

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Shield,
  Info,
  Calculator,
  ChevronDown,
  ChevronUp,
  MapPin,
  User,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { getShadowStyle, withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import { Button, LoadingSpinner, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useDeal } from '../hooks/useDeals';
import { useDealAnalysis, DealMetrics, DEFAULT_FLIP_CONSTANTS } from '../../real-estate/hooks/useDealAnalysis';
import { PropertyAnalysisTab } from '../../real-estate/components/PropertyAnalysisTab';
import {
  Deal,
  getDealAddress,
  getDealLeadName,
  getDealRiskScore,
  getRiskScoreColor,
  DEAL_STRATEGY_CONFIG,
} from '../types';
import { Property } from '../../real-estate/types/property';

// ============================================
// Key Metrics Header Component
// ============================================

interface KeyMetricsHeaderProps {
  deal: Deal;
  metrics: DealMetrics;
  onEvidencePress: (field: string) => void;
}

function KeyMetricsHeader({ deal, metrics, onEvidencePress }: KeyMetricsHeaderProps) {
  const colors = useThemeColors();
  const riskScore = getDealRiskScore(deal);

  // Get the ARV percentage used in MAO calculation (default 70%)
  // TODO: When buyingCriteria is wired up, this will be dynamic
  const arvPercentage = Math.round(DEFAULT_FLIP_CONSTANTS.maoRulePct * 100);

  // Determine which profit metric to show based on strategy
  const showCashFlow = deal.strategy === 'seller_finance' || deal.strategy === 'subject_to';
  const profitValue = showCashFlow ? metrics.monthlyCashFlow : metrics.netProfit;
  const profitLabel = showCashFlow ? 'Monthly CF' : 'Net Profit';

  const formatCurrency = (value: number) => {
    if (!value || value === 0) return '-';
    const prefix = value < 0 ? '-' : '';
    return `${prefix}$${Math.abs(value).toLocaleString()}`;
  };

  return (
    <View
      className="mx-4 mb-4 rounded-2xl p-4"
      style={{
        backgroundColor: colors.card,
        ...getShadowStyle(colors, { size: 'md' }),
      }}
    >
      {/* Big 3 Numbers Row */}
      <View className="flex-row items-stretch">
        {/* MAO */}
        <TouchableOpacity
          className="flex-1 items-center py-2"
          onPress={() => onEvidencePress('mao')}
          accessibilityLabel={`Maximum Allowable Offer: ${formatCurrency(metrics.mao)}. Tap for details.`}
        >
          <View className="flex-row items-center mb-1">
            <DollarSign size={16} color={colors.success} />
            <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>MAO</Text>
            <Info size={12} color={colors.mutedForeground} style={{ marginLeft: 4 }} />
          </View>
          <Text className="text-2xl font-bold" style={{ color: colors.foreground }}>
            {formatCurrency(metrics.mao)}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }}>{arvPercentage}% Rule</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View className="w-px mx-2" style={{ backgroundColor: colors.border }} />

        {/* Profit / Cash Flow */}
        <TouchableOpacity
          className="flex-1 items-center py-2"
          onPress={() => onEvidencePress('profit')}
          accessibilityLabel={`${profitLabel}: ${formatCurrency(profitValue)}. Tap for details.`}
        >
          <View className="flex-row items-center mb-1">
            <TrendingUp size={16} color={colors.info} />
            <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>{profitLabel}</Text>
            <Info size={12} color={colors.mutedForeground} style={{ marginLeft: 4 }} />
          </View>
          <Text
            className="text-2xl font-bold"
            style={{ color: profitValue >= 0 ? colors.success : colors.destructive }}
          >
            {formatCurrency(profitValue)}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
            {showCashFlow ? 'per month' : 'after costs'}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View className="w-px mx-2" style={{ backgroundColor: colors.border }} />

        {/* Risk Score */}
        <TouchableOpacity
          className="flex-1 items-center py-2"
          onPress={() => onEvidencePress('risk')}
          accessibilityLabel={`Risk Score: ${riskScore !== undefined ? `${riskScore} out of 5` : 'Not calculated'}. Tap for details.`}
        >
          <View className="flex-row items-center mb-1">
            <Shield size={16} color={colors.warning} />
            <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>Risk</Text>
            <Info size={12} color={colors.mutedForeground} style={{ marginLeft: 4 }} />
          </View>
          <Text className="text-2xl font-bold" style={{ color: riskScore !== undefined ? (riskScore <= 2 ? colors.success : riskScore <= 3 ? colors.warning : colors.destructive) : colors.mutedForeground }}>
            {riskScore !== undefined ? `${riskScore}/5` : '-'}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
            {riskScore !== undefined
              ? riskScore <= 2
                ? 'Low Risk'
                : riskScore <= 3
                ? 'Medium'
                : 'High Risk'
              : 'Not set'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================
// Evidence Drawer Component
// ============================================

interface EvidenceDrawerProps {
  field: string;
  deal: Deal;
  metrics: DealMetrics;
  isExpanded: boolean;
  onToggle: () => void;
}

function EvidenceDrawer({
  field,
  deal,
  metrics,
  isExpanded,
  onToggle,
}: EvidenceDrawerProps) {
  const colors = useThemeColors();

  // Get the ARV percentage used in MAO calculation
  const arvPercentage = Math.round(DEFAULT_FLIP_CONSTANTS.maoRulePct * 100);
  const arvMultiplier = DEFAULT_FLIP_CONSTANTS.maoRulePct;

  // Get evidence for this field
  const evidence = deal.evidence?.filter((e) => e.field_key === field) || [];

  const getFieldLabel = (f: string) => {
    switch (f) {
      case 'mao':
        return 'Maximum Allowable Offer';
      case 'profit':
        return 'Profit Calculation';
      case 'risk':
        return 'Risk Score';
      case 'arv':
        return 'After Repair Value';
      case 'repair_cost':
        return 'Repair Cost';
      default:
        return f;
    }
  };

  const getFieldExplanation = (f: string) => {
    switch (f) {
      case 'mao':
        return `MAO = (ARV × ${arvPercentage}%) - Repairs\n= ($${(metrics.arv || 0).toLocaleString()} × ${arvMultiplier.toFixed(2)}) - $${(metrics.repairCost || 0).toLocaleString()}\n= $${(metrics.mao || 0).toLocaleString()}`;
      case 'profit':
        return `Net Profit = ARV - Total Investment - Selling Costs\nTotal Investment = Purchase + Repairs + Closing + Holding`;
      case 'risk':
        return `Risk is calculated based on:\n• Data completeness\n• Market conditions\n• Property condition\n• Deal structure`;
      default:
        return 'No additional details available.';
    }
  };

  if (!isExpanded) return null;

  return (
    <View
      className="mx-4 mb-4 rounded-xl p-4"
      style={{ backgroundColor: colors.muted }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-semibold" style={{ color: colors.foreground }}>
          {getFieldLabel(field)}
        </Text>
        <TouchableOpacity onPress={onToggle}>
          <ChevronUp size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <Text className="text-sm mb-3 font-mono" style={{ color: colors.mutedForeground }}>
        {getFieldExplanation(field)}
      </Text>

      {evidence.length > 0 && (
        <View className="pt-3 mt-2" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
          <Text className="text-xs uppercase mb-2" style={{ color: colors.mutedForeground }}>
            Evidence Trail
          </Text>
          {evidence.map((e) => (
            <View key={e.id} className="flex-row items-center mb-2">
              <View
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: colors.info }}
              />
              <Text className="text-sm flex-1" style={{ color: colors.foreground }}>
                {e.source}: {e.value || 'N/A'}
              </Text>
              {e.changed_at && (
                <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                  {new Date(e.changed_at).toLocaleDateString()}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================
// Main Screen
// ============================================

export function QuickUnderwriteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const dealId = params.dealId as string;
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const { deal, isLoading, error, refetch } = useDeal(dealId);
  const [expandedField, setExpandedField] = useState<string | null>(null);

  // Get property for analysis - use empty default if not available
  const property: Property = useMemo(() => {
    return (deal?.property || {
      id: '',
      purchase_price: 0,
      repair_cost: 0,
      arv: 0,
    }) as Property;
  }, [deal?.property]);

  // Use the existing deal analysis hook
  const metrics = useDealAnalysis(property);

  // Handlers
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleEvidencePress = useCallback((field: string) => {
    setExpandedField((prev) => (prev === field ? null : field));
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen text="Loading analysis..." />
      </ThemedSafeAreaView>
    );
  }

  // Error state
  if (error || !deal) {
    return (
      <ThemedSafeAreaView className="flex-1 items-center justify-center px-4" edges={['top']}>
        <Calculator size={48} color={colors.destructive} />
        <Text className="text-center mt-4 mb-4" style={{ color: colors.destructive }}>
          {error?.message || 'Deal not found'}
        </Text>
        <Button onPress={handleBack}>Go Back</Button>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          onPress={handleBack}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          className="p-2 -ml-2"
        >
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>Quick Underwrite</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING + insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
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
                <Text className="text-xs font-medium" style={{ color: colors.secondaryForeground }}>
                  {DEAL_STRATEGY_CONFIG[deal.strategy].label}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Key Metrics Header - The 3 Big Numbers */}
        <KeyMetricsHeader
          deal={deal}
          metrics={metrics}
          onEvidencePress={handleEvidencePress}
        />

        {/* Evidence Drawer (expandable) */}
        {expandedField && (
          <EvidenceDrawer
            field={expandedField}
            deal={deal}
            metrics={metrics}
            isExpanded={true}
            onToggle={() => setExpandedField(null)}
          />
        )}

        {/* Existing Property Analysis Tab - Reused Component */}
        <View className="px-4">
          <Text className="text-sm font-medium mb-3 uppercase" style={{ color: colors.mutedForeground }}>
            Detailed Analysis
          </Text>
          <PropertyAnalysisTab property={property} />
        </View>

        {/* Quick Tips */}
        <View className="mx-4 mt-6 p-4 rounded-xl" style={{ backgroundColor: withOpacity(colors.info, 'muted') }}>
          <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>
            Underwriting Tips
          </Text>
          <View className="gap-2">
            <View className="flex-row items-start">
              <Text className="mr-2" style={{ color: colors.info }}>•</Text>
              <Text className="text-sm flex-1" style={{ color: colors.mutedForeground }}>
                Tap any metric for calculation details and evidence
              </Text>
            </View>
            <View className="flex-row items-start">
              <Text className="mr-2" style={{ color: colors.info }}>•</Text>
              <Text className="text-sm flex-1" style={{ color: colors.mutedForeground }}>
                Toggle between Flip and Rental modes for different strategies
              </Text>
            </View>
            <View className="flex-row items-start">
              <Text className="mr-2" style={{ color: colors.info }}>•</Text>
              <Text className="text-sm flex-1" style={{ color: colors.mutedForeground }}>
                MAO uses {Math.round(DEFAULT_FLIP_CONSTANTS.maoRulePct * 100)}% rule - adjust based on local market conditions
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

export default QuickUnderwriteScreen;
