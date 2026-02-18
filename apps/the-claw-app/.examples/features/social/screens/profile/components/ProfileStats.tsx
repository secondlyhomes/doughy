/**
 * ProfileStats Component
 *
 * Displays followers and following counts with interactive press handlers.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { styles } from '../styles';
import type { ProfileStatsProps } from '../types';

/**
 * Profile statistics display (followers/following counts)
 *
 * @example
 * ```tsx
 * <ProfileStats
 *   followersCount={150}
 *   followingCount={75}
 *   onFollowersPress={() => navigation.navigate('Followers')}
 *   onFollowingPress={() => navigation.navigate('Following')}
 * />
 * ```
 */
export function ProfileStats({
  followersCount,
  followingCount,
  onFollowersPress,
  onFollowingPress,
}: ProfileStatsProps) {
  return (
    <View style={styles.stats}>
      <Pressable style={styles.stat} onPress={onFollowersPress}>
        <Text style={styles.statValue}>{followersCount}</Text>
        <Text style={styles.statLabel}>Followers</Text>
      </Pressable>

      <View style={styles.statDivider} />

      <Pressable style={styles.stat} onPress={onFollowingPress}>
        <Text style={styles.statValue}>{followingCount}</Text>
        <Text style={styles.statLabel}>Following</Text>
      </Pressable>
    </View>
  );
}
