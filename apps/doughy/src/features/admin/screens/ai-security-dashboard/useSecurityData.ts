// src/features/admin/screens/ai-security-dashboard/useSecurityData.ts
// Data fetching hook for AI Security Dashboard
// Focused on: circuit breakers, threat scores, patterns
// Event logs now handled by Sentry

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';

import { supabase } from '@/lib/supabase';

import type {
  CircuitBreakerState,
  UserThreatScore,
  SecurityPattern,
  SecurityStats,
} from './types';

interface UseSecurityDataReturn {
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  circuitBreakers: CircuitBreakerState[];
  threatScores: UserThreatScore[];
  patterns: SecurityPattern[];
  stats: SecurityStats;
  actionLoading: string | null;
  handleRefresh: () => Promise<void>;
  handleTripCircuitBreaker: (scope: string) => void;
  handleResetCircuitBreaker: (scope: string) => Promise<void>;
}

export function useSecurityData(): UseSecurityDataReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreakerState[]>([]);
  const [threatScores, setThreatScores] = useState<UserThreatScore[]>([]);
  const [patterns, setPatterns] = useState<SecurityPattern[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load circuit breaker states
  const loadCircuitBreakers = useCallback(async (): Promise<CircuitBreakerState[]> => {
    const { data, error: fetchError } = await supabase
      .schema('ai').from('openclaw_circuit_breakers' as unknown as 'profiles')
      .select('*')
      .order('scope');

    if (fetchError) {
      console.error('[AISecurityDashboard] Error loading circuit breakers:', fetchError);
      return [];
    }

    const rows = (data || []) as Array<{
      scope: string;
      is_open: boolean;
      opened_at: string | null;
      opened_by: string | null;
      reason: string | null;
      auto_close_at: string | null;
    }>;

    return rows.map((row) => ({
      scope: row.scope,
      isOpen: row.is_open,
      openedAt: row.opened_at,
      openedBy: row.opened_by,
      reason: row.reason,
      autoCloseAt: row.auto_close_at,
    }));
  }, []);

  // Load threat scores
  const loadThreatScores = useCallback(async (): Promise<UserThreatScore[]> => {
    const { data, error: fetchError } = await supabase
      .schema('ai').from('openclaw_user_threat_scores' as unknown as 'profiles')
      .select('*')
      .or('is_flagged.eq.true,current_score.gte.200')
      .order('current_score', { ascending: false })
      .limit(20);

    if (fetchError) {
      console.error('[AISecurityDashboard] Error loading threat scores:', fetchError);
      return [];
    }

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
      events24h: row.event_count_24h,
      lastEventAt: row.last_event_at,
      isFlagged: row.is_flagged,
      userEmail: userEmails[row.user_id],
    }));
  }, []);

  // Load security patterns
  const loadPatterns = useCallback(async (): Promise<SecurityPattern[]> => {
    const { data, error: fetchError } = await supabase
      .schema('ai').from('openclaw_blocked_patterns' as unknown as 'profiles')
      .select('*')
      .order('severity', { ascending: false });

    if (fetchError) {
      console.error('[AISecurityDashboard] Error loading patterns:', fetchError);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      pattern: row.pattern || '',
      severity: row.severity || 'medium',
      threatType: row.threat_type || 'other',
      description: row.description,
      isActive: row.is_active ?? true,
      hitCount: row.hit_count || 0,
    }));
  }, []);

  // Load all data
  const loadAllData = useCallback(async () => {
    try {
      const [breakers, scores, patternList] = await Promise.all([
        loadCircuitBreakers(),
        loadThreatScores(),
        loadPatterns(),
      ]);

      setCircuitBreakers(breakers);
      setThreatScores(scores);
      setPatterns(patternList);
      setError(null);
    } catch (err) {
      console.error('[AISecurityDashboard] Load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    }
  }, [loadCircuitBreakers, loadThreatScores, loadPatterns]);

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
  const handleTripCircuitBreaker = useCallback((scope: string) => {
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
                const breakers = await loadCircuitBreakers();
                setCircuitBreakers(breakers);
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
        const breakers = await loadCircuitBreakers();
        setCircuitBreakers(breakers);
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to reset circuit breaker');
    } finally {
      setActionLoading(null);
    }
  }, [loadCircuitBreakers]);

  // Summary statistics (simplified - removed criticalEvents since logs moved to Sentry)
  const stats = useMemo((): SecurityStats => {
    const openBreakers = circuitBreakers.filter((b) => b.isOpen).length;
    const flaggedUsers = threatScores.filter((t) => t.isFlagged).length;
    const activePatterns = patterns.filter((p) => p.isActive).length;

    return { openBreakers, flaggedUsers, criticalEvents: 0, activePatterns };
  }, [circuitBreakers, threatScores, patterns]);

  return {
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
  };
}
