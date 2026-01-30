// src/features/admin/screens/ai-security-dashboard/CircuitBreakerCard.tsx
// Circuit breaker status card component

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

import { useThemeColors } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING } from '@/constants/design-tokens';

import type { CircuitBreakerState } from './types';
import { formatRelativeTime } from './utils';

interface CircuitBreakerCardProps {
  state: CircuitBreakerState;
  onTrip: (scope: string) => void;
  onReset: (scope: string) => void;
  loading: boolean;
}

function getScopeLabel(scope: string): string {
  if (scope === 'global') return 'Global';
  if (scope.startsWith('function:')) return scope.replace('function:', '');
  if (scope.startsWith('user:')) return 'User';
  return scope;
}

export function CircuitBreakerCard({ state, onTrip, onReset, loading }: CircuitBreakerCardProps) {
  const colors = useThemeColors();
  const isOpen = state.isOpen;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        borderLeftWidth: 4,
        borderLeftColor: isOpen ? colors.destructive : colors.success,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
            {getScopeLabel(state.scope)}
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: SPACING.xxs }}>
            {isOpen ? `Open since ${formatRelativeTime(state.openedAt)}` : 'Closed - Normal operation'}
          </Text>
          {state.reason && (
            <Text style={{ fontSize: 11, color: colors.warning, marginTop: SPACING.xs }}>
              Reason: {state.reason}
            </Text>
          )}
          {state.autoCloseAt && (
            <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: SPACING.xxs }}>
              Auto-closes: {formatRelativeTime(state.autoCloseAt)}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => (isOpen ? onReset(state.scope) : onTrip(state.scope))}
          disabled={loading}
          style={{
            backgroundColor: isOpen ? colors.success : colors.destructive,
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.sm,
            borderRadius: BORDER_RADIUS.md,
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
              {isOpen ? 'Reset' : 'Trip'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
