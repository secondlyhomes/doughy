// src/features/turnovers/screens/TurnoversListScreen.tsx
// List screen for turnovers with status filtering

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { CalendarClock, Plus, Filter } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import {
  SimpleFAB,
  TAB_BAR_SAFE_PADDING,
  Badge,
  ListEmptyState,
} from '@/components/ui';
import { SkeletonList, ListItemSkeleton } from '@/components/ui/CardSkeletons';
import { SPACING, FONT_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { useNativeHeader } from '@/hooks';
import { useTurnovers } from '../hooks/useTurnovers';
import { TurnoverCard } from '../components/TurnoverCard';
import { TurnoverWithRelations, TurnoverStatus, TURNOVER_STATUS_CONFIG } from '../types';

type FilterType = 'all' | 'pending' | 'in_progress' | 'completed';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export function TurnoversListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const propertyId = params.id as string;

  const [filter, setFilter] = useState<FilterType>('all');

  const {
    data: turnovers = [],
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useTurnovers(propertyId);

  // Native header configuration
  const { headerOptions } = useNativeHeader({
    title: 'Turnovers',
    fallbackRoute: `/(tabs)/rental-properties/${propertyId}`,
  });

  // Filter turnovers based on selected filter
  const filteredTurnovers = useMemo(() => {
    switch (filter) {
      case 'pending':
        return turnovers.filter((t) => t.status === 'pending');
      case 'in_progress':
        return turnovers.filter((t) =>
          ['cleaning_scheduled', 'cleaning_done', 'inspected'].includes(t.status)
        );
      case 'completed':
        return turnovers.filter((t) => t.status === 'ready');
      default:
        return turnovers;
    }
  }, [turnovers, filter]);

  const handleTurnoverPress = useCallback(
    (turnover: TurnoverWithRelations) => {
      router.push(
        `/(tabs)/rental-properties/${propertyId}/turnovers/${turnover.id}` as never
      );
    },
    [router, propertyId]
  );

  const handleAddTurnover = useCallback(() => {
    // For now, turnovers are auto-created from bookings
    // This could open a manual create sheet in the future
  }, []);

  // Render filter tabs
  const renderFilterTabs = () => (
    <View className="flex-row px-4 pb-3 gap-2">
      {FILTER_OPTIONS.map((option) => {
        const isActive = filter === option.value;
        const count =
          option.value === 'all'
            ? turnovers.length
            : option.value === 'pending'
            ? turnovers.filter((t) => t.status === 'pending').length
            : option.value === 'in_progress'
            ? turnovers.filter((t) =>
                ['cleaning_scheduled', 'cleaning_done', 'inspected'].includes(
                  t.status
                )
              ).length
            : turnovers.filter((t) => t.status === 'ready').length;

        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => setFilter(option.value)}
            className="px-3 py-2 rounded-full flex-row items-center gap-1"
            style={{
              backgroundColor: isActive ? colors.primary : colors.muted,
            }}
            activeOpacity={PRESS_OPACITY.DEFAULT}
          >
            <Text
              style={{
                color: isActive ? colors.primaryForeground : colors.foreground,
                fontSize: FONT_SIZES.sm,
                fontWeight: isActive ? '600' : '400',
              }}
            >
              {option.label}
            </Text>
            {count > 0 && (
              <View
                className="px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: isActive
                    ? withOpacity(colors.primaryForeground, 'medium')
                    : colors.card,
                }}
              >
                <Text
                  style={{
                    color: isActive ? colors.primaryForeground : colors.mutedForeground,
                    fontSize: FONT_SIZES.xs,
                    fontWeight: '500',
                  }}
                >
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // Render turnover item
  const renderItem = ({ item }: { item: TurnoverWithRelations }) => (
    <View className="px-4">
      <TurnoverCard turnover={item} onPress={() => handleTurnoverPress(item)} />
    </View>
  );

  // Loading state
  if (isLoading && turnovers.length === 0) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <View style={{ padding: SPACING.md }}>
            <SkeletonList count={5} component={ListItemSkeleton} />
          </View>
        </ThemedSafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>

      {/* Filter Tabs */}
      {renderFilterTabs()}

      {/* Content */}
      {turnovers.length === 0 ? (
        <ListEmptyState
          icon={CalendarClock}
          title="No Turnovers"
          description="Turnovers are created automatically when bookings end. Schedule cleaners, track inspections, and prepare for the next guest."
        />
      ) : filteredTurnovers.length === 0 ? (
        <ListEmptyState
          icon={Filter}
          title="No Results"
          description={`No ${filter === 'pending' ? 'pending' : filter === 'in_progress' ? 'in-progress' : 'completed'} turnovers`}
          action={{
            label: 'Show All',
            onPress: () => setFilter('all'),
          }}
        />
      ) : (
        <FlatList
          data={filteredTurnovers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingBottom: TAB_BAR_SAFE_PADDING,
          }}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
        />
      )}
      </ThemedSafeAreaView>
    </>
  );
}

export default TurnoversListScreen;
