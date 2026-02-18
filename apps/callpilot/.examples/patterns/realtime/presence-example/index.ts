/**
 * Presence Example - Public Exports
 *
 * Clean re-exports for the presence example module.
 */

// Main component
export { PresenceExample } from './PresenceExample';

// Types
export type { UserPresence, UserStatus, PresenceState, UsePresenceReturn } from './types';

// Hook
export { usePresence } from './hooks/usePresence';

// Components (for composition/extension)
export { ConnectionStatus } from './components/ConnectionStatus';
export { EmptyState } from './components/EmptyState';
export { ErrorBanner } from './components/ErrorBanner';
export { StatusButton } from './components/StatusButton';
export { UserAvatar } from './components/UserAvatar';
export { UserListItem } from './components/UserListItem';

// Styles (for extension)
export { styles, colors } from './styles';
