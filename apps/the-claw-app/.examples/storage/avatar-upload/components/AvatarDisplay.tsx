/**
 * AvatarDisplay Component
 *
 * Displays the avatar image with:
 * - Placeholder when no image
 * - Upload progress overlay
 * - Edit badge when editable
 */

import { View, Text, Pressable, Image, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/tokens';
import { styles } from '../styles';
import type { AvatarDisplayProps } from '../types';

export function AvatarDisplay({
  currentAvatarUrl,
  userId,
  size,
  uploading,
  progress,
  editable,
  onPress,
}: AvatarDisplayProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!editable || uploading}
      style={[
        styles.avatarContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {currentAvatarUrl ? (
        <Image
          source={{ uri: currentAvatarUrl }}
          style={styles.avatarImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderContainer}>
          <Text
            style={[
              styles.placeholderText,
              {
                fontSize: size / 3,
              },
            ]}
          >
            {userId.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {uploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator color={colors.white} size="large" />
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      )}

      {!uploading && editable && (
        <View
          style={[
            styles.editBadge,
            {
              width: size / 4,
              height: size / 4,
              borderRadius: size / 8,
            },
          ]}
        >
          <Text style={[styles.editIcon, { fontSize: size / 8 }]}>✏️</Text>
        </View>
      )}
    </Pressable>
  );
}
