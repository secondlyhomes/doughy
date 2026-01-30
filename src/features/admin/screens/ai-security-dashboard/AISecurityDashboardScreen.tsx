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
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { Button, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { SPACING, BORDER_RADIUS, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';

import { useSecurityData } from './useSecurityData';
import { CircuitBreakerCard } from './CircuitBreakerCard';
import { ThreatScoreCard } from './ThreatScoreCard';
import { PatternEditorSheet } from './PatternEditorSheet';

export function AISecurityDashboardScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const [showPatternEditor, setShowPatternEditor] = useState(false);

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
              onReset={handleResetCircuitBreaker}
              loading={actionLoading === breaker.scope}
            />
          ))
        )}

        {/* Pattern Management Section */}
        <SectionHeaderWithAction
          title="Security Patterns"
          actionLabel="Manage"
          onAction={() => setShowPatternEditor(true)}
          colors={colors}
        />
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: BORDER_RADIUS.lg,
            padding: 16,
            marginBottom: SPACING.lg,
          }}
        >
          {patterns.filter((p) => p.hitCount > 0).length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Text style={{ color: colors.mutedForeground }}>
                No pattern hits recorded
              </Text>
              <Button
                variant="outline"
                onPress={() => setShowPatternEditor(true)}
                style={{ marginTop: 12 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="add" size={ICON_SIZES.md} color={colors.primary} />
                  <Text style={{ color: colors.primary }}>Add Pattern</Text>
                </View>
              </Button>
            </View>
          ) : (
            <>
              {patterns
                .filter((p) => p.hitCount > 0)
                .sort((a, b) => b.hitCount - a.hitCount)
                .slice(0, 5)
                .map((pattern) => (
                  <PatternRow key={pattern.id} pattern={pattern} colors={colors} />
                ))}
              {patterns.filter((p) => p.hitCount > 0).length > 5 && (
                <TouchableOpacity
                  onPress={() => setShowPatternEditor(true)}
                  style={{ alignItems: 'center', paddingTop: 12 }}
                >
                  <Text style={{ color: colors.primary, fontSize: 13 }}>
                    View all {patterns.length} patterns
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Threat Scores Section */}
        <SectionHeader title="Threat Scores" colors={colors} />
        {threatScores.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: BORDER_RADIUS.lg,
              padding: 16,
              alignItems: 'center',
              marginBottom: SPACING.lg,
            }}
          >
            <Ionicons name="shield-checkmark" size={ICON_SIZES['2xl']} color={colors.success} />
            <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>
              No elevated threat scores
            </Text>
          </View>
        ) : (
          <View style={{ marginBottom: SPACING.lg }}>
            {threatScores.slice(0, 10).map((user) => (
              <TouchableOpacity
                key={user.userId}
                activeOpacity={PRESS_OPACITY.DEFAULT}
                onPress={() => handleUserPress(user.userId)}
              >
                <ThreatScoreCard user={user} />
              </TouchableOpacity>
            ))}
            {threatScores.length > 10 && (
              <View style={{ alignItems: 'center', paddingTop: 8 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                  +{threatScores.length - 10} more users
                </Text>
              </View>
            )}
          </View>
        )}

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
    </ThemedSafeAreaView>
  );
}

// Helper components

interface StatCardProps {
  value: number;
  label: string;
  isAlert: boolean;
  alertColor?: string;
  colors: ReturnType<typeof useThemeColors>;
}

function StatCard({ value, label, isAlert, alertColor, colors }: StatCardProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isAlert && alertColor ? alertColor + '20' : colors.card,
        borderRadius: BORDER_RADIUS.lg,
        padding: 12,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: '700',
          color: isAlert && alertColor ? alertColor : colors.foreground,
        }}
      >
        {value}
      </Text>
      <Text style={{ fontSize: 10, color: colors.mutedForeground }}>{label}</Text>
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  colors: ReturnType<typeof useThemeColors>;
}

function SectionHeader({ title, colors }: SectionHeaderProps) {
  return (
    <Text
      style={{
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 12,
      }}
    >
      {title}
    </Text>
  );
}

interface SectionHeaderWithActionProps {
  title: string;
  actionLabel: string;
  onAction: () => void;
  colors: ReturnType<typeof useThemeColors>;
}

function SectionHeaderWithAction({ title, actionLabel, onAction, colors }: SectionHeaderWithActionProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '600',
          color: colors.foreground,
        }}
      >
        {title}
      </Text>
      <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '500' }}>
          {actionLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

interface EmptyCardProps {
  message: string;
  colors: ReturnType<typeof useThemeColors>;
}

function EmptyCard({ message, colors }: EmptyCardProps) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        padding: 16,
        alignItems: 'center',
        marginBottom: SPACING.lg,
      }}
    >
      <Text style={{ color: colors.mutedForeground }}>{message}</Text>
    </View>
  );
}

interface PatternRowProps {
  pattern: {
    id: string;
    severity: string;
    description: string | null;
    threatType: string;
    hitCount: number;
  };
  colors: ReturnType<typeof useThemeColors>;
}

function PatternRow({ pattern, colors }: PatternRowProps) {
  const getSeverityColor = () => {
    if (pattern.severity === 'critical') return colors.destructive;
    if (pattern.severity === 'high') return colors.warning;
    return colors.foreground;
  };

  const severityColor = getSeverityColor();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          backgroundColor: severityColor + '20',
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
          marginRight: 8,
        }}
      >
        <Text style={{ fontSize: 9, fontWeight: '600', color: severityColor }}>
          {pattern.severity.toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: colors.foreground }} numberOfLines={1}>
          {pattern.description || pattern.threatType}
        </Text>
      </View>
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
        {pattern.hitCount}
      </Text>
    </View>
  );
}
