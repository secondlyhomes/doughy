/**
 * Social Features Type Definitions
 *
 * All types for profiles, social graph, activity feed, and notifications
 */

// Profile types
export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  location: string | null;
  followers_count: number;
  following_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileStats {
  followers_count: number;
  following_count: number;
  posts_count: number;
}

export interface UpdateProfileInput {
  username?: string;
  full_name?: string;
  bio?: string;
  website?: string;
  location?: string;
}

// Social graph types
export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface FollowRelationship {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutual: boolean;
}

// Activity feed types
export type ActivityType =
  | 'post_created'
  | 'post_liked'
  | 'user_followed'
  | 'comment_added'
  | 'profile_updated';

export interface ActivityFeedItem {
  id: string;
  user_id: string;
  actor_id: string;
  activity_type: ActivityType;
  content: Record<string, any> | null;
  created_at: string;
  // Joined data
  actor?: UserProfile;
}

// Notification types
export type NotificationType =
  | 'follow'
  | 'like'
  | 'comment'
  | 'mention'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any> | null;
  read: boolean;
  created_at: string;
  // Joined data
  actor?: UserProfile;
}

export interface NotificationPreferences {
  follow_notifications: boolean;
  like_notifications: boolean;
  comment_notifications: boolean;
  mention_notifications: boolean;
  system_notifications: boolean;
}

// Context state types
export interface ProfileContextValue {
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  loadProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: UpdateProfileInput) => Promise<void>;
  uploadAvatar: (uri: string) => Promise<void>;
  removeAvatar: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export interface SocialContextValue {
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  getFollowRelationship: (userId: string) => Promise<FollowRelationship>;
  loadFollowers: (userId: string) => Promise<UserProfile[]>;
  loadFollowing: (userId: string) => Promise<UserProfile[]>;
  getSuggestedUsers: (limit?: number) => Promise<UserProfile[]>;
  loading: boolean;
  error: Error | null;
}

export interface ActivityFeedContextValue {
  activities: ActivityFeedItem[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadActivities: (offset?: number, limit?: number) => Promise<void>;
  refreshActivities: () => Promise<void>;
  createActivity: (type: ActivityType, content?: Record<string, any>) => Promise<void>;
}

export interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadNotifications: (offset?: number, limit?: number) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}
