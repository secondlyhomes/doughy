/**
 * Social Service
 *
 * Handles social graph operations including:
 * - Following/unfollowing users
 * - Follower/following lists
 * - Friend suggestions
 * - Mutual connections
 */

import { supabase } from '@/services/supabase';
import type { UserProfile, Follow, FollowRelationship } from '../types';

/**
 * Follow a user
 *
 * Creates a follow relationship and updates follower counts.
 * Uses a database function for atomic operations.
 *
 * @example
 * ```ts
 * await followUser(currentUserId, targetUserId);
 * ```
 */
export async function followUser(
  followerId: string,
  followingId: string
): Promise<Follow> {
  // Prevent self-following
  if (followerId === followingId) {
    throw new Error('Cannot follow yourself');
  }

  // Check if already following
  const { data: existing } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();

  if (existing) {
    throw new Error('Already following this user');
  }

  // Create follow relationship
  const { data, error } = await supabase
    .from('follows')
    .insert({
      follower_id: followerId,
      following_id: followingId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error following user:', error);
    throw error;
  }

  // Update counts using RPC function
  await supabase.rpc('increment_follow_counts', {
    p_follower_id: followerId,
    p_following_id: followingId,
  });

  return data;
}

/**
 * Unfollow a user
 *
 * Removes follow relationship and updates follower counts.
 *
 * @example
 * ```ts
 * await unfollowUser(currentUserId, targetUserId);
 * ```
 */
export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<void> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }

  // Update counts using RPC function
  await supabase.rpc('decrement_follow_counts', {
    p_follower_id: followerId,
    p_following_id: followingId,
  });
}

/**
 * Get follow relationship between two users
 *
 * Checks if user A follows user B and vice versa.
 *
 * @example
 * ```ts
 * const rel = await getFollowRelationship(currentUserId, targetUserId);
 * if (rel.isFollowing) {
 *   console.log('You follow this user');
 * }
 * ```
 */
export async function getFollowRelationship(
  userId: string,
  targetUserId: string
): Promise<FollowRelationship> {
  // Check if current user follows target
  const { data: following } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', userId)
    .eq('following_id', targetUserId)
    .single();

  // Check if target follows current user
  const { data: followedBy } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', targetUserId)
    .eq('following_id', userId)
    .single();

  const isFollowing = !!following;
  const isFollowedBy = !!followedBy;

  return {
    isFollowing,
    isFollowedBy,
    isMutual: isFollowing && isFollowedBy,
  };
}

/**
 * Get list of followers for a user
 *
 * Returns profiles of users who follow the given user.
 *
 * @example
 * ```ts
 * const followers = await getFollowers(userId, 0, 20);
 * ```
 */
export async function getFollowers(
  userId: string,
  offset = 0,
  limit = 20
): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select(
      `
      follower_id,
      profiles!follows_follower_id_fkey(*)
    `
    )
    .eq('following_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching followers:', error);
    throw error;
  }

  return (data?.map((f: any) => f.profiles) || []) as UserProfile[];
}

/**
 * Get list of users that a user is following
 *
 * Returns profiles of users that the given user follows.
 *
 * @example
 * ```ts
 * const following = await getFollowing(userId, 0, 20);
 * ```
 */
export async function getFollowing(
  userId: string,
  offset = 0,
  limit = 20
): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select(
      `
      following_id,
      profiles!follows_following_id_fkey(*)
    `
    )
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching following:', error);
    throw error;
  }

  return (data?.map((f: any) => f.profiles) || []) as UserProfile[];
}

/**
 * Get mutual followers (users who both follow each other)
 *
 * @example
 * ```ts
 * const friends = await getMutualFollowers(userId);
 * ```
 */
export async function getMutualFollowers(
  userId: string,
  offset = 0,
  limit = 20
): Promise<UserProfile[]> {
  // Get users where both follow relationships exist
  const { data, error } = await supabase.rpc('get_mutual_followers', {
    p_user_id: userId,
    p_offset: offset,
    p_limit: limit,
  });

  if (error) {
    console.error('Error fetching mutual followers:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get suggested users to follow
 *
 * Returns users based on:
 * - Mutual connections (friends of friends)
 * - Popular users
 * - Similar interests (if available)
 *
 * @example
 * ```ts
 * const suggestions = await getSuggestedUsers(userId, 10);
 * ```
 */
export async function getSuggestedUsers(
  userId: string,
  limit = 10
): Promise<UserProfile[]> {
  // Get users that current user's followers also follow
  // Exclude users already followed and self
  const { data, error } = await supabase.rpc('get_suggested_users', {
    p_user_id: userId,
    p_limit: limit,
  });

  if (error) {
    console.error('Error fetching suggested users:', error);
    // Fallback to popular users
    return getPopularUsers(limit);
  }

  return data || [];
}

/**
 * Get popular users (most followers)
 *
 * Fallback for suggestions when personalized suggestions aren't available.
 *
 * @example
 * ```ts
 * const popular = await getPopularUsers(10);
 * ```
 */
export async function getPopularUsers(limit = 10): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('followers_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching popular users:', error);
    throw error;
  }

  return data || [];
}

/**
 * Check if user is following multiple users at once
 *
 * Useful for displaying follow buttons in lists.
 *
 * @example
 * ```ts
 * const followMap = await checkMultipleFollows(userId, [id1, id2, id3]);
 * // { id1: true, id2: false, id3: true }
 * ```
 */
export async function checkMultipleFollows(
  userId: string,
  targetUserIds: string[]
): Promise<Record<string, boolean>> {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)
    .in('following_id', targetUserIds);

  if (error) {
    console.error('Error checking follows:', error);
    throw error;
  }

  const followMap: Record<string, boolean> = {};
  targetUserIds.forEach((id) => {
    followMap[id] = data?.some((f) => f.following_id === id) || false;
  });

  return followMap;
}
