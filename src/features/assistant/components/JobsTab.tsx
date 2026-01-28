// src/features/assistant/components/JobsTab.tsx
// Jobs tab for AI assistant - shows background job status

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  X,
  FileText,
  ChevronRight,
  RefreshCw,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { formatRelativeTime } from '@/utils/format';
import { BORDER_RADIUS, SPACING } from '@/constants/design-tokens';
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';

import {
  AIJob,
  AIJobStatus,
  JOB_TYPE_CONFIG,
  JOB_STATUS_CONFIG,
} from '../types/jobs';
import { useAIJobs } from '../hooks/useAIJobs';

interface JobsTabProps {
  dealId?: string;
  onJobPress?: (job: AIJob) => void;
}

// Status icon mapping
const STATUS_ICONS: Record<AIJobStatus, React.ComponentType<any>> = {
  queued: Clock,
  running: Loader2,
  succeeded: CheckCircle,
  failed: XCircle,
  cancelled: X,
};

export function JobsTab({ dealId, onJobPress }: JobsTabProps) {
  const colors = useThemeColors();
  const { jobs, pendingCount, isLoading, refetch, cancelJob, canCancel } =
    useAIJobs(dealId);

  const handleCancelJob = async (jobId: string, e: any) => {
    e.stopPropagation();
    try {
      await cancelJob(jobId);
    } catch (error) {
      console.error('Failed to cancel job:', error);
      Alert.alert(
        'Failed to Cancel',
        'Unable to cancel the job. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  if (!dealId) {
    return (
      <View style={styles.emptyContainer}>
        <Clock size={40} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          No Deal Selected
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
          Open a deal to see background jobs
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Loading jobs...
        </Text>
      </View>
    );
  }

  if (jobs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View
          style={[
            styles.emptyIconContainer,
            { backgroundColor: colors.muted },
          ]}
        >
          <Clock size={32} color={colors.mutedForeground} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          No Jobs Yet
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
          Background jobs will appear here when you run actions like generating
          reports or organizing walkthroughs.
        </Text>
      </View>
    );
  }

  // Group jobs by status
  const activeJobs = jobs.filter(
    (j) => j.status === 'queued' || j.status === 'running'
  );
  const completedJobs = jobs.filter(
    (j) => j.status === 'succeeded' || j.status === 'failed' || j.status === 'cancelled'
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Pending Jobs Header */}
      {activeJobs.length > 0 && (
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              IN PROGRESS
            </Text>
            <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.countBadgeText, { color: colors.primaryForeground }]}>{activeJobs.length}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Active Jobs */}
      {activeJobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          onPress={() => onJobPress?.(job)}
          onCancel={
            canCancel(job) ? (e) => handleCancelJob(job.id, e) : undefined
          }
        />
      ))}

      {/* Completed Jobs */}
      {completedJobs.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            COMPLETED
          </Text>
        </View>
      )}

      {completedJobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          onPress={() => onJobPress?.(job)}
        />
      ))}

      {/* Refresh Button */}
      <TouchableOpacity
        style={[styles.refreshButton, { borderColor: colors.border }]}
        onPress={() => refetch()}
        activeOpacity={0.7}
      >
        <RefreshCw size={16} color={colors.mutedForeground} />
        <Text style={[styles.refreshText, { color: colors.mutedForeground }]}>
          Refresh
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Job Card Component
interface JobCardProps {
  job: AIJob;
  onPress: () => void;
  onCancel?: (e: any) => void;
}

function JobCard({ job, onPress, onCancel }: JobCardProps) {
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
          <ActivityIndicator size="small" color={colors.info} />
        ) : (
          <StatusIcon
            size={18}
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
            <X size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
        {job.status === 'succeeded' && (
          <ChevronRight size={18} color={colors.mutedForeground} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: TAB_BAR_SAFE_PADDING,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['3xl'],
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS['36'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: 14,
  },
  sectionHeader: {
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS['10'],
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: 10,
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS['10'],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  jobInfo: {
    flex: 1,
  },
  jobLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  jobMeta: {
    fontSize: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    width: 32,
    textAlign: 'right',
  },
  errorText: {
    fontSize: 11,
    marginTop: 4,
  },
  jobActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginLeft: 8,
  },
  cancelButton: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS['14'],
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS['10'],
    borderWidth: 1,
    marginTop: SPACING.sm,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default JobsTab;
