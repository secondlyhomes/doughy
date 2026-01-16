// Lead Detail Screen - React Native
// Converted from web app src/features/leads/pages/LeadsDetailView.tsx
// Uses useThemeColors() for reliable dark mode support

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, Building2, Edit2, Trash2, Tag, FileText } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import { LoadingSpinner, Button, GlassButton } from '@/components/ui';

import { useLead, useUpdateLead, useDeleteLead } from '../hooks/useLeads';
import { useLeadDocuments } from '../hooks/useLeadDocuments';
import { LeadTimeline, LeadActivity, ActivityType } from '../components/LeadTimeline';
import { AddActivitySheet } from '../components/AddActivitySheet';
import { LeadQuickActions } from '../components/LeadQuickActions';
import { LeadContactInfo } from '../components/LeadContactInfo';
import { LeadNotesSection } from '../components/LeadNotesSection';
import { LeadDocsTab } from '../components/LeadDocsTab';

export function LeadDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const leadId = params.leadId as string;

  const { lead, isLoading } = useLead(leadId);
  const { documents } = useLeadDocuments({ leadId });
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const [isDeleting, setIsDeleting] = useState(false);
  const [showActivitySheet, setShowActivitySheet] = useState(false);
  const [activities, setActivities] = useState<LeadActivity[]>([]);

  const handleAddActivity = (activityData: {
    type: ActivityType;
    description: string;
    metadata?: Record<string, unknown>;
  }) => {
    const newActivity: LeadActivity = {
      id: Date.now().toString(),
      lead_id: leadId,
      type: activityData.type,
      description: activityData.description,
      metadata: activityData.metadata,
      created_at: new Date().toISOString(),
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  const handleToggleStar = async () => {
    if (lead) {
      try {
        await updateLead.mutateAsync({ id: lead.id, data: { starred: !lead.starred } });
      } catch {
        Alert.alert('Error', 'Failed to update lead');
      }
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Lead',
      'Are you sure you want to delete this lead? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteLead.mutateAsync(leadId);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete lead');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string | undefined) => {
    const statusColors: Record<string, string> = {
      new: colors.success,
      active: colors.info,
      won: colors.success,
      lost: colors.destructive,
      closed: colors.primary,
      inactive: colors.mutedForeground,
    };
    return statusColors[status || ''] || colors.mutedForeground;
  };

  const formatStatus = (status: string | undefined) => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen />
      </ThemedSafeAreaView>
    );
  }

  if (!lead) {
    return (
      <ThemedSafeAreaView className="flex-1 items-center justify-center" edges={['top']}>
        <Text className="mb-4" style={{ color: colors.mutedForeground }}>Lead not found</Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View
        className="px-4 py-3"
        style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <View className="flex-row items-center justify-between">
          <GlassButton
            icon={<ArrowLeft size={24} color={colors.foreground} />}
            onPress={() => router.back()}
            size={40}
            effect="clear"
            accessibilityLabel="Go back"
          />

          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={handleToggleStar} accessibilityLabel={lead.starred ? `Remove ${lead.name} from starred` : `Star ${lead.name}`} accessibilityRole="button">
              <Star size={24} color={lead.starred ? colors.warning : colors.mutedForeground} fill={lead.starred ? colors.warning : 'transparent'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push(`/(tabs)/leads/edit/${lead.id}`)} accessibilityLabel={`Edit ${lead.name}`} accessibilityRole="button">
              <Edit2 size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} disabled={isDeleting} accessibilityLabel={`Delete ${lead.name}`} accessibilityRole="button">
              {isDeleting ? <ActivityIndicator size="small" color={colors.destructive} /> : <Trash2 size={22} color={colors.destructive} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Lead Header */}
        <View className="p-4 mb-4" style={{ backgroundColor: colors.card }}>
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <Text className="text-2xl font-bold" style={{ color: colors.foreground }}>{lead.name || 'Unnamed Lead'}</Text>
              {lead.company && (
                <View className="flex-row items-center mt-1">
                  <Building2 size={14} color={colors.mutedForeground} />
                  <Text className="ml-1" style={{ color: colors.mutedForeground }}>{lead.company}</Text>
                </View>
              )}
            </View>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: getStatusColor(lead.status) }}
            >
              <Text className="text-sm font-medium" style={{ color: colors.primaryForeground }}>{formatStatus(lead.status)}</Text>
            </View>
          </View>

          {/* Score */}
          {lead.score !== undefined && (
            <View className="flex-row items-center mb-3">
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>Lead Score:</Text>
              <View className="ml-2 px-2 py-0.5 rounded" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
                <Text className="font-semibold" style={{ color: colors.primary }}>{lead.score}</Text>
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <LeadQuickActions name={lead.name || 'Lead'} phone={lead.phone} email={lead.email} />
        </View>

        {/* Contact Information */}
        <LeadContactInfo
          email={lead.email}
          phone={lead.phone}
          addressLine1={lead.address_line_1}
          addressLine2={lead.address_line_2}
          city={lead.city}
          state={lead.state}
          zip={lead.zip}
        />

        {/* Tags */}
        {lead.tags && lead.tags.length > 0 && (
          <View className="p-4 mb-4" style={{ backgroundColor: colors.card }}>
            <View className="flex-row items-center mb-3">
              <Tag size={18} color={colors.mutedForeground} />
              <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>Tags</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {lead.tags.map((tag, index) => (
                <View key={index} className="px-3 py-1.5 rounded-full" style={{ backgroundColor: colors.secondary }}>
                  <Text className="text-sm" style={{ color: colors.secondaryForeground }}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes Section */}
        <LeadNotesSection notes={lead.notes} onAddNote={() => setShowActivitySheet(true)} />

        {/* Documents Section */}
        <View className="p-4 mb-4" style={{ backgroundColor: colors.card }}>
          <View className="flex-row items-center mb-4">
            <FileText size={18} color={colors.mutedForeground} />
            <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>Documents</Text>
            {documents.length > 0 && (
              <View className="px-2 py-0.5 rounded-full ml-2" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
                <Text className="text-xs font-medium" style={{ color: colors.primary }}>{documents.length}</Text>
              </View>
            )}
          </View>
          <LeadDocsTab leadId={leadId} leadName={lead.name} />
        </View>

        {/* Activity Timeline */}
        <View className="p-4 mb-8" style={{ backgroundColor: colors.card }}>
          <LeadTimeline activities={activities} onAddActivity={() => setShowActivitySheet(true)} />
        </View>
      </ScrollView>

      {/* Add Activity Sheet */}
      <AddActivitySheet
        visible={showActivitySheet}
        leadId={leadId}
        leadName={lead.name || 'Lead'}
        onClose={() => setShowActivitySheet(false)}
        onSave={handleAddActivity}
      />
    </ThemedSafeAreaView>
  );
}

export default LeadDetailScreen;
