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
  ArrowLeft,
  Filter,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  ChevronDown,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import { ScreenHeader, LoadingSpinner } from '@/components/ui';
import { getLogs, type LogEntry, type LogLevel, type LogFilters } from '../services/logsService';

export function SystemLogsScreen() {
  const router = useRouter();
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

  return (
    <ThemedSafeAreaView className="flex-1">
      {/* Header */}
      <ScreenHeader
        title="System Logs"
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

      {/* Filters */}
      {showFilters && (
        <View className="px-4 py-3 border-b" style={{ borderColor: colors.border }}>
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

      {/* Stats */}
      <View className="px-4 py-2 flex-row justify-between" style={{ backgroundColor: withOpacity(colors.muted, 'opaque') }}>
        <Text className="text-sm" style={{ color: colors.mutedForeground }}>
          {total} log{total !== 1 ? 's' : ''}
        </Text>
        <Text className="text-sm" style={{ color: colors.mutedForeground }}>
          Auto-refreshes every 30s
        </Text>
      </View>

      {/* Logs List */}
      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderLog}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ paddingVertical: 8 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-12">
              <Info size={48} color={colors.mutedForeground} />
              <Text className="mt-4" style={{ color: colors.mutedForeground }}>No logs found</Text>
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
