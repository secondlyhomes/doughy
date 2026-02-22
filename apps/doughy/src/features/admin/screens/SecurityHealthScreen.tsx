// src/features/admin/screens/SecurityHealthScreen.tsx
// Main security health dashboard screen — thin orchestrator

import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';

import { SecurityScoreCard } from '../components/SecurityScoreCard';
import { KeyHealthSummary } from '../components/KeyHealthSummary';
import { IntegrationStatusGrid } from '../components/IntegrationStatusGrid';
import { KeyAgeDistributionBar } from '../components/KeyAgeDistributionBar';
import { EnvironmentBadge } from '../components/EnvironmentBadge';

import { useSecurityHealthData } from './security-health/useSecurityHealthData';
import { AIFirewallLink } from './security-health/AIFirewallLink';
import { KeysNeedingAttentionCard } from './security-health/KeysNeedingAttentionCard';

export function SecurityHealthScreen() {
  const colors = useThemeColors();
  const {
    isLoading,
    isRefreshing,
    summary,
    keysNeedingAttention,
    error,
    scoreSubtitle,
    integrationGridItems,
    handleRefresh,
    handleNavigateToIntegrations,
  } = useSecurityHealthData();

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: SPACING.md,
          paddingTop: SPACING.md,
          paddingBottom: TAB_BAR_SAFE_PADDING + SPACING['4xl'] * 2,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header with environment badge */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.md,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: colors.foreground,
            }}
          >
            Security Health
          </Text>
          <EnvironmentBadge />
        </View>

        {/* Error message */}
        {error && (
          <View
            style={{
              backgroundColor: colors.destructive + '20',
              padding: 12,
              borderRadius: BORDER_RADIUS.md,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: colors.destructive }}>{error}</Text>
          </View>
        )}

        {/* AI Security Firewall Link */}
        <AIFirewallLink />

        {/* Security Score Card */}
        <SecurityScoreCard
          score={summary?.score ?? 0}
          loading={isLoading}
          subtitle={scoreSubtitle}
        />

        {/* Key Health Summary */}
        <KeyHealthSummary summary={summary} loading={isLoading} />

        {/* Key Age Distribution */}
        <KeyAgeDistributionBar summary={summary} loading={isLoading} />

        {/* Integration Status Grid */}
        <IntegrationStatusGrid
          integrations={integrationGridItems}
          onNavigate={handleNavigateToIntegrations}
          loading={isLoading}
        />

        {/* Keys Needing Attention */}
        <KeysNeedingAttentionCard
          keysNeedingAttention={keysNeedingAttention}
          onViewAll={handleNavigateToIntegrations}
        />
      </ScrollView>
    </ThemedSafeAreaView>
  );
}
