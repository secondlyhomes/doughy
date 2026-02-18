/**
 * FollowersList component module
 *
 * Clean re-exports for the followers list feature.
 */

// Main component
export { FollowersList } from './FollowersList';

// Types (for consumers who need to type their callbacks)
export type {
  FollowersListProps,
  FollowerItemProps,
  EmptyStateProps,
  ErrorStateProps,
  LoadingStateProps,
} from './types';

// Sub-components (for advanced customization)
export {
  FollowerItem,
  EmptyState,
  ErrorState,
  LoadingState,
} from './components';
