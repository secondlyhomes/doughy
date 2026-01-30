// src/features/admin/screens/UserManagementScreen.tsx
// User management screen for admin

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { User, Shield, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { SearchBar, TAB_BAR_SAFE_PADDING, Skeleton } from '@/components/ui';
import { SPACING } from '@/constants/design-tokens';
import { useDebounce } from '@/hooks/useDebounce';
import { getUsers, getRoleLabel, isAdminRole, type AdminUser, type UserFilters, type UserRole } from '../services/userService';

interface UserRowItemProps {
  user: AdminUser;
  onPress: (user: AdminUser) => void;
}

const UserRowItem = React.memo(function UserRowItem({ user, onPress }: UserRowItemProps) {
  const colors = useThemeColors();

  const getStatusColor = (isDeleted: boolean) => {
    return isDeleted ? colors.destructive : colors.success;
  };

  const handlePress = useCallback(() => {
    onPress(user);
  }, [onPress, user]);

  return (
    <TouchableOpacity
      className="flex-row items-center p-4"
      style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border }}
      onPress={handlePress}
    >
      <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + '1A' }}>
        <User size={24} color={colors.info} />
      </View>
      <View className="flex-1 ml-3">
        <View className="flex-row items-center">
          <Text className="font-medium" style={{ color: colors.foreground }}>
            {user.name || 'No Name'}
          </Text>
          {isAdminRole(user.role) && (
            <Shield size={14} color={colors.primary} style={{ marginLeft: 4 }} />
          )}
        </View>
        <Text className="text-sm" style={{ color: colors.mutedForeground }}>{user.email}</Text>
        <View className="flex-row items-center mt-1">
          <View
            className="w-2 h-2 rounded-full mr-1"
            style={{ backgroundColor: getStatusColor(user.isDeleted) }}
          />
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>
            {user.isDeleted ? 'Deleted' : 'Active'}
          </Text>
          <Text className="text-xs mx-2" style={{ color: colors.mutedForeground }}>•</Text>
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>
            {getRoleLabel(user.role)}
          </Text>
        </View>
      </View>
      <ChevronRight size={20} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
});

export function UserManagementScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filters, setFilters] = useState<UserFilters>({
    role: 'all',
    includeDeleted: false,
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);
  const hasLoadedRef = useRef(false);

  const loadUsers = useCallback(async (reset = false) => {
    const currentFilters = reset ? { ...filters, page: 1 } : filters;

    const result = await getUsers({
      ...currentFilters,
      search: debouncedSearch || undefined,
    });

    if (result.success && result.users) {
      if (reset || currentFilters.page === 1) {
        setUsers(result.users);
      } else {
        setUsers((prev) => [...prev, ...result.users!]);
      }
      setTotal(result.total || 0);
    } else if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to load users');
    }
  }, [filters, debouncedSearch]);

  // Initial load and filter changes
  useEffect(() => {
    setIsLoading(true);
    loadUsers(true).finally(() => {
      setIsLoading(false);
      hasLoadedRef.current = true;
    });
  }, [loadUsers]);

  // Reset pagination when debounced search changes
  useEffect(() => {
    // Only reset if initial load has completed
    if (hasLoadedRef.current) {
      setFilters((prev) => ({ ...prev, page: 1 }));
    }
  }, [debouncedSearch]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setFilters((prev) => ({ ...prev, page: 1 }));
    await loadUsers(true);
    setIsRefreshing(false);
  }, [loadUsers]);

  // Immediate search on explicit submit (Enter key)
  // Note: Typing already triggers search via debounce after 300ms
  const handleSearch = useCallback(() => {
    // Reset pagination and trigger immediate search
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (users.length < total) {
      const nextPage = (filters.page || 1) + 1;
      // Pass new page directly to avoid race condition with state update
      const result = await getUsers({
        ...filters,
        page: nextPage,
        search: debouncedSearch || undefined,
      });

      if (result.success && result.users) {
        setUsers((prev) => [...prev, ...result.users!]);
        setTotal(result.total || 0);
        // Only update page after successful load
        setFilters((prev) => ({ ...prev, page: nextPage }));
      } else if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to load more users');
        // Page stays at current value, so retry will fetch the same page
      }
    }
  }, [users.length, total, filters, debouncedSearch]);

  const handleUserPress = useCallback((user: AdminUser) => {
    router.push(`/(admin)/users/${user.id}`);
  }, [router]);

  const renderUser = useCallback(({ item }: { item: AdminUser }) => (
    <UserRowItem user={item} onPress={handleUserPress} />
  ), [handleUserPress]);

  const keyExtractor = useCallback((item: AdminUser) => item.id, []);

  // Loading skeletons for list content
  const renderSkeletons = () => (
    <View>
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
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        {/* Search Bar - in normal document flow */}
        <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.xs }}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={total > 0 ? `Search ${total} users...` : 'Search users...'}
            size="md"
            onSubmit={handleSearch}
            glass={true}
            onFilter={() => setShowFilters(!showFilters)}
            hasActiveFilters={filters.role !== 'all'}
          />
        </View>

        {/* Filter Pills */}
        {showFilters && (
          <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
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

        {/* User List or Loading Skeletons */}
        {isLoading ? (
          renderSkeletons()
        ) : (
          <FlatList
            data={users}
            keyExtractor={keyExtractor}
            renderItem={renderUser}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{
              paddingBottom: TAB_BAR_SAFE_PADDING,
            }}
            contentInsetAdjustmentBehavior="automatic"
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={10}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-24">
                <User size={48} color={colors.mutedForeground} />
                <Text className="mt-4 text-base" style={{ color: colors.mutedForeground }}>No users found</Text>
              </View>
            }
          />
        )}
      </ThemedSafeAreaView>
    </GestureHandlerRootView>
  );
}

interface FilterPillProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

const FilterPill = React.memo(function FilterPill({ label, active, onPress }: FilterPillProps) {
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
});
