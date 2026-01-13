// Lead Detail Screen - React Native
// Converted from web app src/features/leads/pages/LeadsDetailView.tsx

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, Building2, Edit2, Trash2, Tag } from 'lucide-react-native';

import { useLead, useUpdateLead, useDeleteLead } from '../hooks/useLeads';
import { LeadTimeline, LeadActivity, ActivityType } from '../components/LeadTimeline';
import { AddActivitySheet } from '../components/AddActivitySheet';
import { LeadQuickActions } from '../components/LeadQuickActions';
import { LeadContactInfo } from '../components/LeadContactInfo';
import { LeadNotesSection } from '../components/LeadNotesSection';

export function LeadDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const leadId = params.leadId as string;

  const { lead, isLoading } = useLead(leadId);
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
    const colors: Record<string, string> = {
      new: 'bg-green-500',
      active: 'bg-blue-500',
      won: 'bg-emerald-500',
      lost: 'bg-red-500',
      closed: 'bg-purple-500',
      inactive: 'bg-gray-400',
    };
    return colors[status || ''] || 'bg-gray-400';
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
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!lead) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Lead not found</Text>
        <TouchableOpacity
          className="mt-4 bg-primary px-4 py-2 rounded-lg"
          onPress={() => router.back()}
          accessibilityLabel="Go back to leads list"
          accessibilityRole="button"
        >
          <Text className="text-primary-foreground">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-card border-b border-border px-4 py-3">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity className="flex-row items-center" onPress={() => router.back()} accessibilityLabel="Go back" accessibilityRole="button">
            <ArrowLeft size={24} color="#6b7280" />
            <Text className="text-muted-foreground ml-2">Back</Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={handleToggleStar} accessibilityLabel={lead.starred ? `Remove ${lead.name} from starred` : `Star ${lead.name}`} accessibilityRole="button">
              <Star size={24} color={lead.starred ? '#f59e0b' : '#9ca3af'} fill={lead.starred ? '#f59e0b' : 'transparent'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push(`/(tabs)/leads/edit/${lead.id}`)} accessibilityLabel={`Edit ${lead.name}`} accessibilityRole="button">
              <Edit2 size={22} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} disabled={isDeleting} accessibilityLabel={`Delete ${lead.name}`} accessibilityRole="button">
              {isDeleting ? <ActivityIndicator size="small" color="#ef4444" /> : <Trash2 size={22} color="#ef4444" />}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Lead Header */}
        <View className="bg-card p-4 mb-4">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">{lead.name || 'Unnamed Lead'}</Text>
              {lead.company && (
                <View className="flex-row items-center mt-1">
                  <Building2 size={14} color="#6b7280" />
                  <Text className="text-muted-foreground ml-1">{lead.company}</Text>
                </View>
              )}
            </View>
            <View className={`${getStatusColor(lead.status)} px-3 py-1 rounded-full`}>
              <Text className="text-white text-sm font-medium">{formatStatus(lead.status)}</Text>
            </View>
          </View>

          {/* Score */}
          {lead.score !== undefined && (
            <View className="flex-row items-center mb-3">
              <Text className="text-sm text-muted-foreground">Lead Score:</Text>
              <View className="ml-2 bg-primary/10 px-2 py-0.5 rounded">
                <Text className="text-primary font-semibold">{lead.score}</Text>
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
          <View className="bg-card p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <Tag size={18} color="#6b7280" />
              <Text className="text-lg font-semibold text-foreground ml-2">Tags</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {lead.tags.map((tag, index) => (
                <View key={index} className="bg-secondary px-3 py-1.5 rounded-full">
                  <Text className="text-secondary-foreground text-sm">{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes Section */}
        <LeadNotesSection notes={lead.notes} onAddNote={() => setShowActivitySheet(true)} />

        {/* Activity Timeline */}
        <View className="bg-card p-4 mb-8">
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
    </View>
  );
}

export default LeadDetailScreen;
