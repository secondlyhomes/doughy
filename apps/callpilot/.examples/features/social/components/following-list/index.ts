/**
 * FollowingList Component
 *
 * Re-exports for clean imports.
 *
 * @example
 * ```tsx
 * import { FollowingList } from './following-list';
 * import type { FollowingListProps } from './following-list';
 * ```
 */

// Main component
export { FollowingList } from './FollowingList';

// Types
export type {
  FollowingListProps,
  FollowingItemProps,
  ErrorStateProps,
  EmptyStateProps,
  FollowingListState,
} from './types';

// Sub-components (for advanced usage)
export { FollowingItem } from './components/FollowingItem';
export { EmptyState } from './components/EmptyState';
export { ErrorState } from './components/ErrorState';
export { LoadingState } from './components/LoadingState';
