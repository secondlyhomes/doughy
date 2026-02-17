// Lead Detail Screen - React Native
// Converted from web app src/features/leads/pages/LeadsDetailView.tsx
// Uses useThemeColors() for reliable dark mode support

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Star, Building2, Edit2, Trash2, Tag, FileText, ArrowRight, MoreVertical, Headphones } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { formatStatus, getStatusBadgeVariant } from '@/lib/formatters';
import { ICON_SIZES } from '@/constants/design-tokens';
import { ThemedSafeAreaView } from '@/components';
import { LoadingSpinner, Button, Badge, TAB_BAR_SAFE_PADDING, FAB_BOTTOM_OFFSET, FAB_SIZE, CallPilotActions } from '@/components/ui';
import { useNativeHeader } from '@/hooks';

import { useLead, useUpdateLead, useDeleteLead } from '../hooks/useLeads';
import { useLeadDocuments } from '../hooks/useLeadDocuments';
import { LeadTimeline, LeadActivity, ActivityType } from '../components/LeadTimeline';
import { AddActivitySheet } from '../components/AddActivitySheet';
import { LeadQuickActions } from '../components/LeadQuickActions';
import { LeadContactInfo } from '../components/LeadContactInfo';
import { LeadNotesSection } from '../components/LeadNotesSection';
import { LeadDocsTab } from '../components/LeadDocsTab';
import { useCreateDeal, CreateDealInput } from '../../deals/hooks/useDeals';

export function LeadDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const leadId = params.leadId as string;

  const { lead, isLoading } = useLead(leadId);
  const { documents } = useLeadDocuments({ leadId });
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const createDeal = useCreateDeal();

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
      } catch (error) {
        console.error('[LeadDetailScreen] Failed to toggle star:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        Alert.alert('Error', `Failed to update lead: ${message}`);
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
            } catch (error) {
              console.error('[LeadDetailScreen] Failed to delete lead:', error);
              const message = error instanceof Error ? error.message : 'Unknown error';
              Alert.alert('Error', `Failed to delete lead: ${message}`);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleConvertToDeal = async () => {
    if (!lead) return;

    Alert.alert(
      'Convert to Deal',
      'This will create a new deal from this lead. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Deal',
          onPress: async () => {
            try {
              const dealData: CreateDealInput = {
                lead_id: leadId,
                stage: 'new',
                strategy: 'wholesale',
                next_action: 'Complete property details and underwrite',
              };

              const newDeal = await createDeal.mutateAsync(dealData);

              // Navigate to the new deal
              router.push(`/(tabs)/deals/${newDeal.id}`);
            } catch (error) {
              console.error('[LeadDetailScreen] Failed to create deal:', error);
              const message = error instanceof Error ? error.message : 'Unknown error';
              Alert.alert('Error', `Failed to create deal: ${message}`);
            }
          },
        },
      ]
    );
  };

  // Header actions
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const { headerOptions } = useNativeHeader({
    title: lead?.name || 'Lead',
    subtitle: lead?.company || undefined,
    fallbackRoute: '/(tabs)/leads',
    rightAction: lead ? (
      <View className="flex-row items-center gap-3">
        <TouchableOpacity onPress={handleToggleStar} accessibilityLabel={lead.starred ? `Remove ${lead.name} from starred` : `Star ${lead.name}`} accessibilityRole="button">
          <Star size={ICON_SIZES.xl} color={lead.starred ? colors.warning : colors.mutedForeground} fill={lead.starred ? colors.warning : 'transparent'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/(tabs)/leads/edit/${lead.id}`)} accessibilityLabel={`Edit ${lead.name}`} accessibilityRole="button">
          <Edit2 size={ICON_SIZES.lg} color={colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} disabled={isDeleting} accessibilityLabel={`Delete ${lead.name}`} accessibilityRole="button">
          {isDeleting ? <ActivityIndicator size="small" color={colors.destructive} /> : <Trash2 size={ICON_SIZES.lg} color={colors.destructive} />}
        </TouchableOpacity>
      </View>
    ) : undefined,
  });

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <LoadingSpinner fullScreen />
        </ThemedSafeAreaView>
      </>
    );
  }

  if (!lead) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1 items-center justify-center" edges={[]}>
          <Text className="mb-4" style={{ color: colors.mutedForeground }}>Lead not found</Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </ThemedSafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>
        <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: FAB_BOTTOM_OFFSET + FAB_SIZE + 16,  // Pattern 2: offset + height + breathing (172px)
        }}
      >
        {/* Lead Header */}
        <View className="p-4 mb-4" style={{ backgroundColor: colors.card }}>
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <Text className="text-2xl font-bold" style={{ color: colors.foreground }}>{lead.name || 'Unnamed Lead'}</Text>
              {lead.company && (
                <View className="flex-row items-center mt-1">
                  <Building2 size={ICON_SIZES.sm} color={colors.mutedForeground} />
                  <Text className="ml-1" style={{ color: colors.mutedForeground }}>{lead.company}</Text>
                </View>
              )}
            </View>
            <Badge variant={getStatusBadgeVariant(lead.status)} size="sm">
              {formatStatus(lead.status)}
            </Badge>
          </View>

          {/* Quick Actions - Call uses VoIP for pro/premium users */}
          <LeadQuickActions leadId={lead.id} name={lead.name || 'Lead'} phone={lead.phone} email={lead.email} />
        </View>

        {/* Convert to Deal Action */}
        <View className="px-4 mb-4">
          <TouchableOpacity
            className="flex-row items-center justify-center py-3 px-4 rounded-xl"
            style={{ backgroundColor: colors.primary }}
            onPress={handleConvertToDeal}
            disabled={createDeal.isPending}
            accessibilityLabel="Convert lead to deal"
            accessibilityRole="button"
          >
            {createDeal.isPending ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <>
                <Text className="text-base font-semibold mr-2" style={{ color: colors.primaryForeground }}>
                  Convert to Deal
                </Text>
                <ArrowRight size={ICON_SIZES.lg} color={colors.primaryForeground} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* CallPilot Actions */}
        <View className="px-4 mb-4 p-4" style={{ backgroundColor: colors.card }}>
          <View className="flex-row items-center mb-3">
            <Headphones size={ICON_SIZES.ml} color={colors.mutedForeground} />
            <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>CallPilot</Text>
          </View>
          <CallPilotActions
            contactId={lead.id}
            contactName={lead.name || 'Lead'}
            phone={lead.phone}
          />
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
              <Tag size={ICON_SIZES.ml} color={colors.mutedForeground} />
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
            <FileText size={ICON_SIZES.ml} color={colors.mutedForeground} />
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
    </>
  );
}

export default LeadDetailScreen;
