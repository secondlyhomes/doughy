/**
 * UploadOptions Component
 *
 * Options menu for avatar upload actions: library, camera, remove, cancel.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { optionsStyles } from '../styles';
import type { UploadOptionsProps } from '../types';

/**
 * Upload options menu with library, camera, remove, and cancel actions
 *
 * @example
 * ```tsx
 * <UploadOptions
 *   hasAvatar={!!currentAvatarUrl}
 *   onPickImage={pickImage}
 *   onTakePhoto={takePhoto}
 *   onRemoveAvatar={removeAvatar}
 *   onCancel={closeOptions}
 * />
 * ```
 */
export function UploadOptions({
  hasAvatar,
  onPickImage,
  onTakePhoto,
  onRemoveAvatar,
  onCancel,
}: UploadOptionsProps) {
  return (
    <View style={optionsStyles.optionsMenu}>
      {/* Choose from Library */}
      <Pressable onPress={onPickImage} style={optionsStyles.optionButton}>
        <Text style={optionsStyles.optionText}>Choose from Library</Text>
      </Pressable>

      {/* Take Photo */}
      <Pressable
        onPress={onTakePhoto}
        style={[optionsStyles.optionButton, optionsStyles.optionButtonBorder]}
      >
        <Text style={optionsStyles.optionText}>Take Photo</Text>
      </Pressable>

      {/* Remove Avatar (only if avatar exists) */}
      {hasAvatar && (
        <Pressable
          onPress={onRemoveAvatar}
          style={[optionsStyles.optionButton, optionsStyles.optionButtonBorder]}
        >
          <Text style={optionsStyles.optionTextDanger}>Remove Avatar</Text>
        </Pressable>
      )}

      {/* Cancel */}
      <Pressable
        onPress={onCancel}
        style={[optionsStyles.optionButton, optionsStyles.optionButtonBorder]}
      >
        <Text style={optionsStyles.optionTextSecondary}>Cancel</Text>
      </Pressable>
    </View>
  );
}
