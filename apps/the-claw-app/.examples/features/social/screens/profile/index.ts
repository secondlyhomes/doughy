/**
 * Profile Screen Module
 *
 * Public exports for the profile screen feature.
 */

// Main screen component
export { ProfileScreen } from './ProfileScreen';

// Sub-components (for external use if needed)
export { ProfileHeader } from './components/ProfileHeader';
export { ProfileStats } from './components/ProfileStats';
export { ProfileInfo } from './components/ProfileInfo';

// Hook
export { useProfileScreen } from './hooks/useProfileScreen';

// Types
export type {
  ProfileScreenProps,
  ProfileHeaderProps,
  ProfileStatsProps,
  ProfileInfoProps,
  FollowRelationship,
  UseProfileScreenReturn,
} from './types';
