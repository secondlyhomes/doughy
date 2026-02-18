/**
 * Social Features - Usage Example
 *
 * Complete example of how to integrate social features into your app.
 * This file demonstrates the main app structure with social providers.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Note: These imports assume the social feature module is properly set up.
// Adjust paths based on your project structure.
import {
  ProfileProvider,
  SocialProvider,
  ActivityFeedProvider,
  NotificationsProvider,
  ProfileScreen,
} from '..';

// Auth context
import { useAuth } from '../../../../src/contexts/AuthContext';

// Types
import type { RootStackParamList, MainTabParamList, MinimalProfileScreenProps } from './types';

// Screen components
import {
  FeedScreen,
  NotificationsScreen,
  MyProfileScreen,
  ProfileScreenWrapper,
  EditProfileScreenWrapper,
  FollowersScreenWrapper,
  FollowingScreenWrapper,
} from './components';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Bottom Tab Navigator
 */
function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="MyProfile" component={MyProfileScreen} />
    </Tab.Navigator>
  );
}

/**
 * Root Navigator with Tabs
 */
function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="Profile" component={ProfileScreenWrapper} />
      <Stack.Screen name="EditProfile" component={EditProfileScreenWrapper} />
      <Stack.Screen name="Followers" component={FollowersScreenWrapper} />
      <Stack.Screen name="Following" component={FollowingScreenWrapper} />
    </Stack.Navigator>
  );
}

/**
 * Main App with Social Features
 *
 * Wraps the entire app with all necessary social providers.
 * This is the complete integration example.
 */
export function AppWithSocialFeatures() {
  const { user } = useAuth();

  return (
    <ProfileProvider>
      <SocialProvider currentUserId={user?.id}>
        <ActivityFeedProvider currentUserId={user?.id} enableRealtime>
          <NotificationsProvider currentUserId={user?.id} enableRealtime>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </NotificationsProvider>
        </ActivityFeedProvider>
      </SocialProvider>
    </ProfileProvider>
  );
}

/**
 * Minimal Profile Screen for MinimalSocialExample
 */
function MinimalProfileScreen({ route }: MinimalProfileScreenProps) {
  const { userId } = route.params;
  const { user } = useAuth();

  return (
    <ProfileScreen
      userId={userId}
      currentUserId={user?.id}
    />
  );
}

/**
 * Minimal Social Example
 *
 * Demonstrates the simplest possible social feature integration
 * with just Profile and Follow functionality.
 */
export function MinimalSocialExample() {
  const { user } = useAuth();

  return (
    <ProfileProvider>
      <SocialProvider currentUserId={user?.id}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Profile" component={MinimalProfileScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SocialProvider>
    </ProfileProvider>
  );
}
