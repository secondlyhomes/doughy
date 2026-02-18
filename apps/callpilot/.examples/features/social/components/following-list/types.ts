/**
 * Type definitions for FollowingList component
 */

import type { UserProfile } from '../../types';

/**
 * Props for the main FollowingList component
 */
export interface FollowingListProps {
  userId: string;
  onProfilePress?: (profile: UserProfile) => void;
}

/**
 * Props for the FollowingItem sub-component
 */
export interface FollowingItemProps {
  profile: UserProfile;
  onPress?: (profile: UserProfile) => void;
}

/**
 * Props for the ErrorState sub-component
 */
export interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

/**
 * Props for the EmptyState sub-component
 */
export interface EmptyStateProps {
  message?: string;
}

/**
 * State shape for the FollowingList hook
 */
export interface FollowingListState {
  following: UserProfile[];
  loading: boolean;
  error: Error | null;
}
