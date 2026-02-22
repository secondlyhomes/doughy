// src/features/admin/screens/ai-security-dashboard/useUserThreatData.ts
// Hook for loading and managing user threat data + actions

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';

import { useStepUpAuth } from '@/features/auth/hooks';
import { supabase } from '@/lib/supabase';

import type { SecurityEvent, UserThreatScore } from './types';

export function useUserThreatData(userId: string | undefined) {
  const { requireStepUp, verifyStepUp, cancelStepUp, state: stepUpState } = useStepUpAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [userScore, setUserScore] = useState<UserThreatScore | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Load user data
  const loadUserData = useCallback(async () => {
    if (!userId) return;

    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, is_blocked')
        .eq('id', userId)
        .single();

      if (profile) {
        setUserEmail(profile.email);
      }

      // Get threat score
      const { data: scoreData } = await supabase
        .schema('ai').from('openclaw_user_threat_scores' as unknown as 'profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (scoreData) {
        setUserScore({
          userId: scoreData.user_id,
          currentScore: scoreData.current_score,
          events24h: scoreData.event_count_24h,
          lastEventAt: scoreData.last_event_at,
          isFlagged: scoreData.is_flagged,
        });
      }

      // Get security events for this user
      const { data: eventsData } = await supabase
        .schema('ai').from('openclaw_security_logs' as unknown as 'profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventsData) {
        setEvents(
          eventsData.map((row) => ({
            id: row.id,
            createdAt: row.created_at,
            userId: row.user_id,
            action: row.action,
            threatLevel: row.threat_level || 'low',
            details: row.details || {},
          }))
        );
      }
    } catch (err) {
      console.error('[UserThreatDetail] Error loading data:', err);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadUserData();
      setIsLoading(false);
    };
    load();
  }, [loadUserData]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadUserData();
    setIsRefreshing(false);
  }, [loadUserData]);

  // Reset threat score - requires step-up MFA
  const handleResetScore = useCallback(async () => {
    const verified = await requireStepUp({
      reason: 'Reset user threat score',
      actionType: 'threat_score_reset',
    });

    if (verified) {
      setActionLoading('reset');
      try {
        const { error } = await supabase
          .schema('ai').from('openclaw_user_threat_scores' as unknown as 'profiles')
          .update({
            current_score: 0,
            event_count_24h: 0,
            is_flagged: false,
          })
          .eq('user_id', userId);

        if (error) throw error;
        await loadUserData();
        Alert.alert('Success', 'Threat score has been reset');
      } catch (err) {
        console.error('[UserThreatDetail] Error resetting score:', err);
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to reset score');
      } finally {
        setActionLoading(null);
      }
    }
  }, [userId, loadUserData, requireStepUp]);

  // Block user - requires step-up MFA (destructive action)
  const handleBlockUser = useCallback(async () => {
    const verified = await requireStepUp({
      reason: 'Block user from AI features',
      actionType: 'user_block',
    });

    if (verified) {
      setActionLoading('block');
      try {
        // Update user profile to blocked
        const { error } = await supabase
          .from('profiles')
          .update({ is_blocked: true })
          .eq('id', userId);

        if (error) throw error;

        // Also flag in threat scores
        const { error: threatError } = await supabase
          .schema('ai').from('openclaw_user_threat_scores' as unknown as 'profiles')
          .update({ is_flagged: true })
          .eq('user_id', userId);

        if (threatError) {
          console.error('[UserThreatDetail] Error flagging in threat scores:', threatError);
          // Non-critical, user is blocked but threat score update failed
        }

        await loadUserData();
        Alert.alert('Success', 'User has been blocked');
      } catch (err) {
        console.error('[UserThreatDetail] Error blocking user:', err);
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to block user');
      } finally {
        setActionLoading(null);
      }
    }
  }, [userId, loadUserData, requireStepUp]);

  // Unblock user - requires step-up MFA
  const handleUnblockUser = useCallback(async () => {
    const verified = await requireStepUp({
      reason: 'Unblock user from AI features',
      actionType: 'user_unblock',
    });

    if (verified) {
      setActionLoading('unblock');
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ is_blocked: false })
          .eq('id', userId);

        if (error) throw error;

        await loadUserData();
        Alert.alert('Success', 'User has been unblocked');
      } catch (err) {
        console.error('[UserThreatDetail] Error unblocking user:', err);
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to unblock user');
      } finally {
        setActionLoading(null);
      }
    }
  }, [userId, loadUserData, requireStepUp]);

  // Handle step-up verification completion
  const handleStepUpVerify = useCallback(async (code: string): Promise<boolean> => {
    return verifyStepUp(code);
  }, [verifyStepUp]);

  // Handle step-up cancellation
  const handleStepUpCancel = useCallback(() => {
    cancelStepUp();
  }, [cancelStepUp]);

  return {
    isLoading,
    isRefreshing,
    actionLoading,
    userScore,
    events,
    userEmail,
    stepUpState,
    handleRefresh,
    handleResetScore,
    handleBlockUser,
    handleUnblockUser,
    handleStepUpVerify,
    handleStepUpCancel,
  };
}
