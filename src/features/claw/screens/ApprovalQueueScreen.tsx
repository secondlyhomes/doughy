// The Claw — Approval Queue Screen
// List pending approvals with approve/reject/edit actions

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Check,
  X,
  Edit3,
  Send,
  CheckCheck,
  Clock,
} from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { ScreenHeader, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { useApprovals, type ClawApproval } from '../hooks/useClawApi';

type FilterTab = 'pending' | 'executed' | 'rejected';

export function ApprovalQueueScreen() {
  const colors = useThemeColors();
  const { approvals, fetchApprovals, decideApproval, batchDecide, isLoading, error } = useApprovals();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('pending');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchApprovals(activeFilter);
  }, [activeFilter, fetchApprovals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchApprovals(activeFilter);
    setRefreshing(false);
  }, [activeFilter, fetchApprovals]);

  const handleApprove = useCallback(async (approval: ClawApproval) => {
    try {
      await decideApproval(approval.id, 'approve');
    } catch (err) {
      Alert.alert('Error', 'Failed to approve');
    }
  }, [decideApproval]);

  const handleReject = useCallback(async (approval: ClawApproval) => {
    try {
      await decideApproval(approval.id, 'reject');
    } catch (err) {
      Alert.alert('Error', 'Failed to reject');
    }
  }, [decideApproval]);

  const handleEdit = useCallback((approval: ClawApproval) => {
    setEditingId(approval.id);
    setEditText(approval.draft_content);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId) return;
    try {
      await decideApproval(editingId, 'approve', editText);
      setEditingId(null);
      setEditText('');
    } catch (err) {
      Alert.alert('Error', 'Failed to approve with edit');
    }
  }, [editingId, editText, decideApproval]);

  const handleApproveAll = useCallback(async () => {
    if (approvals.length === 0) return;
    Alert.alert(
      'Approve All',
      `Send ${approvals.length} message(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          onPress: async () => {
            try {
              await batchDecide(
                approvals.map((a) => ({ approval_id: a.id, action: 'approve' as const })),
              );
            } catch {
              Alert.alert('Error', 'Batch approve failed');
            }
          },
        },
      ],
    );
  }, [approvals, batchDecide]);

  const filters: FilterTab[] = ['pending', 'executed', 'rejected'];

  const renderApproval = useCallback(({ item }: { item: ClawApproval }) => {
    const isEditing = editingId === item.id;
    const isPending = item.status === 'pending';

    return (
      <View
        className="rounded-xl p-4 mb-3"
        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <Send size={ICON_SIZES.md} color={colors.primary} />
            <Text className="ml-2 text-sm font-semibold flex-1" style={{ color: colors.foreground }} numberOfLines={1}>
              {item.recipient_name || item.title}
            </Text>
          </View>
          <StatusBadge status={item.status} colors={colors} />
        </View>

        {/* Recipient info */}
        {item.recipient_phone && (
          <Text className="text-xs mb-2" style={{ color: colors.mutedForeground }}>
            {item.recipient_phone}
          </Text>
        )}

        {/* Draft content */}
        {isEditing ? (
          <View className="mb-3">
            <TextInput
              className="rounded-lg p-3 text-sm"
              style={{
                backgroundColor: colors.muted,
                color: colors.foreground,
                minHeight: 80,
              }}
              value={editText}
              onChangeText={setEditText}
              multiline
              maxLength={300}
            />
            <View className="flex-row gap-2 mt-2">
              <TouchableOpacity
                className="flex-1 rounded-lg py-2 items-center"
                style={{ backgroundColor: colors.primary }}
                onPress={handleSaveEdit}
                activeOpacity={0.7}
              >
                <Text className="text-sm font-medium" style={{ color: colors.primaryForeground }}>
                  Approve with Edit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="rounded-lg py-2 px-4 items-center"
                style={{ backgroundColor: colors.muted }}
                onPress={() => setEditingId(null)}
                activeOpacity={0.7}
              >
                <Text className="text-sm" style={{ color: colors.foreground }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text className="text-sm leading-5 mb-3" style={{ color: colors.foreground }}>
            {item.draft_content}
          </Text>
        )}

        {/* Action buttons (only for pending) */}
        {isPending && !isEditing && (
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center rounded-lg py-2.5"
              style={{ backgroundColor: colors.primary }}
              onPress={() => handleApprove(item)}
              activeOpacity={0.7}
            >
              <Check size={ICON_SIZES.md} color={colors.primaryForeground} />
              <Text className="ml-1 text-sm font-medium" style={{ color: colors.primaryForeground }}>
                Approve
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-lg py-2.5 px-4 items-center justify-center"
              style={{ backgroundColor: colors.muted }}
              onPress={() => handleEdit(item)}
              activeOpacity={0.7}
            >
              <Edit3 size={ICON_SIZES.md} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-lg py-2.5 px-4 items-center justify-center"
              style={{ backgroundColor: withOpacity(colors.destructive, 'muted') }}
              onPress={() => handleReject(item)}
              activeOpacity={0.7}
            >
              <X size={ICON_SIZES.md} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        )}

        {/* Timestamp */}
        <Text className="text-xs mt-2" style={{ color: colors.mutedForeground }}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
    );
  }, [colors, editingId, editText, handleApprove, handleReject, handleEdit, handleSaveEdit]);

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScreenHeader
        title="Approvals"
        rightAction={
          activeFilter === 'pending' && approvals.length > 1
            ? { label: 'Approve All', onPress: handleApproveAll }
            : undefined
        }
      />

      {/* Filter Tabs */}
      <View className="flex-row px-4 mb-3 gap-2">
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            className="flex-1 rounded-lg py-2 items-center"
            style={{
              backgroundColor: activeFilter === filter ? colors.primary : colors.muted,
            }}
            onPress={() => setActiveFilter(filter)}
            activeOpacity={0.7}
          >
            <Text
              className="text-sm font-medium capitalize"
              style={{
                color: activeFilter === filter ? colors.primaryForeground : colors.foreground,
              }}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={approvals}
        renderItem={renderApproval}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: TAB_BAR_SAFE_PADDING }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View className="items-center py-12">
            {activeFilter === 'pending' ? (
              <CheckCheck size={48} color={colors.mutedForeground} />
            ) : (
              <Clock size={48} color={colors.mutedForeground} />
            )}
            <Text className="text-base mt-4" style={{ color: colors.mutedForeground }}>
              {activeFilter === 'pending' ? 'All caught up!' : `No ${activeFilter} approvals`}
            </Text>
          </View>
        }
      />
    </ThemedSafeAreaView>
  );
}

function StatusBadge({ status, colors }: { status: string; colors: ReturnType<typeof useThemeColors> }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: withOpacity(colors.warning, 'medium'), text: colors.warning, label: 'Pending' },
    approved: { bg: withOpacity(colors.info, 'medium'), text: colors.info, label: 'Approved' },
    executed: { bg: withOpacity(colors.success, 'medium'), text: colors.success, label: 'Sent' },
    rejected: { bg: withOpacity(colors.destructive, 'medium'), text: colors.destructive, label: 'Rejected' },
  };
  const c = config[status] || config.pending;

  return (
    <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: c.bg }}>
      <Text className="text-xs font-medium" style={{ color: c.text }}>{c.label}</Text>
    </View>
  );
}

export default ApprovalQueueScreen;
