/**
 * Follower Item Component
 *
 * Displays a single follower with avatar, name, username, bio, and follow button.
 */

import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { FollowButton } from '../../FollowButton';
import { styles } from '../styles';
import type { FollowerItemProps } from '../types';

/**
 * Individual follower item for the followers list
 */
export function FollowerItem({ profile, onPress }: FollowerItemProps) {
  return (
    <Pressable style={styles.followerItem} onPress={onPress}>
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
