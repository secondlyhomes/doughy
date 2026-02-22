// src/features/skip-tracing/screens/SkipTraceResultsScreen.tsx
// List screen for skip trace results

import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, RefreshControl, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Search, Plus, AlertCircle } from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { Button, SimpleFAB, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useNativeHeader } from '@/hooks';
import { useSkipTraceResults, useSkipTraceSummary } from '../hooks/useSkipTracing';
import { SkipTraceResultCard } from '../components/SkipTraceResultCard';
import { RunSkipTraceSheet } from '../components/RunSkipTraceSheet';
import type { SkipTraceStatus, SkipTraceResultWithRelations } from '../types';

type FilterStatus = 'all' | SkipTraceStatus;

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
];

export function SkipTraceResultsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ contactId?: string; propertyId?: string }>();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [showAddSheet, setShowAddSheet] = useState(false);

  const {
    data: results,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useSkipTraceResults({
    contactId: params.contactId,
    propertyId: params.propertyId,
  });

  const summary = useSkipTraceSummary();

  const { headerOptions } = useNativeHeader({
    title: 'Skip Tracing',
    fallbackRoute: '/(tabs)',
    rightAction: (
      <TouchableOpacity onPress={() => setShowAddSheet(true)} style={{ padding: 8 }}>
        <Plus size={24} color={colors.foreground} />
      </TouchableOpacity>
    ),
  });

  // Filter results
  const filteredResults = useMemo(() => {
    if (!results) return [];

    let filtered = results;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => {
        const name = `${r.input_first_name || ''} ${r.input_last_name || ''}`.toLowerCase();
        const address = `${r.input_address || ''} ${r.input_city || ''} ${r.input_state || ''}`.toLowerCase();
        const contactName = r.contact
          ? `${r.contact.first_name} ${r.contact.last_name}`.toLowerCase()
          : '';

        return name.includes(query) || address.includes(query) || contactName.includes(query);
      });
    }

    return filtered;
  }, [results, statusFilter, searchQuery]);

  const handleResultPress = (result: SkipTraceResultWithRelations) => {
    router.push(`/skip-tracing/${result.id}`);
  };

  const handleAddSuccess = (resultId: string) => {
    router.push(`/skip-tracing/${resultId}`);
  };

  const renderResult = ({ item }: { item: SkipTraceResultWithRelations }) => (
    <SkipTraceResultCard result={item} onPress={() => handleResultPress(item)} />
  );

  const renderHeader = () => (
    <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
      {/* Summary Stats */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.card,
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground }}>
            {summary.totalTraces}
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Total Traces</Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.card,
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.success }}>
            {summary.completedTraces}
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Completed</Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.card,
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.primary }}>
            {summary.totalPhones}
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Phones Found</Text>
        </View>
      </View>

      {/* Search */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.muted,
          borderRadius: 8,
          paddingHorizontal: 12,
          marginBottom: 12,
        }}
      >
        <Search size={18} color={colors.mutedForeground} style={{ marginRight: 8 }} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name or address..."
          placeholderTextColor={colors.mutedForeground}
          style={{
            flex: 1,
            paddingVertical: 12,
            color: colors.foreground,
            fontSize: 16,
          }}
        />
      </View>

      {/* Status Filter */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.value}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setStatusFilter(item.value)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              marginRight: 8,
              backgroundColor: statusFilter === item.value ? colors.primary : colors.muted,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: statusFilter === item.value ? colors.primaryForeground : colors.foreground,
              }}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView style={{ flex: 1 }} edges={[]}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 16, color: colors.mutedForeground }}>
              Loading skip trace results...
            </Text>
          </View>
        </ThemedSafeAreaView>
      </>
    );
  }

  // Handle error state
  if (isError) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load skip trace results';
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView style={{ flex: 1 }} edges={[]}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <AlertCircle size={48} color={colors.destructive} style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 18, fontWeight: '500', color: colors.foreground, marginBottom: 8 }}>
              Failed to Load Results
            </Text>
            <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 16 }}>
              {errorMessage}
            </Text>
            <Button onPress={() => refetch()}>
              <Text style={{ color: colors.primaryForeground }}>Try Again</Text>
            </Button>
          </View>
          <RunSkipTraceSheet
            isOpen={showAddSheet}
            onClose={() => setShowAddSheet(false)}
            contactId={params.contactId}
            propertyId={params.propertyId}
            onSuccess={handleAddSuccess}
          />
        </ThemedSafeAreaView>
      </>
    );
  }

  // Determine if we should show the action button in empty state
  const showEmptyAction = !searchQuery && statusFilter === 'all';

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView style={{ flex: 1 }} edges={[]}>
        <FlatList
        data={filteredResults}
        renderItem={renderResult}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: TAB_BAR_SAFE_PADDING }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Search size={48} color={colors.mutedForeground} />}
            title="No Skip Traces Found"
            description={
              searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Run a skip trace to find contact information'
            }
            action={
              showEmptyAction
                ? { label: 'Run Skip Trace', onPress: () => setShowAddSheet(true) }
                : undefined
            }
          />
        }
        />

        {/* FAB */}
        <SimpleFAB
          icon={<Plus size={24} color="white" />}
          onPress={() => setShowAddSheet(true)}
          accessibilityLabel="Run skip trace"
        />

        {/* Add Sheet */}
        <RunSkipTraceSheet
          isOpen={showAddSheet}
          onClose={() => setShowAddSheet(false)}
          contactId={params.contactId}
          propertyId={params.propertyId}
          onSuccess={handleAddSuccess}
        />
      </ThemedSafeAreaView>
    </>
  );
}
