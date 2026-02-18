/**
 * Activity Feed Component
 *
 * Complete activity feed with real-time updates and pagination.
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  StyleSheet,
} from 'react-native';
import { colors, spacing, fontSize } from '@/theme/tokens';
import { useActivityFeed } from '../contexts/ActivityFeedContext';
import { FeedItem } from './FeedItem';
import type { ActivityFeedItem } from '../types';

interface ActivityFeedProps {
  onProfilePress?: (userId: string) => void;
  onContentPress?: (activity: ActivityFeedItem) => void;
}

/**
 * Activity Feed
 *
 * @example
 * ```tsx
 * <ActivityFeed
 *   onProfilePress={(userId) => navigation.navigate('Profile', { userId })}
 *   onContentPress={(activity) => handleActivityPress(activity)}
 * />
 * ```
 */
export function ActivityFeed({ onProfilePress, onContentPress }: ActivityFeedProps) {
  const { activities, loading, hasMore, loadActivities, refreshActivities, error } =
    useActivityFeed();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshActivities();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadActivities(activities.length, 20);
    }
  };

  const renderItem = ({ item }: { item: ActivityFeedItem }) => (
    <FeedItem
      activity={item}
      onProfilePress={onProfilePress}
      onContentPress={onContentPress}
    />
  );

  const renderFooter = () => {
    if (!loading) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary[500]} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading && activities.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No activities yet</Text>
        <Text style={styles.emptySubtext}>
          Follow users to see their activity here
        </Text>
      </View>
    );
  };

  if (error && activities.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error.message}</Text>
        <Pressable onPress={refreshActivities} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={activities}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary[500]}
        />
      }
      contentContainerStyle={activities.length === 0 ? styles.emptyContainer : undefined}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  emptySubtext: {
    fontSize: fontSize.base,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.error[600],
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.primary[500],
    borderRadius: 8,
  },
  retryText: {
    color: colors.white,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
});
