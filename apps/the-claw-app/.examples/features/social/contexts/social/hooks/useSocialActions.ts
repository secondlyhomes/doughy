/**
 * Social Actions Hook
 *
 * Encapsulates follow/unfollow and social graph operations.
 * Extracted from SocialProvider to keep provider under 150 lines.
 */

import { useCallback } from 'react';
import type { UserProfile, FollowRelationship, SocialActions } from '../types';
import * as socialService from '../../../services/socialService';
import * as notificationService from '../../../services/notificationService';

interface UseSocialActionsOptions {
  currentUserId?: string;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
}

/**
 * Hook providing social graph action handlers
 */
export function useSocialActions({
  currentUserId,
  setLoading,
  setError,
}: UseSocialActionsOptions): SocialActions {
  /**
   * Follow a user and send notification
   */
  const followUser = useCallback(
    async (userId: string) => {
      if (!currentUserId) {
        throw new Error('Not authenticated');
      }

      try {
        setLoading(true);
        setError(null);
        await socialService.followUser(currentUserId, userId);

        // Create notification for the followed user
        await notificationService.createNotification(
          userId,
          'follow',
          'New Follower',
          'Someone started following you',
          { followerId: currentUserId }
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to follow user');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, setLoading, setError]
  );

  /**
   * Unfollow a user
   */
  const unfollowUser = useCallback(
    async (userId: string) => {
      if (!currentUserId) {
        throw new Error('Not authenticated');
      }

      try {
        setLoading(true);
        setError(null);
        await socialService.unfollowUser(currentUserId, userId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to unfollow user');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, setLoading, setError]
  );

  /**
   * Get follow relationship with another user
   */
  const getFollowRelationship = useCallback(
    async (userId: string): Promise<FollowRelationship> => {
      if (!currentUserId) {
        return { isFollowing: false, isFollowedBy: false, isMutual: false };
      }

      try {
        setError(null);
        return await socialService.getFollowRelationship(currentUserId, userId);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to get follow relationship');
        setError(error);
        throw error;
      }
    },
    [currentUserId, setError]
  );

  /**
   * Load followers for a user
   */
  const loadFollowers = useCallback(
    async (userId: string): Promise<UserProfile[]> => {
      try {
        setLoading(true);
        setError(null);
        return await socialService.getFollowers(userId, 0, 100);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load followers');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError]
  );

  /**
   * Load users that a user is following
   */
  const loadFollowing = useCallback(
    async (userId: string): Promise<UserProfile[]> => {
      try {
        setLoading(true);
        setError(null);
        return await socialService.getFollowing(userId, 0, 100);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load following');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError]
  );

  /**
   * Get suggested users to follow
   */
  const getSuggestedUsers = useCallback(
    async (limit = 10): Promise<UserProfile[]> => {
      if (!currentUserId) {
        return [];
      }

      try {
        setLoading(true);
        setError(null);
        return await socialService.getSuggestedUsers(currentUserId, limit);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to get suggestions');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, setLoading, setError]
  );

  return {
    followUser,
    unfollowUser,
    getFollowRelationship,
    loadFollowers,
    loadFollowing,
    getSuggestedUsers,
  };
}
