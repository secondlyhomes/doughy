// src/features/admin/screens/ai-security-dashboard/AISecurityDashboardScreen.tsx
// AI Security Firewall monitoring and control dashboard - main screen component
// Focused on: circuit breakers, threat scores, pattern management
// Event logs/trends handled by Sentry

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { TAB_BAR_SAFE_PADDING, StepUpVerificationSheet } from '@/components/ui';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { useStepUpAuth } from '@/features/auth/hooks';

import { useSecurityData } from './useSecurityData';
import { CircuitBreakerCard } from './CircuitBreakerCard';
import { PatternEditorSheet } from './PatternEditorSheet';
import { StatCard, SectionHeader, EmptyCard } from './DashboardHelpers';
import { PatternHitsSection } from './PatternHitsSection';
import { ThreatScoresSection } from './ThreatScoresSection';

export function AISecurityDashboardScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const [showPatternEditor, setShowPatternEditor] = useState(false);

  // Step-up MFA authentication for global circuit breaker reset
  const { requireStepUp, verifyStepUp, cancelStepUp, state: stepUpState } = useStepUpAuth();

  const {
    isLoading,
    isRefreshing,
    error,
    circuitBreakers,
    threatScores,
    patterns,
    stats,
    actionLoading,
    handleRefresh,
    handleTripCircuitBreaker,
    handleResetCircuitBreaker,
  } = useSecurityData();

  // Wrap circuit breaker reset with MFA for global scope
  const handleResetWithMFA = async (scope: string) => {
    // Only require MFA for global circuit breaker reset
    if (scope === 'global') {
      const verified = await requireStepUp({
        reason: 'Reset global circuit breaker',
        actionType: 'circuit_breaker_global_reset',
      });

      if (verified) {
        await handleResetCircuitBreaker(scope);
      }
    } else {
      // Non-global resets don't require MFA
      await handleResetCircuitBreaker(scope);
    }
  };

  // Handle step-up verification completion
  const handleStepUpVerify = async (code: string): Promise<boolean> => {
    return verifyStepUp(code);
  };

  // Handle step-up cancellation
  const handleStepUpCancel = () => {
    cancelStepUp();
  };

  // Navigate to user threat detail screen
  const handleUserPress = (userId: string) => {
    router.push(`/(admin)/security/user-threat/${userId}`);
  };

  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>Loading security data...</Text>
        </View>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: SPACING.md,
          paddingTop: SPACING.md,
          paddingBottom: TAB_BAR_SAFE_PADDING + SPACING['4xl'] * 2,
        }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={{ marginBottom: SPACING.lg }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>
            AI Security Firewall
          </Text>
          <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 4 }}>
            Monitor and control AI system security
          </Text>
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

        {/* Stats Summary */}
        <View style={{ flexDirection: 'row', marginBottom: SPACING.lg, gap: 8 }}>
          <StatCard
            value={stats.openBreakers}
            label="Open Breakers"
            isAlert={stats.openBreakers > 0}
            alertColor={colors.destructive}
            colors={colors}
          />
          <StatCard
            value={stats.flaggedUsers}
            label="Flagged Users"
            isAlert={stats.flaggedUsers > 0}
            alertColor={colors.warning}
            colors={colors}
          />
          <StatCard
            value={stats.activePatterns}
            label="Active Patterns"
            isAlert={false}
            colors={colors}
          />
        </View>

        {/* Circuit Breakers Section */}
        <SectionHeader title="Circuit Breakers" colors={colors} />
        {circuitBreakers.length === 0 ? (
          <EmptyCard message="No circuit breakers configured" colors={colors} />
        ) : (
          circuitBreakers.map((breaker) => (
            <CircuitBreakerCard
              key={breaker.scope}
              state={breaker}
              onTrip={handleTripCircuitBreaker}
              onReset={handleResetWithMFA}
              loading={actionLoading === breaker.scope}
            />
          ))
        )}

        {/* Pattern Management Section */}
        <PatternHitsSection
          patterns={patterns}
          onManagePatterns={() => setShowPatternEditor(true)}
        />

        {/* Threat Scores Section */}
        <ThreatScoresSection
          threatScores={threatScores}
          onUserPress={handleUserPress}
        />

        {/* Sentry Link */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: BORDER_RADIUS.lg,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons name="analytics-outline" size={ICON_SIZES.xl} color={colors.info} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>
              Event Logs & Trends
            </Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
              View detailed logs and analytics in Sentry
            </Text>
          </View>
          <Ionicons name="open-outline" size={ICON_SIZES.ml} color={colors.mutedForeground} />
        </View>
      </ScrollView>

      {/* Pattern Editor Sheet */}
      <PatternEditorSheet
        visible={showPatternEditor}
        onClose={() => setShowPatternEditor(false)}
        patterns={patterns}
        onPatternsChanged={handleRefresh}
      />

      {/* Step-up verification sheet for MFA on global circuit breaker reset */}
      <StepUpVerificationSheet
        visible={stepUpState.isRequired || stepUpState.status === 'mfa_not_configured'}
        onClose={handleStepUpCancel}
        onVerify={handleStepUpVerify}
        state={stepUpState}
      />
    </ThemedSafeAreaView>
  );
}
