/**
 * TypeScript interfaces for AvatarUpload component
 */

export interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: Error) => void;
  size?: number;
  editable?: boolean;
}

export interface AvatarDisplayProps {
  currentAvatarUrl?: string | null;
  userId: string;
  size: number;
  uploading: boolean;
  progress: number;
  editable: boolean;
  onPress: () => void;
}

export interface UploadOptionsMenuProps {
  onPickImage: () => void;
  onTakePhoto: () => void;
  onRemove: () => void;
  onCancel: () => void;
  showRemove: boolean;
}

export interface UseAvatarUploadStateProps {
  userId: string;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: Error) => void;
}

export interface UseAvatarUploadStateReturn {
  showOptions: boolean;
  setShowOptions: (show: boolean) => void;
  uploading: boolean;
  progress: number;
  error: Error | null;
  handlePickImage: () => Promise<void>;
  handleTakePhoto: () => Promise<void>;
  handleRemove: () => Promise<void>;
}
