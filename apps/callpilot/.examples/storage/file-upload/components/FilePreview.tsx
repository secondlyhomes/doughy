/**
 * FilePreview Component
 *
 * Displays selected file info with upload/cancel actions
 */

import { View, Text, Pressable } from 'react-native';
import { styles } from '../styles';
import { UploadProgress } from './UploadProgress';
import { formatFileSize } from '../utils';
import type { FilePreviewProps } from '../types';

export function FilePreview({
  file,
  uploading,
  progress,
  onUpload,
  onCancel,
}: FilePreviewProps) {
  return (
    <View style={styles.filePreview}>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>
          {file.name}
        </Text>
        <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
      </View>

      {!uploading && (
        <View style={styles.actions}>
          <Pressable onPress={onUpload} style={styles.uploadButton}>
            <Text style={styles.uploadButtonText}>Upload</Text>
          </Pressable>

          <Pressable onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      )}

      {uploading && <UploadProgress progress={progress} />}
    </View>
  );
}
