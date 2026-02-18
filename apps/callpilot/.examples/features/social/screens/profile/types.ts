/**
 * Profile Screen Types
 *
 * TypeScript interfaces for the profile screen module.
 */

import type { UserProfile } from '../../types';

/**
 * Props for the main ProfileScreen component
 */
export interface ProfileScreenProps {
  userId: string;
  currentUserId?: string;
  onEditProfile?: () => void;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
}

/**
 * Props for the ProfileHeader component
 */
export interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  onEditProfile?: () => void;
  userId: string;
}

/**
 * Props for the ProfileStats component
 */
export interface ProfileStatsProps {
  followersCount: number;
  followingCount: number;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
}

/**
 * Props for the ProfileInfo component
 */
export interface ProfileInfoProps {
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  createdAt: string;
}

/**
 * Relationship state between current user and profile user
 */
export interface FollowRelationship {
  isMutual?: boolean;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
}

/**
 * Return type for the useProfileScreen hook
 */
export interface UseProfileScreenReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  relationship: FollowRelationship | null;
  isOwnProfile: boolean;
}
