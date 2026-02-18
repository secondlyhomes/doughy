// src/features/campaigns/screens/campaign-detail/EnrollmentCard.tsx
// Card component for displaying campaign enrollment status

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  Play,
  Pause,
  MessageSquare,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Clock,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Badge } from '@/components/ui';
import { getStatusBadgeVariant } from '@/lib/formatters';
import type { DripEnrollment } from '../../types';

interface EnrollmentCardProps {
  enrollment: DripEnrollment;
  totalSteps: number;
  onPause: () => void;
  onResume: () => void;
  onRemove: () => void;
}

export function EnrollmentCard({
  enrollment,
  totalSteps,
  onPause,
  onResume,
  onRemove,
}: EnrollmentCardProps) {
  const colors = useThemeColors();

  const getStatusIcon = () => {
    switch (enrollment.status) {
      case 'active':
        return <Play size={14} color={colors.success} />;
      case 'paused':
        return <Pause size={14} color={colors.warning} />;
      case 'completed':
        return <CheckCircle size={14} color={colors.info} />;
      case 'responded':
        return <MessageSquare size={14} color={colors.success} />;
      case 'converted':
        return <Target size={14} color={colors.primary} />;
      case 'opted_out':
        return <XCircle size={14} color={colors.destructive} />;
      default:
        return <AlertCircle size={14} color={colors.mutedForeground} />;
    }
  };


  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const contactName = enrollment.contact
    ? `${enrollment.contact.first_name || ''} ${enrollment.contact.last_name || ''}`.trim() ||
      'Unknown'
    : 'Unknown Contact';

  return (
    <View className="rounded-lg p-3 mb-2" style={{ backgroundColor: colors.muted }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {getStatusIcon()}
          <Text className="ml-2 font-medium" style={{ color: colors.foreground }}>
            {contactName}
          </Text>
        </View>
        <Badge variant={getStatusBadgeVariant(enrollment.status)} size="sm">
          {enrollment.status.replace('_', ' ')}
        </Badge>
      </View>

      <View className="flex-row items-center justify-between mt-2">
        <View className="flex-row items-center">
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>
            Step {enrollment.current_step}/{totalSteps}
          </Text>
          <View
            className="w-1 h-1 rounded-full mx-2"
            style={{ backgroundColor: colors.border }}
          />
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>
            {enrollment.touches_sent} sent
          </Text>
        </View>

        <View className="flex-row gap-2">
          {enrollment.status === 'active' && (
            <TouchableOpacity onPress={onPause} className="p-1">
              <Pause size={16} color={colors.warning} />
            </TouchableOpacity>
          )}
          {enrollment.status === 'paused' && (
            <TouchableOpacity onPress={onResume} className="p-1">
              <Play size={16} color={colors.success} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onRemove} className="p-1">
            <Trash2 size={16} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      {enrollment.next_touch_at && enrollment.status === 'active' && (
        <View className="flex-row items-center mt-2">
          <Clock size={12} color={colors.mutedForeground} />
          <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>
            Next touch: {formatDate(enrollment.next_touch_at)}
          </Text>
        </View>
      )}
    </View>
  );
}
