/**
 * Social Features Usage Example
 *
 * This module demonstrates how to integrate social features into your app.
 *
 * @example Full Integration
 * ```tsx
 * import { AppWithSocialFeatures } from './.examples/features/social/usage-example';
 *
 * export default function App() {
 *   return <AppWithSocialFeatures />;
 * }
 * ```
 *
 * @example Minimal Integration
 * ```tsx
 * import { MinimalSocialExample } from './.examples/features/social/usage-example';
 *
 * export default function App() {
 *   return <MinimalSocialExample />;
 * }
 * ```
 *
 * @example Custom Hook Components
 * ```tsx
 * import {
 *   CustomProfileComponent,
 *   CustomFollowComponent,
 *   CustomActivityComponent,
 *   CustomNotificationsComponent,
 * } from './.examples/features/social/usage-example';
 * ```
 */

// Main app examples
export { AppWithSocialFeatures, MinimalSocialExample } from './UsageExample';

// Screen wrapper components (for reference/customization)
export {
  FeedScreen,
  NotificationsScreen,
  MyProfileScreen,
  ProfileScreenWrapper,
  EditProfileScreenWrapper,
  FollowersScreenWrapper,
  FollowingScreenWrapper,
} from './components';

// Custom hook example components (for reference)
export {
  CustomProfileComponent,
  CustomFollowComponent,
  CustomActivityComponent,
  CustomNotificationsComponent,
} from './components';

// Types
export type {
  RootStackParamList,
  MainTabParamList,
  RootStackNavigationProp,
  MainTabNavigationProp,
  FeedScreenProps,
  NotificationsScreenProps,
  MyProfileScreenProps,
  ProfileScreenWrapperProps,
  EditProfileScreenWrapperProps,
  FollowersScreenWrapperProps,
  FollowingScreenWrapperProps,
  CustomFollowComponentProps,
  MinimalProfileScreenProps,
} from './types';
