/**
 * UserAvatar Component
 *
 * Displays user avatar with status indicator dot.
 */

import React from 'react';
import { View, Text, Image } from 'react-native';
import { styles, colors } from '../styles';
import type { UserStatus } from '../types';

interface UserAvatarProps {
  username: string;
  avatarUrl?: string;
  status: UserStatus;
}

export function UserAvatar({ username, avatarUrl, status }: UserAvatarProps) {
  const statusColor = status === 'online' ? colors.online : colors.away;

  return (
    <View style={styles.avatarContainer}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>
            {username[0]?.toUpperCase() || '?'}
          </Text>
        </View>
      )}
      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
    </View>
  );
}
