// src/features/admin/screens/AISecurityDashboardScreen.tsx
// AI Security Firewall monitoring and control dashboard

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { SPACING } from '@/constants/design-tokens';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

// Types for security data
interface CircuitBreakerState {
  scope: string;
  isOpen: boolean;
  openedAt: string | null;
  openedBy: string | null;
  reason: string | null;
  autoCloseAt: string | null;
}

interface UserThreatScore {
  userId: string;
  currentScore: number;
  events24h: number;
  lastEventAt: string | null;
  isFlagged: boolean;
  userEmail?: string;
}

interface SecurityEvent {
  id: string;
  createdAt: string;
  userId: string | null;
  action: string;
  threatLevel: string;
  details: Record<string, unknown>;
  userEmail?: string;
}

interface SecurityPattern {
  id: string;
  pattern: string;
  severity: string;
  threatType: string;
  description: string | null;
  isActive: boolean;
  hitCount: number;
}

// Utility function to format relative time
function formatRelativeTime(date: string | null): string {
  if (!date) return 'Never';
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// Circuit Breaker Card Component
function CircuitBreakerCard({
  state,
  onTrip,
  onReset,
  loading,
}: {
  state: CircuitBreakerState;
  onTrip: (scope: string) => void;
  onReset: (scope: string) => void;
  loading: boolean;
}) {
  const colors = useThemeColors();
  const isOpen = state.isOpen;

  const getScopeLabel = (scope: string): string => {
    if (scope === 'global') return 'Global';
    if (scope.startsWith('function:')) return scope.replace('function:', '');
    if (scope.startsWith('user:')) return 'User';
    return scope;
  };

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: isOpen ? colors.destructive : colors.success,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
            {getScopeLabel(state.scope)}
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
            {isOpen ? `Open since ${formatRelativeTime(state.openedAt)}` : 'Closed - Normal operation'}
          </Text>
          {state.reason && (
            <Text style={{ fontSize: 11, color: colors.warning, marginTop: 4 }}>
              Reason: {state.reason}
            </Text>
          )}
          {state.autoCloseAt && (
            <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>
              Auto-closes: {formatRelativeTime(state.autoCloseAt)}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => (isOpen ? onReset(state.scope) : onTrip(state.scope))}
          disabled={loading}
          style={{
            backgroundColor: isOpen ? colors.success : colors.destructive,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
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

// Threat Score Card Component
function ThreatScoreCard({ user }: { user: UserThreatScore }) {
  const colors = useThemeColors();

  const getScoreColor = (score: number): string => {
    if (score >= 800) return colors.destructive;
    if (score >= 500) return colors.warning;
    if (score >= 200) return '#f59e0b'; // amber
    return colors.success;
  };

  const scoreColor = getScoreColor(user.currentScore);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* Score indicator */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: scoreColor + '20',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: scoreColor }}>
          {user.currentScore}
        </Text>
      </View>

      {/* User info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '500', color: colors.foreground }} numberOfLines={1}>
          {user.userEmail || user.userId.slice(0, 8) + '...'}
        </Text>
        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
          {user.events24h} events in 24h
        </Text>
      </View>

      {/* Status badges */}
      <View style={{ alignItems: 'flex-end' }}>
        {user.isFlagged && (
          <View
            style={{
              backgroundColor: colors.destructive,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 4,
            }}
          >
            <Text style={{ fontSize: 10, color: '#fff', fontWeight: '600' }}>FLAGGED</Text>
          </View>
        )}
        <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: 4 }}>
          {formatRelativeTime(user.lastEventAt)}
        </Text>
      </View>
    </View>
  );
}

