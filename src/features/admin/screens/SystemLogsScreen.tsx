// src/features/admin/screens/SystemLogsScreen.tsx
// System logs viewer for admin

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  ChevronDown,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import { SearchBar, LoadingSpinner, TAB_BAR_SAFE_PADDING, Skeleton } from '@/components/ui';
import { SPACING } from '@/constants/design-tokens';
import { getLogs, type LogEntry, type LogLevel, type LogFilters } from '../services/logsService';

// Spacing constants for floating search bar
const SEARCH_BAR_CONTAINER_HEIGHT = SPACING.sm + 48 + SPACING.xs; // ~60px (pt-2 + searchbar + pb-1)
const FILTER_PILLS_HEIGHT = 60; // Slightly taller due to "Filter by Level" label
const SEARCH_BAR_TO_CONTENT_GAP = SPACING.md; // 12px gap

export function SystemLogsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<LogFilters>({
    level: 'all',
    page: 1,
    limit: 50,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadLogs = useCallback(async (reset = false) => {
    const currentFilters = reset ? { ...filters, page: 1 } : filters;
    const result = await getLogs(currentFilters);

    if (result.success && result.logs) {
      if (reset || currentFilters.page === 1) {
        setLogs(result.logs);
      } else {
        setLogs((prev) => [...prev, ...result.logs!]);
      }
      setTotal(result.total || 0);
    }
  }, [filters]);

  useEffect(() => {
    setIsLoading(true);
    loadLogs(true).finally(() => setIsLoading(false));
  }, [loadLogs]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setFilters((prev) => ({ ...prev, page: 1 }));
    await loadLogs(true);
    setIsRefreshing(false);
  }, [loadLogs]);

  const handleFilterChange = useCallback((level: LogLevel | 'all') => {
    setFilters((prev) => ({ ...prev, level, page: 1 }));
    setIsLoading(true);
    loadLogs(true).finally(() => setIsLoading(false));
  }, [loadLogs]);

  const handleLoadMore = useCallback(() => {
    if (logs.length < total) {
      setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }));
      loadLogs();
    }
  }, [logs.length, total, loadLogs]);

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return <AlertCircle size={16} color={colors.destructive} />;
      case 'warning':
        return <AlertTriangle size={16} color={colors.warning} />;
      case 'info':
        return <Info size={16} color={colors.info} />;
      case 'debug':
        return <Bug size={16} color={colors.mutedForeground} />;
    }
  };

  const getLevelStyles = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return { backgroundColor: withOpacity(colors.destructive, 'muted'), borderColor: withOpacity(colors.destructive, 'strong') };
      case 'warning':
        return { backgroundColor: withOpacity(colors.warning, 'muted'), borderColor: withOpacity(colors.warning, 'strong') };
      case 'info':
        return { backgroundColor: withOpacity(colors.info, 'muted'), borderColor: withOpacity(colors.info, 'strong') };
      case 'debug':
        return { backgroundColor: colors.muted, borderColor: colors.border };
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderLog = ({ item }: { item: LogEntry }) => {
    const isExpanded = expandedLog === item.id;
    const levelStyles = getLevelStyles(item.level);

    return (
      <TouchableOpacity
        className="mx-4 mb-2 p-3 rounded-lg border"
        style={{ backgroundColor: levelStyles.backgroundColor, borderColor: levelStyles.borderColor }}
        onPress={() => setExpandedLog(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-start">
          <View className="mt-0.5">{getLevelIcon(item.level)}</View>
          <View className="flex-1 ml-2">
            <Text style={{ color: colors.foreground }} numberOfLines={isExpanded ? undefined : 2}>
              {item.message}
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                {item.source}
              </Text>
              <Text className="text-xs mx-1" style={{ color: colors.mutedForeground }}>•</Text>
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                {formatDate(item.timestamp)} {formatTime(item.timestamp)}
              </Text>
            </View>
            {isExpanded && item.metadata && (
              <View className="mt-2 p-2 rounded" style={{ backgroundColor: colors.muted }}>
                <Text className="text-xs font-mono" style={{ color: colors.mutedForeground }}>
                  {JSON.stringify(item.metadata, null, 2)}
                </Text>
              </View>
            )}
          </View>
          <ChevronDown
            size={16}
            color={colors.mutedForeground}
            style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
          />
        </View>
      </TouchableOpacity>
    );
  };

  // Filter logs by search term
  const filteredLogs = logs.filter((log) =>
    !search || log.message.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate dynamic padding based on filter visibility
  const listPaddingTop =
    SEARCH_BAR_CONTAINER_HEIGHT +
    insets.top +
    SEARCH_BAR_TO_CONTENT_GAP +
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
        <View style={{ paddingTop: SEARCH_BAR_CONTAINER_HEIGHT + insets.top + SEARCH_BAR_TO_CONTENT_GAP, paddingHorizontal: 16 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} className="mb-2">
              <Skeleton className="h-16 rounded-lg" />
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
            placeholder="Search logs..."
            size="lg"
            glass={true}
            onFilter={() => setShowFilters(!showFilters)}
            hasActiveFilters={filters.level !== 'all'}
          />
        </View>

        {/* Filter Pills */}
        {showFilters && (
          <View className="px-4 pb-2">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.mutedForeground }}>
              Filter by Level
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <FilterPill
                label="All"
                active={filters.level === 'all'}
                onPress={() => handleFilterChange('all')}
                colors={colors}
              />
              <FilterPill
                label="Error"
                active={filters.level === 'error'}
                onPress={() => handleFilterChange('error')}
                color={colors.destructive}
                colors={colors}
              />
              <FilterPill
                label="Warning"
                active={filters.level === 'warning'}
                onPress={() => handleFilterChange('warning')}
                color={colors.warning}
                colors={colors}
              />
              <FilterPill
                label="Info"
                active={filters.level === 'info'}
                onPress={() => handleFilterChange('info')}
                color={colors.info}
                colors={colors}
              />
              <FilterPill
                label="Debug"
                active={filters.level === 'debug'}
                onPress={() => handleFilterChange('debug')}
                color={colors.mutedForeground}
                colors={colors}
              />
            </View>
          </View>
        )}
      </View>

      {/* Logs List - content scrolls beneath search bar */}
      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        renderItem={renderLog}
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
            <Info size={48} color={colors.mutedForeground} />
            <Text className="mt-4 text-base" style={{ color: colors.mutedForeground }}>No logs found</Text>
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
  color?: string;
  colors: ReturnType<typeof useThemeColors>;
}

function FilterPill({ label, active, onPress, color, colors }: FilterPillProps) {
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
