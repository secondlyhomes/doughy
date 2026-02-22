// src/features/turnovers/screens/TurnoverDetailScreen.tsx
// Detail screen for viewing and managing a turnover

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { CalendarClock, Trash2, Edit2 } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { LoadingSpinner, Button, Badge, Card, TAB_BAR_SAFE_PADDING, HeaderActionMenu, ConfirmButton, useToast } from '@/components/ui';
import { useNativeHeader } from '@/hooks';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
import { useTurnover, useTurnoverMutations } from '../hooks/useTurnovers';
import { TurnoverTimeline } from '../components/TurnoverTimeline';
import { ScheduleCleaningSheet } from '../components/ScheduleCleaningSheet';
import { TURNOVER_STATUS_CONFIG } from '../types';
import {
  PropertyInfoCard,
  ScheduleCard,
  CleanerInfoCard,
  NextActionPanel,
} from './turnover-detail';

export function TurnoverDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const turnoverId = params.turnoverId as string;

  const { toast } = useToast();
  const [showScheduleSheet, setShowScheduleSheet] = useState(false);
  const [inspectionNotes, setInspectionNotes] = useState('');

  const { data: turnover, isLoading, refetch, error } = useTurnover(turnoverId);
  const { scheduleCleaning, markCleaningDone, markInspected, markReady, deleteTurnover, isSaving } =
    useTurnoverMutations();

  // Status config moved from header to content area
  const statusConfig = turnover ? TURNOVER_STATUS_CONFIG[turnover.status] : null;

  const { headerOptions, handleBack } = useNativeHeader({
    title: 'Turnover',
    fallbackRoute: turnover?.property_id
      ? `/(tabs)/rental-properties/${turnover.property_id}/turnovers`
      : '/(tabs)/turnovers',
    rightAction: (
      <HeaderActionMenu
        actions={[
          { label: 'Delete', icon: Trash2, onPress: () => handleConfirmDelete(), destructive: true },
        ]}
      />
    ),
  });

  const handleScheduleCleaning = useCallback(
    async (vendorId: string, scheduledAt: string) => {
      await scheduleCleaning({ id: turnoverId, vendorId, scheduledAt });
      refetch();
    },
    [turnoverId, scheduleCleaning, refetch]
  );

  const handleMarkCleaningDone = useCallback(async () => {
    try {
      await markCleaningDone(turnoverId);
      refetch();
    } catch {
      Alert.alert('Error', 'Failed to mark cleaning as done');
    }
  }, [turnoverId, markCleaningDone, refetch]);

  const handleMarkInspected = useCallback(async () => {
    try {
      await markInspected({ id: turnoverId, notes: inspectionNotes || undefined });
      refetch();
    } catch {
      Alert.alert('Error', 'Failed to mark as inspected');
    }
  }, [turnoverId, inspectionNotes, markInspected, refetch]);

  const handleMarkReady = useCallback(async () => {
    try {
      await markReady(turnoverId);
      refetch();
    } catch {
      Alert.alert('Error', 'Failed to mark as ready');
    }
  }, [turnoverId, markReady, refetch]);

  const handleConfirmDelete = useCallback(async () => {
    try {
      await deleteTurnover(turnoverId);
      toast({ title: 'Turnover deleted', type: 'success' });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to delete turnover');
    }
  }, [turnoverId, deleteTurnover, router, toast]);

  // Loading state
  if (isLoading && !turnover) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <LoadingSpinner fullScreen text="Loading turnover..." />
        </ThemedSafeAreaView>
      </>
    );
  }

  // Error state
  if (error || !turnover) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <View className="flex-1 items-center justify-center p-4">
            <CalendarClock size={48} color={colors.mutedForeground} />
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: FONT_SIZES.base,
                textAlign: 'center',
                marginTop: 12,
              }}
            >
              {error?.message || 'Turnover not found'}
            </Text>
            <Button variant="outline" onPress={handleBack} className="mt-4">
              Go Back
            </Button>
          </View>
        </ThemedSafeAreaView>
      </>
    );
  }

  const guestName = turnover.booking?.contact
    ? `${turnover.booking.contact.first_name || ''} ${turnover.booking.contact.last_name || ''}`.trim()
    : null;

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: SPACING.md,
            paddingBottom: TAB_BAR_SAFE_PADDING,
          }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
          }
        >
          {/* Status Badge */}
          {statusConfig && (
            <View className="flex-row items-center mb-4 mt-2">
              <Badge variant={statusConfig.variant} size="lg">
                {statusConfig.label}
              </Badge>
            </View>
          )}

          {/* Property Info */}
          {turnover.property && (
            <PropertyInfoCard name={turnover.property.name} address={turnover.property.address} />
          )}

          {/* Timeline */}
          <Card className="mb-4">
            <Text
              style={{
                color: colors.foreground,
                fontSize: FONT_SIZES.lg,
                fontWeight: '600',
                marginBottom: SPACING.sm,
              }}
            >
              Progress
            </Text>
            <TurnoverTimeline
              currentStatus={turnover.status}
              cleaningScheduledAt={turnover.cleaning_scheduled_at}
              cleaningCompletedAt={turnover.cleaning_completed_at}
              inspectionCompletedAt={turnover.inspection_completed_at}
            />
          </Card>

          {/* Schedule */}
          <ScheduleCard
            checkoutAt={turnover.checkout_at}
            checkinAt={turnover.checkin_at}
            guestName={guestName}
          />

          {/* Cleaner Info */}
          {turnover.cleaner && (
            <CleanerInfoCard
              cleaner={turnover.cleaner}
              scheduledAt={turnover.cleaning_scheduled_at}
            />
          )}

          {/* Inspection Notes */}
          {turnover.inspection_notes && (
            <Card className="mb-4">
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: FONT_SIZES.lg,
                  fontWeight: '600',
                  marginBottom: SPACING.sm,
                }}
              >
                Inspection Notes
              </Text>
              <Text style={{ color: colors.foreground, fontSize: FONT_SIZES.base }}>
                {turnover.inspection_notes}
              </Text>
            </Card>
          )}

          {/* Next Action */}
          <NextActionPanel
            status={turnover.status}
            isSaving={isSaving}
            inspectionNotes={inspectionNotes}
            onInspectionNotesChange={setInspectionNotes}
            onScheduleCleaning={() => setShowScheduleSheet(true)}
            onMarkCleaningDone={handleMarkCleaningDone}
            onMarkInspected={handleMarkInspected}
            onMarkReady={handleMarkReady}
          />

          {/* Delete */}
          {turnover.status !== 'ready' && (
            <View className="mb-6">
              <ConfirmButton label="Delete Turnover" onConfirm={handleConfirmDelete} />
            </View>
          )}
        </ScrollView>

        {/* Schedule Cleaning Sheet */}
        <ScheduleCleaningSheet
          visible={showScheduleSheet}
          onClose={() => setShowScheduleSheet(false)}
          propertyId={turnover.property_id}
          propertyAddress={turnover.property?.address}
          checkoutAt={turnover.checkout_at}
          checkinAt={turnover.checkin_at}
          onSchedule={handleScheduleCleaning}
        />

      </ThemedSafeAreaView>
    </>
  );
}

export default TurnoverDetailScreen;
