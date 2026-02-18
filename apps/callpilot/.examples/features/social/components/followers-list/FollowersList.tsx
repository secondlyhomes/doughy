/**
 * Followers List Component
 *
 * Displays a list of users who follow a given user.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FlatList } from 'react-native';
import { useSocial } from '../../contexts/SocialContext';
import { FollowerItem, EmptyState, ErrorState, LoadingState } from './components';
import { styles } from './styles';
import type { FollowersListProps } from './types';
import type { UserProfile } from '../../types';

/**
 * Followers List
 *
 * @example
 * ```tsx
 * <FollowersList
 *   userId={user.id}
 *   onProfilePress={(profile) => navigation.navigate('Profile', { userId: profile.id })}
 * />
 * ```
 */
export function FollowersList({ userId, onProfilePress }: FollowersListProps) {
  const { loadFollowers } = useSocial();
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFollowers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await loadFollowers(userId);
      setFollowers(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load followers'));
    } finally {
      setLoading(false);
    }
  }, [loadFollowers, userId]);

  useEffect(() => {
    fetchFollowers();
  }, [fetchFollowers]);

  const renderFollower = useCallback(
    ({ item }: { item: UserProfile }) => (
      <FollowerItem
        profile={item}
        onPress={() => onProfilePress?.(item)}
      />
    ),
    [onProfilePress]
  );

  const keyExtractor = useCallback((item: UserProfile) => item.id, []);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={fetchFollowers} />;
  }

  if (followers.length === 0) {
    return <EmptyState />;
  }

  return (
    <FlatList
      data={followers}
      renderItem={renderFollower}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.list}
    />
  );
}
