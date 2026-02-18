/**
 * Types for FollowersList component
 */

import type { UserProfile } from '../../types';

/**
 * Props for the main FollowersList component
 */
export interface FollowersListProps {
  userId: string;
  onProfilePress?: (profile: UserProfile) => void;
}

/**
 * Props for individual follower item
 */
export interface FollowerItemProps {
  profile: UserProfile;
  onPress?: () => void;
}

/**
 * Props for empty state component
 */
export interface EmptyStateProps {
  message?: string;
}

/**
 * Props for error state component
 */
export interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

/**
 * Props for loading state component
 */
export interface LoadingStateProps {
  size?: 'small' | 'large';
}
