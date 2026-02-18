/**
 * Profile Screen
 *
 * Complete user profile screen with stats, follow button, and activity.
 * Composes extracted components for a clean, maintainable structure.
 */

import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/tokens';
import { useProfileScreen } from './hooks/useProfileScreen';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileStats } from './components/ProfileStats';
import { ProfileInfo } from './components/ProfileInfo';
import { styles } from './styles';
import type { ProfileScreenProps } from './types';

/**
 * Profile Screen
 *
 * @example
 * ```tsx
 * <ProfileScreen
 *   userId={route.params.userId}
 *   currentUserId={currentUser.id}
 *   onEditProfile={() => navigation.navigate('EditProfile')}
 *   onFollowersPress={() => navigation.navigate('Followers')}
 *   onFollowingPress={() => navigation.navigate('Following')}
 * />
 * ```
 */
export function ProfileScreen({
  userId,
  currentUserId,
  onEditProfile,
  onFollowersPress,
  onFollowingPress,
}: ProfileScreenProps) {
  const { profile, loading, error, relationship, isOwnProfile } = useProfileScreen({
    userId,
    currentUserId,
  });

  // Loading state
  if (loading && !profile) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {error?.message || 'Failed to load profile'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        onEditProfile={onEditProfile}
        userId={userId}
      />

      <ProfileInfo
        bio={profile.bio}
        location={profile.location}
        website={profile.website}
        createdAt={profile.created_at}
      />

      <ProfileStats
        followersCount={profile.followers_count}
        followingCount={profile.following_count}
        onFollowersPress={onFollowersPress}
        onFollowingPress={onFollowingPress}
      />

      {/* Mutual follow badge */}
      {relationship?.isMutual && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>You follow each other</Text>
        </View>
      )}

      {/* Activity section placeholder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity</Text>
        <View style={styles.emptyActivity}>
          <Text style={styles.emptyActivityText}>
            Activity feed coming soon
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
