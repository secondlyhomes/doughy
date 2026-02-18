/**
 * Feed Item Component
 *
 * Displays a single activity feed item.
 */

import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '@/theme/tokens';
import type { ActivityFeedItem } from '../types';

interface FeedItemProps {
  activity: ActivityFeedItem;
  onProfilePress?: (userId: string) => void;
  onContentPress?: (activity: ActivityFeedItem) => void;
}

/**
 * Feed Item
 *
 * @example
 * ```tsx
 * <FeedItem
 *   activity={activity}
 *   onProfilePress={(userId) => navigation.navigate('Profile', { userId })}
 * />
 * ```
 */
export function FeedItem({ activity, onProfilePress, onContentPress }: FeedItemProps) {
  const getActivityText = () => {
    switch (activity.activity_type) {
      case 'post_created':
        return 'created a post';
      case 'post_liked':
        return 'liked a post';
      case 'user_followed':
        return 'followed someone';
      case 'comment_added':
        return 'added a comment';
      case 'profile_updated':
        return 'updated their profile';
      default:
        return 'did something';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks}w ago`;
  };

  return (
    <Pressable
      style={styles.container}
      onPress={() => onContentPress?.(activity)}
    >
      <Pressable
        style={styles.avatarContainer}
        onPress={() => onProfilePress?.(activity.actor_id)}
      >
        {activity.actor?.avatar_url ? (
          <Image source={{ uri: activity.actor.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {activity.actor?.username?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
      </Pressable>

      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => onProfilePress?.(activity.actor_id)}>
            <Text style={styles.username}>
              {activity.actor?.username || 'Unknown user'}
            </Text>
          </Pressable>
          <Text style={styles.action}> {getActivityText()}</Text>
        </View>

        {activity.content && (
          <View style={styles.activityContent}>
            {activity.content.title && (
              <Text style={styles.contentTitle}>{activity.content.title}</Text>
            )}
            {activity.content.text && (
              <Text style={styles.contentText} numberOfLines={3}>
                {activity.content.text}
              </Text>
            )}
          </View>
        )}

        <Text style={styles.timestamp}>{getTimeAgo(activity.created_at)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  avatarContainer: {
    marginRight: spacing[3],
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary[600],
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  username: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  action: {
    fontSize: fontSize.base,
    color: colors.neutral[600],
  },
  activityContent: {
    marginTop: spacing[2],
    padding: spacing[3],
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[500],
  },
  contentTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  contentText: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  timestamp: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: spacing[2],
  },
});
