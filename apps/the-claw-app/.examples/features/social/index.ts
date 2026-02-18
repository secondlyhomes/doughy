/**
 * Social Features - Main Export
 *
 * Import social features from this file for easier usage.
 */

// Types
export * from './types';

// Services
export * from './services/profileService';
export * from './services/socialService';
export * from './services/activityService';
export * from './services/notificationService';

// Contexts
export { ProfileProvider, useProfile } from './contexts/ProfileContext';
export { SocialProvider, useSocial } from './contexts/SocialContext';
export { ActivityFeedProvider, useActivityFeed } from './contexts/ActivityFeedContext';
export { NotificationsProvider, useNotifications } from './contexts/NotificationsContext';

// Components
export { AvatarUpload } from './components/AvatarUpload';
export { FollowButton } from './components/FollowButton';
export { FollowersList } from './components/FollowersList';
export { FollowingList } from './components/FollowingList';
export { FeedItem } from './components/FeedItem';
export { ActivityFeed } from './components/ActivityFeed';
export { NotificationItem } from './components/NotificationItem';
export { NotificationsList } from './components/NotificationsList';

// Screens
export { ProfileScreen } from './screens/ProfileScreen';
export { EditProfileScreen } from './screens/EditProfileScreen';
