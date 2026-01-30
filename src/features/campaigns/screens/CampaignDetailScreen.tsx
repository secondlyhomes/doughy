// src/features/campaigns/screens/CampaignDetailScreen.tsx
// Campaign Detail Screen - View campaign, enrollees, and stats

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import { Button, TAB_BAR_SAFE_PADDING, LoadingSpinner } from '@/components/ui';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Play,
  Pause,
  Users,
  Target,
  MoreVertical,
  UserPlus,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
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
import { LEAD_TYPE_CONFIG } from '../types';
import {
  EnrollmentCard,
  CampaignStatsCards,
  SequencePreview,
  CampaignActionsSheet,
} from './campaign-detail';

export function CampaignDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: campaign, isLoading: campaignLoading, refetch } = useCampaign(id);
  const { data: enrollments, isLoading: enrollmentsLoading } =
    useCampaignEnrollments(id);

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
      await updateCampaign.mutateAsync({ id: campaign.id, status: newStatus });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert(
        'Update Failed',
        `Could not ${newStatus === 'active' ? 'activate' : 'pause'} campaign: ${errorMessage}`
      );
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
              const errorMessage =
                error instanceof Error ? error.message : 'Unknown error occurred';
              Alert.alert('Delete Failed', `Could not delete campaign: ${errorMessage}`);
            }
          },
        },
      ]
    );
  }, [campaign, deleteCampaign, router]);

  const handlePauseEnrollment = useCallback(
    async (enrollmentId: string) => {
      try {
        await pauseEnrollment.mutateAsync({ id: enrollmentId });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        Alert.alert('Pause Failed', `Could not pause enrollment: ${errorMessage}`);
      }
    },
    [pauseEnrollment]
  );

  const handleResumeEnrollment = useCallback(
    async (enrollmentId: string) => {
      try {
        await resumeEnrollment.mutateAsync(enrollmentId);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        Alert.alert('Resume Failed', `Could not resume enrollment: ${errorMessage}`);
      }
    },
    [resumeEnrollment]
  );

  const handleRemoveEnrollment = useCallback(
    (enrollmentId: string) => {
      Alert.alert('Remove from Campaign', 'Remove this contact from the campaign?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromCampaign.mutateAsync(enrollmentId);
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : 'Unknown error occurred';
              Alert.alert(
                'Remove Failed',
                `Could not remove contact from campaign: ${errorMessage}`
              );
            }
          },
        },
      ]);
    },
    [removeFromCampaign]
  );

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
      <View
        className="flex-row items-center justify-between px-4 py-3 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text
          className="text-lg font-semibold flex-1 mx-3"
          numberOfLines={1}
          style={{ color: colors.foreground }}
        >
          {campaign.name}
        </Text>
        <TouchableOpacity
          onPress={() => setShowActionsSheet(true)}
          className="p-2 -mr-2"
        >
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
        <CampaignStatsCards
          enrolledCount={campaign.enrolled_count}
          respondedCount={campaign.responded_count}
          convertedCount={campaign.converted_count}
        />

        {/* Sequence Preview */}
        {campaign.steps && <SequencePreview steps={campaign.steps} />}

        {/* Enrollments */}
        <View className="px-4 pb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text
              className="text-lg font-semibold"
              style={{ color: colors.foreground }}
            >
              Enrolled Contacts ({enrollments?.length || 0})
            </Text>
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => router.push(`/(tabs)/campaigns/${id}/enroll`)}
            >
              <UserPlus size={16} color={colors.primary} />
              <Text
                className="ml-1 text-sm font-medium"
                style={{ color: colors.primary }}
              >
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
              <Text
                className="text-sm mt-2 text-center"
                style={{ color: colors.mutedForeground }}
              >
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
      <CampaignActionsSheet
        visible={showActionsSheet}
        onClose={() => setShowActionsSheet(false)}
        onEdit={() => router.push(`/(tabs)/campaigns/${id}/edit`)}
        onAddContacts={() => router.push(`/(tabs)/campaigns/${id}/enroll`)}
        onDelete={handleDelete}
      />
    </ThemedSafeAreaView>
  );
}

export default CampaignDetailScreen;
