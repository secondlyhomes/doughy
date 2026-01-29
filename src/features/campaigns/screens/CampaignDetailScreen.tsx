// src/features/campaigns/screens/CampaignDetailScreen.tsx
// Campaign Detail Screen - View campaign, enrollees, and stats

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import {
  Button,
  BottomSheet,
  BottomSheetSection,
  TAB_BAR_SAFE_PADDING,
  LoadingSpinner,
} from '@/components/ui';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Play,
  Pause,
  Users,
  MessageSquare,
  Target,
  Mail,
  Phone,
  Send,
  Instagram,
  MoreVertical,
  UserPlus,
  Edit,
  Trash2,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

import {
  useCampaign,
  useCampaignEnrollments,
  useUpdateCampaign,
  useDeleteCampaign,
  usePauseEnrollment,
  useResumeEnrollment,
  useRemoveFromCampaign,
} from '../hooks/useCampaigns';
import type { DripEnrollment, CampaignStep } from '../types';
import { CHANNEL_CONFIG, LEAD_TYPE_CONFIG } from '../types';

// =============================================================================
// Enrollment Card Component
// =============================================================================

interface EnrollmentCardProps {
  enrollment: DripEnrollment;
  totalSteps: number;
  onPause: () => void;
  onResume: () => void;
  onRemove: () => void;
}

