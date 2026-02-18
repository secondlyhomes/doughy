/**
 * AvatarUpload Component
 *
 * Complete avatar upload component with:
 * - Image picker and camera support
 * - Square cropping and resizing
 * - Progress tracking
 * - Profile update
 * - Old avatar cleanup
 */

import { View, Text } from 'react-native';
import { styles } from './styles';
import { useAvatarUploadState } from './hooks/useAvatarUploadState';
import { AvatarDisplay } from './components/AvatarDisplay';
import { UploadOptionsMenu } from './components/UploadOptionsMenu';
import type { AvatarUploadProps } from './types';

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  onUploadSuccess,
  onUploadError,
  size = 120,
  editable = true,
}: AvatarUploadProps) {
  const {
    showOptions,
    setShowOptions,
    uploading,
    progress,
    error,
    handlePickImage,
    handleTakePhoto,
    handleRemove,
  } = useAvatarUploadState({
    userId,
    onUploadSuccess,
    onUploadError,
  });

  const toggleOptions = () => {
    if (editable) {
      setShowOptions(!showOptions);
    }
  };

  return (
    <View style={styles.container}>
      <AvatarDisplay
        currentAvatarUrl={currentAvatarUrl}
        userId={userId}
        size={size}
        uploading={uploading}
        progress={progress}
        editable={editable}
        onPress={toggleOptions}
      />

      {showOptions && !uploading && editable && (
        <UploadOptionsMenu
          onPickImage={handlePickImage}
          onTakePhoto={handleTakePhoto}
          onRemove={handleRemove}
          onCancel={() => setShowOptions(false)}
          showRemove={!!currentAvatarUrl}
        />
      )}

      {error && <Text style={styles.errorText}>{error.message}</Text>}
    </View>
  );
}
