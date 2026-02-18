/**
 * UserListItem Component
 *
 * Displays a single user in the online users list.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { UserAvatar } from './UserAvatar';
import { styles } from '../styles';
import type { UserPresence } from '../types';

interface UserListItemProps {
  user: UserPresence;
}

export function UserListItem({ user }: UserListItemProps) {
  const statusText = user.status === 'online' ? 'Online' : 'Away';

  return (
    <View style={styles.userItem}>
      <UserAvatar
        username={user.username}
        avatarUrl={user.avatarUrl}
        status={user.status}
      />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.status}>{statusText}</Text>
      </View>
    </View>
  );
}
