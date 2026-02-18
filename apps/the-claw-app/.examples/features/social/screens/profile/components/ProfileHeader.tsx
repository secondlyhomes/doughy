/**
 * ProfileHeader Component
 *
 * Displays user avatar, name, username, and action button (edit/follow).
 */

import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { FollowButton } from '../../../components/FollowButton';
import { styles } from '../styles';
import type { ProfileHeaderProps } from '../types';

/**
 * Profile header with avatar and user info
 *
 * @example
 * ```tsx
 * <ProfileHeader
 *   profile={profile}
 *   isOwnProfile={false}
 *   userId="user-123"
 *   onEditProfile={() => navigation.navigate('EditProfile')}
 * />
 * ```
 */
export function ProfileHeader({
  profile,
  isOwnProfile,
  onEditProfile,
  userId,
}: ProfileHeaderProps) {
  return (
    <View style={styles.header}>
      {profile.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {profile.username.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.headerInfo}>
        <Text style={styles.fullName}>
          {profile.full_name || profile.username}
        </Text>
        <Text style={styles.username}>@{profile.username}</Text>
      </View>

      {isOwnProfile ? (
        <Pressable style={styles.editButton} onPress={onEditProfile}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </Pressable>
      ) : (
        <FollowButton userId={userId} size="medium" />
      )}
    </View>
  );
}
