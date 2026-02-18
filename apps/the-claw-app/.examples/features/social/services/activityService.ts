/**
 * Activity Feed Service
 *
 * Manages activity feed operations including:
 * - Creating activity items
 * - Fetching personalized feed
 * - Real-time updates
 */

import { supabase } from '@/services/supabase';
import type { ActivityFeedItem, ActivityType } from '../types';

/**
 * Create an activity feed item
 *
 * Records a user action in the activity feed.
 *
 * @example
 * ```ts
 * await createActivity(userId, 'post_created', {
 *   postId: '123',
 *   title: 'My first post'
 * });
 * ```
 */
export async function createActivity(
  userId: string,
  actorId: string,
  activityType: ActivityType,
  content?: Record<string, any>
): Promise<ActivityFeedItem> {
  const { data, error } = await supabase
    .from('activity_feed')
    .insert({
      user_id: userId,
      actor_id: actorId,
      activity_type: activityType,
      content: content || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating activity:', error);
    throw error;
  }

  return data;
}

/**
 * Get activity feed for a user
 *
 * Returns activities from users that the current user follows,
 * plus their own activities.
 *
 * @example
 * ```ts
 * const feed = await getActivityFeed(userId, 0, 20);
 * ```
 */
export async function getActivityFeed(
  userId: string,
  offset = 0,
  limit = 20
): Promise<ActivityFeedItem[]> {
  const { data, error } = await supabase
    .from('activity_feed')
    .select(
      `
      *,
      actor:profiles!activity_feed_actor_id_fkey(*)
    `
    )
    .or(`user_id.eq.${userId},actor_id.in.(select following_id from follows where follower_id='${userId}')`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching activity feed:', error);
    throw error;
  }

  return (data || []) as ActivityFeedItem[];
}

/**
 * Get user's own activities
 *
 * Returns only activities created by the specified user.
 *
 * @example
 * ```ts
 * const myActivities = await getUserActivities(userId, 0, 20);
 * ```
 */
export async function getUserActivities(
  userId: string,
  offset = 0,
  limit = 20
): Promise<ActivityFeedItem[]> {
  const { data, error } = await supabase
    .from('activity_feed')
    .select(
      `
      *,
      actor:profiles!activity_feed_actor_id_fkey(*)
    `
    )
    .eq('actor_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching user activities:', error);
    throw error;
  }

  return (data || []) as ActivityFeedItem[];
}

/**
 * Subscribe to real-time activity feed updates
 *
 * Sets up a real-time subscription for new activities.
 * Call the returned function to unsubscribe.
 *
 * @example
 * ```ts
 * const unsubscribe = subscribeToActivityFeed(userId, (activity) => {
 *   console.log('New activity:', activity);
 * });
 *
 * // Later, clean up
 * unsubscribe();
 * ```
 */
export function subscribeToActivityFeed(
  userId: string,
  onInsert: (activity: ActivityFeedItem) => void,
  onUpdate?: (activity: ActivityFeedItem) => void,
  onDelete?: (activityId: string) => void
): () => void {
  const channel = supabase
    .channel('activity-feed')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_feed',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onInsert(payload.new as ActivityFeedItem);
      }
    );

  if (onUpdate) {
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'activity_feed',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onUpdate(payload.new as ActivityFeedItem);
      }
    );
  }

  if (onDelete) {
    channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'activity_feed',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onDelete(payload.old.id);
      }
    );
  }

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Delete an activity
 *
 * Removes an activity from the feed.
 *
 * @example
 * ```ts
 * await deleteActivity(activityId);
 * ```
 */
export async function deleteActivity(activityId: string): Promise<void> {
  const { error } = await supabase
    .from('activity_feed')
    .delete()
    .eq('id', activityId);

  if (error) {
    console.error('Error deleting activity:', error);
    throw error;
  }
}

/**
 * Get activity count for a user
 *
 * Returns total number of activities for a user.
 *
 * @example
 * ```ts
 * const count = await getActivityCount(userId);
 * ```
 */
export async function getActivityCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('activity_feed')
    .select('*', { count: 'exact', head: true })
    .eq('actor_id', userId);

  if (error) {
    console.error('Error getting activity count:', error);
    throw error;
  }

  return count || 0;
}
