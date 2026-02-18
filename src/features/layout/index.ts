// Layout Feature - Index
// Export navigation and layout components
// Note: Tab navigation is now handled by Expo Router in app/(tabs)/_layout.tsx

// Components
export { FloatingActionButton, QuickActionFAB } from './components/FloatingActionButton';
export type { FABAction } from './components/FloatingActionButton';
export { ErrorBoundary } from './components/ErrorBoundary';

// Hooks
export { useUnreadCounts, formatBadgeCount, UnreadCountsProvider } from './hooks/useUnreadCounts';
export type { UnreadCounts } from './hooks/useUnreadCounts';
