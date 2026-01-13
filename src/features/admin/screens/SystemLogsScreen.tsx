// src/features/admin/screens/SystemLogsScreen.tsx
// System logs viewer for admin

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLogs, type LogEntry, type LogLevel, type LogFilters } from '../services/logsService';

export function SystemLogsScreen() {
  const router = useRouter();

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
        return <AlertCircle size={16} color="#ef4444" />;
      case 'warning':
        return <AlertTriangle size={16} color="#f59e0b" />;
      case 'info':
        return <Info size={16} color="#3b82f6" />;
      case 'debug':
        return <Bug size={16} color="#6b7280" />;
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'debug':
        return 'bg-gray-50 border-gray-200';
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

    return (
      <TouchableOpacity
        className={`mx-4 mb-2 p-3 rounded-lg border ${getLevelColor(item.level)}`}
        onPress={() => setExpandedLog(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-start">
          <View className="mt-0.5">{getLevelIcon(item.level)}</View>
          <View className="flex-1 ml-2">
            <Text className="text-foreground" numberOfLines={isExpanded ? undefined : 2}>
              {item.message}
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-xs text-muted-foreground">
                {item.source}
              </Text>
              <Text className="text-xs text-muted-foreground mx-1">•</Text>
              <Text className="text-xs text-muted-foreground">
                {formatDate(item.timestamp)} {formatTime(item.timestamp)}
              </Text>
            </View>
            {isExpanded && item.metadata && (
              <View className="mt-2 p-2 bg-muted rounded">
                <Text className="text-xs font-mono text-muted-foreground">
                  {JSON.stringify(item.metadata, null, 2)}
                </Text>
              </View>
            )}
          </View>
          <ChevronDown
            size={16}
            color="#6b7280"
            style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-foreground ml-2">
          System Logs
        </Text>
        <TouchableOpacity
          className="p-2"
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={showFilters ? '#3b82f6' : '#6b7280'} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View className="px-4 py-3 border-b border-border">
          <Text className="text-sm font-medium text-muted-foreground mb-2">
            Filter by Level
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <FilterPill
              label="All"
              active={filters.level === 'all'}
              onPress={() => handleFilterChange('all')}
            />
            <FilterPill
              label="Error"
              active={filters.level === 'error'}
              onPress={() => handleFilterChange('error')}
              color="#ef4444"
            />
            <FilterPill
              label="Warning"
              active={filters.level === 'warning'}
              onPress={() => handleFilterChange('warning')}
              color="#f59e0b"
            />
            <FilterPill
              label="Info"
              active={filters.level === 'info'}
              onPress={() => handleFilterChange('info')}
              color="#3b82f6"
            />
            <FilterPill
              label="Debug"
              active={filters.level === 'debug'}
              onPress={() => handleFilterChange('debug')}
              color="#6b7280"
            />
          </View>
        </View>
      )}

      {/* Stats */}
      <View className="px-4 py-2 bg-muted/50 flex-row justify-between">
        <Text className="text-sm text-muted-foreground">
          {total} log{total !== 1 ? 's' : ''}
        </Text>
        <Text className="text-sm text-muted-foreground">
          Auto-refreshes every 30s
        </Text>
      </View>

      {/* Logs List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
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
              <Info size={48} color="#9ca3af" />
              <Text className="text-muted-foreground mt-4">No logs found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

interface FilterPillProps {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
}

function FilterPill({ label, active, onPress, color }: FilterPillProps) {
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
