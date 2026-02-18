/**
 * UploadOptionsMenu Component
 *
 * Displays the upload options:
 * - Choose from Library
 * - Take Photo
 * - Remove Avatar (conditional)
 * - Cancel
 */

import { View, Text, Pressable } from 'react-native';
import { styles } from '../styles';
import type { UploadOptionsMenuProps } from '../types';

export function UploadOptionsMenu({
  onPickImage,
  onTakePhoto,
  onRemove,
  onCancel,
  showRemove,
}: UploadOptionsMenuProps) {
  return (
    <View style={styles.optionsMenu}>
      <Pressable onPress={onPickImage} style={styles.optionButton}>
        <Text style={styles.optionText}>📚 Choose from Library</Text>
      </Pressable>

      <Pressable
        onPress={onTakePhoto}
        style={[styles.optionButton, styles.optionButtonBorder]}
      >
        <Text style={styles.optionText}>📷 Take Photo</Text>
      </Pressable>

      {showRemove && (
        <Pressable
          onPress={onRemove}
          style={[styles.optionButton, styles.optionButtonBorder]}
        >
          <Text style={styles.optionTextDanger}>🗑️ Remove Avatar</Text>
        </Pressable>
      )}

      <Pressable
        onPress={onCancel}
        style={[styles.optionButton, styles.optionButtonBorder]}
      >
        <Text style={styles.optionTextSecondary}>Cancel</Text>
      </Pressable>
    </View>
  );
}
