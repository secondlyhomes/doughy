// src/features/campaigns/screens/MailHistoryScreen.tsx
// Mail History Screen - View sent mail pieces and their status
// Follows DirectMailCreditsScreen + ConversationsListScreen patterns

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
} from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import {
  LoadingSpinner,
  TAB_BAR_SAFE_PADDING,
  Badge,
} from '@/components/ui';
import { useRouter, Stack } from 'expo-router';
import {
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  AlertCircle,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { useNativeHeader } from '@/hooks';

import {
  useMailHistory,
  useMailHistoryStats,
  type MailHistoryEntry,
} from '../hooks/useMailHistory';
import { MAIL_PIECE_CONFIG, type MailPieceType, type DripTouchStatus } from '../types';

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeAgo(dateString: string | undefined): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

function getContactName(entry: MailHistoryEntry): string {
  const contact = entry.enrollment?.contact;
  if (contact) {
    return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown';
  }
  return 'Unknown';
}

function formatAddress(recipient: Record<string, unknown> | undefined): string {
  if (!recipient) return 'No address';
  const line1 = recipient.address_line1 || recipient.line1 || '';
  return String(line1) || 'No address';
}

function formatCost(cost: number | null | undefined): string {
  if (cost === null || cost === undefined) return '-';
  return `${cost.toFixed(2)} credits`;
}

// =============================================================================
// Status Config
// =============================================================================

interface StatusConfig {
  label: string;
  color: 'default' | 'success' | 'destructive' | 'warning' | 'info';
  icon: typeof CheckCircle;
}

const STATUS_CONFIG: Record<DripTouchStatus, StatusConfig> = {
  pending: { label: 'Pending', color: 'default', icon: Clock },
  sending: { label: 'Sending', color: 'info', icon: Send },
  sent: { label: 'Sent', color: 'info', icon: Send },
  delivered: { label: 'Delivered', color: 'success', icon: CheckCircle },
  failed: { label: 'Failed', color: 'destructive', icon: XCircle },
  skipped: { label: 'Skipped', color: 'warning', icon: AlertCircle },
  bounced: { label: 'Bounced', color: 'destructive', icon: XCircle },
};

// =============================================================================
// Mail History Card
// =============================================================================

interface MailHistoryCardProps {
  entry: MailHistoryEntry;
}

const MailHistoryCard = React.memo(function MailHistoryCard({ entry }: MailHistoryCardProps) {
  const colors = useThemeColors();
  const statusConfig = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending;
  const mailPieceConfig = entry.mail_piece_type
    ? MAIL_PIECE_CONFIG[entry.mail_piece_type as MailPieceType]
    : null;

  return (
    <View
      className="rounded-xl p-4 mb-3"
      style={{ backgroundColor: colors.card }}
    >
      <View className="flex-row items-start">
        <View
          className="rounded-full p-2 mr-3"
          style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}
        >
          <Mail size={ICON_SIZES.lg} color={colors.primary} />
        </View>

        <View className="flex-1">
          {/* Contact Name */}
          <Text
            className="text-base font-semibold mb-1"
            style={{ color: colors.foreground }}
            numberOfLines={1}
          >
            {getContactName(entry)}
          </Text>

          {/* Mail Piece Type & Status Badges */}
          <View className="flex-row items-center gap-2 mb-2">
            {mailPieceConfig && (
              <Badge variant="secondary" size="sm">
                {mailPieceConfig.label}
              </Badge>
            )}
            <Badge variant={statusConfig.color} size="sm">
              {statusConfig.label}
            </Badge>
          </View>

          {/* Address */}
          <Text
            className="text-sm mb-1"
            style={{ color: colors.mutedForeground }}
            numberOfLines={1}
          >
            {formatAddress(entry.recipient_address)}
          </Text>

          {/* Footer: Date & Cost */}
          <View className="flex-row items-center justify-between mt-1">
            <View className="flex-row items-center">
              <Clock size={12} color={colors.mutedForeground} />
              <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>
                {entry.sent_at ? formatTimeAgo(entry.sent_at) : formatDate(entry.scheduled_at)}
              </Text>
            </View>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              {formatCost(entry.mail_cost)}
            </Text>
          </View>

          {/* Error Message (if failed) */}
          {entry.error_message && (
            <View
              className="mt-2 p-2 rounded"
              style={{ backgroundColor: withOpacity(colors.destructive, 'light') }}
            >
              <Text
                className="text-xs"
                style={{ color: colors.destructive }}
                numberOfLines={2}
              >
                {entry.error_message}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
});

// =============================================================================
// Statistics Section
// =============================================================================

interface StatItemProps {
  label: string;
  value: string | number;
  icon: typeof Send;
  color: string;
}

function StatItem({ label, value, icon: Icon, color }: StatItemProps) {
  const colors = useThemeColors();

  return (
    <View className="items-center p-3 flex-1">
      <View
        className="rounded-full p-2 mb-2"
        style={{ backgroundColor: withOpacity(color, 'light') }}
      >
        <Icon size={16} color={color} />
      </View>
      <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
        {value}
      </Text>
      <Text className="text-xs" style={{ color: colors.mutedForeground }}>
        {label}
      </Text>
    </View>
  );
}

function StatsSection() {
  const colors = useThemeColors();
  const { data: stats, isLoading } = useMailHistoryStats();

  if (isLoading) {
    return (
      <View className="p-4">
        <LoadingSpinner size="small" />
      </View>
    );
  }

  return (
    <View
      className="mx-4 mb-4 rounded-xl overflow-hidden"
      style={{ backgroundColor: colors.card }}
    >
      <View className="flex-row">
        <StatItem
          label="Sent"
          value={stats?.total_sent || 0}
          icon={Send}
          color={colors.info}
        />
        <StatItem
          label="Delivered"
          value={stats?.total_delivered || 0}
          icon={CheckCircle}
          color={colors.success}
        />
        <StatItem
          label="Failed"
          value={stats?.total_failed || 0}
          icon={XCircle}
          color={colors.destructive}
        />
        <StatItem
          label="Pending"
          value={stats?.total_pending || 0}
          icon={Clock}
          color={colors.warning}
        />
      </View>
    </View>
  );
}

// =============================================================================
// Main Screen
// =============================================================================

export function MailHistoryScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { data: entries, isLoading, refetch, isFetching } = useMailHistory({ limit: 50 });

  const { headerOptions } = useNativeHeader({
    title: 'Mail History',
    fallbackRoute: '/(tabs)/campaigns',
  });

  const renderItem = useCallback(
    ({ item }: { item: MailHistoryEntry }) => <MailHistoryCard entry={item} />,
    []
  );

  const keyExtractor = useCallback((item: MailHistoryEntry) => item.id, []);

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>

      {/* Stats Section */}
      <View className="pt-4">
        <StatsSection />
      </View>

      {/* Mail History List */}
      {isLoading ? (
        <LoadingSpinner fullScreen color={colors.info} />
      ) : (
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SAFE_PADDING }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={colors.info}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <View
                className="rounded-full p-4 mb-4"
                style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}
              >
                <Mail size={ICON_SIZES['2xl']} color={colors.mutedForeground} />
              </View>
              <Text className="text-lg font-semibold mb-2" style={{ color: colors.foreground }}>
                No mail sent yet
              </Text>
              <Text
                className="text-center px-8"
                style={{ color: colors.mutedForeground }}
              >
                Your direct mail history will appear here once you send mail pieces through campaigns
              </Text>
            </View>
          }
        />
      )}
      </ThemedSafeAreaView>
    </>
  );
}

export default MailHistoryScreen;
