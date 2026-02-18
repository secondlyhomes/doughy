/**
 * Avatar Upload Component
 *
 * Reusable avatar component with upload functionality.
 * Integrates with ProfileContext for avatar management.
 */

import React from 'react';
import { View } from 'react-native';
import { useAvatarUpload } from './hooks/useAvatarUpload';
import { AvatarPreview } from './components/AvatarPreview';
import { UploadOptions } from './components/UploadOptions';
import { containerStyles } from './styles';
import type { AvatarUploadProps } from './types';

/**
 * Avatar Upload Component
 *
 * @example
 * ```tsx
 * <AvatarUpload
 *   userId={user.id}
 *   currentAvatarUrl={user.avatar_url}
 *   onUploadSuccess={(url) => console.log('Uploaded:', url)}
 *   size={120}
 *   editable
 * />
 * ```
 */
export function AvatarUpload({
  userId,
  currentAvatarUrl,
  onUploadSuccess,
  onUploadError,
  size = 120,
  editable = true,
}: AvatarUploadProps) {
  const {
    uploading,
    showOptions,
    toggleOptions,
    closeOptions,
    pickImage,
    takePhoto,
    removeAvatar,
  } = useAvatarUpload({
    onUploadSuccess,
    onUploadError,
  });

  const handleAvatarPress = () => {
    if (editable) {
      toggleOptions();
    }
  };

  return (
    <View style={containerStyles.container}>
      <AvatarPreview
        currentAvatarUrl={currentAvatarUrl}
        userId={userId}
        size={size}
        uploading={uploading}
        editable={editable}
        onPress={handleAvatarPress}
      />

      {showOptions && !uploading && editable && (
        <UploadOptions
          hasAvatar={!!currentAvatarUrl}
          onPickImage={pickImage}
          onTakePhoto={takePhoto}
          onRemoveAvatar={removeAvatar}
          onCancel={closeOptions}
        />
      )}
    </View>
  );
}
