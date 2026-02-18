/**
 * Social Context Module
 *
 * Clean re-exports for the social context.
 *
 * @example
 * ```tsx
 * import { SocialProvider, useSocial } from './contexts/social';
 *
 * // In app root
 * <SocialProvider currentUserId={user?.id}>
 *   <App />
 * </SocialProvider>
 *
 * // In components
 * const { followUser, loading } = useSocial();
 * ```
 */

// Provider component
export { SocialProvider } from './SocialProvider';

// Consumer hook
export { useSocial } from './useSocial';

// Types
export type {
  SocialProviderProps,
  SocialContextValue,
  SocialState,
  SocialActions,
  UserProfile,
  FollowRelationship,
} from './types';

// Internal hooks (for advanced usage)
export { useSocialActions } from './hooks/useSocialActions';
