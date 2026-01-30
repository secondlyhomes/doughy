// src/features/turnovers/screens/TurnoverDetailScreen.tsx
// Detail screen for viewing and managing a turnover

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarClock, Trash2 } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { LoadingSpinner, Button, Badge, Card, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
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

  const [showScheduleSheet, setShowScheduleSheet] = useState(false);
  const [inspectionNotes, setInspectionNotes] = useState('');

  const { data: turnover, isLoading, refetch, error } = useTurnover(turnoverId);
  const { scheduleCleaning, markCleaningDone, markInspected, markReady, deleteTurnover, isSaving } =
    useTurnoverMutations();

  // Handlers
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

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

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Turnover', 'Are you sure you want to delete this turnover?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTurnover(turnoverId);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete turnover');
          }
        },
      },
    ]);
  }, [turnoverId, deleteTurnover, router]);

  // Loading state
  if (isLoading && !turnover) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen text="Loading turnover..." />
      </ThemedSafeAreaView>
    );
  }

  // Error state
  if (error || !turnover) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <ScreenHeader title="Turnover" backButton onBack={handleBack} />
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
    );
  }

  const statusConfig = TURNOVER_STATUS_CONFIG[turnover.status];
  const guestName = turnover.booking?.contact
    ? `${turnover.booking.contact.first_name || ''} ${turnover.booking.contact.last_name || ''}`.trim()
    : null;

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScreenHeader
        title="Turnover"
        backButton
        onBack={handleBack}
        rightAction={
          <Badge variant={statusConfig.color} size="sm">
            {statusConfig.emoji} {statusConfig.label}
          </Badge>
        }
      />

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
          <Button
            variant="destructive"
            onPress={handleDelete}
            className="flex-row items-center justify-center gap-2"
          >
            <Trash2 size={16} color="white" />
            <Text style={{ color: 'white', fontWeight: '600' }}>Delete Turnover</Text>
          </Button>
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
  );
}

export default TurnoverDetailScreen;
