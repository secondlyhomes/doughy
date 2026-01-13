// Leads List Screen - React Native
// Converted from web app src/features/leads/

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import { SearchBar, ScreenHeader, LoadingSpinner } from '@/components/ui';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Plus, SlidersHorizontal } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';

import { Lead, LeadStatus } from '../types';
import { useLeads } from '../hooks/useLeads';
import { SwipeableLeadCard } from '../components/SwipeableLeadCard';
import { LeadsFiltersSheet } from '../components/LeadsFiltersSheet';

export interface LeadFilters {
  status: LeadStatus | 'all';
  source: string | 'all';
  starred: boolean | null;
  sortBy: 'name' | 'created_at' | 'score';
  sortOrder: 'asc' | 'desc';
}

const defaultFilters: LeadFilters = {
  status: 'all',
  source: 'all',
  starred: null,
  sortBy: 'created_at',
  sortOrder: 'desc',
};

export function LeadsListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<LeadFilters>(defaultFilters);

  const { leads, isLoading, refetch } = useLeads();

  const filteredLeads = leads?.filter(lead => {
    // Search filter
    const matchesSearch = !searchQuery ||
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());

    // Quick status filter (tabs)
    const matchesQuickFilter = activeFilter === 'all' ||
      lead.status === activeFilter ||
      (activeFilter === 'starred' && lead.starred);

    // Advanced filters
    const matchesAdvancedStatus = advancedFilters.status === 'all' ||
      lead.status === advancedFilters.status;
    const matchesSource = advancedFilters.source === 'all' ||
      lead.source === advancedFilters.source;
    const matchesStarred = advancedFilters.starred === null ||
      lead.starred === advancedFilters.starred;

    return matchesSearch && matchesQuickFilter && matchesAdvancedStatus && matchesSource && matchesStarred;
  }).sort((a, b) => {
    const { sortBy, sortOrder } = advancedFilters;
    let comparison = 0;

    if (sortBy === 'name') {
      comparison = (a.name || '').localeCompare(b.name || '');
    } else if (sortBy === 'score') {
      comparison = (a.score || 0) - (b.score || 0);
    } else {
      comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  }) || [];

  const activeFiltersCount = [
    advancedFilters.status !== 'all',
    advancedFilters.source !== 'all',
    advancedFilters.starred !== null,
  ].filter(Boolean).length;

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New' },
    { key: 'active', label: 'Active' },
    { key: 'won', label: 'Won' },
    { key: 'starred', label: 'Starred' },
  ];

  const handleLeadPress = useCallback((lead: Lead) => {
    router.push(`/(tabs)/leads/${lead.id}`);
  }, [router]);

  const handleApplyFilters = (newFilters: LeadFilters) => {
    setAdvancedFilters(newFilters);
    setShowFiltersSheet(false);
  };

  const handleResetFilters = () => {
    setAdvancedFilters(defaultFilters);
  };

  const renderItem = useCallback(({ item }: { item: Lead }) => (
    <SwipeableLeadCard
      lead={item}
      onPress={() => handleLeadPress(item)}
    />
  ), [handleLeadPress]);

  const keyExtractor = useCallback((item: Lead) => item.id, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <ScreenHeader title="Leads" subtitle="Track your prospects" />

      {/* Search Bar */}
      <View className="px-4 pt-2 pb-2">
        <View className="flex-row items-center gap-2">
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search leads..."
            size="md"
            className="flex-1"
          />
          <TouchableOpacity
            className="bg-muted p-2.5 rounded-lg relative"
            onPress={() => setShowFiltersSheet(true)}
            accessibilityLabel={`Open filters${activeFiltersCount > 0 ? `, ${activeFiltersCount} active` : ''}`}
            accessibilityRole="button"
          >
            <SlidersHorizontal size={20} color={colors.mutedForeground} />
            {activeFiltersCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-primary w-5 h-5 rounded-full items-center justify-center">
                <Text className="text-primary-foreground text-xs font-bold">
                  {activeFiltersCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="px-4 pb-2">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`mr-2 px-4 py-2 rounded-full ${
                activeFilter === item.key
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}
              onPress={() => setActiveFilter(item.key)}
              accessibilityLabel={`Filter by ${item.label}${activeFilter === item.key ? ', selected' : ''}`}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === item.key }}
            >
              <Text
                className={`text-sm font-medium ${
                  activeFilter === item.key
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Leads Count */}
      <View className="px-4 pb-2">
        <Text className="text-sm text-muted-foreground">
          {filteredLeads.length} leads
        </Text>
      </View>

      {/* Leads List */}
      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={filteredLeads}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.info}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-muted-foreground text-center">
                {searchQuery ? 'No leads match your search' : 'No leads yet'}
              </Text>
              <TouchableOpacity
                className="mt-4 bg-primary px-4 py-2 rounded-lg"
                onPress={() => router.push('/(tabs)/leads/add')}
                accessibilityLabel="Add your first lead"
                accessibilityRole="button"
              >
                <Text className="text-primary-foreground font-medium">Add First Lead</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
        onPress={() => router.push('/(tabs)/leads/add')}
        accessibilityLabel="Add new lead"
        accessibilityRole="button"
      >
        <Plus size={24} color={colors.primaryForeground} />
      </TouchableOpacity>

      {/* Filters Sheet */}
      <LeadsFiltersSheet
        visible={showFiltersSheet}
        filters={advancedFilters}
        onClose={() => setShowFiltersSheet(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />
    </ThemedSafeAreaView>
    </GestureHandlerRootView>
  );
}

export default LeadsListScreen;
