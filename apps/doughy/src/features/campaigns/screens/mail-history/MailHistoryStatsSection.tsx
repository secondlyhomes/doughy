// src/features/campaigns/screens/mail-history/MailHistoryStatsSection.tsx
// Stats overview section for mail history

import React from 'react';
import { View, Text } from 'react-native';
import { LoadingSpinner } from '@/components/ui';
import {
  Clock,
  CheckCircle,
  XCircle,
  Send,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

import { useMailHistoryStats } from '../../hooks/useMailHistory';

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

export function MailHistoryStatsSection() {
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
