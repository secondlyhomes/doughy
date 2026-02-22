// src/features/assistant/components/JobCard.tsx
// Individual job card component for the JobsTab

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import {
  X,
  ChevronRight,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { formatRelativeTime } from '@/utils/format';
import { ICON_SIZES } from '@/constants/design-tokens';
import { LoadingSpinner } from '@/components/ui';

import {
  JOB_TYPE_CONFIG,
  JOB_STATUS_CONFIG,
} from '../types/jobs';
import { JobCardProps, STATUS_ICONS } from './jobs-tab-types';
import { styles } from './jobs-tab-styles';

export function JobCard({ job, onPress, onCancel }: JobCardProps) {
  const colors = useThemeColors();
  const config = JOB_TYPE_CONFIG[job.job_type];
  const statusConfig = JOB_STATUS_CONFIG[job.status];
  const StatusIcon = STATUS_ICONS[job.status];

  const isActive = job.status === 'queued' || job.status === 'running';

  return (
    <TouchableOpacity
      style={[
        styles.jobCard,
        {
          backgroundColor: colors.muted,
          borderColor: isActive ? colors.primary + '40' : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Status Icon */}
      <View
        style={[
          styles.statusIconContainer,
          {
            backgroundColor:
              statusConfig.color === 'green'
                ? colors.success + '20'
                : statusConfig.color === 'red'
                ? colors.destructive + '20'
                : statusConfig.color === 'blue'
                ? colors.info + '20'
                : colors.muted,
          },
        ]}
      >
        {job.status === 'running' ? (
          <LoadingSpinner size="small" />
        ) : (
          <StatusIcon
            size={ICON_SIZES.ml}
            color={
              statusConfig.color === 'green'
                ? colors.success
                : statusConfig.color === 'red'
                ? colors.destructive
                : statusConfig.color === 'blue'
                ? colors.info
                : colors.mutedForeground
            }
          />
        )}
      </View>

      {/* Job Info */}
      <View style={styles.jobInfo}>
        <Text style={[styles.jobLabel, { color: colors.foreground }]}>
          {config?.label || job.job_type}
        </Text>
        <Text style={[styles.jobMeta, { color: colors.mutedForeground }]}>
          {statusConfig.label}
          {job.created_at && ` • ${formatRelativeTime(job.created_at)}`}
        </Text>

        {/* Progress Bar for Running Jobs */}
        {job.status === 'running' && (
          <View style={styles.progressContainer}>
            <View
              style={[styles.progressTrack, { backgroundColor: colors.border }]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${job.progress}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
              {job.progress}%
            </Text>
          </View>
        )}

        {/* Error Message */}
        {job.status === 'failed' && job.error_message && (
          <Text
            style={[styles.errorText, { color: colors.destructive }]}
            numberOfLines={2}
          >
            {job.error_message}
          </Text>
        )}
      </View>

      {/* Actions */}
      <View style={styles.jobActions}>
        {onCancel && (
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={onCancel}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={ICON_SIZES.sm} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
        {job.status === 'succeeded' && (
          <ChevronRight size={ICON_SIZES.ml} color={colors.mutedForeground} />
        )}
      </View>
    </TouchableOpacity>
  );
}
