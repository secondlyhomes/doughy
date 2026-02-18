/**
 * Avatar Upload Component Types
 *
 * TypeScript interfaces for the AvatarUpload component and its sub-components.
 */

/**
 * Props for the main AvatarUpload component
 */
export interface AvatarUploadProps {
  /** User ID for generating placeholder initials */
  userId: string;
  /** Current avatar URL, if any */
  currentAvatarUrl?: string | null;
  /** Callback when upload succeeds with the new URL */
  onUploadSuccess?: (url: string) => void;
  /** Callback when upload fails with an error */
  onUploadError?: (error: Error) => void;
  /** Size of the avatar in pixels (default: 120) */
  size?: number;
  /** Whether the avatar can be edited (default: true) */
  editable?: boolean;
}

/**
 * Props for the AvatarPreview sub-component
 */
export interface AvatarPreviewProps {
  /** Current avatar URL to display */
  currentAvatarUrl?: string | null;
  /** User ID for placeholder initials */
  userId: string;
  /** Size of the avatar in pixels */
  size: number;
  /** Whether the avatar is currently being uploaded */
  uploading: boolean;
  /** Whether the avatar is editable */
  editable: boolean;
  /** Callback when the avatar is pressed */
  onPress: () => void;
}

/**
 * Props for the UploadOptions sub-component
 */
export interface UploadOptionsProps {
  /** Whether a current avatar exists (shows remove option) */
  hasAvatar: boolean;
  /** Callback to choose image from library */
  onPickImage: () => void;
  /** Callback to take a new photo */
  onTakePhoto: () => void;
  /** Callback to remove current avatar */
  onRemoveAvatar: () => void;
  /** Callback to cancel/close options menu */
  onCancel: () => void;
}

/**
 * Return type for the useAvatarUpload hook
 */
export interface UseAvatarUploadReturn {
  /** Whether an upload is in progress */
  uploading: boolean;
  /** Whether the options menu is visible */
  showOptions: boolean;
  /** Toggle the options menu visibility */
  toggleOptions: () => void;
  /** Close the options menu */
  closeOptions: () => void;
  /** Pick an image from the device library */
  pickImage: () => Promise<void>;
  /** Take a photo using the camera */
  takePhoto: () => Promise<void>;
  /** Remove the current avatar */
  removeAvatar: () => void;
}
