/**
 * FollowingItem Component
 *
 * Displays a single user in the following list with avatar, info, and follow button.
 */

import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { FollowButton } from '../../FollowButton';
import { styles } from '../styles';
import type { FollowingItemProps } from '../types';

/**
 * Individual user item in the following list
 *
 * @example
 * ```tsx
 * <FollowingItem
 *   profile={userProfile}
 *   onPress={(profile) => navigation.navigate('Profile', { userId: profile.id })}
 * />
 * ```
 */
export function FollowingItem({ profile, onPress }: FollowingItemProps) {
  const handlePress = () => {
    onPress?.(profile);
  };

  return (
    <Pressable style={styles.userItem} onPress={handlePress}>
      <View style={styles.avatarContainer}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {profile.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{profile.full_name || profile.username}</Text>
        <Text style={styles.username}>@{profile.username}</Text>
        {profile.bio && (
          <Text style={styles.bio} numberOfLines={1}>
            {profile.bio}
          </Text>
        )}
      </View>

      <FollowButton userId={profile.user_id} size="small" />
    </Pressable>
  );
}
