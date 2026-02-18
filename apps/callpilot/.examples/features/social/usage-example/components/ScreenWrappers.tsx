/**
 * Screen Wrapper Components
 *
 * Wrapper components for navigation screens that connect
 * social feature components with React Navigation.
 */

import React from 'react';
// Note: These imports assume the social feature module is properly set up.
// Adjust paths based on your project structure.
import {
  ProfileScreen,
  EditProfileScreen,
  ActivityFeed,
  NotificationsList,
  FollowersList,
  FollowingList,
} from '../..';
import { useAuth } from '../../../../../src/contexts/AuthContext';
import type {
  FeedScreenProps,
  NotificationsScreenProps,
  MyProfileScreenProps,
  ProfileScreenWrapperProps,
  EditProfileScreenWrapperProps,
  FollowersScreenWrapperProps,
  FollowingScreenWrapperProps,
} from '../types';

/**
 * Feed Screen - Displays activity feed
 */
export function FeedScreen({ navigation }: FeedScreenProps) {
  return (
    <ActivityFeed
      onProfilePress={(userId) =>
        navigation.navigate('Profile', { userId })
      }
      onContentPress={(activity) => {
        // Handle activity press (navigate to post, etc.)
        console.log('Activity pressed:', activity);
      }}
    />
  );
}

/**
 * Notifications Screen - Displays user notifications
 */
export function NotificationsScreen({ navigation }: NotificationsScreenProps) {
  return (
    <NotificationsList
      onNotificationPress={(notification) => {
        // Handle notification press
        if (notification.type === 'follow' && notification.data?.followerId) {
          navigation.navigate('Profile', { userId: notification.data.followerId });
        }
        // Handle other notification types...
      }}
    />
  );
}

/**
 * My Profile Screen - Current user's profile
 */
export function MyProfileScreen({ navigation }: MyProfileScreenProps) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <ProfileScreen
      userId={user.id}
      currentUserId={user.id}
      onEditProfile={() => navigation.navigate('EditProfile')}
      onFollowersPress={() => navigation.navigate('Followers', { userId: user.id })}
      onFollowingPress={() => navigation.navigate('Following', { userId: user.id })}
    />
  );
}

/**
 * Profile Screen Wrapper - View any user's profile
 */
export function ProfileScreenWrapper({ route, navigation }: ProfileScreenWrapperProps) {
  const { userId } = route.params;
  const { user } = useAuth();

  return (
    <ProfileScreen
      userId={userId}
      currentUserId={user?.id}
      onEditProfile={() => navigation.navigate('EditProfile')}
      onFollowersPress={() => navigation.navigate('Followers', { userId })}
      onFollowingPress={() => navigation.navigate('Following', { userId })}
    />
  );
}

/**
 * Edit Profile Screen Wrapper
 */
export function EditProfileScreenWrapper({ navigation }: EditProfileScreenWrapperProps) {
  return (
    <EditProfileScreen
      onSave={() => navigation.goBack()}
      onCancel={() => navigation.goBack()}
    />
  );
}

/**
 * Followers Screen Wrapper
 */
export function FollowersScreenWrapper({ route, navigation }: FollowersScreenWrapperProps) {
  const { userId } = route.params;

  return (
    <FollowersList
      userId={userId}
      onProfilePress={(profile) =>
        navigation.navigate('Profile', { userId: profile.user_id })
      }
    />
  );
}

/**
 * Following Screen Wrapper
 */
export function FollowingScreenWrapper({ route, navigation }: FollowingScreenWrapperProps) {
  const { userId } = route.params;

  return (
    <FollowingList
      userId={userId}
      onProfilePress={(profile) =>
        navigation.navigate('Profile', { userId: profile.user_id })
      }
    />
  );
}
