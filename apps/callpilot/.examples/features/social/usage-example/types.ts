/**
 * Social Features Usage Example - Type Definitions
 */

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';

/**
 * Root Stack Navigator Param List
 */
export type RootStackParamList = {
  Main: undefined;
  Profile: { userId: string };
  EditProfile: undefined;
  Followers: { userId: string };
  Following: { userId: string };
};

/**
 * Bottom Tab Navigator Param List
 */
export type MainTabParamList = {
  Feed: undefined;
  Notifications: undefined;
  MyProfile: undefined;
};

/**
 * Navigation Props for Stack Screens
 */
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Navigation Props for Tab Screens
 */
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

/**
 * Screen Props Types
 */
export interface FeedScreenProps {
  navigation: RootStackNavigationProp & MainTabNavigationProp;
}

export interface NotificationsScreenProps {
  navigation: RootStackNavigationProp & MainTabNavigationProp;
}

export interface MyProfileScreenProps {
  navigation: RootStackNavigationProp & MainTabNavigationProp;
}

export interface ProfileScreenWrapperProps {
  route: RouteProp<RootStackParamList, 'Profile'>;
  navigation: RootStackNavigationProp;
}

export interface EditProfileScreenWrapperProps {
  navigation: RootStackNavigationProp;
}

export interface FollowersScreenWrapperProps {
  route: RouteProp<RootStackParamList, 'Followers'>;
  navigation: RootStackNavigationProp;
}

export interface FollowingScreenWrapperProps {
  route: RouteProp<RootStackParamList, 'Following'>;
  navigation: RootStackNavigationProp;
}

/**
 * Custom Component Props
 */
export interface CustomFollowComponentProps {
  targetUserId: string;
}

export interface MinimalProfileScreenProps {
  route: RouteProp<RootStackParamList, 'Profile'>;
}
