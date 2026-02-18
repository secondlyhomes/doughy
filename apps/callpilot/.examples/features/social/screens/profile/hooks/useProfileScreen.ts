/**
 * useProfileScreen Hook
 *
 * Manages profile screen state, data fetching, and relationship checking.
 */

import { useEffect, useState, useCallback } from 'react';
import { useProfile } from '../../../contexts/ProfileContext';
import { useSocial } from '../../../contexts/SocialContext';
import type { FollowRelationship, UseProfileScreenReturn } from '../types';

interface UseProfileScreenParams {
  userId: string;
  currentUserId?: string;
}

/**
 * Hook for managing profile screen data and state
 *
 * @example
 * ```tsx
 * const { profile, loading, error, relationship, isOwnProfile } = useProfileScreen({
 *   userId: 'user-123',
 *   currentUserId: 'current-user-456',
 * });
 * ```
 */
export function useProfileScreen({
  userId,
  currentUserId,
}: UseProfileScreenParams): UseProfileScreenReturn {
  const { profile, loading, error, loadProfile } = useProfile();
  const { getFollowRelationship } = useSocial();
  const [relationship, setRelationship] = useState<FollowRelationship | null>(null);

  const isOwnProfile = userId === currentUserId;

  const checkRelationship = useCallback(async () => {
    if (!currentUserId || isOwnProfile) return;

    try {
      const rel = await getFollowRelationship(userId);
      setRelationship(rel);
    } catch (err) {
      console.error('Error checking relationship:', err);
    }
  }, [currentUserId, isOwnProfile, userId, getFollowRelationship]);

  // Load profile data
  useEffect(() => {
    loadProfile(userId);
  }, [userId, loadProfile]);

  // Check relationship status
  useEffect(() => {
    if (currentUserId && !isOwnProfile) {
      checkRelationship();
    }
  }, [currentUserId, isOwnProfile, checkRelationship]);

  return {
    profile,
    loading,
    error,
    relationship,
    isOwnProfile,
  };
}
