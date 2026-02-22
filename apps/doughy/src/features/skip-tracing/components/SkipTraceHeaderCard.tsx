// src/features/skip-tracing/components/SkipTraceHeaderCard.tsx
// Header card for skip trace detail screen showing person info and status

import React from 'react';
import { View, Text } from 'react-native';
import {
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react-native';
import { Badge } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ICON_SIZES } from '@/constants/design-tokens';
import { formatRelativeTime } from '@/utils/format';
import { SKIP_TRACE_STATUS_CONFIG } from '../types';
import type { SkipTraceResultWithRelations } from '../types';

interface SkipTraceHeaderCardProps {
  result: SkipTraceResultWithRelations;
  displayName: string;
}

function StatusIcon({ status }: { status: SkipTraceResultWithRelations['status'] }) {
  const colors = useThemeColors();

  switch (status) {
    case 'completed':
      return <CheckCircle size={ICON_SIZES.ml} color={colors.success} />;
    case 'pending':
    case 'processing':
      return <Loader2 size={ICON_SIZES.ml} color={colors.warning} />;
    case 'failed':
      return <AlertCircle size={ICON_SIZES.ml} color={colors.destructive} />;
    default:
      return <AlertCircle size={ICON_SIZES.ml} color={colors.mutedForeground} />;
  }
}

export function SkipTraceHeaderCard({ result, displayName }: SkipTraceHeaderCardProps) {
  const colors = useThemeColors();
  const statusConfig = SKIP_TRACE_STATUS_CONFIG[result.status];

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.primary + '15',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <User size={ICON_SIZES.xl} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.foreground }}>{displayName}</Text>
            {result.input_address && (
              <Text style={{ fontSize: 14, color: colors.mutedForeground }} numberOfLines={1}>
                {result.input_address}, {result.input_city}, {result.input_state}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Status Badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <StatusIcon status={result.status} />
          <Badge
            variant={
              statusConfig.color === 'success'
                ? 'default'
                : statusConfig.color === 'destructive'
                  ? 'destructive'
                  : 'secondary'
            }
            style={{ marginLeft: 8 }}
          >
            <Text style={{ fontSize: 12 }}>{statusConfig.label}</Text>
          </Badge>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Clock size={ICON_SIZES.xs} color={colors.mutedForeground} style={{ marginRight: 4 }} />
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
            {formatRelativeTime(result.created_at)}
          </Text>
          {result.credits_used > 0 && (
            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginLeft: 8 }}>
              • {result.credits_used} credit{result.credits_used !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
