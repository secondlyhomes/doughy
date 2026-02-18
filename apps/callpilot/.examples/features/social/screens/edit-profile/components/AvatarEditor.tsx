/**
 * Avatar Editor Component
 *
 * Wrapper component for avatar upload with hint text.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { AvatarUpload } from '../../../components/AvatarUpload';
import type { AvatarEditorProps } from '../types';
import { styles } from '../styles';

/**
 * Avatar Editor
 *
 * Displays the avatar upload component with a helpful hint.
 *
 * @example
 * ```tsx
 * <AvatarEditor
 *   userId={profile.user_id}
 *   currentAvatarUrl={profile.avatar_url}
 *   onUpload={handleAvatarUpload}
 * />
 * ```
 */
export function AvatarEditor({
  userId,
  currentAvatarUrl,
  onUpload,
}: AvatarEditorProps) {
  return (
    <View style={styles.avatarSection}>
      <AvatarUpload
        userId={userId}
        currentAvatarUrl={currentAvatarUrl}
        onUploadSuccess={onUpload}
        size={100}
        editable
      />
      <Text style={styles.avatarHint}>Tap to change photo</Text>
    </View>
  );
}
