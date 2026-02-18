/**
 * Custom Hook Usage Examples
 *
 * Demonstrates how to use social feature hooks in custom components.
 * These are reference implementations showing hook patterns.
 */

import React from 'react';
import { View, Text, Button } from 'react-native';
// Note: These imports assume the social feature module is properly set up.
// Adjust paths based on your project structure.
import {
  useProfile,
  useSocial,
  useActivityFeed,
  useNotifications,
} from '../..';
import type { CustomFollowComponentProps } from '../types';

/**
 * Custom Profile Component
 *
 * Example of using useProfile hook for custom profile UI.
 */
export function CustomProfileComponent() {
  const { profile, updateProfile, uploadAvatar, loading } = useProfile();

  const handleUpdateBio = async () => {
    await updateProfile({ bio: 'New bio text' });
  };

  const handleUploadAvatar = async (imageUri: string) => {
    await uploadAvatar(imageUri);
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View>
      <Text>{profile?.username}</Text>
      <Text>{profile?.bio}</Text>
      <Button title="Update Bio" onPress={handleUpdateBio} />
    </View>
  );
}

/**
 * Custom Follow Component
 *
 * Example of using useSocial hook for follow/unfollow functionality.
 */
export function CustomFollowComponent({ targetUserId }: CustomFollowComponentProps) {
  const { followUser, unfollowUser, getFollowRelationship } = useSocial();
  const [isFollowing, setIsFollowing] = React.useState(false);

  React.useEffect(() => {
    checkRelationship();
  }, [targetUserId]);

  const checkRelationship = async () => {
    const rel = await getFollowRelationship(targetUserId);
    setIsFollowing(rel.isFollowing);
  };

  const handleToggle = async () => {
    if (isFollowing) {
      await unfollowUser(targetUserId);
      setIsFollowing(false);
    } else {
      await followUser(targetUserId);
      setIsFollowing(true);
    }
  };

  return (
    <Button
      title={isFollowing ? 'Unfollow' : 'Follow'}
      onPress={handleToggle}
    />
  );
}

/**
 * Custom Activity Component
 *
 * Example of using useActivityFeed hook for custom activity display.
 */
export function CustomActivityComponent() {
  const { activities, loading, hasMore, loadActivities } = useActivityFeed();

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadActivities(activities.length, 20);
    }
  };

  return (
    <View>
      {activities.map((activity) => (
        <View key={activity.id}>
          <Text>{activity.activity_type}</Text>
          <Text>{activity.created_at}</Text>
        </View>
      ))}
      {hasMore && <Button title="Load More" onPress={handleLoadMore} />}
    </View>
  );
}

/**
 * Custom Notifications Component
 *
 * Example of using useNotifications hook for custom notifications UI.
 */
export function CustomNotificationsComponent() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <View>
      <Text>Unread: {unreadCount}</Text>
      <Button title="Mark All Read" onPress={markAllAsRead} />
      {notifications.map((notification) => (
        <View key={notification.id}>
          <Text>{notification.title}</Text>
          <Button title="Mark Read" onPress={() => markAsRead(notification.id)} />
        </View>
      ))}
    </View>
  );
}
