/**
 * Social Context Types
 *
 * TypeScript interfaces for the Social context module.
 */

import type { ReactNode } from 'react';
import type { UserProfile, FollowRelationship } from '../../types';

/**
 * Props for the SocialProvider component
 */
export interface SocialProviderProps {
  children: ReactNode;
  currentUserId?: string;
}

/**
 * State managed by the social context
 */
export interface SocialState {
  loading: boolean;
  error: Error | null;
}

/**
 * Actions available through the social context
 */
export interface SocialActions {
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  getFollowRelationship: (userId: string) => Promise<FollowRelationship>;
  loadFollowers: (userId: string) => Promise<UserProfile[]>;
  loadFollowing: (userId: string) => Promise<UserProfile[]>;
  getSuggestedUsers: (limit?: number) => Promise<UserProfile[]>;
}

/**
 * Complete context value combining state and actions
 */
export interface SocialContextValue extends SocialState, SocialActions {}

/**
 * Re-export types from main types file for convenience
 */
export type { UserProfile, FollowRelationship };
