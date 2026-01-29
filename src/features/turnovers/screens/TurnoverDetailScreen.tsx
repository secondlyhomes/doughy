// src/features/turnovers/screens/TurnoverDetailScreen.tsx
// Detail screen for viewing and managing a turnover

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CalendarClock,
  Home,
  User,
  CheckCircle2,
  Clock,
  Trash2,
  MessageSquare,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import {
  LoadingSpinner,
  Button,
  Badge,
  Card,
  TAB_BAR_SAFE_PADDING,
  Input,
  FormField,
} from '@/components/ui';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
import { useTurnover, useTurnoverMutations } from '../hooks/useTurnovers';
import { TurnoverTimeline } from '../components/TurnoverTimeline';
import { ScheduleCleaningSheet } from '../components/ScheduleCleaningSheet';
import { TURNOVER_STATUS_CONFIG, TurnoverStatus } from '../types';

export function TurnoverDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const turnoverId = params.turnoverId as string;

  const [showScheduleSheet, setShowScheduleSheet] = useState(false);
  const [inspectionNotes, setInspectionNotes] = useState('');

  const {
    data: turnover,
    isLoading,
    refetch,
    error,
  } = useTurnover(turnoverId);

  const {
    scheduleCleaning,
    markCleaningDone,
    markInspected,
    markReady,
    deleteTurnover,
    isSaving,
  } = useTurnoverMutations();

  // Handlers
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleScheduleCleaning = useCallback(
    async (vendorId: string, scheduledAt: string, sendMessage?: boolean) => {
      try {
        await scheduleCleaning({ id: turnoverId, vendorId, scheduledAt });
        // TODO: If sendMessage, call AI message edge function
        refetch();
      } catch (error) {
        throw error;
      }
    },
    [turnoverId, scheduleCleaning, refetch]
  );

  const handleMarkCleaningDone = useCallback(async () => {
    try {
      await markCleaningDone(turnoverId);
      refetch();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark cleaning as done');
    }
  }, [turnoverId, markCleaningDone, refetch]);

  const handleMarkInspected = useCallback(async () => {
    try {
      await markInspected({ id: turnoverId, notes: inspectionNotes || undefined });
      refetch();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark as inspected');
    }
  }, [turnoverId, inspectionNotes, markInspected, refetch]);

  const handleMarkReady = useCallback(async () => {
    try {
      await markReady(turnoverId);
      refetch();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark as ready');
    }
  }, [turnoverId, markReady, refetch]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Turnover',
      'Are you sure you want to delete this turnover?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTurnover(turnoverId);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete turnover');
            }
          },
        },
      ]
    );
  }, [turnoverId, deleteTurnover, router]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

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

  // Determine next action based on status
  const renderNextAction = () => {
    switch (turnover.status) {
      case 'pending':
        return (
          <Button
            onPress={() => setShowScheduleSheet(true)}
            className="flex-row items-center justify-center gap-2"
          >
            <Clock size={18} color="white" />
            <Text style={{ color: 'white', fontWeight: '600' }}>
              Schedule Cleaning
            </Text>
          </Button>
        );

      case 'cleaning_scheduled':
        return (
          <Button
            onPress={handleMarkCleaningDone}
            disabled={isSaving}
            className="flex-row items-center justify-center gap-2"
          >
            <CheckCircle2 size={18} color="white" />
            <Text style={{ color: 'white', fontWeight: '600' }}>
              {isSaving ? 'Saving...' : 'Mark Cleaning Done'}
            </Text>
          </Button>
        );

      case 'cleaning_done':
        return (
          <View>
            <FormField label="Inspection Notes (optional)" className="mb-3">
              <Input
                value={inspectionNotes}
                onChangeText={setInspectionNotes}
                placeholder="Any issues found during inspection..."
                multiline
                numberOfLines={3}
              />
            </FormField>
            <Button
              onPress={handleMarkInspected}
              disabled={isSaving}
              className="flex-row items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} color="white" />
              <Text style={{ color: 'white', fontWeight: '600' }}>
                {isSaving ? 'Saving...' : 'Mark Inspected'}
              </Text>
            </Button>
          </View>
        );

      case 'inspected':
        return (
          <Button
            onPress={handleMarkReady}
            disabled={isSaving}
            className="flex-row items-center justify-center gap-2"
            style={{ backgroundColor: colors.success }}
          >
            <Home size={18} color="white" />
            <Text style={{ color: 'white', fontWeight: '600' }}>
              {isSaving ? 'Saving...' : 'Mark Ready for Guest'}
            </Text>
          </Button>
        );

      case 'ready':
        return (
          <View
            className="py-4 px-4 rounded-xl items-center"
            style={{ backgroundColor: colors.success + '20' }}
          >
            <CheckCircle2 size={32} color={colors.success} />
            <Text
              style={{
                color: colors.success,
                fontSize: FONT_SIZES.lg,
                fontWeight: '600',
                marginTop: 8,
              }}
            >
              Ready for Next Guest!
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

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
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {/* Property Info */}
        {turnover.property && (
          <Card className="mb-4">
            <View className="flex-row items-center gap-3">
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.muted }}
              >
                <Home size={24} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: FONT_SIZES.lg,
                    fontWeight: '600',
                  }}
                >
                  {turnover.property.name}
                </Text>
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: FONT_SIZES.sm,
                  }}
                >
                  {turnover.property.address}
                </Text>
              </View>
            </View>
          </Card>
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

        {/* Dates */}
        <Card className="mb-4">
          <Text
            style={{
              color: colors.foreground,
              fontSize: FONT_SIZES.lg,
              fontWeight: '600',
              marginBottom: SPACING.md,
            }}
          >
            Schedule
          </Text>

          <View className="flex-row items-center gap-3 mb-3">
            <CalendarClock size={20} color={colors.primary} />
            <View>
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: FONT_SIZES.xs,
                }}
              >
                Checkout
              </Text>
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: FONT_SIZES.base,
                  fontWeight: '500',
                }}
              >
                {formatDateTime(turnover.checkout_at)}
              </Text>
            </View>
          </View>

          {turnover.checkin_at && (
            <View className="flex-row items-center gap-3">
              <CalendarClock size={20} color={colors.success} />
              <View>
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: FONT_SIZES.xs,
                  }}
                >
                  Next Check-in
                </Text>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: FONT_SIZES.base,
                    fontWeight: '500',
                  }}
                >
                  {formatDateTime(turnover.checkin_at)}
                </Text>
              </View>
            </View>
          )}

          {guestName && (
            <View className="flex-row items-center gap-3 mt-3 pt-3 border-t border-border">
              <User size={20} color={colors.mutedForeground} />
              <View>
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: FONT_SIZES.xs,
                  }}
                >
                  Departing Guest
                </Text>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: FONT_SIZES.base,
                  }}
                >
                  {guestName}
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Cleaner Info */}
        {turnover.cleaner && (
          <Card className="mb-4">
            <Text
              style={{
                color: colors.foreground,
                fontSize: FONT_SIZES.lg,
                fontWeight: '600',
                marginBottom: SPACING.md,
              }}
            >
              Assigned Cleaner
            </Text>

            <View className="flex-row items-center gap-3">
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.muted }}
              >
                <Text style={{ fontSize: 20 }}>🧹</Text>
              </View>
              <View className="flex-1">
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: FONT_SIZES.base,
                    fontWeight: '500',
                  }}
                >
                  {turnover.cleaner.name}
                </Text>
                {turnover.cleaner.phone && (
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: FONT_SIZES.sm,
                    }}
                  >
                    {turnover.cleaner.phone}
                  </Text>
                )}
              </View>
            </View>

            {turnover.cleaning_scheduled_at && (
              <View className="mt-3 pt-3 border-t border-border">
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: FONT_SIZES.xs,
                  }}
                >
                  Scheduled for
                </Text>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: FONT_SIZES.base,
                  }}
                >
                  {formatDateTime(turnover.cleaning_scheduled_at)}
                </Text>
              </View>
            )}
          </Card>
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
            <Text
              style={{
                color: colors.foreground,
                fontSize: FONT_SIZES.base,
              }}
            >
              {turnover.inspection_notes}
            </Text>
          </Card>
        )}

        {/* Next Action */}
        <Card className="mb-4">{renderNextAction()}</Card>

        {/* Delete */}
        {turnover.status !== 'ready' && (
          <Button
            variant="destructive"
            onPress={handleDelete}
            className="flex-row items-center justify-center gap-2"
          >
            <Trash2 size={16} color="white" />
            <Text style={{ color: 'white', fontWeight: '600' }}>
              Delete Turnover
            </Text>
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