function EnrollmentCard({ enrollment, totalSteps, onPause, onResume, onRemove }: EnrollmentCardProps) {
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

  const getStatusColor = () => {
    switch (enrollment.status) {
      case 'active':
        return colors.success;
      case 'paused':
        return colors.warning;
      case 'completed':
      case 'responded':
        return colors.info;
      case 'converted':
        return colors.primary;
      case 'opted_out':
      case 'bounced':
        return colors.destructive;
      default:
        return colors.mutedForeground;
    }
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const contactName = enrollment.contact
    ? `${enrollment.contact.first_name || ''} ${enrollment.contact.last_name || ''}`.trim() || 'Unknown'
    : 'Unknown Contact';

  return (
    <View
      className="rounded-lg p-3 mb-2"
      style={{ backgroundColor: colors.muted }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {getStatusIcon()}
          <Text className="ml-2 font-medium" style={{ color: colors.foreground }}>
            {contactName}
          </Text>
        </View>
        <View
          className="px-2 py-0.5 rounded-full"
          style={{ backgroundColor: withOpacity(getStatusColor(), 'light') }}
        >
          <Text className="text-xs capitalize" style={{ color: getStatusColor() }}>
            {enrollment.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-2">
        <View className="flex-row items-center">
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>
            Step {enrollment.current_step}/{totalSteps}
          </Text>
          <View className="w-1 h-1 rounded-full mx-2" style={{ backgroundColor: colors.border }} />
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

// =============================================================================
// Main Screen
// =============================================================================

export function CampaignDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: campaign, isLoading: campaignLoading, refetch } = useCampaign(id);
  const { data: enrollments, isLoading: enrollmentsLoading } = useCampaignEnrollments(id);

  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const pauseEnrollment = usePauseEnrollment();
  const resumeEnrollment = useResumeEnrollment();
  const removeFromCampaign = useRemoveFromCampaign();

  const [showActionsSheet, setShowActionsSheet] = useState(false);

  const totalSteps = campaign?.steps?.length || 0;

  const handleToggleStatus = useCallback(async () => {
    if (!campaign) return;

    const newStatus = campaign.status === 'active' ? 'paused' : 'active';

    try {
      await updateCampaign.mutateAsync({
        id: campaign.id,
        status: newStatus,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Update Failed', `Could not ${newStatus === 'active' ? 'activate' : 'pause'} campaign: ${errorMessage}`);
    }
  }, [campaign, updateCampaign]);

  const handleDelete = useCallback(() => {
    if (!campaign) return;

    Alert.alert(
      'Delete Campaign',
      'Are you sure? This will remove all enrollments and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCampaign.mutateAsync(campaign.id);
              router.back();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
              Alert.alert('Delete Failed', `Could not delete campaign: ${errorMessage}`);
            }
          },
        },
      ]
    );
  }, [campaign, deleteCampaign, router]);

  const handlePauseEnrollment = useCallback(async (enrollmentId: string) => {
    try {
      await pauseEnrollment.mutateAsync({ id: enrollmentId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Pause Failed', `Could not pause enrollment: ${errorMessage}`);
    }
  }, [pauseEnrollment]);

  const handleResumeEnrollment = useCallback(async (enrollmentId: string) => {
    try {
      await resumeEnrollment.mutateAsync(enrollmentId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Resume Failed', `Could not resume enrollment: ${errorMessage}`);
    }
  }, [resumeEnrollment]);

  const handleRemoveEnrollment = useCallback((enrollmentId: string) => {
    Alert.alert(
      'Remove from Campaign',
      'Remove this contact from the campaign?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromCampaign.mutateAsync(enrollmentId);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
              Alert.alert('Remove Failed', `Could not remove contact from campaign: ${errorMessage}`);
            }
          },
        },
      ]
    );
  }, [removeFromCampaign]);

  const leadTypeConfig = campaign?.lead_type
    ? LEAD_TYPE_CONFIG[campaign.lead_type]
    : null;

  if (campaignLoading) {
    return (
      <ThemedSafeAreaView className="flex-1 items-center justify-center">
        <LoadingSpinner />
      </ThemedSafeAreaView>
    );
  }

  if (!campaign) {
    return (
      <ThemedSafeAreaView className="flex-1 items-center justify-center">
        <Text style={{ color: colors.mutedForeground }}>Campaign not found</Text>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold flex-1 mx-3" numberOfLines={1} style={{ color: colors.foreground }}>
          {campaign.name}
        </Text>
        <TouchableOpacity onPress={() => setShowActionsSheet(true)} className="p-2 -mr-2">
          <MoreVertical size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}
        refreshControl={
          <RefreshControl
            refreshing={campaignLoading}
            onRefresh={refetch}
            tintColor={colors.info}
          />
        }
      >
        {/* Status & Quick Actions */}
        <View className="px-4 py-4">
          <View className="flex-row items-center justify-between mb-4">
            <View
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: withOpacity(
                  campaign.status === 'active' ? colors.success : colors.warning,
                  'light'
                ),
              }}
            >
              <Text
                className="text-sm font-medium capitalize"
                style={{
                  color: campaign.status === 'active' ? colors.success : colors.warning,
                }}
              >
                {campaign.status}
              </Text>
            </View>

            <Button
              variant={campaign.status === 'active' ? 'outline' : 'default'}
              onPress={handleToggleStatus}
              disabled={updateCampaign.isPending}
            >
              {campaign.status === 'active' ? (
                <>
                  <Pause size={16} color={colors.foreground} />
                  <Text className="ml-2">Pause</Text>
                </>
              ) : (
                <>
                  <Play size={16} color={colors.primaryForeground} />
                  <Text className="ml-2">Activate</Text>
                </>
              )}
            </Button>
          </View>

          {/* Lead Type */}
          {leadTypeConfig && (
            <View className="flex-row items-center mb-4">
              <Target size={16} color={colors.primary} />
              <Text className="ml-2 text-sm" style={{ color: colors.foreground }}>
                {leadTypeConfig.label}
              </Text>
              <Text className="text-sm ml-1" style={{ color: colors.mutedForeground }}>
                - {leadTypeConfig.description}
              </Text>
            </View>
          )}
        </View>

        {/* Stats Cards */}
        <View className="px-4 pb-4">
          <View className="flex-row gap-3">
            <View className="flex-1 rounded-xl p-4" style={{ backgroundColor: colors.card }}>
              <Users size={20} color={colors.primary} />
              <Text className="text-2xl font-bold mt-2" style={{ color: colors.foreground }}>
                {campaign.enrolled_count}
              </Text>
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                Enrolled
              </Text>
            </View>

            <View className="flex-1 rounded-xl p-4" style={{ backgroundColor: colors.card }}>
              <MessageSquare size={20} color={colors.success} />
              <Text className="text-2xl font-bold mt-2" style={{ color: colors.foreground }}>
                {campaign.responded_count}
              </Text>
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                Responded
              </Text>
            </View>

            <View className="flex-1 rounded-xl p-4" style={{ backgroundColor: colors.card }}>
              <Target size={20} color={colors.info} />
              <Text className="text-2xl font-bold mt-2" style={{ color: colors.foreground }}>
                {campaign.enrolled_count > 0
                  ? ((campaign.converted_count / campaign.enrolled_count) * 100).toFixed(0)
                  : 0}%
              </Text>
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                Conversion
              </Text>
            </View>
          </View>
        </View>

        {/* Sequence Preview */}
        <View className="px-4 pb-4">
          <Text className="text-lg font-semibold mb-3" style={{ color: colors.foreground }}>
            Sequence ({totalSteps} steps)
          </Text>

          <View className="rounded-xl p-4" style={{ backgroundColor: colors.card }}>
            {campaign.steps?.map((step: CampaignStep, index: number) => {
              const channelConfig = CHANNEL_CONFIG[step.channel];
              const ChannelIcon = step.channel === 'sms' ? MessageSquare
                : step.channel === 'email' ? Mail
                : step.channel === 'phone_reminder' ? Phone
                : step.channel === 'direct_mail' ? Send
                : Instagram;

              return (
                <View
                  key={step.id}
                  className={`flex-row items-center py-2 ${index < (campaign.steps?.length || 0) - 1 ? 'border-b' : ''}`}
                  style={{ borderBottomColor: colors.border }}
                >
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: withOpacity(channelConfig.color, 'light') }}
                  >
                    <ChannelIcon size={12} color={channelConfig.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium" style={{ color: colors.foreground }}>
                      Day {step.delay_days}
                    </Text>
                    <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                      {channelConfig.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Enrollments */}
        <View className="px-4 pb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
              Enrolled Contacts ({enrollments?.length || 0})
            </Text>
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => router.push(`/(tabs)/campaigns/${id}/enroll`)}
            >
              <UserPlus size={16} color={colors.primary} />
              <Text className="ml-1 text-sm font-medium" style={{ color: colors.primary }}>
                Add
              </Text>
            </TouchableOpacity>
          </View>

          {enrollmentsLoading ? (
            <LoadingSpinner />
          ) : enrollments?.length === 0 ? (
            <View
              className="rounded-xl p-6 items-center"
              style={{ backgroundColor: colors.muted }}
            >
              <Users size={32} color={colors.mutedForeground} />
              <Text className="text-sm mt-2 text-center" style={{ color: colors.mutedForeground }}>
                No contacts enrolled yet.{'\n'}Add contacts to start the campaign.
              </Text>
            </View>
          ) : (
            enrollments?.map((enrollment) => (
              <EnrollmentCard
                key={enrollment.id}
                enrollment={enrollment}
                totalSteps={totalSteps}
                onPause={() => handlePauseEnrollment(enrollment.id)}
                onResume={() => handleResumeEnrollment(enrollment.id)}
                onRemove={() => handleRemoveEnrollment(enrollment.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Actions Sheet */}
      <BottomSheet
        visible={showActionsSheet}
        onClose={() => setShowActionsSheet(false)}
        title="Campaign Actions"
      >
        <TouchableOpacity
          className="flex-row items-center py-4"
          onPress={() => {
            setShowActionsSheet(false);
            router.push(`/(tabs)/campaigns/${id}/edit`);
          }}
        >
          <Edit size={20} color={colors.foreground} />
          <Text className="ml-3 text-base" style={{ color: colors.foreground }}>
            Edit Campaign
          </Text>
          <ChevronRight size={20} color={colors.mutedForeground} className="ml-auto" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center py-4"
          onPress={() => {
            setShowActionsSheet(false);
            router.push(`/(tabs)/campaigns/${id}/enroll`);
          }}
        >
          <UserPlus size={20} color={colors.foreground} />
          <Text className="ml-3 text-base" style={{ color: colors.foreground }}>
            Add Contacts
          </Text>
          <ChevronRight size={20} color={colors.mutedForeground} className="ml-auto" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center py-4"
          onPress={() => {
            setShowActionsSheet(false);
            handleDelete();
          }}
        >
          <Trash2 size={20} color={colors.destructive} />
          <Text className="ml-3 text-base" style={{ color: colors.destructive }}>
            Delete Campaign
          </Text>
        </TouchableOpacity>
      </BottomSheet>
    </ThemedSafeAreaView>
  );
}

export default CampaignDetailScreen;
