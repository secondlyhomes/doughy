// src/features/admin/screens/SystemLogsScreen.tsx
// System logs viewer for admin

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  ChevronDown,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import { SearchBar, TAB_BAR_SAFE_PADDING, Skeleton } from '@/components/ui';
import { SPACING } from '@/constants/design-tokens';
import { getLogs, type LogEntry, type LogLevel, type LogFilters } from '../services/logsService';

export function SystemLogsScreen() {
  const colors = useThemeColors();

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
    } else if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to load logs');
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

  const handleLoadMore = useCallback(async () => {
    if (logs.length < total) {
      const nextPage = (filters.page || 1) + 1;
      // Pass new page directly to avoid race condition with state update
      const result = await getLogs({
        ...filters,
        page: nextPage,
      });

      if (result.success && result.logs) {
        setLogs((prev) => [...prev, ...result.logs!]);
        setTotal(result.total || 0);
        // Only update page after successful load
        setFilters((prev) => ({ ...prev, page: nextPage }));
      } else if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to load more logs');
        // Page stays at current value, so retry will fetch the same page
      }
    }
  }, [logs.length, total, filters]);

  const getLevelIcon = useCallback((level: LogLevel) => {
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
  }, [colors]);

  const getLevelStyles = useCallback((level: LogLevel) => {
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
  }, [colors]);

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

  const renderLog = useCallback(({ item }: { item: LogEntry }) => {
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
  }, [colors, expandedLog, getLevelIcon, getLevelStyles]);

  // Filter logs by search term
  const filteredLogs = logs.filter((log) =>
    !search || log.message.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        {/* Search Bar - always rendered in normal document flow */}
        <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.xs }}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search logs..."
            size="md"
            glass={true}
            onFilter={() => setShowFilters(!showFilters)}
            hasActiveFilters={filters.level !== 'all'}
          />
        </View>

        {/* Filter Pills */}
        {showFilters && (
          <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
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

        {/* Content: Loading skeletons or Logs List */}
        {isLoading && !logs?.length ? (
          <View style={{ paddingHorizontal: SPACING.md }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} className="mb-2">
                <Skeleton className="h-16 rounded-lg" />
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={filteredLogs}
            keyExtractor={(item) => item.id}
            renderItem={renderLog}
            extraData={expandedLog}
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
            initialNumToRender={15}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-24">
                <Info size={48} color={colors.mutedForeground} />
                <Text className="mt-4 text-base" style={{ color: colors.mutedForeground }}>No logs found</Text>
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
  color?: string;
  colors: ReturnType<typeof useThemeColors>;
}

const FilterPill = React.memo(function FilterPill({ label, active, onPress, color, colors }: FilterPillProps) {
  // Use the provided color when active, otherwise use default primary
  const activeBackgroundColor = color ? withOpacity(color, 'strong') : colors.primary;
  const activeTextColor = color || colors.primaryForeground;

  return (
    <TouchableOpacity
      className="px-3 py-1.5 rounded-full"
      style={{ backgroundColor: active ? activeBackgroundColor : colors.muted }}
      onPress={onPress}
    >
      <Text
        className="text-sm"
        style={{ color: active ? activeTextColor : colors.mutedForeground }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
});
