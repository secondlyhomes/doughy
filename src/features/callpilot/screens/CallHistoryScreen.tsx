// CallPilot — Call History Screen
// Shows list of past and upcoming calls with status indicators

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  Plus,
  Voicemail,
} from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { ScreenHeader, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, ICON_SIZES } from '@/constants/design-tokens';
import { useCallHistory, type Call } from '../hooks/useCallPilot';

export function CallHistoryScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { calls, fetchCalls, isLoading, error } = useCallHistory();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCalls();
    setRefreshing(false);
  }, [fetchCalls]);

  const handleNewCall = useCallback(() => {
    router.push('/(tabs)/calls/new');
  }, [router]);

  const handleCallPress = useCallback((call: Call) => {
    if (call.status === 'completed') {
      router.push(`/(tabs)/calls/review/${call.id}`);
    } else if (call.status === 'initiated' || call.status === 'ringing') {
      router.push(`/(tabs)/calls/pre-call/${call.id}`);
    } else if (call.status === 'in_progress') {
      router.push(`/(tabs)/calls/active/${call.id}`);
    }
  }, [router]);

  const renderCall = useCallback(({ item }: { item: Call }) => {
    const icon = getCallIcon(item, colors);
    const statusColor = getStatusColor(item.status, colors);
    const duration = item.duration_seconds
      ? formatDuration(item.duration_seconds)
      : item.status === 'in_progress' ? 'Live' : '—';

    return (
      <TouchableOpacity
        className="flex-row items-center py-3 px-4"
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        onPress={() => handleCallPress(item)}
        activeOpacity={0.7}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: withOpacity(statusColor, 'muted') }}
        >
          {icon}
        </View>

        <View className="flex-1">
          <Text className="text-sm font-medium" style={{ color: colors.foreground }} numberOfLines={1}>
            {item.phone_number}
          </Text>
          <Text className="text-xs mt-0.5" style={{ color: colors.mutedForeground }}>
            {item.direction === 'outbound' ? 'Outgoing' : 'Incoming'} · {formatTimeAgo(item.created_at)}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-xs font-medium" style={{ color: statusColor }}>
            {item.status === 'in_progress' ? 'LIVE' : item.status}
          </Text>
          <Text className="text-xs mt-0.5" style={{ color: colors.mutedForeground }}>
            {duration}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [colors, handleCallPress]);

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScreenHeader
        title="Calls"
        rightAction={{ icon: Plus, onPress: handleNewCall }}
      />

      {/* Stats Row */}
      <View className="flex-row gap-3 mx-4 mb-3">
        <MiniStat label="Today" value={String(calls.filter((c) => isToday(c.created_at)).length)} colors={colors} />
        <MiniStat label="This Week" value={String(calls.filter((c) => isThisWeek(c.created_at)).length)} colors={colors} />
        <MiniStat label="Avg Duration" value={formatAvgDuration(calls)} colors={colors} />
      </View>

      <FlatList
        data={calls}
        renderItem={renderCall}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View className="items-center py-16">
            <Phone size={48} color={colors.mutedForeground} />
            <Text className="text-base mt-4" style={{ color: colors.mutedForeground }}>
              No calls yet
            </Text>
            <TouchableOpacity
              className="mt-4 rounded-xl px-6 py-3"
              style={{ backgroundColor: colors.primary }}
              onPress={handleNewCall}
              activeOpacity={0.7}
            >
              <Text className="text-sm font-medium" style={{ color: colors.primaryForeground }}>
                Start Your First Call
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </ThemedSafeAreaView>
  );
}

function MiniStat({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useThemeColors> }) {
  return (
    <View className="flex-1 rounded-lg py-2 items-center" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
      <Text className="text-lg font-bold" style={{ color: colors.foreground }}>{value}</Text>
      <Text className="text-xs" style={{ color: colors.mutedForeground }}>{label}</Text>
    </View>
  );
}

function getCallIcon(call: Call, colors: ReturnType<typeof useThemeColors>) {
  const size = ICON_SIZES.lg;
  if (call.status === 'missed') return <PhoneMissed size={size} color={colors.destructive} />;
  if (call.status === 'voicemail') return <Voicemail size={size} color={colors.warning} />;
  if (call.direction === 'outbound') return <PhoneOutgoing size={size} color={colors.primary} />;
  return <PhoneIncoming size={size} color={colors.success} />;
}

function getStatusColor(status: string, colors: ReturnType<typeof useThemeColors>): string {
  switch (status) {
    case 'completed': return colors.success;
    case 'in_progress': return colors.info;
    case 'missed': case 'failed': return colors.destructive;
    case 'voicemail': return colors.warning;
    default: return colors.mutedForeground;
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatAvgDuration(calls: Call[]): string {
  const completed = calls.filter((c) => c.duration_seconds);
  if (completed.length === 0) return '—';
  const avg = completed.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / completed.length;
  return formatDuration(Math.round(avg));
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function isToday(dateStr: string): boolean {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

function isThisWeek(dateStr: string): boolean {
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000;
}

export default CallHistoryScreen;
