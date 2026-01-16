// src/features/admin/screens/UserManagementScreen.tsx
// User management screen for admin

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Shield, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/context/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { SearchBar, LoadingSpinner, TAB_BAR_SAFE_PADDING, Skeleton } from '@/components/ui';
import { SPACING } from '@/constants/design-tokens';
import { getUsers, getRoleLabel, isAdminRole, type AdminUser, type UserFilters, type UserRole } from '../services/userService';

// Spacing constants for floating search bar
const SEARCH_BAR_CONTAINER_HEIGHT = SPACING.sm + 48 + SPACING.xs; // ~60px (pt-2 + searchbar + pb-1)
const FILTER_PILLS_HEIGHT = 40; // Approximate height of filter pills row
const SEARCH_BAR_TO_CONTENT_GAP = SPACING.md; // 12px gap
const COUNT_TEXT_HEIGHT = 20; // Height for count text line

export function UserManagementScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<UserFilters>({
    role: 'all',
    includeDeleted: false,
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);

  const loadUsers = useCallback(async (reset = false) => {
    const currentFilters = reset ? { ...filters, page: 1 } : filters;

    const result = await getUsers({
      ...currentFilters,
      search: search || undefined,
    });

    if (result.success && result.users) {
      if (reset || currentFilters.page === 1) {
        setUsers(result.users);
      } else {
        setUsers((prev) => [...prev, ...result.users!]);
      }
      setTotal(result.total || 0);
    }
  }, [filters, search]);

  useEffect(() => {
    setIsLoading(true);
    loadUsers(true).finally(() => setIsLoading(false));
  }, [loadUsers]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setFilters((prev) => ({ ...prev, page: 1 }));
    await loadUsers(true);
    setIsRefreshing(false);
  }, [loadUsers]);

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    setIsLoading(true);
    loadUsers(true).finally(() => setIsLoading(false));
  }, [loadUsers]);

  const handleLoadMore = useCallback(() => {
    if (users.length < total) {
      setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }));
      loadUsers();
    }
  }, [users.length, total, loadUsers]);

  const handleUserPress = useCallback((user: AdminUser) => {
    router.push(`/(admin)/users/${user.id}`);
  }, [router]);

  const getStatusColor = (isDeleted: boolean) => {
    return isDeleted ? colors.destructive : colors.success;
  };

  const renderUser = ({ item }: { item: AdminUser }) => (
    <TouchableOpacity
      className="flex-row items-center p-4"
      style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border }}
      onPress={() => handleUserPress(item)}
    >
      <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + '1A' }}>
        <User size={24} color={colors.info} />
      </View>
      <View className="flex-1 ml-3">
        <View className="flex-row items-center">
          <Text className="font-medium" style={{ color: colors.foreground }}>
            {item.name || 'No Name'}
          </Text>
          {isAdminRole(item.role) && (
            <Shield size={14} color={colors.primary} style={{ marginLeft: 4 }} />
          )}
        </View>
        <Text className="text-sm" style={{ color: colors.mutedForeground }}>{item.email}</Text>
        <View className="flex-row items-center mt-1">
          <View
            className="w-2 h-2 rounded-full mr-1"
            style={{ backgroundColor: getStatusColor(item.isDeleted) }}
          />
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>
            {item.isDeleted ? 'Deleted' : 'Active'}
          </Text>
          <Text className="text-xs mx-2" style={{ color: colors.mutedForeground }}>•</Text>
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>
            {getRoleLabel(item.role)}
          </Text>
        </View>
      </View>
      <ChevronRight size={20} color={colors.mutedForeground} />
    </TouchableOpacity>
  );

  // Calculate dynamic padding based on filter visibility and count text
  const listPaddingTop =
    SEARCH_BAR_CONTAINER_HEIGHT +
    insets.top +
    SEARCH_BAR_TO_CONTENT_GAP +
    (total > 0 ? COUNT_TEXT_HEIGHT : 0) +
    (showFilters ? FILTER_PILLS_HEIGHT : 0);

  // Loading state with skeletons - matches floating search bar layout
  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={[]}>
        {/* Floating search bar skeleton */}
        <View className="absolute top-0 left-0 right-0 z-10" style={{ paddingTop: insets.top }}>
          <View className="px-4 pt-2 pb-1">
            <Skeleton className="h-12 rounded-full" />
          </View>
        </View>

        {/* Content skeletons with matching paddingTop */}
        <View style={{ paddingTop: SEARCH_BAR_CONTAINER_HEIGHT + insets.top + SEARCH_BAR_TO_CONTENT_GAP }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={{
                backgroundColor: colors.card,
                borderBottomWidth: 1,
                borderColor: colors.border,
                padding: 16,
              }}
            >
              <View className="flex-row items-center">
                <Skeleton className="w-12 h-12 rounded-full" />
                <View className="flex-1 ml-3">
                  <Skeleton className="h-4 w-32 rounded mb-2" />
                  <Skeleton className="h-3 w-48 rounded mb-1" />
                  <Skeleton className="h-3 w-24 rounded" />
                </View>
              </View>
            </View>
          ))}
        </View>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={[]}>
      {/* Floating Glass Search Bar - positioned absolutely at top */}
      <View className="absolute top-0 left-0 right-0 z-10" style={{ paddingTop: insets.top }}>
        <View className="px-4 pt-2 pb-1">
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search users..."
            size="lg"
            onSubmit={handleSearch}
            glass={true}
            onFilter={() => setShowFilters(!showFilters)}
            hasActiveFilters={filters.role !== 'all'}
          />
        </View>

        {/* Subtle count text */}
        {total > 0 && (
          <Text className="text-xs text-center px-4" style={{ color: colors.mutedForeground }}>
            {total} user{total !== 1 ? 's' : ''} found
          </Text>
        )}

        {/* Filter Pills */}
        {showFilters && (
          <View className="px-4 pb-2 mt-2">
            <View className="flex-row flex-wrap gap-2">
              <FilterPill
                label="All Roles"
                active={filters.role === 'all'}
                onPress={() => {
                  setFilters((prev) => ({ ...prev, role: 'all', page: 1 }));
                  loadUsers(true);
                }}
              />
              <FilterPill
                label="Admin"
                active={filters.role === 'admin'}
                onPress={() => {
                  setFilters((prev) => ({ ...prev, role: 'admin', page: 1 }));
                  loadUsers(true);
                }}
              />
              <FilterPill
                label="Support"
                active={filters.role === 'support'}
                onPress={() => {
                  setFilters((prev) => ({ ...prev, role: 'support', page: 1 }));
                  loadUsers(true);
                }}
              />
              <FilterPill
                label="User"
                active={filters.role === 'user'}
                onPress={() => {
                  setFilters((prev) => ({ ...prev, role: 'user', page: 1 }));
                  loadUsers(true);
                }}
              />
            </View>
          </View>
        )}
      </View>

      {/* User List - content scrolls beneath search bar */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{
          paddingTop: listPaddingTop,
          paddingBottom: TAB_BAR_SAFE_PADDING + insets.bottom,
        }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-24">
            <User size={48} color={colors.mutedForeground} />
            <Text className="mt-4 text-base" style={{ color: colors.mutedForeground }}>No users found</Text>
          </View>
        }
      />
    </ThemedSafeAreaView>
  );
}

interface FilterPillProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function FilterPill({ label, active, onPress }: FilterPillProps) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      className="px-3 py-1.5 rounded-full"
      style={{ backgroundColor: active ? colors.primary : colors.muted }}
      onPress={onPress}
    >
      <Text
        className="text-sm"
        style={{ color: active ? colors.primaryForeground : colors.mutedForeground }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
