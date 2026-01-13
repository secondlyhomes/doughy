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
import { ArrowLeft, Filter, User, Shield, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { SearchBar, ScreenHeader, LoadingSpinner } from '@/components/ui';
import { getUsers, getRoleLabel, isAdminRole, type AdminUser, type UserFilters, type UserRole } from '../services/userService';

export function UserManagementScreen() {
  const router = useRouter();
  const colors = useThemeColors();

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
      className="flex-row items-center bg-card p-4 border-b border-border"
      onPress={() => handleUserPress(item)}
    >
      <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
        <User size={24} color={colors.info} />
      </View>
      <View className="flex-1 ml-3">
        <View className="flex-row items-center">
          <Text className="text-foreground font-medium">
            {item.name || 'No Name'}
          </Text>
          {isAdminRole(item.role) && (
            <Shield size={14} color={colors.primary} style={{ marginLeft: 4 }} />
          )}
        </View>
        <Text className="text-sm text-muted-foreground">{item.email}</Text>
        <View className="flex-row items-center mt-1">
          <View
            className="w-2 h-2 rounded-full mr-1"
            style={{ backgroundColor: getStatusColor(item.isDeleted) }}
          />
          <Text className="text-xs text-muted-foreground">
            {item.isDeleted ? 'Deleted' : 'Active'}
          </Text>
          <Text className="text-xs text-muted-foreground mx-2">•</Text>
          <Text className="text-xs text-muted-foreground">
            {getRoleLabel(item.role)}
          </Text>
        </View>
      </View>
      <ChevronRight size={20} color={colors.mutedForeground} />
    </TouchableOpacity>
  );

  return (
    <ThemedSafeAreaView className="flex-1">
      {/* Header */}
      <ScreenHeader
        title="User Management"
        backButton
        bordered
        rightAction={
          <TouchableOpacity
            className="p-2"
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} color={showFilters ? colors.info : colors.mutedForeground} />
          </TouchableOpacity>
        }
      />

      {/* Search Bar */}
      <View className="px-4 py-3 border-b border-border">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search users..."
          size="lg"
          onSubmit={handleSearch}
        />

        {/* Filter Pills */}
        {showFilters && (
          <View className="flex-row flex-wrap mt-3 gap-2">
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
        )}
      </View>

      {/* Stats */}
      <View className="px-4 py-2 bg-muted/50">
        <Text className="text-sm text-muted-foreground">
          {total} user{total !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* User List */}
      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-12">
              <User size={48} color={colors.mutedForeground} />
              <Text className="text-muted-foreground mt-4">No users found</Text>
            </View>
          }
        />
      )}
    </ThemedSafeAreaView>
  );
}

interface FilterPillProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function FilterPill({ label, active, onPress }: FilterPillProps) {
  return (
    <TouchableOpacity
      className={`px-3 py-1.5 rounded-full ${
        active ? 'bg-primary' : 'bg-muted'
      }`}
      onPress={onPress}
    >
      <Text
        className={`text-sm ${
          active ? 'text-primary-foreground' : 'text-muted-foreground'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
