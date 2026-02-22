// src/features/lead-inbox/components/ConversationCardAvatar.tsx
// Avatar with status dot indicator for LeadConversationCard

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { styles } from './lead-conversation-card-styles';

interface ConversationCardAvatarProps {
  initial: string;
  hasUnread: boolean;
  hasPending: boolean;
}

export function ConversationCardAvatar({
  initial,
  hasUnread,
  hasPending,
}: ConversationCardAvatarProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.avatarContainer}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: colors.muted },
        ]}
      >
        <Text style={[styles.avatarText, { color: colors.foreground }]}>
          {initial}
        </Text>
      </View>
      {(hasUnread || hasPending) && (
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: hasPending ? colors.warning : colors.primary,
            },
          ]}
        />
      )}
    </View>
  );
}
