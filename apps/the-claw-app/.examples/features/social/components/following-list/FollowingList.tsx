/**
 * Following List Component
 *
 * Displays a list of users that a given user is following.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FlatList } from 'react-native';
import { useSocial } from '../../contexts/SocialContext';
import type { UserProfile } from '../../types';
import { styles } from './styles';
import type { FollowingListProps } from './types';
import { FollowingItem } from './components/FollowingItem';
import { EmptyState } from './components/EmptyState';
import { ErrorState } from './components/ErrorState';
import { LoadingState } from './components/LoadingState';

/**
 * Following List
 *
 * Fetches and displays the list of users that a given user is following.
 * Handles loading, error, and empty states.
 *
 * @example
 * ```tsx
 * <FollowingList
 *   userId={user.id}
 *   onProfilePress={(profile) => navigation.navigate('Profile', { userId: profile.id })}
 * />
 * ```
 */
export function FollowingList({ userId, onProfilePress }: FollowingListProps) {
  const { loadFollowing } = useSocial();
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFollowing = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await loadFollowing(userId);
      setFollowing(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load following'));
    } finally {
      setLoading(false);
    }
  }, [userId, loadFollowing]);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  const renderItem = useCallback(
    ({ item }: { item: UserProfile }) => (
      <FollowingItem profile={item} onPress={onProfilePress} />
    ),
    [onProfilePress]
  );

  const keyExtractor = useCallback((item: UserProfile) => item.id, []);

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState message={error.message} onRetry={fetchFollowing} />;
  }

  // Empty state
  if (following.length === 0) {
    return <EmptyState />;
  }

  // Success state - render list
  return (
    <FlatList
      data={following}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.list}
    />
  );
}
