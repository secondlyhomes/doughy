/**
 * FileUpload Component
 *
 * Generic file upload component with:
 * - File type validation
 * - Size validation
 * - Progress tracking
 * - Error handling
 * - Drag and drop support (web)
 */

import { View, Text } from 'react-native';
import { styles } from './styles';
import { useFileUploadLogic } from './hooks/useFileUploadLogic';
import { FileSelector } from './components/FileSelector';
import { FilePreview } from './components/FilePreview';
import type { FileUploadProps } from './types';

export function FileUpload({
  bucket,
  path,
  maxSizeMB = 10,
  allowedTypes,
  onUploadSuccess,
  onUploadError,
  label = 'Upload File',
  description,
}: FileUploadProps) {
  const {
    selectedFile,
    uploading,
    progress,
    error,
    handleSelectFile,
    handleUpload,
    handleCancel,
  } = useFileUploadLogic({
    bucket,
    path,
    maxSizeMB,
    allowedTypes,
    onUploadSuccess,
    onUploadError,
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      {description && <Text style={styles.description}>{description}</Text>}

      {!selectedFile ? (
        <FileSelector
          onSelectFile={handleSelectFile}
          disabled={uploading}
          maxSizeMB={maxSizeMB}
        />
      ) : (
        <FilePreview
          file={selectedFile}
          uploading={uploading}
          progress={progress}
          onUpload={handleUpload}
          onCancel={handleCancel}
        />
      )}

      {error && <Text style={styles.errorText}>{error.message}</Text>}
    </View>
  );
}
