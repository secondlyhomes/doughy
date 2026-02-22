// src/features/assistant/components/JobsTab.tsx
// Jobs tab for AI assistant - shows background job status

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Clock,
  RefreshCw,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ICON_SIZES } from '@/constants/design-tokens';
import { LoadingSpinner } from '@/components/ui';

import { useAIJobs } from '../hooks/useAIJobs';
import { JobsTabProps } from './jobs-tab-types';
import { styles } from './jobs-tab-styles';
import { JobCard } from './JobCard';

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
        <LoadingSpinner size="large" />
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
          <Clock size={ICON_SIZES['2xl']} color={colors.mutedForeground} />
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
        <RefreshCw size={ICON_SIZES.md} color={colors.mutedForeground} />
        <Text style={[styles.refreshText, { color: colors.mutedForeground }]}>
          Refresh
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default JobsTab;
