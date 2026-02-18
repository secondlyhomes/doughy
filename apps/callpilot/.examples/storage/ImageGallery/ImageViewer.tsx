/**
 * Full-screen image viewer modal
 */

import { View, Text, Image, Pressable, Modal, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '@/theme/tokens';
import type { ImageViewerProps } from './types';

export function ImageViewer({
  visible,
  image,
  editable = false,
  onClose,
  onDelete,
}: ImageViewerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={styles.overlay} onPress={onClose} />

        {image && (
          <View style={styles.content}>
            <Image
              source={{ uri: image.url }}
              style={styles.image}
              resizeMode="contain"
            />

            <View style={styles.actions}>
              <Pressable onPress={onClose} style={styles.button}>
                <Text style={styles.buttonText}>Close</Text>
              </Pressable>

              {editable && onDelete && (
                <Pressable
                  onPress={onDelete}
                  style={[styles.button, styles.deleteButton]}
                >
                  <Text style={[styles.buttonText, styles.deleteButtonText]}>
                    Delete
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '80%',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[4],
    padding: spacing[4],
  },
  button: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  deleteButton: {
    backgroundColor: colors.error[600],
  },
  deleteButtonText: {
    color: colors.white,
  },
});
