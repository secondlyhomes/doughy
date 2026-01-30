// src/features/admin/screens/ai-security-dashboard/UserThreatDetailScreen.tsx
// Screen showing detailed threat history for a specific user

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { Button, Badge, ScreenHeader } from '@/components/ui';
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { SPACING, BORDER_RADIUS, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { supabase } from '@/lib/supabase';

import { formatRelativeTime } from './utils';
import type { SecurityEvent, UserThreatScore } from './types';

export function UserThreatDetailScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();

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
        .from('ai_moltbot_user_threat_scores' as 'profiles')
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
        .from('ai_moltbot_security_logs' as 'profiles')
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

  // Reset threat score
  const handleResetScore = useCallback(() => {
    Alert.alert(
      'Reset Threat Score',
      'This will reset the user\'s threat score to 0. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            setActionLoading('reset');
            try {
              const { error } = await supabase
                .from('ai_moltbot_user_threat_scores' as 'profiles')
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
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to reset score');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }, [userId, loadUserData]);

  // Block user
  const handleBlockUser = useCallback(() => {
    Alert.alert(
      'Block User',
      'This will prevent the user from using AI features. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('block');
            try {
              // Update user profile to blocked
              const { error } = await supabase
                .from('profiles')
                .update({ is_blocked: true })
                .eq('id', userId);

              if (error) throw error;

              // Also flag in threat scores
              await supabase
                .from('ai_moltbot_user_threat_scores' as 'profiles')
                .update({ is_flagged: true })
                .eq('user_id', userId);

              await loadUserData();
              Alert.alert('Success', 'User has been blocked');
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to block user');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }, [userId, loadUserData]);

  // Unblock user
  const handleUnblockUser = useCallback(() => {
    Alert.alert(
      'Unblock User',
      'This will restore the user\'s access to AI features. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
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
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to unblock user');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }, [userId, loadUserData]);

  const getScoreColor = (score: number): string => {
    if (score >= 800) return colors.destructive;
    if (score >= 500) return colors.warning;
    if (score >= 200) return '#f59e0b';
    return colors.success;
  };

  const getThreatLevelColor = (level: string): string => {
    if (level === 'critical') return colors.destructive;
    if (level === 'high') return colors.warning;
    if (level === 'medium') return '#f59e0b';
    return colors.mutedForeground;
  };

  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <ScreenHeader title="User Threat Details" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScreenHeader title="User Threat Details" onBack={() => router.back()} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: SPACING.md,
          paddingTop: SPACING.md,
          paddingBottom: TAB_BAR_SAFE_PADDING + SPACING['4xl'] * 2,
        }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {/* User Info Card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: BORDER_RADIUS.lg,
            padding: 16,
            marginBottom: SPACING.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.muted,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="person" size={ICON_SIZES.xl} color={colors.mutedForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                {userEmail || 'Unknown User'}
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground }} numberOfLines={1}>
                {userId}
              </Text>
            </View>
          </View>

          {/* Threat Score */}
          {userScore && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Threat Score</Text>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: '700',
                    color: getScoreColor(userScore.currentScore),
                  }}
                >
                  {userScore.currentScore}
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Events (24h)</Text>
                <Text style={{ fontSize: 24, fontWeight: '600', color: colors.foreground }}>
                  {userScore.events24h}
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                {userScore.isFlagged && (
                  <Badge variant="destructive">
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>FLAGGED</Text>
                  </Badge>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: SPACING.lg }}>
          <Button
            variant="outline"
            onPress={handleResetScore}
            disabled={actionLoading !== null}
            style={{ flex: 1 }}
          >
            {actionLoading === 'reset' ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="refresh" size={ICON_SIZES.md} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: '500' }}>Reset Score</Text>
              </View>
            )}
          </Button>
          <Button
            variant="destructive"
            onPress={handleBlockUser}
            disabled={actionLoading !== null}
            style={{ flex: 1 }}
          >
            {actionLoading === 'block' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="ban" size={ICON_SIZES.md} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '500' }}>Block User</Text>
              </View>
            )}
          </Button>
        </View>

        {/* Security Events */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.foreground,
            marginBottom: 12,
          }}
        >
          Security Events ({events.length})
        </Text>

        {events.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: BORDER_RADIUS.lg,
              padding: 24,
              alignItems: 'center',
            }}
          >
            <Ionicons name="shield-checkmark" size={ICON_SIZES['3xl']} color={colors.success} />
            <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>
              No security events recorded
            </Text>
          </View>
        ) : (
          events.map((event) => (
            <EventCard key={event.id} event={event} colors={colors} getThreatLevelColor={getThreatLevelColor} />
          ))
        )}
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

// Event card component
interface EventCardProps {
  event: SecurityEvent;
  colors: ReturnType<typeof useThemeColors>;
  getThreatLevelColor: (level: string) => string;
}

function EventCard({ event, colors, getThreatLevelColor }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const threatColor = getThreatLevelColor(event.threatLevel);

  // Extract input from details if available
  const userInput = event.details?.input || event.details?.user_input || event.details?.message;
  const matchedPattern = event.details?.matched_pattern || event.details?.pattern;
  const additionalDetails = event.details?.details || event.details?.reason;

  return (
    <TouchableOpacity
      activeOpacity={PRESS_OPACITY.DEFAULT}
      onPress={() => setExpanded(!expanded)}
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: threatColor,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Badge
              variant="outline"
              style={{
                backgroundColor: threatColor + '20',
                borderColor: threatColor,
                marginRight: 8,
              }}
            >
              <Text style={{ fontSize: 10, color: threatColor, fontWeight: '600' }}>
                {event.threatLevel.toUpperCase()}
              </Text>
            </Badge>
            <Text style={{ fontSize: 12, color: colors.foreground, fontWeight: '500' }}>
              {event.action.replace(/_/g, ' ')}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
            {formatRelativeTime(event.createdAt)}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={ICON_SIZES.ml}
          color={colors.mutedForeground}
        />
      </View>

      {expanded && (
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
          {userInput && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.mutedForeground, marginBottom: 4 }}>
                User Input:
              </Text>
              <View
                style={{
                  backgroundColor: colors.muted,
                  borderRadius: BORDER_RADIUS.sm,
                  padding: 8,
                }}
              >
                <Text style={{ fontSize: 12, color: colors.foreground }} numberOfLines={5}>
                  {String(userInput)}
                </Text>
              </View>
            </View>
          )}

          {matchedPattern && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.mutedForeground, marginBottom: 4 }}>
                Matched Pattern:
              </Text>
              <Text style={{ fontSize: 12, color: colors.warning, fontFamily: 'monospace' }}>
                {String(matchedPattern)}
              </Text>
            </View>
          )}

          {additionalDetails && (
            <View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.mutedForeground, marginBottom: 4 }}>
                Details:
              </Text>
              <Text style={{ fontSize: 12, color: colors.foreground }}>
                {String(additionalDetails)}
              </Text>
            </View>
          )}

          {!userInput && !matchedPattern && !additionalDetails && (
            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontStyle: 'italic' }}>
              No additional details available
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default UserThreatDetailScreen;
