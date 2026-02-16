// src/features/admin/screens/claw-dashboard/ApprovalQueue.tsx
// Pending approvals section with draft preview and expiration countdown

import React from 'react';
import { View, Text } from 'react-native';
import { Shield, Clock, MessageSquare, User } from 'lucide-react-native';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import type { useThemeColors } from '@/contexts/ThemeContext';

import type { ApprovalItem } from './types';

interface ApprovalQueueProps {
  approvals: ApprovalItem[];
  colors: ReturnType<typeof useThemeColors>;
}

export function ApprovalQueue({ approvals, colors }: ApprovalQueueProps) {
  return (
    <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl }}>
      <View className="flex-row items-center" style={{ gap: SPACING.sm, marginBottom: SPACING.sm }}>
        <Shield size={18} color={colors.warning} />
        <Text
          className="text-lg font-semibold"
          style={{ color: colors.foreground }}
        >
          Pending Approvals
        </Text>
        <View
          style={{
            backgroundColor: colors.warning + '20',
            paddingHorizontal: SPACING.xs,
            paddingVertical: 2,
            borderRadius: BORDER_RADIUS.full,
            minWidth: 22,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.warning, fontSize: 12, fontWeight: '600' }}>
            {approvals.length}
          </Text>
        </View>
      </View>

      {approvals.map((approval) => (
        <ApprovalCard key={approval.id} approval={approval} colors={colors} />
      ))}
    </View>
  );
}

function ApprovalCard({
  approval,
  colors,
}: {
  approval: ApprovalItem;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const timeLeft = approval.expiresAt
    ? getTimeUntil(approval.expiresAt)
    : null;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderLeftWidth: 3,
        borderLeftColor: colors.warning,
      }}
    >
      {/* Title + Type */}
      <View className="flex-row items-center justify-between">
        <Text
          className="text-sm font-medium flex-1"
          numberOfLines={1}
          style={{ color: colors.foreground }}
        >
          {approval.title}
        </Text>
        <Text
          className="text-xs"
          style={{
            color: colors.mutedForeground,
            backgroundColor: colors.muted,
            paddingHorizontal: SPACING.xs,
            paddingVertical: 2,
            borderRadius: BORDER_RADIUS.sm,
          }}
        >
          {approval.actionType.replace('_', ' ')}
        </Text>
      </View>

      {/* Recipient */}
      {approval.recipientName && (
        <View
          className="flex-row items-center"
          style={{ gap: SPACING.xs, marginTop: SPACING.xs }}
        >
          <User size={12} color={colors.mutedForeground} />
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>
            To: {approval.recipientName}
          </Text>
        </View>
      )}

      {/* Draft Preview */}
      {approval.draftContent && (
        <View
          style={{
            backgroundColor: colors.muted,
            borderRadius: BORDER_RADIUS.md,
            padding: SPACING.sm,
            marginTop: SPACING.sm,
          }}
        >
          <View className="flex-row items-center" style={{ gap: SPACING.xs, marginBottom: 4 }}>
            <MessageSquare size={12} color={colors.mutedForeground} />
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              Draft
            </Text>
          </View>
          <Text
            className="text-sm"
            numberOfLines={3}
            style={{ color: colors.foreground }}
          >
            {approval.draftContent}
          </Text>
        </View>
      )}

      {/* Footer: agent + expiration */}
      <View
        className="flex-row items-center justify-between"
        style={{ marginTop: SPACING.sm }}
      >
        {approval.agentName && (
          <Text className="text-xs" style={{ color: colors.primary }}>
            {approval.agentName}
          </Text>
        )}
        {timeLeft && (
          <View className="flex-row items-center" style={{ gap: 4 }}>
            <Clock size={12} color={colors.mutedForeground} />
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              Expires {timeLeft}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function getTimeUntil(iso: string): string | null {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'expired';
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hrs > 0) return `in ${hrs}h ${mins}m`;
  return `in ${mins}m`;
}
