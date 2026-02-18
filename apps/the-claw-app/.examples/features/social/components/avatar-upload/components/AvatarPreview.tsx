/**
 * AvatarPreview Component
 *
 * Displays the avatar image or placeholder with upload overlay and edit badge.
 */

import React from 'react';
import { View, Text, Pressable, Image, ActivityIndicator } from 'react-native';
import { avatarStyles, colors } from '../styles';
import type { AvatarPreviewProps } from '../types';

/**
 * Avatar preview with image, placeholder, loading overlay, and edit badge
 *
 * @example
 * ```tsx
 * <AvatarPreview
 *   currentAvatarUrl={user.avatar_url}
 *   userId={user.id}
 *   size={120}
 *   uploading={false}
 *   editable={true}
 *   onPress={() => setShowOptions(true)}
 * />
 * ```
 */
export function AvatarPreview({
  currentAvatarUrl,
  userId,
  size,
  uploading,
  editable,
  onPress,
}: AvatarPreviewProps) {
  const dynamicContainerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const dynamicBadgeStyle = {
    width: size / 4,
    height: size / 4,
    borderRadius: size / 8,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={!editable || uploading}
      style={[avatarStyles.avatarContainer, dynamicContainerStyle]}
    >
      {/* Avatar Image or Placeholder */}
      {currentAvatarUrl ? (
        <Image
          source={{ uri: currentAvatarUrl }}
          style={avatarStyles.avatarImage}
          resizeMode="cover"
        />
      ) : (
        <View style={avatarStyles.placeholderContainer}>
          <Text
            style={[
              avatarStyles.placeholderText,
              { fontSize: size / 3 },
            ]}
          >
            {userId.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Upload Loading Overlay */}
      {uploading && (
        <View style={avatarStyles.uploadingOverlay}>
          <ActivityIndicator color={colors.white} size="large" />
        </View>
      )}

      {/* Edit Badge */}
      {!uploading && editable && (
        <View style={[avatarStyles.editBadge, dynamicBadgeStyle]}>
          <Text style={[avatarStyles.editText, { fontSize: size / 10 }]}>
            Edit
          </Text>
        </View>
      )}
    </Pressable>
  );
}