// Security Event Row Component
function SecurityEventRow({ event }: { event: SecurityEvent }) {
  const colors = useThemeColors();

  const getThreatColor = (level: string): string => {
    switch (level) {
      case 'critical':
        return colors.destructive;
      case 'high':
        return '#dc2626';
      case 'medium':
        return colors.warning;
      case 'low':
        return '#f59e0b';
      default:
        return colors.mutedForeground;
    }
  };

  return (
    <View
      style={{
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: getThreatColor(event.threatLevel),
          marginRight: 10,
        }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: colors.foreground }}>
          {event.action}
        </Text>
        <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
          {event.userEmail || event.userId?.slice(0, 8) || 'Anonymous'} · {formatRelativeTime(event.createdAt)}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: getThreatColor(event.threatLevel) + '20',
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
        }}
      >
        <Text style={{ fontSize: 9, color: getThreatColor(event.threatLevel), fontWeight: '600' }}>
          {event.threatLevel.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

// Main Dashboard Screen
export function AISecurityDashboardScreen() {
  const colors = useThemeColors();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreakerState[]>([]);
  const [threatScores, setThreatScores] = useState<UserThreatScore[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [patterns, setPatterns] = useState<SecurityPattern[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load circuit breaker states (moltbot_circuit_breakers per DBA guidelines)
  const loadCircuitBreakers = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('moltbot_circuit_breakers')
      .select('*')
      .order('scope');

    if (fetchError) {
      console.error('[AISecurityDashboard] Error loading circuit breakers:', fetchError);
      return [];
    }

    return (data || []).map((row) => ({
      scope: row.scope,
      isOpen: row.is_open,
      openedAt: row.opened_at,
      openedBy: row.opened_by,
      reason: row.reason,
      autoCloseAt: row.auto_close_at,
    }));
  }, []);

  // Load threat scores (moltbot_user_threat_scores per DBA guidelines)
  const loadThreatScores = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('moltbot_user_threat_scores')
      .select('*')
      .or('is_flagged.eq.true,current_score.gte.200')
      .order('current_score', { ascending: false })
      .limit(20);

    if (fetchError) {
      console.error('[AISecurityDashboard] Error loading threat scores:', fetchError);
      return [];
    }

    // Fetch user emails for display
    const userIds = (data || []).map((row) => row.user_id);
    let userEmails: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      if (profiles) {
        userEmails = profiles.reduce((acc, p) => {
          acc[p.id] = p.email;
          return acc;
        }, {} as Record<string, string>);
      }
    }

    return (data || []).map((row) => ({
      userId: row.user_id,
      currentScore: row.current_score,
      events24h: row.event_count_24h,  // Column renamed per DBA guidelines
      lastEventAt: row.last_event_at,
      isFlagged: row.is_flagged,
      userEmail: userEmails[row.user_id],
    }));
  }, []);

  // Load recent security events
  const loadSecurityEvents = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('moltbot_security_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (fetchError) {
      console.error('[AISecurityDashboard] Error loading security events:', fetchError);
      return [];
    }

    // Fetch user emails for display
    const userIds = (data || [])
      .map((row) => row.user_id)
      .filter((id): id is string => id !== null);
    let userEmails: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      if (profiles) {
        userEmails = profiles.reduce((acc, p) => {
          acc[p.id] = p.email;
          return acc;
        }, {} as Record<string, string>);
      }
    }

    return (data || []).map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      userId: row.user_id,
      action: row.action,
      threatLevel: row.threat_level || 'low',
      details: row.details || {},
      userEmail: row.user_id ? userEmails[row.user_id] : undefined,
    }));
  }, []);

  // Load security patterns
  const loadPatterns = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('moltbot_blocked_patterns')
      .select('*')
      .order('severity', { ascending: false });

    if (fetchError) {
      console.error('[AISecurityDashboard] Error loading patterns:', fetchError);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      pattern: row.pattern,
      severity: row.severity,
      threatType: row.threat_type,
      description: row.description,
      isActive: row.is_active,
      hitCount: row.hit_count || 0,
    }));
  }, []);

  // Load all data
  const loadAllData = useCallback(async () => {
    try {
      const [breakers, scores, events, patternList] = await Promise.all([
        loadCircuitBreakers(),
        loadThreatScores(),
        loadSecurityEvents(),
        loadPatterns(),
      ]);

      setCircuitBreakers(breakers);
      setThreatScores(scores);
      setSecurityEvents(events);
      setPatterns(patternList);
      setError(null);
    } catch (err) {
      console.error('[AISecurityDashboard] Load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    }
  }, [loadCircuitBreakers, loadThreatScores, loadSecurityEvents, loadPatterns]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadAllData();
      setIsLoading(false);
    };
    load();
  }, [loadAllData]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadAllData();
    setIsRefreshing(false);
  }, [loadAllData]);

  // Trip circuit breaker
  const handleTripCircuitBreaker = useCallback(async (scope: string) => {
    Alert.alert(
      'Trip Circuit Breaker',
      `Are you sure you want to trip the ${scope} circuit breaker? This will block AI operations.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trip',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(scope);
            try {
              const { error: tripError } = await supabase.rpc('trip_circuit_breaker', {
                p_scope: scope,
                p_reason: 'Manual trip from admin dashboard',
                p_auto_close_minutes: null,
              });

              if (tripError) {
                Alert.alert('Error', tripError.message);
              } else {
                await loadCircuitBreakers().then(setCircuitBreakers);
              }
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to trip circuit breaker');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }, [loadCircuitBreakers]);

  // Reset circuit breaker
  const handleResetCircuitBreaker = useCallback(async (scope: string) => {
    setActionLoading(scope);
    try {
      const { error: resetError } = await supabase.rpc('reset_circuit_breaker', {
        p_scope: scope,
      });

      if (resetError) {
        Alert.alert('Error', resetError.message);
      } else {
        await loadCircuitBreakers().then(setCircuitBreakers);
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to reset circuit breaker');
    } finally {
      setActionLoading(null);
    }
  }, [loadCircuitBreakers]);

  // Summary statistics
  const stats = useMemo(() => {
    const openBreakers = circuitBreakers.filter((b) => b.isOpen).length;
    const flaggedUsers = threatScores.filter((t) => t.isFlagged).length;
    const criticalEvents = securityEvents.filter((e) => e.threatLevel === 'critical').length;
    const activePatterns = patterns.filter((p) => p.isActive).length;

    return { openBreakers, flaggedUsers, criticalEvents, activePatterns };
  }, [circuitBreakers, threatScores, securityEvents, patterns]);

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
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: colors.destructive }}>{error}</Text>
          </View>
        )}

        {/* Stats Summary */}
        <View
          style={{
            flexDirection: 'row',
            marginBottom: SPACING.lg,
            gap: 8,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: stats.openBreakers > 0 ? colors.destructive + '20' : colors.card,
              borderRadius: 12,
              padding: 12,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: stats.openBreakers > 0 ? colors.destructive : colors.foreground,
              }}
            >
              {stats.openBreakers}
            </Text>
            <Text style={{ fontSize: 10, color: colors.mutedForeground }}>Open Breakers</Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: stats.flaggedUsers > 0 ? colors.warning + '20' : colors.card,
              borderRadius: 12,
              padding: 12,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: stats.flaggedUsers > 0 ? colors.warning : colors.foreground,
              }}
            >
              {stats.flaggedUsers}
            </Text>
            <Text style={{ fontSize: 10, color: colors.mutedForeground }}>Flagged Users</Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: stats.criticalEvents > 0 ? colors.destructive + '20' : colors.card,
              borderRadius: 12,
              padding: 12,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: stats.criticalEvents > 0 ? colors.destructive : colors.foreground,
              }}
            >
              {stats.criticalEvents}
            </Text>
            <Text style={{ fontSize: 10, color: colors.mutedForeground }}>Critical Events</Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>
              {stats.activePatterns}
            </Text>
            <Text style={{ fontSize: 10, color: colors.mutedForeground }}>Active Patterns</Text>
          </View>
        </View>

        {/* Circuit Breakers Section */}
        <View style={{ marginBottom: SPACING.lg }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.foreground,
              marginBottom: 12,
            }}
          >
            Circuit Breakers
          </Text>

          {circuitBreakers.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.mutedForeground }}>No circuit breakers configured</Text>
            </View>
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
        </View>

        {/* Flagged Users Section */}
        <View style={{ marginBottom: SPACING.lg }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.foreground,
              marginBottom: 12,
            }}
          >
            Threat Scores
          </Text>

          {threatScores.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
              }}
            >
              <Ionicons name="shield-checkmark" size={32} color={colors.success} />
              <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>
                No elevated threat scores
              </Text>
            </View>
          ) : (
            threatScores.slice(0, 10).map((user) => (
              <ThreatScoreCard key={user.userId} user={user} />
            ))
          )}
        </View>

        {/* Recent Security Events */}
        <View style={{ marginBottom: SPACING.lg }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.foreground,
              marginBottom: 12,
            }}
          >
            Recent Security Events
          </Text>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 16,
            }}
          >
            {securityEvents.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>
                  No security events recorded
                </Text>
              </View>
            ) : (
              securityEvents.slice(0, 15).map((event) => (
                <SecurityEventRow key={event.id} event={event} />
              ))
            )}
          </View>
        </View>

        {/* Pattern Statistics */}
        <View style={{ marginBottom: SPACING.lg }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.foreground,
              marginBottom: 12,
            }}
          >
            Pattern Hit Statistics
          </Text>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 16,
            }}
          >
            {patterns.filter((p) => p.hitCount > 0).length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <Text style={{ color: colors.mutedForeground }}>
                  No pattern hits recorded
                </Text>
              </View>
            ) : (
              patterns
                .filter((p) => p.hitCount > 0)
                .sort((a, b) => b.hitCount - a.hitCount)
                .slice(0, 10)
                .map((pattern) => (
                  <View
                    key={pattern.id}
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
                        backgroundColor:
                          pattern.severity === 'critical'
                            ? colors.destructive + '20'
                            : pattern.severity === 'high'
                            ? colors.warning + '20'
                            : colors.muted,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                        marginRight: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: '600',
                          color:
                            pattern.severity === 'critical'
                              ? colors.destructive
                              : pattern.severity === 'high'
                              ? colors.warning
                              : colors.foreground,
                        }}
                      >
                        {pattern.severity.toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ fontSize: 12, color: colors.foreground }}
                        numberOfLines={1}
                      >
                        {pattern.description || pattern.threatType}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
                      {pattern.hitCount}
                    </Text>
                  </View>
                ))
            )}
          </View>
        </View>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}
